package reconciliation

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ApplyEvent persists a chain event and its derived escrow state atomically.
// Replaying the same transaction hash/log index is a successful no-op.
func (r *Repository) ApplyEvent(ctx context.Context, event ChainEvent) (bool, error) {
	if r == nil || r.pool == nil {
		return false, errors.New("reconciliation: repository has nil pool")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, fmt.Errorf("reconciliation: begin: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op after commit

	inserted, err := applyEventTx(ctx, tx, event)
	if err != nil {
		return false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return false, fmt.Errorf("reconciliation: commit: %w", err)
	}
	return inserted, nil
}

// ApplyEventsAndAdvance atomically applies a finalized batch and advances the
// cursor. A failed event rolls back both the batch and cursor movement.
func (r *Repository) ApplyEventsAndAdvance(ctx context.Context, events []ChainEvent, nextBlock int64) (int, error) {
	if r == nil || r.pool == nil {
		return 0, errors.New("reconciliation: repository has nil pool")
	}
	if len(events) == 0 || nextBlock < 0 {
		return 0, fmt.Errorf("reconciliation: invalid finalized batch")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("reconciliation: begin: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	applied := 0
	for _, event := range events {
		inserted, err := applyEventTx(ctx, tx, event)
		if err != nil {
			return 0, err
		}
		if inserted {
			applied++
		}
	}
	if err := upsertCursor(ctx, tx, events[0].ChainID, events[0].ContractAddress, nextBlock); err != nil {
		return 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("reconciliation: commit batch: %w", err)
	}
	return applied, nil
}

func (r *Repository) Cursor(ctx context.Context, chainID int64, contractAddress string) (int64, error) {
	if r == nil || r.pool == nil {
		return 0, errors.New("reconciliation: repository has nil pool")
	}

	var nextBlock int64
	err := r.pool.QueryRow(ctx, `
		SELECT next_block FROM reconciliation_cursors
		WHERE chain_id = $1 AND contract_address = $2`,
		chainID, contractAddress,
	).Scan(&nextBlock)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("reconciliation: read cursor: %w", err)
	}
	return nextBlock, nil
}

func (r *Repository) ListEscrows(ctx context.Context, chainID int64, contractAddress string) ([]Summary, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("reconciliation: repository has nil pool")
	}
	rows, err := r.pool.Query(ctx, `
		SELECT chain_id, contract_address, escrow_id, buyer_address,
		       supplier_address, amount::text, invoice_ref, state, updated_block
		FROM escrows
		WHERE chain_id = $1 AND contract_address = $2
		ORDER BY escrow_id`, chainID, contractAddress)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list escrows: %w", err)
	}
	defer rows.Close()
	var result []Summary
	for rows.Next() {
		var item Summary
		if err := rows.Scan(&item.ChainID, &item.ContractAddress, &item.EscrowID,
			&item.Buyer, &item.Supplier, &item.Amount, &item.InvoiceRef,
			&item.State, &item.UpdatedBlock); err != nil {
			return nil, fmt.Errorf("reconciliation: scan escrow: %w", err)
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) ListEvents(ctx context.Context, chainID int64, contractAddress string, escrowID int64) ([]EventRecord, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("reconciliation: repository has nil pool")
	}
	rows, err := r.pool.Query(ctx, `
		SELECT chain_id, contract_address, transaction_hash, log_index,
		       block_number, block_hash, escrow_id, event_type, payload,
		       observed_at
		FROM chain_events
		WHERE chain_id = $1 AND contract_address = $2 AND escrow_id = $3
		ORDER BY block_number, log_index`, chainID, contractAddress, escrowID)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list events: %w", err)
	}
	defer rows.Close()

	result := make([]EventRecord, 0)
	for rows.Next() {
		var item EventRecord
		var observedAt time.Time
		if err := rows.Scan(&item.ChainID, &item.ContractAddress, &item.TransactionHash,
			&item.LogIndex, &item.BlockNumber, &item.BlockHash, &item.EscrowID,
			&item.EventType, &item.Payload, &observedAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan event: %w", err)
		}
		item.ObservedAt = observedAt.UTC().Format(time.RFC3339)
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) AdvanceCursor(ctx context.Context, chainID int64, contractAddress string, nextBlock int64) error {
	if r == nil || r.pool == nil {
		return errors.New("reconciliation: repository has nil pool")
	}
	if chainID <= 0 || contractAddress == "" || nextBlock < 0 {
		return fmt.Errorf("reconciliation: invalid cursor")
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("reconciliation: begin cursor update: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if err := upsertCursor(ctx, tx, chainID, contractAddress, nextBlock); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("reconciliation: commit cursor update: %w", err)
	}
	return nil
}

func applyEventTx(ctx context.Context, tx pgx.Tx, event ChainEvent) (bool, error) {
	payload, err := json.Marshal(event)
	if err != nil {
		return false, fmt.Errorf("reconciliation: encode event: %w", err)
	}

	var inserted bool
	var existingHash string
	err = tx.QueryRow(ctx, `
		SELECT block_hash FROM canonical_blocks
		WHERE chain_id = $1 AND contract_address = $2 AND block_number = $3`,
		event.ChainID, event.ContractAddress, event.BlockNumber).Scan(&existingHash)
	if err == nil && existingHash != event.BlockHash {
		return false, fmt.Errorf("%w: block %d", ErrReorgDetected, event.BlockNumber)
	}
	if !errors.Is(err, pgx.ErrNoRows) && err != nil {
		return false, fmt.Errorf("reconciliation: check canonical block: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO canonical_blocks (chain_id, contract_address, block_number, block_hash)
		VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
		event.ChainID, event.ContractAddress, event.BlockNumber, event.BlockHash); err != nil {
		return false, fmt.Errorf("reconciliation: store canonical block: %w", err)
	}
	err = tx.QueryRow(ctx, `
		INSERT INTO chain_events
			(chain_id, contract_address, transaction_hash, log_index,
			 block_number, block_hash, escrow_id, event_type, payload)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT DO NOTHING
		RETURNING TRUE`,
		event.ChainID, event.ContractAddress, event.TransactionHash, event.LogIndex,
		event.BlockNumber, event.BlockHash, event.EscrowID, event.Type, payload,
	).Scan(&inserted)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("reconciliation: insert chain event: %w", err)
	}

	var current Escrow
	err = tx.QueryRow(ctx, `
		SELECT chain_id, contract_address, escrow_id, buyer_address,
		       supplier_address, amount::text, invoice_ref, state
		FROM escrows
		WHERE chain_id = $1 AND contract_address = $2 AND escrow_id = $3
		FOR UPDATE`,
		event.ChainID, event.ContractAddress, event.EscrowID,
	).Scan(&current.ChainID, &current.ContractAddress, &current.EscrowID,
		&current.Buyer, &current.Supplier, &current.Amount, &current.InvoiceRef, &current.State)
	if errors.Is(err, pgx.ErrNoRows) {
		if event.Type != EventEscrowCreated || event.Buyer == "" ||
			event.Supplier == "" || event.Amount == "" {
			return false, fmt.Errorf("%w: first event must create escrow", ErrInvalidState)
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO escrows
				(chain_id, contract_address, escrow_id, buyer_address,
				 supplier_address, amount, invoice_ref, state, updated_block)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			event.ChainID, event.ContractAddress, event.EscrowID, event.Buyer,
			event.Supplier, event.Amount, event.InvoiceRef, StateCreated, event.BlockNumber)
		if err != nil {
			return false, fmt.Errorf("reconciliation: insert escrow: %w", err)
		}
	} else if err != nil {
		return false, fmt.Errorf("reconciliation: select escrow: %w", err)
	} else {
		if err := Apply(&current, event); err != nil {
			return false, err
		}
		_, err = tx.Exec(ctx, `
			UPDATE escrows SET state = $1, updated_block = $2, updated_at = now()
			WHERE chain_id = $3 AND contract_address = $4 AND escrow_id = $5`,
			current.State, event.BlockNumber, current.ChainID, current.ContractAddress, current.EscrowID)
		if err != nil {
			return false, fmt.Errorf("reconciliation: update escrow: %w", err)
		}
	}

	return inserted, nil
}

func upsertCursor(ctx context.Context, tx pgx.Tx, chainID int64, contractAddress string, nextBlock int64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO reconciliation_cursors (chain_id, contract_address, next_block)
		VALUES ($1, $2, $3)
		ON CONFLICT (chain_id, contract_address) DO UPDATE
		SET next_block = EXCLUDED.next_block, updated_at = now()
		WHERE reconciliation_cursors.next_block <= EXCLUDED.next_block`,
		chainID, contractAddress, nextBlock)
	if err != nil {
		return fmt.Errorf("reconciliation: advance cursor: %w", err)
	}
	return nil
}
