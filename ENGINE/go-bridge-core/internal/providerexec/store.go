package providerexec

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("provider execution: not found")

type MemoryStore struct {
	mu         sync.Mutex
	executions map[string]Execution
	byKey      map[string]string
	events     map[string]Event
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		executions: make(map[string]Execution),
		byKey:      make(map[string]string),
		events:     make(map[string]Event),
	}
}

func executionKey(r Request) string {
	return r.Provider + "\x00" + r.Operation + "\x00" + r.RequestReference
}

func (s *MemoryStore) Claim(_ context.Context, r Request) (Execution, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if id, ok := s.byKey[executionKey(r)]; ok {
		return s.executions[id], true, nil
	}
	now := time.Now().UTC()
	e := Execution{ID: r.ID, TransactionID: r.TransactionID, Provider: r.Provider, Operation: r.Operation,
		RequestReference: r.RequestReference, State: StatePending, CreatedAt: now, UpdatedAt: now}
	s.executions[e.ID], s.byKey[executionKey(r)] = e, e.ID
	return e, false, nil
}

func (s *MemoryStore) Get(_ context.Context, id string) (Execution, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.executions[id]
	if !ok {
		return Execution{}, ErrNotFound
	}
	return e, nil
}

func (s *MemoryStore) GetByTransaction(_ context.Context, transactionID string) (Execution, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, e := range s.executions {
		if e.TransactionID == transactionID {
			return e, nil
		}
	}
	return Execution{}, ErrNotFound
}

func (s *MemoryStore) Update(_ context.Context, e Execution) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.executions[e.ID]; !ok {
		return ErrNotFound
	}
	e.UpdatedAt = time.Now().UTC()
	s.executions[e.ID] = e
	return nil
}

func (s *MemoryStore) AppendEvent(_ context.Context, event Event) (Event, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if prior, ok := s.events[event.Provider+"\x00"+event.ReplayKey]; ok {
		return prior, true, nil
	}
	if event.ReceivedAt.IsZero() {
		event.ReceivedAt = time.Now().UTC()
	}
	s.events[event.Provider+"\x00"+event.ReplayKey] = event
	return event, false, nil
}

func (s *MemoryStore) ListEvents(_ context.Context, limit int) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Event, 0, len(s.events))
	for _, e := range s.events {
		out = append(out, e)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ReceivedAt.After(out[j].ReceivedAt) })
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

type PostgresStore struct{ pool *pgxpool.Pool }

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore { return &PostgresStore{pool: pool} }

func (s *PostgresStore) Claim(ctx context.Context, r Request) (Execution, bool, error) {
	if s == nil || s.pool == nil {
		return Execution{}, false, fmt.Errorf("provider execution: nil database pool")
	}
	var e Execution
	err := s.pool.QueryRow(ctx, `
		INSERT INTO provider_executions
			(id, transaction_id, provider, operation, request_reference, state, attempts)
		VALUES ($1,$2,$3,$4,$5,$6,0)
		ON CONFLICT (provider, operation, request_reference)
		DO UPDATE SET updated_at = provider_executions.updated_at
		RETURNING id, transaction_id, provider, operation, request_reference,
		          COALESCE(external_reference,''), state, attempts, COALESCE(last_error,''),
		          COALESCE(raw_response, '{}'::jsonb),
		          created_at, updated_at`,
		r.ID, r.TransactionID, r.Provider, r.Operation, r.RequestReference, StatePending,
	).Scan(&e.ID, &e.TransactionID, &e.Provider, &e.Operation, &e.RequestReference,
		&e.ExternalReference, &e.State, &e.Attempts, &e.LastError, &e.RawResponse,
		&e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return Execution{}, false, fmt.Errorf("provider execution claim: %w", err)
	}
	return e, e.ID != r.ID, nil
}

func (s *PostgresStore) Get(ctx context.Context, id string) (Execution, error) {
	var e Execution
	err := s.pool.QueryRow(ctx, `
		SELECT id, transaction_id, provider, operation, request_reference,
		       COALESCE(external_reference,''), state, attempts, COALESCE(last_error,''),
		       COALESCE(raw_response, '{}'::jsonb),
		       created_at, updated_at
		FROM provider_executions WHERE id=$1`, id).Scan(
		&e.ID, &e.TransactionID, &e.Provider, &e.Operation, &e.RequestReference,
		&e.ExternalReference, &e.State, &e.Attempts, &e.LastError, &e.RawResponse,
		&e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Execution{}, ErrNotFound
	}
	if err != nil {
		return Execution{}, fmt.Errorf("provider execution get: %w", err)
	}
	return e, nil
}

func (s *PostgresStore) GetByTransaction(ctx context.Context, transactionID string) (Execution, error) {
	var e Execution
	err := s.pool.QueryRow(ctx, `
		SELECT id, transaction_id, provider, operation, request_reference,
		       COALESCE(external_reference,''), state, attempts, COALESCE(last_error,''),
		       COALESCE(raw_response, '{}'::jsonb),
		       created_at, updated_at
		FROM provider_executions WHERE transaction_id=$1
		ORDER BY created_at DESC LIMIT 1`, transactionID).Scan(
		&e.ID, &e.TransactionID, &e.Provider, &e.Operation, &e.RequestReference,
		&e.ExternalReference, &e.State, &e.Attempts, &e.LastError, &e.RawResponse,
		&e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Execution{}, ErrNotFound
	}
	if err != nil {
		return Execution{}, fmt.Errorf("provider execution get by transaction: %w", err)
	}
	return e, nil
}

func (s *PostgresStore) Update(ctx context.Context, e Execution) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE provider_executions
		SET external_reference=$2, state=$3, attempts=$4, last_error=$5,
		    raw_response=$6, updated_at=now()
		WHERE id=$1`, e.ID, nullString(e.ExternalReference), e.State, e.Attempts,
		nullString(e.LastError), nullString(e.RawResponse))
	if err != nil {
		return fmt.Errorf("provider execution update: %w", err)
	}
	return nil
}

func (s *PostgresStore) AppendEvent(ctx context.Context, e Event) (Event, bool, error) {
	if e.ReceivedAt.IsZero() {
		e.ReceivedAt = time.Now().UTC()
	}
	err := s.pool.QueryRow(ctx, `
		INSERT INTO provider_execution_events
			(id, provider, replay_key, transaction_id, request_reference,
			 event_type, external_reference, state, raw_payload, received_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		ON CONFLICT (provider, replay_key) DO NOTHING
		RETURNING id, provider, replay_key, COALESCE(transaction_id,''), COALESCE(request_reference,''),
		          COALESCE(event_type,''), COALESCE(external_reference,''), state, raw_payload, received_at`,
		e.ID, e.Provider, e.ReplayKey, nullString(e.TransactionID), nullString(e.RequestReference),
		nullString(e.EventType), nullString(e.ExternalReference), e.State, []byte(e.RawPayload), e.ReceivedAt,
	).Scan(&e.ID, &e.Provider, &e.ReplayKey, &e.TransactionID, &e.RequestReference,
		&e.EventType, &e.ExternalReference, &e.State, &e.RawPayload, &e.ReceivedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		err = s.pool.QueryRow(ctx, `
			SELECT id, provider, replay_key, COALESCE(transaction_id,''), COALESCE(request_reference,''),
			       COALESCE(event_type,''), COALESCE(external_reference,''), state, raw_payload, received_at
			FROM provider_execution_events WHERE provider=$1 AND replay_key=$2`,
			e.Provider, e.ReplayKey).Scan(&e.ID, &e.Provider, &e.ReplayKey, &e.TransactionID,
			&e.RequestReference, &e.EventType, &e.ExternalReference, &e.State, &e.RawPayload, &e.ReceivedAt)
		if err != nil {
			return Event{}, false, fmt.Errorf("provider execution event replay: %w", err)
		}
		return e, true, nil
	}
	if err != nil {
		return Event{}, false, fmt.Errorf("provider execution event: %w", err)
	}
	return e, false, nil
}

func (s *PostgresStore) ListEvents(ctx context.Context, limit int) ([]Event, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id, provider, replay_key, COALESCE(transaction_id,''), COALESCE(request_reference,''),
		       COALESCE(event_type,''), COALESCE(external_reference,''), state, raw_payload, received_at
		FROM provider_execution_events ORDER BY received_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, fmt.Errorf("provider execution events: %w", err)
	}
	defer rows.Close()
	var out []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.Provider, &e.ReplayKey, &e.TransactionID, &e.RequestReference,
			&e.EventType, &e.ExternalReference, &e.State, &e.RawPayload, &e.ReceivedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func nullString(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}
