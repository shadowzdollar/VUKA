package pilot

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
	pool             *pgxpool.Pool
	readOnly         bool
	globalKillSwitch bool
}

func NewService(pool *pgxpool.Pool, readOnly, globalKillSwitch bool) *Service {
	return &Service{pool: pool, readOnly: readOnly, globalKillSwitch: globalKillSwitch}
}

func (s *Service) EnsureSchema(ctx context.Context) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("pilot: nil database pool")
	}
	if _, err := s.pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("pilot: ensure schema: %w", err)
	}
	return nil
}

func (s *Service) guardWrite() error {
	if s.readOnly {
		return ErrReadOnly
	}
	return nil
}

func (s *Service) Audit(ctx context.Context, pilotID, actor, role, action, detail string) error {
	if strings.TrimSpace(actor) == "" {
		return fmt.Errorf("%w: actor is required", ErrInvalid)
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO pilot_audit_events(pilot_id,actor,role,action,detail)
		VALUES(NULLIF($1,'')::uuid,$2,$3,$4,$5)`, pilotID, actor, role, action, detail)
	return err
}

func scanPilot(row interface{ Scan(...any) error }) (*Pilot, error) {
	var p Pilot
	err := row.Scan(&p.ID, &p.PilotID, &p.CorridorID, &p.ProviderID, &p.Environment, &p.Scope,
		&p.MaxParticipants, &p.AmountLimitMinor, &p.TransactionLimitMinor, &p.DailyLimitMinor,
		&p.StartAt, &p.EndAt, &p.Owner, &p.SupportOwner, &p.IncidentOwner, &p.Status,
		&p.RequiredApprovals, &p.KillSwitch, &p.ObservationOnly, &p.LiveEnabled,
		&p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &p, err
}

const pilotColumns = `id,pilot_id,corridor_id,provider_id,environment,scope,max_participants,
	amount_limit_minor,transaction_limit_minor,daily_limit_minor,start_at,end_at,owner,
	support_owner,incident_owner,status,required_approvals,kill_switch,observation_only,
	live_enabled,created_at,updated_at`

func (s *Service) Create(ctx context.Context, req CreateRequest, actor string) (*Pilot, error) {
	return s.CreateAs(ctx, req, actor, "operator")
}

func (s *Service) CreateAs(ctx context.Context, req CreateRequest, actor, role string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}
	req.PilotID = strings.TrimSpace(req.PilotID)
	req.CorridorID = strings.TrimSpace(req.CorridorID)
	req.ProviderID = strings.TrimSpace(req.ProviderID)
	req.Environment = strings.ToLower(strings.TrimSpace(req.Environment))
	req.Scope = strings.TrimSpace(req.Scope)
	req.Owner = strings.TrimSpace(req.Owner)
	req.SupportOwner = strings.TrimSpace(req.SupportOwner)
	req.IncidentOwner = strings.TrimSpace(req.IncidentOwner)
	if strings.TrimSpace(actor) == "" {
		return nil, fmt.Errorf("%w: actor is required", ErrInvalid)
	}
	p, err := scanPilot(s.pool.QueryRow(ctx, `INSERT INTO pilot_programs
		(pilot_id,corridor_id,provider_id,environment,scope,max_participants,amount_limit_minor,
		transaction_limit_minor,daily_limit_minor,start_at,end_at,owner,support_owner,incident_owner,
		required_approvals) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING `+pilotColumns, req.PilotID, req.CorridorID, req.ProviderID, req.Environment, req.Scope,
		req.MaxParticipants, req.AmountLimitMinor, req.TransactionLimitMinor, req.DailyLimitMinor,
		req.StartAt, req.EndAt, req.Owner, req.SupportOwner, req.IncidentOwner, req.RequiredApprovals))
	if err != nil {
		if isUnique(err) {
			return nil, fmt.Errorf("%w: pilot_id already exists", ErrConflict)
		}
		return nil, fmt.Errorf("pilot: create: %w", err)
	}
	if err := s.Audit(ctx, p.ID, actor, role, "PILOT_CREATED", "Synthetic local/sandbox pilot created"); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) Get(ctx context.Context, id string) (*Pilot, error) {
	p, err := scanPilot(s.pool.QueryRow(ctx, `SELECT `+pilotColumns+` FROM pilot_programs WHERE pilot_id=$1 OR id::text=$1`, id))
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) resolveID(ctx context.Context, id string) (string, error) {
	var resolved string
	err := s.pool.QueryRow(ctx, `SELECT id::text FROM pilot_programs WHERE pilot_id=$1 OR id::text=$1`, id).Scan(&resolved)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return resolved, err
}

func (s *Service) List(ctx context.Context, status string) ([]*Pilot, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+pilotColumns+` FROM pilot_programs
		WHERE ($1='' OR status=$1) ORDER BY created_at DESC`, strings.ToLower(strings.TrimSpace(status)))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Pilot
	for rows.Next() {
		p, scanErr := scanPilot(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Service) Update(ctx context.Context, id string, req UpdateRequest, actor string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status != StatusDraft && p.Status != StatusPlanned && p.Status != StatusApproved {
		return nil, fmt.Errorf("%w: only draft, planned, or approved pilots may be updated", ErrConflict)
	}
	if req.MaxParticipants != nil && *req.MaxParticipants <= 0 ||
		req.AmountLimitMinor != nil && *req.AmountLimitMinor <= 0 ||
		req.TransactionLimitMinor != nil && *req.TransactionLimitMinor <= 0 ||
		req.DailyLimitMinor != nil && *req.DailyLimitMinor <= 0 {
		return nil, fmt.Errorf("%w: limits must be positive", ErrInvalid)
	}
	if req.StartAt != nil && req.EndAt != nil && !req.EndAt.After(*req.StartAt) {
		return nil, fmt.Errorf("%w: end_at must be after start_at", ErrInvalid)
	}
	_, err = s.pool.Exec(ctx, `UPDATE pilot_programs SET
		scope=COALESCE($1,scope), max_participants=COALESCE($2,max_participants),
		amount_limit_minor=COALESCE($3,amount_limit_minor), transaction_limit_minor=COALESCE($4,transaction_limit_minor),
		daily_limit_minor=COALESCE($5,daily_limit_minor), start_at=COALESCE($6,start_at), end_at=COALESCE($7,end_at),
		support_owner=COALESCE($8,support_owner), incident_owner=COALESCE($9,incident_owner),
		status=CASE WHEN status='draft' THEN 'planned' ELSE status END, updated_at=now()
		WHERE id=$10`, req.Scope, req.MaxParticipants, req.AmountLimitMinor, req.TransactionLimitMinor,
		req.DailyLimitMinor, req.StartAt, req.EndAt, req.SupportOwner, req.IncidentOwner, p.ID)
	if err != nil {
		return nil, err
	}
	updated, err := s.Get(ctx, p.ID)
	if err == nil {
		_ = s.Audit(ctx, p.ID, actor, "operator", "PILOT_UPDATED", "Pilot governance metadata updated")
	}
	return updated, err
}

func (s *Service) AddParticipant(ctx context.Context, id string, req ParticipantRequest, actor string) (*Participant, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status == StatusActive || p.Status == StatusCompleted || p.Status == StatusCancelled {
		return nil, fmt.Errorf("%w: allowlist is closed for this pilot state", ErrConflict)
	}
	var kyc string
	if req.OrganizationID != "" {
		err = s.pool.QueryRow(ctx, `SELECT verification_status FROM organizations WHERE id=$1`, req.OrganizationID).Scan(&kyc)
	} else {
		err = s.pool.QueryRow(ctx, `SELECT kyc_status FROM users WHERE id=$1`, req.UserID).Scan(&kyc)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	kyc = strings.ToLower(strings.TrimSpace(kyc))
	if kyc != "approved" && kyc != "verified" {
		return nil, fmt.Errorf("%w: participant KYC/compliance status must be approved", ErrGovernance)
	}
	var out Participant
	err = s.pool.QueryRow(ctx, `INSERT INTO pilot_participants
		(pilot_id,organization_id,user_id,kyc_status,consent_at,terms_version,metadata)
		VALUES($1,$2,$3,$4,now(),$5,$6)
		RETURNING id,pilot_id,organization_id,user_id,kyc_status,consent_at,terms_version,metadata,status,created_at`,
		p.ID, nullString(req.OrganizationID), nullString(req.UserID), kyc, strings.TrimSpace(req.TermsVersion),
		strings.TrimSpace(req.Metadata)).Scan(&out.ID, &out.PilotID, &out.OrganizationID, &out.UserID,
		&out.KYCStatus, &out.ConsentAt, &out.TermsVersion, &out.Metadata, &out.Status, &out.CreatedAt)
	if err != nil {
		if isUnique(err) {
			return nil, fmt.Errorf("%w: participant is already allowlisted", ErrConflict)
		}
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, "operator", "PILOT_PARTICIPANT_ALLOWLISTED", "Synthetic participant consent recorded")
	return &out, nil
}

func (s *Service) Participants(ctx context.Context, id string) ([]Participant, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,pilot_id,organization_id,user_id,kyc_status,consent_at,
		terms_version,metadata,status,created_at FROM pilot_participants WHERE pilot_id=$1 ORDER BY created_at`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Participant
	for rows.Next() {
		var p Participant
		if err := rows.Scan(&p.ID, &p.PilotID, &p.OrganizationID, &p.UserID, &p.KYCStatus, &p.ConsentAt,
			&p.TermsVersion, &p.Metadata, &p.Status, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Service) Approvals(ctx context.Context, id string) ([]Approval, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,pilot_id,approver,role,decision,COALESCE(reason,''),created_at
		FROM pilot_approvals WHERE pilot_id=$1 ORDER BY created_at`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Approval
	for rows.Next() {
		var a Approval
		if err := rows.Scan(&a.ID, &a.PilotID, &a.Approver, &a.Role, &a.Decision, &a.Reason, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Service) Approve(ctx context.Context, id, actor, role string, req ApprovalRequest) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if strings.EqualFold(p.Owner, actor) {
		return nil, ErrSelfApproval
	}
	if req.Decision != "approved" && req.Decision != "rejected" || strings.TrimSpace(actor) == "" {
		return nil, fmt.Errorf("%w: decision and approver are required", ErrInvalid)
	}
	if p.Status == StatusActive || p.Status == StatusCompleted || p.Status == StatusCancelled {
		return nil, fmt.Errorf("%w: pilot is not awaiting approval", ErrConflict)
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO pilot_approvals(pilot_id,approver,role,decision,reason)
		VALUES($1,$2,$3,$4,$5) ON CONFLICT(pilot_id,approver) DO UPDATE SET decision=EXCLUDED.decision,reason=EXCLUDED.reason`,
		p.ID, actor, role, req.Decision, strings.TrimSpace(req.Reason))
	if err != nil {
		return nil, err
	}
	if req.Decision == "rejected" {
		_, err = s.pool.Exec(ctx, `UPDATE pilot_programs SET status='planned',updated_at=now() WHERE id=$1`, p.ID)
	} else {
		var count int
		err = s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM pilot_approvals WHERE pilot_id=$1 AND decision='approved'`, p.ID).Scan(&count)
		if err == nil && count >= p.RequiredApprovals {
			_, err = s.pool.Exec(ctx, `UPDATE pilot_programs SET status='approved',updated_at=now() WHERE id=$1`, p.ID)
		}
	}
	if err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_APPROVAL", req.Decision)
	return s.Get(ctx, p.ID)
}

func (s *Service) governanceReady(ctx context.Context, p *Pilot) error {
	if !s.globalKillSwitch {
		return ErrKillSwitch
	}
	if !p.KillSwitch || !p.ObservationOnly || p.LiveEnabled {
		return ErrNotObservation
	}
	var approvals, participants, noncompliant int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM pilot_approvals WHERE pilot_id=$1 AND decision='approved'`, p.ID).Scan(&approvals); err != nil {
		return err
	}
	if approvals < p.RequiredApprovals {
		return ErrGovernance
	}
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM pilot_participants WHERE pilot_id=$1`, p.ID).Scan(&participants); err != nil {
		return err
	}
	if participants == 0 || participants > p.MaxParticipants {
		return ErrGovernance
	}
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM pilot_participants WHERE pilot_id=$1 AND lower(kyc_status) NOT IN ('approved','verified')`, p.ID).Scan(&noncompliant); err != nil {
		return err
	}
	if noncompliant > 0 {
		return ErrGovernance
	}
	return nil
}

func (s *Service) Pause(ctx context.Context, id, actor, role string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status != StatusActive {
		return nil, fmt.Errorf("%w: only active pilots can be paused", ErrConflict)
	}
	_, err = s.pool.Exec(ctx, `UPDATE pilot_programs SET status='paused',updated_at=now() WHERE id=$1`, p.ID)
	if err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_PAUSED", "Pilot paused by operator")
	return s.Get(ctx, p.ID)
}

func (s *Service) Resume(ctx context.Context, id, actor, role string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status != StatusApproved && p.Status != StatusPaused {
		return nil, fmt.Errorf("%w: only approved or paused pilots can be resumed", ErrConflict)
	}
	if err := s.governanceReady(ctx, p); err != nil {
		return nil, err
	}
	_, err = s.pool.Exec(ctx, `UPDATE pilot_programs SET status='active',updated_at=now() WHERE id=$1`, p.ID)
	if err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_ACTIVATED", "Observation-only pilot activated; settlement remains kill-switched")
	return s.Get(ctx, p.ID)
}

func (s *Service) Cancel(ctx context.Context, id, actor, role string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status == StatusCompleted || p.Status == StatusCancelled {
		return nil, fmt.Errorf("%w: terminal pilot", ErrConflict)
	}
	if _, err := s.pool.Exec(ctx, `UPDATE pilot_programs SET status='cancelled',updated_at=now() WHERE id=$1`, p.ID); err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_CANCELLED", "Pilot cancelled")
	return s.Get(ctx, p.ID)
}

func (s *Service) Complete(ctx context.Context, id, actor, role string) (*Pilot, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Status != StatusActive && p.Status != StatusPaused {
		return nil, fmt.Errorf("%w: only active or paused pilots can be completed", ErrConflict)
	}
	if _, err := s.pool.Exec(ctx, `UPDATE pilot_programs SET status='completed',updated_at=now() WHERE id=$1`, p.ID); err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_COMPLETED", "Pilot observation window completed")
	return s.Get(ctx, p.ID)
}

func (s *Service) Scenarios(ctx context.Context, id string) ([]Scenario, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,pilot_id,code,name,description,expected,created_at FROM pilot_scenarios WHERE pilot_id=$1 ORDER BY created_at`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Scenario
	for rows.Next() {
		var v Scenario
		if err := rows.Scan(&v.ID, &v.PilotID, &v.Code, &v.Name, &v.Description, &v.Expected, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (s *Service) AddScenario(ctx context.Context, id string, req ScenarioRequest, actor string) (*Scenario, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Code) == "" || strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Expected) == "" || strings.TrimSpace(req.Description) == "" {
		return nil, fmt.Errorf("%w: scenario code, name, description and expected outcome are required", ErrInvalid)
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	var v Scenario
	err = s.pool.QueryRow(ctx, `INSERT INTO pilot_scenarios(pilot_id,code,name,description,expected) VALUES($1,$2,$3,$4,$5)
		RETURNING id,pilot_id,code,name,description,expected,created_at`, p.ID, strings.TrimSpace(req.Code), strings.TrimSpace(req.Name), strings.TrimSpace(req.Description), strings.TrimSpace(req.Expected)).
		Scan(&v.ID, &v.PilotID, &v.Code, &v.Name, &v.Description, &v.Expected, &v.CreatedAt)
	if err != nil {
		if isUnique(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, "operator", "PILOT_SCENARIO_CREATED", v.Code)
	return &v, nil
}

func (s *Service) AddRun(ctx context.Context, id, scenarioID, actor string, req RunRequest) (*Run, bool, error) {
	if err := s.guardWrite(); err != nil {
		return nil, false, err
	}
	if strings.TrimSpace(req.Observed) == "" || strings.TrimSpace(req.Outcome) == "" || strings.TrimSpace(req.IdempotencyKey) == "" {
		return nil, false, fmt.Errorf("%w: observed, outcome and idempotency_key are required", ErrInvalid)
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, false, err
	}
	var scenarioPilot string
	if err := s.pool.QueryRow(ctx, `SELECT pilot_id::text FROM pilot_scenarios WHERE id::text=$1`, scenarioID).Scan(&scenarioPilot); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, false, ErrNotFound
		}
		return nil, false, err
	}
	if scenarioPilot != p.ID {
		return nil, false, ErrConflict
	}
	var v Run
	err = s.pool.QueryRow(ctx, `INSERT INTO pilot_runs(pilot_id,scenario_id,runner,observed,outcome,evidence_ref,idempotency_key,completed_at)
		VALUES($1,$2,$3,$4,$5,NULLIF($6,''),$7,CASE WHEN $8 THEN now() ELSE NULL END)
		RETURNING id,scenario_id,pilot_id,runner,observed,outcome,COALESCE(evidence_ref,''),started_at,completed_at`,
		p.ID, scenarioID, actor, strings.TrimSpace(req.Observed), strings.TrimSpace(req.Outcome), strings.TrimSpace(req.EvidenceRef), strings.TrimSpace(req.IdempotencyKey), req.Completed).
		Scan(&v.ID, &v.ScenarioID, &v.PilotID, &v.Runner, &v.Observed, &v.Outcome, &v.EvidenceRef, &v.StartedAt, &v.CompletedAt)
	if err == nil {
		_ = s.Audit(ctx, p.ID, actor, "operator", "PILOT_SCENARIO_RUN_RECORDED", v.Outcome)
		return &v, false, nil
	}
	if !isUnique(err) {
		return nil, false, err
	}
	err = s.pool.QueryRow(ctx, `SELECT id,scenario_id,pilot_id,runner,observed,outcome,COALESCE(evidence_ref,''),started_at,completed_at FROM pilot_runs WHERE idempotency_key=$1`, req.IdempotencyKey).
		Scan(&v.ID, &v.ScenarioID, &v.PilotID, &v.Runner, &v.Observed, &v.Outcome, &v.EvidenceRef, &v.StartedAt, &v.CompletedAt)
	if err != nil {
		return nil, false, err
	}
	if v.ScenarioID != scenarioID || v.Observed != req.Observed || v.Outcome != req.Outcome {
		return nil, false, ErrIdempotency
	}
	return &v, true, nil
}

func (s *Service) Runs(ctx context.Context, id string) ([]Run, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,scenario_id,pilot_id,runner,observed,outcome,COALESCE(evidence_ref,''),started_at,completed_at FROM pilot_runs WHERE pilot_id=$1 ORDER BY started_at DESC`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Run
	for rows.Next() {
		var v Run
		if err := rows.Scan(&v.ID, &v.ScenarioID, &v.PilotID, &v.Runner, &v.Observed, &v.Outcome, &v.EvidenceRef, &v.StartedAt, &v.CompletedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (s *Service) AddObservation(ctx context.Context, id, actor, role string, req ObservationRequest) (*Observation, bool, error) {
	if err := s.guardWrite(); err != nil {
		return nil, false, err
	}
	if strings.TrimSpace(req.Metric) == "" || strings.TrimSpace(req.Value) == "" || strings.TrimSpace(req.IdempotencyKey) == "" {
		return nil, false, fmt.Errorf("%w: metric, value and idempotency_key are required", ErrInvalid)
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, false, err
	}
	var v Observation
	err = s.pool.QueryRow(ctx, `INSERT INTO pilot_observations(pilot_id,metric,value,unit,observed_by,evidence_ref,idempotency_key) VALUES($1,$2,$3,NULLIF($4,''),$5,NULLIF($6,''),$7) RETURNING id,pilot_id,metric,value,COALESCE(unit,''),observed_by,COALESCE(evidence_ref,''),observed_at`, p.ID, strings.TrimSpace(req.Metric), strings.TrimSpace(req.Value), strings.TrimSpace(req.Unit), actor, strings.TrimSpace(req.EvidenceRef), strings.TrimSpace(req.IdempotencyKey)).Scan(&v.ID, &v.PilotID, &v.Metric, &v.Value, &v.Unit, &v.ObservedBy, &v.EvidenceRef, &v.ObservedAt)
	if err == nil {
		_ = s.Audit(ctx, p.ID, actor, role, "PILOT_OBSERVATION_RECORDED", v.Metric)
		return &v, false, nil
	}
	if !isUnique(err) {
		return nil, false, err
	}
	err = s.pool.QueryRow(ctx, `SELECT id,pilot_id,metric,value,COALESCE(unit,''),observed_by,COALESCE(evidence_ref,''),observed_at FROM pilot_observations WHERE idempotency_key=$1`, req.IdempotencyKey).Scan(&v.ID, &v.PilotID, &v.Metric, &v.Value, &v.Unit, &v.ObservedBy, &v.EvidenceRef, &v.ObservedAt)
	if err != nil {
		return nil, false, err
	}
	if v.Metric != req.Metric || v.Value != req.Value {
		return nil, false, ErrIdempotency
	}
	return &v, true, nil
}

func (s *Service) Observations(ctx context.Context, id string) ([]Observation, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,pilot_id,metric,value,COALESCE(unit,''),observed_by,COALESCE(evidence_ref,''),observed_at FROM pilot_observations WHERE pilot_id=$1 ORDER BY observed_at DESC`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Observation
	for rows.Next() {
		var v Observation
		if err := rows.Scan(&v.ID, &v.PilotID, &v.Metric, &v.Value, &v.Unit, &v.ObservedBy, &v.EvidenceRef, &v.ObservedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (s *Service) AddIncident(ctx context.Context, id, actor, role string, req IncidentRequest) (*Incident, error) {
	if err := s.guardWrite(); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Kind) == "" || strings.TrimSpace(req.Severity) == "" || strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Description) == "" || strings.TrimSpace(req.Owner) == "" {
		return nil, fmt.Errorf("%w: incident kind, severity, title, description and owner are required", ErrInvalid)
	}
	p, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	status := "open"
	var resolved *time.Time
	if strings.TrimSpace(req.Resolution) != "" {
		status = "resolved"
		now := time.Now().UTC()
		resolved = &now
	}
	var v Incident
	err = s.pool.QueryRow(ctx, `INSERT INTO pilot_incidents(pilot_id,kind,severity,title,description,status,owner,resolution,resolved_at) VALUES($1,$2,$3,$4,$5,$6,$7,NULLIF($8,''),$9) RETURNING id,pilot_id,kind,severity,title,description,status,owner,COALESCE(resolution,''),opened_at,resolved_at`, p.ID, strings.TrimSpace(req.Kind), strings.TrimSpace(req.Severity), strings.TrimSpace(req.Title), strings.TrimSpace(req.Description), status, strings.TrimSpace(req.Owner), strings.TrimSpace(req.Resolution), resolved).Scan(&v.ID, &v.PilotID, &v.Kind, &v.Severity, &v.Title, &v.Description, &v.Status, &v.Owner, &v.Resolution, &v.OpenedAt, &v.ResolvedAt)
	if err != nil {
		return nil, err
	}
	_ = s.Audit(ctx, p.ID, actor, role, "PILOT_INCIDENT_RECORDED", v.Title)
	return &v, nil
}

func (s *Service) Incidents(ctx context.Context, id string) ([]Incident, error) {
	resolved, err := s.resolveID(ctx, id)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `SELECT id,pilot_id,kind,severity,title,description,status,owner,COALESCE(resolution,''),opened_at,resolved_at FROM pilot_incidents WHERE pilot_id=$1 ORDER BY opened_at DESC`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Incident
	for rows.Next() {
		var v Incident
		if err := rows.Scan(&v.ID, &v.PilotID, &v.Kind, &v.Severity, &v.Title, &v.Description, &v.Status, &v.Owner, &v.Resolution, &v.OpenedAt, &v.ResolvedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (s *Service) AuditEvents(ctx context.Context, id string) ([]AuditEvent, error) {
	resolved := id
	if strings.TrimSpace(id) != "" {
		var resolveErr error
		resolved, resolveErr = s.resolveID(ctx, id)
		if resolveErr != nil {
			return nil, resolveErr
		}
	}
	rows, err := s.pool.Query(ctx, `SELECT id,COALESCE(pilot_id::text,''),actor,role,action,COALESCE(detail,''),created_at FROM pilot_audit_events WHERE ($1='' OR pilot_id=$1::uuid) ORDER BY created_at DESC`, resolved)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []AuditEvent
	for rows.Next() {
		var v AuditEvent
		if err := rows.Scan(&v.ID, &v.PilotID, &v.Actor, &v.Role, &v.Action, &v.Detail, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func nullString(v string) any {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	return strings.TrimSpace(v)
}
func isUnique(err error) bool {
	var e interface{ SQLState() string }
	return errors.As(err, &e) && e.SQLState() == "23505"
}
