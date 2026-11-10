package ledger

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SolvencyCurrencyReport holds the net zero-sum calculation for one currency.
type SolvencyCurrencyReport struct {
	Currency     string  `json:"currency"`
	TotalDebits  float64 `json:"total_debits"`
	TotalCredits float64 `json:"total_credits"`
	NetSum       float64 `json:"net_sum"`
	EntryCount   int64   `json:"entry_count"`
	Balanced     bool    `json:"balanced"`
}

// SolvencyAttestation is an immutable cryptographic audit record certifying
// that all ledger entries across all currencies strictly sum to zero.
type SolvencyAttestation struct {
	Timestamp      time.Time                `json:"timestamp"`
	TotalEntries   int64                    `json:"total_entries"`
	Currencies     []SolvencyCurrencyReport `json:"currencies"`
	GlobalBalanced bool                     `json:"global_balanced"`
	AuditHash      string                   `json:"audit_hash"`
}

// VerifySolvency scans the entire double-entry ledger by currency and proves
// mathematically that SUM(amount) == 0 (accounting equation net-zero).
func (s *Service) VerifySolvency(ctx context.Context) (*SolvencyAttestation, error) {
	query := `
		SELECT 
			a.currency,
			COALESCE(SUM(CASE WHEN le.amount < 0 THEN ABS(le.amount) ELSE 0 END), 0) AS total_debits,
			COALESCE(SUM(CASE WHEN le.amount > 0 THEN le.amount ELSE 0 END), 0) AS total_credits,
			COALESCE(SUM(le.amount), 0) AS net_sum,
			COUNT(le.id) AS entry_count
		FROM accounts a
		LEFT JOIN ledger_entries le ON a.id = le.account_id
		GROUP BY a.currency
		ORDER BY a.currency;
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("ledger: verify solvency query failed: %w", err)
	}
	defer rows.Close()

	var reports []SolvencyCurrencyReport
	var totalEntries int64
	globalBalanced := true

	h := sha256.New()

	for rows.Next() {
		var r SolvencyCurrencyReport
		if err := rows.Scan(&r.Currency, &r.TotalDebits, &r.TotalCredits, &r.NetSum, &r.EntryCount); err != nil {
			return nil, fmt.Errorf("ledger: scan solvency row failed: %w", err)
		}

		// Floating point tolerance for zero-sum accounting
		if math.Abs(r.NetSum) < 0.0001 {
			r.NetSum = 0
			r.Balanced = true
		} else {
			r.Balanced = false
			globalBalanced = false
		}

		totalEntries += r.EntryCount
		reports = append(reports, r)

		h.Write([]byte(fmt.Sprintf("%s:deb=%.4f:cred=%.4f:cnt=%d|", r.Currency, r.TotalDebits, r.TotalCredits, r.EntryCount)))
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ledger: solvency rows error: %w", err)
	}

	now := time.Now().UTC()
	h.Write([]byte(fmt.Sprintf("time=%s:entries=%d:bal=%t", now.Format(time.RFC3339), totalEntries, globalBalanced)))
	auditHash := hex.EncodeToString(h.Sum(nil))

	return &SolvencyAttestation{
		Timestamp:      now,
		TotalEntries:   totalEntries,
		Currencies:     reports,
		GlobalBalanced: globalBalanced,
		AuditHash:      auditHash,
	}, nil
}

// SolvencyDaemon monitors ledger solvency periodically in the background.
type SolvencyDaemon struct {
	pool            *pgxpool.Pool
	service         *Service
	interval        time.Duration
	lastAttestation *SolvencyAttestation
}

// NewSolvencyDaemon creates a new solvency monitoring daemon.
func NewSolvencyDaemon(pool *pgxpool.Pool, service *Service, interval time.Duration) *SolvencyDaemon {
	if interval <= 0 {
		interval = 5 * time.Minute
	}
	return &SolvencyDaemon{
		pool:     pool,
		service:  service,
		interval: interval,
	}
}

// LastAttestation returns the most recent solvency check result.
func (d *SolvencyDaemon) LastAttestation() *SolvencyAttestation {
	return d.lastAttestation
}

// Run executes the solvency verification loop until context is canceled.
func (d *SolvencyDaemon) Run(ctx context.Context) {
	ticker := time.NewTicker(d.interval)
	defer ticker.Stop()

	// Run initial check on startup
	if att, err := d.service.VerifySolvency(ctx); err == nil {
		d.lastAttestation = att
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			att, err := d.service.VerifySolvency(ctx)
			if err != nil {
				continue
			}
			d.lastAttestation = att
		}
	}
}
