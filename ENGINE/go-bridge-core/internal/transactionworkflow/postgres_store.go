package transactionworkflow

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresStore struct{ pool *pgxpool.Pool }

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore { return &PostgresStore{pool: pool} }

func (s *PostgresStore) Create(ctx context.Context, item Workflow) (Workflow, bool, error) {
	var out Workflow
	err := s.pool.QueryRow(ctx, `
		INSERT INTO transaction_workflows
		(id,idempotency_key,trader_id,source_account_id,destination_account_id,corridor_id,quote_id,
		 collection_provider,payout_provider,amount,currency_from,currency_to,rate,state)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (idempotency_key) DO UPDATE SET updated_at=transaction_workflows.updated_at
		RETURNING id,idempotency_key,trader_id,source_account_id,destination_account_id,corridor_id,quote_id,
		 collection_provider,payout_provider,COALESCE(collection_execution_id,''),COALESCE(payout_execution_id,''),
		 COALESCE(ledger_transfer_id,''),amount,currency_from,currency_to,rate,state,COALESCE(failed_step,''),
		 COALESCE(failure_reason,''),created_at,updated_at`,
		item.ID, item.IdempotencyKey, item.TraderID, item.SourceAccountID, item.DestinationAccountID,
		item.CorridorID, item.QuoteID, item.CollectionProvider, item.PayoutProvider, item.Amount,
		item.CurrencyFrom, item.CurrencyTo, item.Rate, item.State).Scan(scanWorkflow(&out)...)
	if err != nil {
		return Workflow{}, false, fmt.Errorf("transaction workflow create: %w", err)
	}
	return out, out.ID != item.ID, nil
}

func scanWorkflow(w *Workflow) []any {
	return []any{&w.ID, &w.IdempotencyKey, &w.TraderID, &w.SourceAccountID, &w.DestinationAccountID,
		&w.CorridorID, &w.QuoteID, &w.CollectionProvider, &w.PayoutProvider, &w.CollectionExecutionID,
		&w.PayoutExecutionID, &w.LedgerTransferID, &w.Amount, &w.CurrencyFrom, &w.CurrencyTo, &w.Rate,
		&w.State, &w.FailedStep, &w.FailureReason, &w.CreatedAt, &w.UpdatedAt}
}

func (s *PostgresStore) Get(ctx context.Context, id string) (Workflow, error) {
	var out Workflow
	err := s.pool.QueryRow(ctx, `SELECT id,idempotency_key,trader_id,source_account_id,destination_account_id,corridor_id,quote_id,
		collection_provider,payout_provider,COALESCE(collection_execution_id,''),COALESCE(payout_execution_id,''),
		COALESCE(ledger_transfer_id,''),amount,currency_from,currency_to,rate,state,COALESCE(failed_step,''),
		COALESCE(failure_reason,''),created_at,updated_at FROM transaction_workflows WHERE id=$1`, id).Scan(scanWorkflow(&out)...)
	if errors.Is(err, pgx.ErrNoRows) {
		return Workflow{}, ErrNotFound
	}
	if err != nil {
		return Workflow{}, err
	}
	return out, nil
}

func (s *PostgresStore) Update(ctx context.Context, item Workflow) error {
	_, err := s.pool.Exec(ctx, `UPDATE transaction_workflows SET collection_execution_id=NULLIF($2,''),
		payout_execution_id=NULLIF($3,''),ledger_transfer_id=NULLIF($4,''),state=$5,failed_step=NULLIF($6,''),
		failure_reason=NULLIF($7,''),updated_at=now() WHERE id=$1`,
		item.ID, item.CollectionExecutionID, item.PayoutExecutionID, item.LedgerTransferID, item.State, item.FailedStep, item.FailureReason)
	return err
}

func (s *PostgresStore) UpdateWithEvent(ctx context.Context, item Workflow, event Event) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `UPDATE transaction_workflows SET collection_execution_id=NULLIF($2,''),
		payout_execution_id=NULLIF($3,''),ledger_transfer_id=NULLIF($4,''),state=$5,failed_step=NULLIF($6,''),
		failure_reason=NULLIF($7,''),updated_at=now() WHERE id=$1`,
		item.ID, item.CollectionExecutionID, item.PayoutExecutionID, item.LedgerTransferID, item.State, item.FailedStep, item.FailureReason); err != nil {
		return err
	}
	if err := tx.QueryRow(ctx, `INSERT INTO transaction_workflow_events
		(id,workflow_id,from_state,to_state,step,reason)
		VALUES ($1,$2,$3,$4,NULLIF($5,''),NULLIF($6,'')) RETURNING sequence,created_at`,
		event.ID, event.WorkflowID, event.FromState, event.ToState, event.Step, event.Reason).
		Scan(&event.Sequence, &event.CreatedAt); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s *PostgresStore) AppendEvent(ctx context.Context, event Event) (Event, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO transaction_workflow_events
		(id,workflow_id,from_state,to_state,step,reason)
		VALUES ($1,$2,$3,$4,NULLIF($5,''),NULLIF($6,'')) RETURNING sequence,created_at`,
		event.ID, event.WorkflowID, event.FromState, event.ToState, event.Step, event.Reason).
		Scan(&event.Sequence, &event.CreatedAt)
	return event, err
}

func (s *PostgresStore) ListEvents(ctx context.Context, id string) ([]Event, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,workflow_id,sequence,from_state,to_state,COALESCE(step,''),COALESCE(reason,''),created_at
		FROM transaction_workflow_events WHERE workflow_id=$1 ORDER BY sequence`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Event
	for rows.Next() {
		var item Event
		if err := rows.Scan(&item.ID, &item.WorkflowID, &item.Sequence, &item.FromState, &item.ToState, &item.Step, &item.Reason, &item.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}
