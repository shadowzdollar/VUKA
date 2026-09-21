// Package risk enforces KYC-tiered transaction limits and the sanctions
// screening gate. Limits are expressed in USD equivalents so one policy covers
// every currency on the platform. It is a pure decision layer over data the
// ledger already holds; it never moves money.
package risk

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// KYC statuses stored in users.kyc_status.
const (
	StatusPending          = "PENDING"
	StatusVerified         = "VERIFIED"
	StatusBusinessVerified = "BUSINESS_VERIFIED"
	StatusRejected         = "REJECTED"
	StatusSuspended        = "SUSPENDED"
)

// Limits caps what one trader may send, in USD equivalents. A zero Limits
// blocks the trader entirely (REJECTED / SUSPENDED).
type Limits struct {
	PerTxnUSD  float64 `json:"per_txn_usd"`
	DailyUSD   float64 `json:"daily_usd"`
	MonthlyUSD float64 `json:"monthly_usd"`
}

// DefaultLimits is a conservative, tiered policy in the spirit of
// proportionate, risk-based KYC (FATF R.10). Tune per jurisdiction with the
// compliance officer before production; these are the engine defaults.
func DefaultLimits() map[string]Limits {
	return map[string]Limits{
		StatusPending:          {PerTxnUSD: 200, DailyUSD: 500, MonthlyUSD: 2_000},
		StatusVerified:         {PerTxnUSD: 2_000, DailyUSD: 5_000, MonthlyUSD: 20_000},
		StatusBusinessVerified: {PerTxnUSD: 10_000, DailyUSD: 50_000, MonthlyUSD: 250_000},
		StatusRejected:         {},
		StatusSuspended:        {},
	}
}

// Decision is the outcome of a limit check.
type Decision struct {
	Allowed   bool    `json:"allowed"`
	Code      string  `json:"code,omitempty"`
	Message   string  `json:"message,omitempty"`
	Status    string  `json:"kyc_status"`
	AmountUSD float64 `json:"amount_usd"`
	Limits    Limits  `json:"limits"`
	UsedDay   float64 `json:"used_day_usd"`
	UsedMonth float64 `json:"used_month_usd"`
}

// Usage is what the trader has already sent, in USD.
type Usage struct {
	Day   float64
	Month float64
}

// Evaluate is the pure policy function.
func Evaluate(status string, amountUSD float64, used Usage, table map[string]Limits) Decision {
	status = strings.ToUpper(strings.TrimSpace(status))
	lim, known := table[status]
	d := Decision{Status: status, AmountUSD: round2(amountUSD), Limits: lim, UsedDay: round2(used.Day), UsedMonth: round2(used.Month)}
	switch {
	case !known || lim.PerTxnUSD <= 0:
		d.Code, d.Message = "kyc_not_permitted", "this account is not permitted to send payments until verification is resolved"
	case amountUSD > lim.PerTxnUSD:
		d.Code, d.Message = "kyc_limit_exceeded", fmt.Sprintf("the amount exceeds the per-transaction limit of USD %.0f for your verification level", lim.PerTxnUSD)
	case used.Day+amountUSD > lim.DailyUSD:
		d.Code, d.Message = "kyc_limit_exceeded", fmt.Sprintf("this would exceed your daily limit of USD %.0f", lim.DailyUSD)
	case used.Month+amountUSD > lim.MonthlyUSD:
		d.Code, d.Message = "kyc_limit_exceeded", fmt.Sprintf("this would exceed your monthly limit of USD %.0f", lim.MonthlyUSD)
	default:
		d.Allowed = true
	}
	return d
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }

// Converter turns an amount in a currency into USD (the catalog's reference table).
type Converter interface {
	ToUSD(amount float64, currency string) (float64, error)
}

// Service evaluates limits against live ledger usage.
type Service struct {
	pool   *pgxpool.Pool
	conv   Converter
	limits map[string]Limits
	now    func() time.Time
}

func NewService(pool *pgxpool.Pool, conv Converter, limits map[string]Limits) *Service {
	if limits == nil {
		limits = DefaultLimits()
	}
	return &Service{pool: pool, conv: conv, limits: limits, now: time.Now}
}

// Table exposes the active policy (for the public config endpoint).
func (s *Service) Table() map[string]Limits { return s.limits }

// Check evaluates a proposed outgoing amount for a trader. Usage counts
// outgoing business-wallet transfers that are not failed or reversed.
func (s *Service) Check(ctx context.Context, userID string, amount float64, currency string) (Decision, error) {
	amountUSD, err := s.conv.ToUSD(amount, currency)
	if err != nil {
		return Decision{}, err
	}
	var status string
	if err := s.pool.QueryRow(ctx, `SELECT kyc_status FROM users WHERE id=$1`, userID).Scan(&status); err != nil {
		return Decision{}, fmt.Errorf("risk: load trader: %w", err)
	}
	used, err := s.usage(ctx, userID)
	if err != nil {
		return Decision{}, err
	}
	return Evaluate(status, amountUSD, used, s.limits), nil
}

func (s *Service) usage(ctx context.Context, userID string) (Usage, error) {
	now := s.now().UTC()
	rows, err := s.pool.Query(ctx, `
		SELECT t.currency,
		       COALESCE(SUM(t.amount) FILTER (WHERE t.created_at >= $2), 0)::float8,
		       COALESCE(SUM(t.amount) FILTER (WHERE t.created_at >= $3), 0)::float8
		FROM transactions t JOIN accounts a ON a.id = t.source_account_id
		WHERE a.user_id = $1 AND a.type = 'BUSINESS'
		  AND t.status IN ('PENDING','PROCESSING','SUCCESS')
		  AND t.created_at >= $3
		GROUP BY t.currency`, userID, now.Add(-24*time.Hour), now.Add(-30*24*time.Hour))
	if err != nil {
		return Usage{}, fmt.Errorf("risk: usage: %w", err)
	}
	defer rows.Close()
	var u Usage
	for rows.Next() {
		var cur string
		var day, month float64
		if err := rows.Scan(&cur, &day, &month); err != nil {
			return Usage{}, err
		}
		d, err := s.conv.ToUSD(day, cur)
		if err != nil {
			return Usage{}, err
		}
		m, err := s.conv.ToUSD(month, cur)
		if err != nil {
			return Usage{}, err
		}
		u.Day += d
		u.Month += m
	}
	return u, rows.Err()
}
