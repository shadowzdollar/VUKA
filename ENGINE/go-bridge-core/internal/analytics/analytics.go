// Package analytics turns ledger history into the aggregates behind VUKA's
// dashboards. Aggregation is server-side so figures cover the whole period
// (not one page of transfers), are converted to a single USD-equivalent using
// the platform's reference rates, and are identical for every client.
//
// Definitions (kept identical for traders and operators):
//   - payment  : money moved between two trader accounts (BUSINESS/PERSONAL)
//   - cash-in  : money credited to a trader from a settlement account (top-up)
//   - volume   : USD-equivalent of SUCCESSFUL payments, at reference rates
//   - corridor : source-currency -> destination-currency of a cross-currency payment
package analytics

import (
	"context"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Converter converts an amount to USD (the catalog's reference table).
type Converter interface {
	ToUSD(amount float64, currency string) (float64, error)
}

// Row is one transfer as the aggregator sees it.
type Row struct {
	Status       string
	CreatedAt    time.Time
	Amount       float64
	Currency     string // currency of the amount (source account)
	ToCurrency   string // destination account currency
	FromType     string // account type of the source
	ToType       string // account type of the destination
	FromUser     string
	ToUser       string
	Counterparty string // trader-report only: the other party's display name
}

func isTraderAccount(t string) bool { return t == "BUSINESS" || t == "PERSONAL" }

// Kind classifies a row.
type Kind int

const (
	KindOther Kind = iota
	KindPayment
	KindCashIn
)

func (r Row) Kind() Kind {
	switch {
	case isTraderAccount(r.FromType) && isTraderAccount(r.ToType):
		return KindPayment
	case !isTraderAccount(r.FromType) && isTraderAccount(r.ToType):
		return KindCashIn
	}
	return KindOther
}

// ---- report types ---------------------------------------------------------------------------

type Slice struct {
	Label    string  `json:"label"`
	ValueUSD float64 `json:"value_usd"`
	Count    int     `json:"count"`
}

type DayPoint struct {
	Date   string  `json:"date"`
	OutUSD float64 `json:"out_usd"`
	InUSD  float64 `json:"in_usd"`
	Count  int     `json:"count"`
	Failed int     `json:"failed"`
}

type Bucket struct {
	Label string  `json:"label"`
	Min   float64 `json:"min_usd"`
	Max   float64 `json:"max_usd"` // 0 = open-ended
	Count int     `json:"count"`
}

type CorridorFlow struct {
	From      string  `json:"from"`
	To        string  `json:"to"`
	VolumeUSD float64 `json:"volume_usd"`
	Count     int     `json:"count"`
}

type Party struct {
	Name      string  `json:"name"`
	VolumeUSD float64 `json:"volume_usd"`
	Count     int     `json:"count"`
}

type Totals struct {
	SentUSD       float64 `json:"sent_usd"`
	ReceivedUSD   float64 `json:"received_usd"`
	VolumeUSD     float64 `json:"volume_usd"`
	CashInUSD     float64 `json:"cash_in_usd"`
	Payments      int     `json:"payments"`
	PaymentsOut   int     `json:"payments_out"`
	PaymentsIn    int     `json:"payments_in"`
	Succeeded     int     `json:"succeeded"`
	Failed        int     `json:"failed"`
	Reversed      int     `json:"reversed"`
	SuccessRate   float64 `json:"success_rate"` // 0..1 of finished payments
	AvgPaymentUSD float64 `json:"avg_payment_usd"`
	LargestUSD    float64 `json:"largest_payment_usd"`
	CrossCurrency int     `json:"cross_currency_payments"`
	ActiveTraders int     `json:"active_traders,omitempty"`
	NewTraders    int     `json:"new_traders,omitempty"`
	TotalTraders  int     `json:"total_traders,omitempty"`
}

type Report struct {
	Scope          string         `json:"scope"` // "trader" | "platform"
	PeriodDays     int            `json:"period_days"`
	GeneratedAt    time.Time      `json:"generated_at"`
	RateBasis      string         `json:"rate_basis"`
	Totals         Totals         `json:"totals"`
	Daily          []DayPoint     `json:"daily"`
	Currencies     []Slice        `json:"currencies"`
	Statuses       []Slice        `json:"statuses"`
	Histogram      []Bucket       `json:"histogram"`
	Corridors      []CorridorFlow `json:"corridors"`
	Counterparties []Party        `json:"counterparties,omitempty"`
	Heatmap        [7][24]int     `json:"heatmap"` // weekday (Mon=0) x hour (UTC)
	KYC            []Slice        `json:"kyc,omitempty"`
	Workflows      []Slice        `json:"workflows,omitempty"`
	Providers      []ProviderStat `json:"providers,omitempty"`
	Tickets        []Slice        `json:"tickets,omitempty"`
	Settlements    []Slice        `json:"settlements,omitempty"`
}

type ProviderStat struct {
	Provider    string  `json:"provider"`
	Total       int     `json:"total"`
	Succeeded   int     `json:"succeeded"`
	Failed      int     `json:"failed"`
	SuccessRate float64 `json:"success_rate"`
}

// HistogramEdges are the USD bucket boundaries; the last bucket is open-ended.
var HistogramEdges = []float64{0, 10, 50, 100, 250, 500, 1000, 5000}

func bucketLabel(lo, hi float64) string {
	if hi == 0 {
		return fmt.Sprintf("%s+", short(lo))
	}
	return fmt.Sprintf("%s–%s", short(lo), short(hi))
}

func short(v float64) string {
	if v >= 1000 {
		return fmt.Sprintf("$%gk", v/1000)
	}
	return fmt.Sprintf("$%g", v)
}

func newHistogram() []Bucket {
	out := make([]Bucket, len(HistogramEdges))
	for i, lo := range HistogramEdges {
		hi := 0.0
		if i+1 < len(HistogramEdges) {
			hi = HistogramEdges[i+1]
		}
		out[i] = Bucket{Label: bucketLabel(lo, hi), Min: lo, Max: hi}
	}
	return out
}

// bucketIndex returns the histogram bucket for a USD amount ([lo, hi)).
func bucketIndex(usd float64) int {
	for i := len(HistogramEdges) - 1; i >= 0; i-- {
		if usd >= HistogramEdges[i] {
			return i
		}
	}
	return 0
}

func r2(v float64) float64 { return math.Round(v*100) / 100 }

type sliceAcc map[string]*Slice

func (a sliceAcc) add(label string, usd float64) {
	s, ok := a[label]
	if !ok {
		s = &Slice{Label: label}
		a[label] = s
	}
	s.ValueUSD += usd
	s.Count++
}

func (a sliceAcc) sorted() []Slice {
	out := make([]Slice, 0, len(a))
	for _, s := range a {
		out = append(out, Slice{Label: s.Label, ValueUSD: r2(s.ValueUSD), Count: s.Count})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].ValueUSD != out[j].ValueUSD {
			return out[i].ValueUSD > out[j].ValueUSD
		}
		if out[i].Count != out[j].Count {
			return out[i].Count > out[j].Count
		}
		return out[i].Label < out[j].Label
	})
	return out
}

// Aggregate builds a report from rows. `viewer` is the trader id for a trader
// report ("" for platform scope): it decides which side of a payment is "out"/"in".
func Aggregate(rows []Row, conv Converter, viewer string, days int, now time.Time, basis string) (Report, error) {
	now = now.UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(days - 1))
	rep := Report{Scope: "platform", PeriodDays: days, GeneratedAt: now, RateBasis: basis, Histogram: newHistogram()}
	if viewer != "" {
		rep.Scope = "trader"
	}
	daily := make([]DayPoint, days)
	for i := range daily {
		daily[i].Date = start.AddDate(0, 0, i).Format("2006-01-02")
	}
	cur, stat := sliceAcc{}, sliceAcc{}
	corr := map[[2]string]*CorridorFlow{}
	party := map[string]*Party{}
	var succeededUSD float64

	for _, r := range rows {
		kind := r.Kind()
		if kind == KindOther {
			continue
		}
		usd, err := conv.ToUSD(r.Amount, r.Currency)
		if err != nil {
			return Report{}, err
		}
		day := int(r.CreatedAt.UTC().Sub(start).Hours() / 24)
		if r.CreatedAt.UTC().Before(start) {
			continue
		}
		if kind == KindCashIn {
			if r.Status == "SUCCESS" {
				rep.Totals.CashInUSD += usd
			}
			continue
		}
		// payment
		stat.add(r.Status, usd)
		rep.Totals.Payments++
		out := viewer != "" && r.FromUser == viewer
		in := viewer != "" && r.ToUser == viewer
		if day >= 0 && day < days {
			daily[day].Count++
			if r.Status == "FAILED" {
				daily[day].Failed++
			}
		}
		switch r.Status {
		case "FAILED":
			rep.Totals.Failed++
			continue
		case "REVERSED":
			rep.Totals.Reversed++
			continue
		case "SUCCESS":
		default:
			continue // pending/processing are not yet volume
		}
		rep.Totals.Succeeded++
		succeededUSD += usd
		rep.Totals.VolumeUSD += usd
		if usd > rep.Totals.LargestUSD {
			rep.Totals.LargestUSD = usd
		}
		if day >= 0 && day < days {
			switch {
			case viewer == "":
				daily[day].OutUSD += usd
			case out:
				daily[day].OutUSD += usd
			case in:
				daily[day].InUSD += usd
			}
		}
		if out {
			rep.Totals.SentUSD += usd
			rep.Totals.PaymentsOut++
		}
		if in {
			// A received payment is worth its destination-currency amount; at reference rates that
			// is the same USD value, so the source-side figure is used for both directions.
			rep.Totals.ReceivedUSD += usd
			rep.Totals.PaymentsIn++
		}
		label := r.Currency
		if in && !out {
			label = r.ToCurrency
		}
		cur.add(label, usd)
		rep.Histogram[bucketIndex(usd)].Count++
		if r.Currency != r.ToCurrency {
			rep.Totals.CrossCurrency++
			k := [2]string{r.Currency, r.ToCurrency}
			c, ok := corr[k]
			if !ok {
				c = &CorridorFlow{From: k[0], To: k[1]}
				corr[k] = c
			}
			c.VolumeUSD += usd
			c.Count++
		}
		if r.Counterparty != "" {
			p, ok := party[r.Counterparty]
			if !ok {
				p = &Party{Name: r.Counterparty}
				party[r.Counterparty] = p
			}
			p.VolumeUSD += usd
			p.Count++
		}
		wd := (int(r.CreatedAt.UTC().Weekday()) + 6) % 7 // Monday = 0
		rep.Heatmap[wd][r.CreatedAt.UTC().Hour()]++
	}

	if fin := rep.Totals.Succeeded + rep.Totals.Failed + rep.Totals.Reversed; fin > 0 {
		rep.Totals.SuccessRate = float64(rep.Totals.Succeeded) / float64(fin)
	}
	if rep.Totals.Succeeded > 0 {
		rep.Totals.AvgPaymentUSD = succeededUSD / float64(rep.Totals.Succeeded)
	}
	for i := range daily {
		daily[i].OutUSD, daily[i].InUSD = r2(daily[i].OutUSD), r2(daily[i].InUSD)
	}
	rep.Daily = daily
	rep.Currencies, rep.Statuses = cur.sorted(), stat.sorted()
	for _, c := range corr {
		rep.Corridors = append(rep.Corridors, CorridorFlow{From: c.From, To: c.To, VolumeUSD: r2(c.VolumeUSD), Count: c.Count})
	}
	sort.Slice(rep.Corridors, func(i, j int) bool {
		if rep.Corridors[i].VolumeUSD != rep.Corridors[j].VolumeUSD {
			return rep.Corridors[i].VolumeUSD > rep.Corridors[j].VolumeUSD
		}
		return rep.Corridors[i].From+rep.Corridors[i].To < rep.Corridors[j].From+rep.Corridors[j].To
	})
	for _, p := range party {
		rep.Counterparties = append(rep.Counterparties, Party{Name: p.Name, VolumeUSD: r2(p.VolumeUSD), Count: p.Count})
	}
	sort.Slice(rep.Counterparties, func(i, j int) bool { return rep.Counterparties[i].VolumeUSD > rep.Counterparties[j].VolumeUSD })
	if len(rep.Counterparties) > 6 {
		rep.Counterparties = rep.Counterparties[:6]
	}
	t := &rep.Totals
	t.SentUSD, t.ReceivedUSD, t.VolumeUSD, t.CashInUSD = r2(t.SentUSD), r2(t.ReceivedUSD), r2(t.VolumeUSD), r2(t.CashInUSD)
	t.AvgPaymentUSD, t.LargestUSD = r2(t.AvgPaymentUSD), r2(t.LargestUSD)
	return rep, nil
}

// ---- loading --------------------------------------------------------------------------------

// Service loads rows and adds platform-only dimensions.
type Service struct {
	pool  *pgxpool.Pool
	conv  Converter
	basis string
	now   func() time.Time
}

func NewService(pool *pgxpool.Pool, conv Converter, basis string) *Service {
	return &Service{pool: pool, conv: conv, basis: basis, now: time.Now}
}

const rowSelect = `
	SELECT t.status::text, t.created_at, t.amount::float8, t.currency, da.currency,
	       sa.type::text, da.type::text, sa.user_id::text, da.user_id::text,
	       COALESCE(CASE WHEN $2 = '' THEN '' WHEN sa.user_id::text = $2 THEN du.full_name ELSE su.full_name END, '')
	FROM transactions t
	JOIN accounts sa ON sa.id = t.source_account_id
	JOIN accounts da ON da.id = t.destination_account_id
	JOIN users su ON su.id = sa.user_id
	JOIN users du ON du.id = da.user_id
	WHERE t.created_at >= $1 AND ($2 = '' OR sa.user_id::text = $2 OR da.user_id::text = $2)`

func (s *Service) load(ctx context.Context, since time.Time, viewer string) ([]Row, error) {
	rows, err := s.pool.Query(ctx, rowSelect, since, viewer)
	if err != nil {
		return nil, fmt.Errorf("analytics: load transfers: %w", err)
	}
	defer rows.Close()
	var out []Row
	for rows.Next() {
		var r Row
		if err := rows.Scan(&r.Status, &r.CreatedAt, &r.Amount, &r.Currency, &r.ToCurrency, &r.FromType, &r.ToType, &r.FromUser, &r.ToUser, &r.Counterparty); err != nil {
			return nil, err
		}
		// A trader's own top-up/self-transfer has no meaningful counterparty.
		if r.FromUser == r.ToUser {
			r.Counterparty = ""
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func clampDays(d int) int {
	if d < 7 {
		return 30
	}
	if d > 365 {
		return 365
	}
	return d
}

func (s *Service) start(days int) time.Time {
	n := s.now().UTC()
	return time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -(days - 1))
}

// Trader builds one trader's report.
func (s *Service) Trader(ctx context.Context, userID string, days int) (Report, error) {
	days = clampDays(days)
	rows, err := s.load(ctx, s.start(days), userID)
	if err != nil {
		return Report{}, err
	}
	return Aggregate(rows, s.conv, userID, days, s.now(), s.basis)
}

// Platform builds the operator's platform-wide report.
func (s *Service) Platform(ctx context.Context, days int) (Report, error) {
	days = clampDays(days)
	since := s.start(days)
	rows, err := s.load(ctx, since, "")
	if err != nil {
		return Report{}, err
	}
	rep, err := Aggregate(rows, s.conv, "", days, s.now(), s.basis)
	if err != nil {
		return Report{}, err
	}
	if err := s.platformDimensions(ctx, &rep, since); err != nil {
		return Report{}, err
	}
	return rep, nil
}

func (s *Service) counts(ctx context.Context, query string, args ...any) ([]Slice, error) {
	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Slice{}
	for rows.Next() {
		var l string
		var n int
		if err := rows.Scan(&l, &n); err != nil {
			return nil, err
		}
		out = append(out, Slice{Label: l, Count: n})
	}
	return out, rows.Err()
}

func (s *Service) platformDimensions(ctx context.Context, rep *Report, since time.Time) error {
	var err error
	if rep.KYC, err = s.counts(ctx, `SELECT kyc_status, COUNT(*)::int FROM users GROUP BY 1 ORDER BY 2 DESC`); err != nil {
		return fmt.Errorf("analytics: kyc: %w", err)
	}
	for _, k := range rep.KYC {
		rep.Totals.TotalTraders += k.Count
	}
	if err = s.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM users WHERE created_at >= $1`, since).Scan(&rep.Totals.NewTraders); err != nil {
		return err
	}
	if err = s.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT a.user_id)::int FROM transactions t JOIN accounts a ON a.id = t.source_account_id
		WHERE t.created_at >= $1 AND a.type IN ('BUSINESS','PERSONAL')`, since).Scan(&rep.Totals.ActiveTraders); err != nil {
		return err
	}
	if rep.Workflows, err = s.counts(ctx, `SELECT state, COUNT(*)::int FROM transaction_workflows WHERE created_at >= $1 GROUP BY 1 ORDER BY 2 DESC`, since); err != nil {
		return fmt.Errorf("analytics: workflows: %w", err)
	}
	if rep.Tickets, err = s.counts(ctx, `SELECT status, COUNT(*)::int FROM support_tickets GROUP BY 1 ORDER BY 2 DESC`); err != nil {
		return fmt.Errorf("analytics: tickets: %w", err)
	}
	if rep.Settlements, err = s.counts(ctx, `SELECT status, COUNT(*)::int FROM settlement_commands GROUP BY 1 ORDER BY 2 DESC`); err != nil {
		return fmt.Errorf("analytics: settlements: %w", err)
	}
	prows, err := s.pool.Query(ctx, `
		SELECT provider, COUNT(*)::int,
		       COUNT(*) FILTER (WHERE state = 'SUCCEEDED')::int,
		       COUNT(*) FILTER (WHERE state IN ('FAILED','TIMEOUT'))::int
		FROM provider_executions WHERE created_at >= $1 GROUP BY 1 ORDER BY 2 DESC`, since)
	if err != nil {
		return fmt.Errorf("analytics: providers: %w", err)
	}
	defer prows.Close()
	rep.Providers = []ProviderStat{}
	for prows.Next() {
		var p ProviderStat
		if err := prows.Scan(&p.Provider, &p.Total, &p.Succeeded, &p.Failed); err != nil {
			return err
		}
		if fin := p.Succeeded + p.Failed; fin > 0 {
			p.SuccessRate = float64(p.Succeeded) / float64(fin)
		}
		rep.Providers = append(rep.Providers, p)
	}
	return prows.Err()
}
