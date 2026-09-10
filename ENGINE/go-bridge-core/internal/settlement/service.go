package settlement

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaSQL string

type Service struct {
	pool   *pgxpool.Pool
	policy Policy
}

type AuditEvent struct {
	ID        string    `json:"id"`
	CommandID string    `json:"command_id,omitempty"`
	Actor     string    `json:"actor"`
	Role      string    `json:"role"`
	Action    string    `json:"action"`
	Detail    string    `json:"detail,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func NewService(pool *pgxpool.Pool, policy Policy) *Service {
	if policy.RequiredApprovals <= 0 {
		policy.RequiredApprovals = 2
	}
	if policy.VelocityWindow <= 0 {
		policy.VelocityWindow = 24 * time.Hour
	}
	return &Service{pool: pool, policy: policy}
}

func (s *Service) Policy() Policy { return s.policy }

func (s *Service) Audit(ctx context.Context, commandID, actor, role, action, detail string) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO settlement_audit_events(command_id,actor,role,action,detail)
		VALUES(NULLIF($1,'')::uuid,$2,$3,$4,$5)`, commandID, actor, role, action, detail)
	return err
}

func (s *Service) AuditEvents(ctx context.Context, commandID string) ([]AuditEvent, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,COALESCE(command_id::text,''),actor,role,action,COALESCE(detail,''),created_at
		FROM settlement_audit_events WHERE ($1='' OR command_id=$1::uuid) ORDER BY created_at DESC`, commandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []AuditEvent
	for rows.Next() {
		var e AuditEvent
		if err := rows.Scan(&e.ID, &e.CommandID, &e.Actor, &e.Role, &e.Action, &e.Detail, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Service) EnsureSchema(ctx context.Context) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("settlement: nil database pool")
	}
	_, err := s.pool.Exec(ctx, schemaSQL)
	if err != nil {
		return fmt.Errorf("settlement: ensure schema: %w", err)
	}
	return nil
}

func (s *Service) Submit(ctx context.Context, req Request, actor string) (*Command, bool, error) {
	if err := req.Validate(); err != nil {
		return nil, false, err
	}
	actor = strings.TrimSpace(actor)
	if actor == "" {
		return nil, false, fmt.Errorf("%w: requested_by is required", ErrInvalid)
	}
	required := req.RequiredApprovals
	if required <= 0 {
		required = s.policy.RequiredApprovals
	}
	var c Command
	err := s.pool.QueryRow(ctx, `INSERT INTO settlement_commands
		(action,target,provider_id,corridor_id,amount_minor,currency,reason,requested_by,required_approvals,idempotency_key)
		VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id,action,target,provider_id,corridor_id,amount_minor,currency,reason,requested_by,
		approval_state,execution_state,status,idempotency_key,required_approvals,created_at,updated_at,approved_at,executed_at`,
		req.Action, req.Target, req.ProviderID, req.CorridorID, req.AmountMinor, strings.ToUpper(req.Currency),
		req.Reason, actor, required, req.IdempotencyKey).Scan(commandArgs(&c)...)
	if err == nil {
		return &c, false, nil
	}
	var existing Command
	if !isUnique(err) {
		return nil, false, fmt.Errorf("settlement: submit: %w", err)
	}
	if scanErr := s.pool.QueryRow(ctx, `SELECT id,action,target,provider_id,corridor_id,amount_minor,currency,reason,requested_by,
		approval_state,execution_state,status,idempotency_key,required_approvals,created_at,updated_at,approved_at,executed_at
		FROM settlement_commands WHERE idempotency_key=$1`, req.IdempotencyKey).Scan(commandArgs(&existing)...); scanErr != nil {
		return nil, false, fmt.Errorf("settlement: idempotency lookup: %w", scanErr)
	}
	if existing.Action != req.Action || existing.Target != req.Target || existing.AmountMinor != req.AmountMinor ||
		!strings.EqualFold(existing.Currency, req.Currency) {
		return nil, false, ErrConflict
	}
	return &existing, true, nil
}

func commandArgs(c *Command) []any {
	return []any{&c.ID, &c.Action, &c.Target, &c.ProviderID, &c.CorridorID, &c.AmountMinor, &c.Currency, &c.Reason, &c.RequestedBy,
		&c.ApprovalState, &c.ExecutionState, &c.Status, &c.IdempotencyKey, &c.RequiredApprovals, &c.CreatedAt, &c.UpdatedAt, &c.ApprovedAt, &c.ExecutedAt}
}

func isUnique(err error) bool {
	var pgErr interface{ SQLState() string }
	return errors.As(err, &pgErr) && pgErr.SQLState() == "23505"
}

func (s *Service) Get(ctx context.Context, id string) (*Command, error) {
	var c Command
	err := s.pool.QueryRow(ctx, `SELECT id,action,target,provider_id,corridor_id,amount_minor,currency,reason,requested_by,
		approval_state,execution_state,status,idempotency_key,required_approvals,created_at,updated_at,approved_at,executed_at
		FROM settlement_commands WHERE id=$1`, id).Scan(commandArgs(&c)...)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("settlement: get: %w", err)
	}
	return &c, nil
}

func (s *Service) List(ctx context.Context, status string, limit int) ([]*Command, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `SELECT id,action,target,provider_id,corridor_id,amount_minor,currency,reason,requested_by,
		approval_state,execution_state,status,idempotency_key,required_approvals,created_at,updated_at,approved_at,executed_at
		FROM settlement_commands WHERE ($1='' OR status=$1) ORDER BY created_at DESC LIMIT $2`, strings.TrimSpace(status), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Command
	for rows.Next() {
		var c Command
		if err := rows.Scan(commandArgs(&c)...); err != nil {
			return nil, err
		}
		out = append(out, &c)
	}
	return out, rows.Err()
}

func (s *Service) Approvals(ctx context.Context, id string) ([]Approval, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,command_id,approver,role,decision,COALESCE(reason,''),created_at
		FROM settlement_approvals WHERE command_id=$1 ORDER BY created_at`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Approval
	for rows.Next() {
		var a Approval
		if err := rows.Scan(&a.ID, &a.CommandID, &a.Approver, &a.Role, &a.Decision, &a.Reason, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Service) Approve(ctx context.Context, id, actor, role string, req ApprovalRequest) (*Command, error) {
	actor = strings.TrimSpace(actor)
	if actor == "" || (req.Decision != ApprovalApproved && req.Decision != ApprovalRejected) {
		return nil, fmt.Errorf("%w: approval decision and actor are required", ErrInvalid)
	}
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if c.RequestedBy == actor {
		return nil, ErrSelfApproval
	}
	if c.Status != StatusPending && c.Status != StatusApproved {
		return nil, fmt.Errorf("%w: command is not awaiting approval", ErrConflict)
	}
	if req.Decision == ApprovalRejected {
		if _, err = s.pool.Exec(ctx, `INSERT INTO settlement_approvals(command_id,approver,role,decision,reason)
			VALUES($1,$2,$3,$4,$5) ON CONFLICT(command_id,approver) DO UPDATE SET decision=EXCLUDED.decision,reason=EXCLUDED.reason`,
			id, actor, role, req.Decision, strings.TrimSpace(req.Reason)); err != nil {
			return nil, err
		}
		_, err = s.pool.Exec(ctx, `UPDATE settlement_commands SET approval_state='rejected',status='cancelled',updated_at=now() WHERE id=$1`, id)
		return s.Get(ctx, id)
	}
	if _, err = s.pool.Exec(ctx, `INSERT INTO settlement_approvals(command_id,approver,role,decision,reason)
		VALUES($1,$2,$3,$4,$5) ON CONFLICT(command_id,approver) DO UPDATE SET decision=EXCLUDED.decision,reason=EXCLUDED.reason`,
		id, actor, role, req.Decision, strings.TrimSpace(req.Reason)); err != nil {
		return nil, err
	}
	var count int
	if err = s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM settlement_approvals WHERE command_id=$1 AND decision='approved'`, id).Scan(&count); err != nil {
		return nil, err
	}
	if count >= c.RequiredApprovals {
		_, err = s.pool.Exec(ctx, `UPDATE settlement_commands SET approval_state='approved',status='approved',approved_at=now(),updated_at=now() WHERE id=$1`, id)
	}
	return s.Get(ctx, id)
}

func (s *Service) Cancel(ctx context.Context, id, actor string) (*Command, error) {
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if c.Status == StatusSucceeded || c.Status == StatusCancelled {
		return nil, fmt.Errorf("%w: terminal command", ErrConflict)
	}
	if actor != c.RequestedBy {
		return nil, fmt.Errorf("%w: only requester may cancel", ErrConflict)
	}
	if _, err := s.pool.Exec(ctx, `UPDATE settlement_commands SET status='cancelled',updated_at=now() WHERE id=$1`, id); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *Service) Preflight(ctx context.Context, id string, providerEnabled, corridorEnabled, providerKill, corridorKill bool,
	fxValid, identityApproved bool) (*PreflightResult, error) {
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	velocityPassed := true
	if s.policy.VelocityLimit > 0 {
		var recent int
		if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM settlement_commands
			WHERE provider_id=$1 AND corridor_id=$2 AND created_at >= now() - ($3 * INTERVAL '1 second')
			AND status NOT IN ('cancelled','failed','expired')`, c.ProviderID, c.CorridorID, int64(s.policy.VelocityWindow/time.Second)).Scan(&recent); err != nil {
			return nil, fmt.Errorf("settlement: velocity preflight: %w", err)
		}
		velocityPassed = recent <= s.policy.VelocityLimit
	}
	checks := []PreflightCheck{
		{"global_kill_switch", !s.policy.GlobalKillSwitch, true, "global settlement kill switch must be inactive"},
		{"read_only", !s.policy.ReadOnly, true, "read-only mode must be disabled for settlement state changes"},
		{"provider_enabled", providerEnabled && !providerKill, true, "provider must be enabled and its kill switch inactive"},
		{"corridor_enabled", corridorEnabled && !corridorKill, true, "corridor must be enabled and its kill switch inactive"},
		{"amount_limit", s.policy.MaxAmountMinor <= 0 || c.AmountMinor <= s.policy.MaxAmountMinor, true, "amount must be within configured maximum"},
		{"daily_limit", s.policy.DailyLimitMinor <= 0 || c.AmountMinor <= s.policy.DailyLimitMinor, true, "amount must be within configured daily limit"},
		{"velocity_limit", velocityPassed, true, "command velocity must remain within the configured window limit"},
		{"fx_fee_metadata", fxValid, true, "FX and fee metadata must be present and valid"},
		{"identity_compliance", identityApproved, true, "identity/compliance status must be approved"},
		{"idempotency", strings.TrimSpace(c.IdempotencyKey) != "", true, "command must have an idempotency key"},
		{"execution_boundary", !s.policy.ExecutionEnabled, false, "live execution remains disabled; dry-run is the only permitted mode"},
	}
	passed := true
	for _, check := range checks {
		if check.Required && !check.Passed {
			passed = false
		}
	}
	return &PreflightResult{CommandID: c.ID, Passed: passed, Checks: checks, EvaluatedAt: time.Now().UTC()}, nil
}

func (s *Service) DryRun(ctx context.Context, id string, preflight *PreflightResult) (*Command, error) {
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if c.ApprovalState != ApprovalApproved || c.Status != StatusApproved {
		return nil, ErrInsufficientApprovals
	}
	if preflight != nil && !preflight.Passed {
		return nil, fmt.Errorf("%w: preflight failed", ErrConflict)
	}
	if _, err := s.pool.Exec(ctx, `UPDATE settlement_commands SET execution_state='dry_run',updated_at=now() WHERE id=$1`, id); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *Service) Execute(ctx context.Context, id string) (*Command, error) {
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if c.ApprovalState != ApprovalApproved || c.Status != StatusApproved {
		return nil, ErrInsufficientApprovals
	}
	if !s.policy.ExecutionEnabled {
		return nil, ErrLiveExecutionDisabled
	}
	return nil, ErrLiveExecutionDisabled
}

func (s *Service) Reconcile(ctx context.Context, id, providerRef, outcome, detail string) (*Reconciliation, error) {
	switch outcome {
	case "pending", "succeeded", "failed", "expired":
	default:
		return nil, fmt.Errorf("%w: invalid reconciliation outcome", ErrInvalid)
	}
	c, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if _, err := s.pool.Exec(ctx, `INSERT INTO settlement_reconciliations(command_id,provider_reference,outcome,detail) VALUES($1,$2,$3,$4)`, id, providerRef, outcome, detail); err != nil {
		return nil, err
	}
	status := "pending_provider"
	if outcome == "succeeded" {
		status = "succeeded"
	}
	if outcome == "failed" {
		status = "failed"
	}
	if outcome == "expired" {
		status = "expired"
	}
	if _, err := s.pool.Exec(ctx, `UPDATE settlement_commands SET status=$1,updated_at=now(),executed_at=CASE WHEN $1 IN ('succeeded','failed','expired') THEN now() ELSE executed_at END WHERE id=$2`, status, c.ID); err != nil {
		return nil, err
	}
	return &Reconciliation{CommandID: id, ProviderReference: providerRef, Outcome: outcome, Detail: detail, ObservedAt: time.Now().UTC()}, nil
}

func (s *Service) Reconciliations(ctx context.Context, id string) ([]Reconciliation, error) {
	rows, err := s.pool.Query(ctx, `SELECT command_id,COALESCE(provider_reference,''),outcome,COALESCE(detail,''),observed_at FROM settlement_reconciliations WHERE ($1='' OR command_id=$1) ORDER BY observed_at DESC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Reconciliation
	for rows.Next() {
		var r Reconciliation
		if err := rows.Scan(&r.CommandID, &r.ProviderReference, &r.Outcome, &r.Detail, &r.ObservedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
