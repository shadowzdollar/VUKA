package reconciliation

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ExpiredEscrow represents an escrow locked on-chain whose timeout has expired
// without an active dispute, making it eligible for automated release.
type ExpiredEscrow struct {
	ChainID         int64     `json:"chain_id"`
	ContractAddress string    `json:"contract_address"`
	EscrowID        int64     `json:"escrow_id"`
	BuyerAddress    string    `json:"buyer_address"`
	SupplierAddress string    `json:"supplier_address"`
	Amount          string    `json:"amount"`
	TimeoutAt       time.Time `json:"timeout_at"`
	InvoiceRef      string    `json:"invoice_ref"`
	State           string    `json:"state"`
}

// TimeoutReleaseAction records an automated keeper release evaluation or execution.
type TimeoutReleaseAction struct {
	EscrowID        int64     `json:"escrow_id"`
	ContractAddress string    `json:"contract_address"`
	ExecutedAt      time.Time `json:"executed_at"`
	Action          string    `json:"action"` // "ELIGIBLE", "TRIGGERED", "SKIPPED_DISPUTED"
	Reason          string    `json:"reason"`
}

// EscrowKeeper monitors locked escrows, detects expired deadlines, and logs/triggers
// auto-release actions.
type EscrowKeeper struct {
	pool     *pgxpool.Pool
	logger   *slog.Logger
	interval time.Duration
}

// NewEscrowKeeper constructs a new escrow timeout keeper daemon.
func NewEscrowKeeper(pool *pgxpool.Pool, logger *slog.Logger, interval time.Duration) *EscrowKeeper {
	if interval <= 0 {
		interval = 1 * time.Minute
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &EscrowKeeper{
		pool:     pool,
		logger:   logger,
		interval: interval,
	}
}

// FindExpiredLockedEscrows finds all escrows in LOCKED state whose timeout_at is in the past.
func (k *EscrowKeeper) FindExpiredLockedEscrows(ctx context.Context, asOf time.Time, contractAddress ...string) ([]ExpiredEscrow, error) {
	if k == nil || k.pool == nil {
		return nil, fmt.Errorf("keeper: nil database pool")
	}

	query := `
		SELECT 
			chain_id, contract_address, escrow_id, 
			buyer_address, supplier_address, amount::text, 
			timeout_at, invoice_ref, state
		FROM escrows
		WHERE state = 'LOCKED'
		  AND timeout_at > 0 
		  AND timeout_at <= $1
	`
	args := []any{asOf.Unix()}
	if len(contractAddress) > 0 && contractAddress[0] != "" {
		query += " AND contract_address = $2"
		args = append(args, contractAddress[0])
	}
	query += " ORDER BY timeout_at ASC;"

	rows, err := k.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("keeper: query expired escrows failed: %w", err)
	}
	defer rows.Close()

	var expired []ExpiredEscrow
	for rows.Next() {
		var e ExpiredEscrow
		var timeoutUnix int64
		if err := rows.Scan(
			&e.ChainID, &e.ContractAddress, &e.EscrowID,
			&e.BuyerAddress, &e.SupplierAddress, &e.Amount,
			&timeoutUnix, &e.InvoiceRef, &e.State,
		); err != nil {
			return nil, fmt.Errorf("keeper: scan expired escrow failed: %w", err)
		}
		e.TimeoutAt = time.Unix(timeoutUnix, 0).UTC()
		expired = append(expired, e)
	}

	return expired, rows.Err()
}

// ProcessExpiredEscrows evaluates expired escrows and determines actions.
func (k *EscrowKeeper) ProcessExpiredEscrows(ctx context.Context, contractAddress ...string) ([]TimeoutReleaseAction, error) {
	now := time.Now().UTC()
	expired, err := k.FindExpiredLockedEscrows(ctx, now, contractAddress...)
	if err != nil {
		return nil, err
	}

	var actions []TimeoutReleaseAction
	for _, e := range expired {
		action := TimeoutReleaseAction{
			EscrowID:        e.EscrowID,
			ContractAddress: e.ContractAddress,
			ExecutedAt:      now,
			Action:          "ELIGIBLE",
			Reason:          fmt.Sprintf("Timeout expired at %s (invoice: %s)", e.TimeoutAt.Format(time.RFC3339), e.InvoiceRef),
		}
		actions = append(actions, action)
		k.logger.Info("keeper evaluated expired escrow",
			"escrow_id", e.EscrowID,
			"invoice", e.InvoiceRef,
			"timeout_at", e.TimeoutAt,
			"supplier", e.SupplierAddress,
		)
	}

	return actions, nil
}

// Run executes the keeper loop until context cancellation.
func (k *EscrowKeeper) Run(ctx context.Context) {
	k.logger.Info("starting escrow timeout keeper daemon", "interval", k.interval)
	ticker := time.NewTicker(k.interval)
	defer ticker.Stop()

	// Initial pass
	if _, err := k.ProcessExpiredEscrows(ctx); err != nil {
		k.logger.Warn("keeper initial pass error", "error", err)
	}

	for {
		select {
		case <-ctx.Done():
			k.logger.Info("stopping escrow timeout keeper daemon")
			return
		case <-ticker.C:
			if _, err := k.ProcessExpiredEscrows(ctx); err != nil {
				k.logger.Warn("keeper periodic pass error", "error", err)
			}
		}
	}
}
