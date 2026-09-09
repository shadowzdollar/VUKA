package reconciliation

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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
	chainID, contractAddress, err := validateFinalizedBatch(events)
	if err != nil {
		return 0, err
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
	if err := upsertCursor(ctx, tx, chainID, contractAddress, nextBlock); err != nil {
		return 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("reconciliation: commit batch: %w", err)
	}
	return applied, nil
}

func validateFinalizedBatch(events []ChainEvent) (int64, string, error) {
	if len(events) == 0 {
		return 0, "", fmt.Errorf("reconciliation: invalid finalized batch")
	}
	chainID := events[0].ChainID
	contractAddress := events[0].ContractAddress
	if chainID <= 0 || contractAddress == "" {
		return 0, "", fmt.Errorf("reconciliation: finalized batch has invalid chain resource")
	}
	previousBlock := events[0].BlockNumber
	previousLog := events[0].LogIndex
	if previousBlock < 0 || previousLog < 0 {
		return 0, "", fmt.Errorf("reconciliation: finalized batch contains invalid event position")
	}
	for _, event := range events[1:] {
		if event.ChainID != chainID || event.ContractAddress != contractAddress {
			return 0, "", fmt.Errorf("reconciliation: finalized batch contains multiple chain resources")
		}
		if event.BlockNumber < 0 || event.LogIndex < 0 ||
			event.BlockNumber < previousBlock ||
			(event.BlockNumber == previousBlock && event.LogIndex < previousLog) {
			return 0, "", fmt.Errorf("reconciliation: finalized batch is not ordered by chain position")
		}
		previousBlock = event.BlockNumber
		previousLog = event.LogIndex
	}
	return chainID, contractAddress, nil
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
		       supplier_address, amount::text, timeout_at, invoice_ref, state, updated_block
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
			&item.Buyer, &item.Supplier, &item.Amount, &item.TimeoutAt, &item.InvoiceRef,
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

func (r *Repository) ListDisputes(ctx context.Context, chainID int64, contractAddress, status string) ([]Dispute, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, chain_id, contract_address, escrow_id, raised_transaction_hash,
		       raised_log_index, reason, status, created_at, resolved_at
		FROM escrow_disputes
		WHERE chain_id = $1 AND contract_address = $2
		  AND ($3 = '' OR status = $3)
		ORDER BY created_at DESC`, chainID, contractAddress, status)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list disputes: %w", err)
	}
	defer rows.Close()
	result := make([]Dispute, 0)
	for rows.Next() {
		var item Dispute
		var createdAt time.Time
		var resolvedAt *time.Time
		if err := rows.Scan(&item.ID, &item.ChainID, &item.ContractAddress, &item.EscrowID,
			&item.RaisedTransactionHash, &item.RaisedLogIndex, &item.Reason, &item.Status,
			&createdAt, &resolvedAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan dispute: %w", err)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		if resolvedAt != nil {
			item.ResolvedAt = resolvedAt.UTC().Format(time.RFC3339)
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *Repository) GetDispute(ctx context.Context, disputeID string) (Dispute, error) {
	if r == nil || r.pool == nil {
		return Dispute{}, errors.New("reconciliation: repository has nil pool")
	}
	var dispute Dispute
	var createdAt time.Time
	var resolvedAt *time.Time
	err := r.pool.QueryRow(ctx, `
		SELECT id, chain_id, contract_address, escrow_id, raised_transaction_hash,
		       raised_log_index, reason, status, created_at, resolved_at
		FROM escrow_disputes WHERE id = $1`, disputeID).Scan(
		&dispute.ID, &dispute.ChainID, &dispute.ContractAddress, &dispute.EscrowID,
		&dispute.RaisedTransactionHash, &dispute.RaisedLogIndex, &dispute.Reason,
		&dispute.Status, &createdAt, &resolvedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Dispute{}, fmt.Errorf("reconciliation: dispute not found")
	}
	if err != nil {
		return Dispute{}, fmt.Errorf("reconciliation: get dispute: %w", err)
	}
	dispute.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	if resolvedAt != nil {
		dispute.ResolvedAt = resolvedAt.UTC().Format(time.RFC3339)
	}
	return dispute, nil
}

func (r *Repository) AddDisputeReview(ctx context.Context, disputeID, reviewer, note string) (DisputeReview, error) {
	if r == nil || r.pool == nil {
		return DisputeReview{}, errors.New("reconciliation: repository has nil pool")
	}
	var review DisputeReview
	var createdAt time.Time
	err := r.pool.QueryRow(ctx, `
		INSERT INTO dispute_reviews (dispute_id, reviewer_email, note)
		SELECT id, $2, $3 FROM escrow_disputes WHERE id = $1 AND status = 'OPEN'
		RETURNING id, dispute_id, reviewer_email, note, created_at`,
		disputeID, reviewer, note).Scan(&review.ID, &review.DisputeID, &review.Reviewer, &review.Note, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return DisputeReview{}, fmt.Errorf("reconciliation: dispute not found or already resolved")
	}
	if err != nil {
		return DisputeReview{}, fmt.Errorf("reconciliation: add dispute review: %w", err)
	}
	review.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return review, nil
}

func (r *Repository) ListDisputeReviews(ctx context.Context, disputeID string) ([]DisputeReview, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("reconciliation: repository has nil pool")
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, dispute_id, reviewer_email, note, created_at
		FROM dispute_reviews
		WHERE dispute_id = $1
		ORDER BY created_at DESC`, disputeID)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list dispute reviews: %w", err)
	}
	defer rows.Close()
	reviews := make([]DisputeReview, 0)
	for rows.Next() {
		var review DisputeReview
		var createdAt time.Time
		if err := rows.Scan(&review.ID, &review.DisputeID, &review.Reviewer, &review.Note, &createdAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan dispute review: %w", err)
		}
		review.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		reviews = append(reviews, review)
	}
	return reviews, rows.Err()
}

func (r *Repository) AddDisputeDecision(ctx context.Context, disputeID, decision, rationale, decidedBy string) (DisputeDecision, error) {
	if r == nil || r.pool == nil {
		return DisputeDecision{}, errors.New("reconciliation: repository has nil pool")
	}
	var result DisputeDecision
	var createdAt time.Time
	err := r.pool.QueryRow(ctx, `
		INSERT INTO dispute_decisions (dispute_id, decision, rationale, decided_by)
		SELECT id, $2, $3, $4 FROM escrow_disputes WHERE id = $1 AND status = 'OPEN'
		RETURNING id, dispute_id, decision, rationale, decided_by, created_at`,
		disputeID, decision, rationale, decidedBy).Scan(
		&result.ID, &result.DisputeID, &result.Decision, &result.Rationale, &result.DecidedBy, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return DisputeDecision{}, fmt.Errorf("reconciliation: dispute not found or already resolved")
	}
	if err != nil && strings.Contains(err.Error(), "dispute_decisions_dispute_id_key") {
		return DisputeDecision{}, fmt.Errorf("reconciliation: dispute already has an active recommendation")
	}
	if err != nil {
		return DisputeDecision{}, fmt.Errorf("reconciliation: add dispute decision: %w", err)
	}
	result.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	result.Approvals = []DisputeDecisionApproval{}
	return result, nil
}

func (r *Repository) ListDisputeTimeline(ctx context.Context, disputeID string) ([]DisputeTimelineEntry, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("reconciliation: repository has nil pool")
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, kind, actor, summary, details, created_at
		FROM (
			SELECT
				ed.id::text || ':event:' || ce.transaction_hash || ':' || ce.log_index AS id,
				'CHAIN_EVENT' AS kind, '' AS actor, ce.event_type AS summary,
				ce.transaction_hash AS details, ce.observed_at AS created_at
			FROM escrow_disputes ed
			JOIN chain_events ce
			  ON ce.chain_id = ed.chain_id
			 AND ce.contract_address = ed.contract_address
			 AND ce.escrow_id = ed.escrow_id
			WHERE ed.id = $1
			UNION ALL
			SELECT id::text, 'REVIEW', reviewer_email, 'Review note', note, created_at
			FROM dispute_reviews WHERE dispute_id = $1
			UNION ALL
			SELECT id::text, 'RECOMMENDATION', decided_by,
			       decision || ' recommendation', rationale, created_at
			FROM dispute_decisions WHERE dispute_id = $1
			UNION ALL
			SELECT a.id::text, 'APPROVAL', a.approver_email,
			       'Recommendation approved', d.decision || ' recommendation', a.created_at
			FROM dispute_decision_approvals a
			JOIN dispute_decisions d ON d.id = a.decision_id
			WHERE d.dispute_id = $1
		) timeline
		ORDER BY created_at, id`, disputeID)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list dispute timeline: %w", err)
	}
	defer rows.Close()
	entries := make([]DisputeTimelineEntry, 0)
	for rows.Next() {
		var entry DisputeTimelineEntry
		var createdAt time.Time
		if err := rows.Scan(&entry.ID, &entry.Kind, &entry.Actor, &entry.Summary, &entry.Details, &createdAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan dispute timeline: %w", err)
		}
		entry.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

func (r *Repository) ListDisputeDecisions(ctx context.Context, disputeID string) ([]DisputeDecision, error) {
	if r == nil || r.pool == nil {
		return nil, errors.New("reconciliation: repository has nil pool")
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, dispute_id, decision, rationale, decided_by, created_at
		FROM dispute_decisions WHERE dispute_id = $1 ORDER BY created_at DESC`, disputeID)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list dispute decisions: %w", err)
	}
	defer rows.Close()
	decisions := make([]DisputeDecision, 0)
	for rows.Next() {
		var item DisputeDecision
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.DisputeID, &item.Decision, &item.Rationale, &item.DecidedBy, &createdAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan dispute decision: %w", err)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.Approvals, err = r.listDecisionApprovals(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		decisions = append(decisions, item)
	}
	return decisions, rows.Err()
}

func (r *Repository) listDecisionApprovals(ctx context.Context, decisionID string) ([]DisputeDecisionApproval, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, decision_id, approver_email, created_at
		FROM dispute_decision_approvals WHERE decision_id = $1 ORDER BY created_at`, decisionID)
	if err != nil {
		return nil, fmt.Errorf("reconciliation: list decision approvals: %w", err)
	}
	defer rows.Close()
	approvals := make([]DisputeDecisionApproval, 0)
	for rows.Next() {
		var item DisputeDecisionApproval
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.DecisionID, &item.ApproverEmail, &createdAt); err != nil {
			return nil, fmt.Errorf("reconciliation: scan decision approval: %w", err)
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		approvals = append(approvals, item)
	}
	return approvals, rows.Err()
}

func (r *Repository) ApproveDisputeDecision(ctx context.Context, decisionID, approver string) (DisputeDecisionApproval, error) {
	if r == nil || r.pool == nil {
		return DisputeDecisionApproval{}, errors.New("reconciliation: repository has nil pool")
	}
	var approval DisputeDecisionApproval
	var createdAt time.Time
	err := r.pool.QueryRow(ctx, `
		INSERT INTO dispute_decision_approvals (decision_id, approver_email)
		SELECT id, $2 FROM dispute_decisions
		WHERE id = $1 AND decided_by <> $2
		RETURNING id, decision_id, approver_email, created_at`,
		decisionID, approver).Scan(&approval.ID, &approval.DecisionID, &approval.ApproverEmail, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return DisputeDecisionApproval{}, fmt.Errorf("reconciliation: decision missing or approver must differ from arbiter")
	}
	if err != nil && strings.Contains(err.Error(), "dispute_decision_approvals_decision_id_approver_email_key") {
		return DisputeDecisionApproval{}, fmt.Errorf("reconciliation: decision already approved by this operator")
	}
	if err != nil {
		return DisputeDecisionApproval{}, fmt.Errorf("reconciliation: approve dispute decision: %w", err)
	}
	approval.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return approval, nil
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
	var existingBlockNumber int64
	var existingBlockHash string
	var existingEscrowID int64
	var existingEventType EventType
	var existingPayload []byte
	err = tx.QueryRow(ctx, `
		SELECT block_number, block_hash, escrow_id, event_type, payload
		FROM chain_events
		WHERE chain_id = $1 AND contract_address = $2
		  AND transaction_hash = $3 AND log_index = $4`,
		event.ChainID, event.ContractAddress, event.TransactionHash, event.LogIndex,
	).Scan(&existingBlockNumber, &existingBlockHash, &existingEscrowID,
		&existingEventType, &existingPayload)
	if err == nil {
		var existingEvent ChainEvent
		if unmarshalErr := json.Unmarshal(existingPayload, &existingEvent); unmarshalErr != nil {
			return false, fmt.Errorf("reconciliation: decode existing chain event: %w", unmarshalErr)
		}
		if existingBlockNumber != event.BlockNumber ||
			existingBlockHash != event.BlockHash ||
			existingEscrowID != event.EscrowID ||
			existingEventType != event.Type ||
			existingEvent != event {
			return false, fmt.Errorf("%w: event identity %s", ErrDuplicateEvent, event.Key())
		}
		return false, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return false, fmt.Errorf("reconciliation: check existing chain event: %w", err)
	}
	if event.Type == EventDisputeRaised {
		if _, err := tx.Exec(ctx, `
			INSERT INTO escrow_disputes
				(chain_id, contract_address, escrow_id, raised_transaction_hash,
				 raised_log_index, reason)
			VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
			event.ChainID, event.ContractAddress, event.EscrowID,
			event.TransactionHash, event.LogIndex, event.Reason); err != nil {
			return false, fmt.Errorf("reconciliation: store dispute: %w", err)
		}
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
		       supplier_address, amount::text, timeout_at, invoice_ref, state
		FROM escrows
		WHERE chain_id = $1 AND contract_address = $2 AND escrow_id = $3
		FOR UPDATE`,
		event.ChainID, event.ContractAddress, event.EscrowID,
	).Scan(&current.ChainID, &current.ContractAddress, &current.EscrowID,
		&current.Buyer, &current.Supplier, &current.Amount, &current.TimeoutAt,
		&current.InvoiceRef, &current.State)
	if errors.Is(err, pgx.ErrNoRows) {
		if event.Type != EventEscrowCreated || event.Buyer == "" ||
			event.Supplier == "" || event.Amount == "" {
			return false, fmt.Errorf("%w: first event must create escrow", ErrInvalidState)
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO escrows
				(chain_id, contract_address, escrow_id, buyer_address,
				 supplier_address, amount, timeout_at, invoice_ref, state, updated_block)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			event.ChainID, event.ContractAddress, event.EscrowID, event.Buyer,
			event.Supplier, event.Amount, event.TimeoutAt, event.InvoiceRef, StateCreated, event.BlockNumber)
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
