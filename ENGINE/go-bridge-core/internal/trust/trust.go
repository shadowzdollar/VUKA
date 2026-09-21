// Package trust computes VUKA's deterministic trader trust score from a
// trader's own settlement history. Inputs are limited to settlement outcomes:
// no identity, demographic or inferred-behaviour signals are used, so the
// score is explainable and contestable factor by factor.
//
// Not scored (no per-trader source in the engine): mutual-release rate and
// arbitration record, because on-chain escrows are keyed by wallet address.
package trust

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	Min = 300
	Max = 850
)

// Tx is one transfer touching the trader's accounts.
type Tx struct {
	Status       string // SUCCESS | FAILED | REVERSED | PENDING | PROCESSING
	CreatedAt    time.Time
	Counterparty string // the other side's account id (empty for own-account moves)
	Trade        bool   // true only for movements between the trader and ANOTHER TRADER (top-ups from settlement accounts are not trade)
}

// Input is everything the score depends on.
type Input struct {
	Transfers     []Tx
	InvoicesTotal int
	InvoicesPaid  int
	Now           time.Time
}

// Factor is one explainable component.
type Factor struct {
	Key        string  `json:"key"`
	Label      string  `json:"label"`
	Weight     int     `json:"weight"`     // percent; all weights sum to 100
	Value      float64 `json:"value"`      // 0..100
	Confidence float64 `json:"confidence"` // 0..1 share of the evidence needed to trust Value
	Detail     string  `json:"detail"`
}

// Result is the full, explainable score.
type Result struct {
	Score        int       `json:"score"`
	Band         string    `json:"band"`
	CyclesScored int       `json:"cycles_scored"`
	Factors      []Factor  `json:"factors"`
	ComputedAt   time.Time `json:"computed_at"`
	Method       string    `json:"method"`
}

const day = 24 * time.Hour

func clamp(v, lo, hi float64) float64 { return math.Min(hi, math.Max(lo, v)) }
func conf(n, need float64) float64    { return clamp(n/need, 0, 1) }

// Compute is pure and deterministic.
func Compute(in Input) Result {
	now := in.Now
	if now.IsZero() {
		now = time.Now().UTC()
	}
	var success, failed, reversed int
	cps := map[string]struct{}{}
	var recent, prior int
	for _, t := range in.Transfers {
		if !t.Trade {
			continue
		}
		switch t.Status {
		case "SUCCESS":
			success++
			if t.Counterparty != "" {
				cps[t.Counterparty] = struct{}{}
			}
			switch age := now.Sub(t.CreatedAt); {
			case age >= -day && age < 30*day:
				recent++
			case age >= 30*day && age < 60*day:
				prior++
			}
		case "FAILED":
			failed++
		case "REVERSED":
			reversed++
		}
	}
	finished := success + failed + reversed
	settledOrReversed := success + reversed

	cycles := Factor{Key: "cycles", Label: "Completed settlement cycles", Weight: 35,
		Confidence: conf(float64(finished), 10),
		Detail:     fmt.Sprintf("%d of %d finished payments settled successfully.", success, finished)}
	if finished > 0 {
		cycles.Value = 100 * float64(success) / float64(finished)
	}

	invoices := Factor{Key: "invoices", Label: "Invoice settlement", Weight: 25,
		Confidence: conf(float64(in.InvoicesTotal), 5),
		Detail:     fmt.Sprintf("%d of %d invoices are fully paid.", in.InvoicesPaid, in.InvoicesTotal)}
	if in.InvoicesTotal > 0 {
		invoices.Value = 100 * float64(in.InvoicesPaid) / float64(in.InvoicesTotal)
	}

	reversals := Factor{Key: "reversals", Label: "Reversal record", Weight: 20,
		Confidence: conf(float64(settledOrReversed), 10),
		Detail:     fmt.Sprintf("%d of %d settled payments were later reversed.", reversed, settledOrReversed)}
	if settledOrReversed > 0 {
		reversals.Value = 100 * (1 - float64(reversed)/float64(settledOrReversed))
	}

	growth := Factor{Key: "volume", Label: "Volume progression", Weight: 10,
		Confidence: conf(float64(recent+prior), 4),
		Detail:     fmt.Sprintf("%d settled payments in the last 30 days vs %d in the 30 days before.", recent, prior)}
	switch {
	case recent == 0 && prior == 0:
		growth.Value = 0
	case prior == 0:
		growth.Value = 70
	default:
		growth.Value = clamp(50+50*float64(recent-prior)/float64(prior), 0, 100)
	}

	diversity := Factor{Key: "diversity", Label: "Counterparty diversity", Weight: 10,
		Confidence: conf(float64(success), 5),
		Detail:     fmt.Sprintf("%d distinct counterparty accounts across settled payments.", len(cps)),
		Value:      clamp(float64(len(cps))*20, 0, 100)}

	factors := []Factor{cycles, invoices, reversals, growth, diversity}
	var weighted float64
	for _, f := range factors {
		// Thin evidence pulls a factor toward the floor so one payment cannot yield a top score.
		weighted += float64(f.Weight) * (f.Value * f.Confidence)
	}
	score := int(math.Round(Min + float64(Max-Min)*weighted/10_000))

	band := "Unrated"
	if finished > 0 {
		switch {
		case score >= 780:
			band = "A"
		case score >= 700:
			band = "B"
		case score >= 600:
			band = "C"
		case score >= 500:
			band = "D"
		default:
			band = "E"
		}
	}
	return Result{Score: score, Band: band, CyclesScored: finished, Factors: factors, ComputedAt: now.UTC(),
		Method: "deterministic-v1: settlement outcomes only; evidence-weighted"}
}

// Load reads a trader's transfers from the ledger.
func Load(ctx context.Context, pool *pgxpool.Pool, userID string) ([]Tx, error) {
	rows, err := pool.Query(ctx, `
		SELECT t.status::text, t.created_at,
		       CASE WHEN sa.user_id = $1 THEN t.destination_account_id::text ELSE t.source_account_id::text END,
		       (sa.user_id = $1) <> (da.user_id = $1)
		       AND (CASE WHEN sa.user_id = $1 THEN da.type ELSE sa.type END) IN ('BUSINESS','PERSONAL')
		FROM transactions t
		JOIN accounts sa ON sa.id = t.source_account_id
		JOIN accounts da ON da.id = t.destination_account_id
		WHERE sa.user_id = $1 OR da.user_id = $1`, userID)
	if err != nil {
		return nil, fmt.Errorf("trust: load transfers: %w", err)
	}
	defer rows.Close()
	var out []Tx
	for rows.Next() {
		var t Tx
		if err := rows.Scan(&t.Status, &t.CreatedAt, &t.Counterparty, &t.Trade); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
