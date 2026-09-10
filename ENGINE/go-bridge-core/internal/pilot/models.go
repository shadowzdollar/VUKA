// Package pilot contains the Phase 6 supervised-pilot control plane.
//
// A pilot is a governance and observation record only. It cannot call a
// provider, write to a chain, move ledger funds, or disable the global
// settlement kill switch.
package pilot

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusPlanned   Status = "planned"
	StatusApproved  Status = "approved"
	StatusActive    Status = "active"
	StatusPaused    Status = "paused"
	StatusCompleted Status = "completed"
	StatusCancelled Status = "cancelled"
)

var (
	ErrInvalid        = errors.New("pilot: invalid request")
	ErrNotFound       = errors.New("pilot: record not found")
	ErrConflict       = errors.New("pilot: conflict")
	ErrSelfApproval   = errors.New("pilot: self-approval is not allowed")
	ErrGovernance     = errors.New("pilot: governance requirements are not met")
	ErrKillSwitch     = errors.New("pilot: global settlement kill switch must remain active")
	ErrReadOnly       = errors.New("pilot: read-only mode blocks state changes")
	ErrIdempotency    = errors.New("pilot: idempotency conflict")
	ErrNotObservation = errors.New("pilot: observation-only mode is required")
)

type Pilot struct {
	ID                    string    `json:"id"`
	PilotID               string    `json:"pilot_id"`
	CorridorID            string    `json:"corridor_id"`
	ProviderID            string    `json:"provider_id"`
	Environment           string    `json:"environment"`
	Scope                 string    `json:"scope"`
	MaxParticipants       int       `json:"max_participants"`
	AmountLimitMinor      int64     `json:"amount_limit_minor"`
	TransactionLimitMinor int64     `json:"transaction_limit_minor"`
	DailyLimitMinor       int64     `json:"daily_limit_minor"`
	StartAt               time.Time `json:"start_at"`
	EndAt                 time.Time `json:"end_at"`
	Owner                 string    `json:"owner"`
	SupportOwner          string    `json:"support_owner"`
	IncidentOwner         string    `json:"incident_owner"`
	Status                Status    `json:"status"`
	RequiredApprovals     int       `json:"required_approvals"`
	KillSwitch            bool      `json:"kill_switch"`
	ObservationOnly       bool      `json:"observation_only"`
	LiveEnabled           bool      `json:"live_enabled"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

type CreateRequest struct {
	PilotID               string    `json:"pilot_id"`
	CorridorID            string    `json:"corridor_id"`
	ProviderID            string    `json:"provider_id"`
	Environment           string    `json:"environment"`
	Scope                 string    `json:"scope"`
	MaxParticipants       int       `json:"max_participants"`
	AmountLimitMinor      int64     `json:"amount_limit_minor"`
	TransactionLimitMinor int64     `json:"transaction_limit_minor"`
	DailyLimitMinor       int64     `json:"daily_limit_minor"`
	StartAt               time.Time `json:"start_at"`
	EndAt                 time.Time `json:"end_at"`
	Owner                 string    `json:"owner"`
	SupportOwner          string    `json:"support_owner"`
	IncidentOwner         string    `json:"incident_owner"`
	RequiredApprovals     int       `json:"required_approvals"`
}

type UpdateRequest struct {
	Scope                 *string    `json:"scope,omitempty"`
	MaxParticipants       *int       `json:"max_participants,omitempty"`
	AmountLimitMinor      *int64     `json:"amount_limit_minor,omitempty"`
	TransactionLimitMinor *int64     `json:"transaction_limit_minor,omitempty"`
	DailyLimitMinor       *int64     `json:"daily_limit_minor,omitempty"`
	StartAt               *time.Time `json:"start_at,omitempty"`
	EndAt                 *time.Time `json:"end_at,omitempty"`
	SupportOwner          *string    `json:"support_owner,omitempty"`
	IncidentOwner         *string    `json:"incident_owner,omitempty"`
}

type Participant struct {
	ID             string     `json:"id"`
	PilotID        string     `json:"pilot_id"`
	OrganizationID *string    `json:"organization_id,omitempty"`
	UserID         *string    `json:"user_id,omitempty"`
	KYCStatus      string     `json:"kyc_status"`
	ConsentAt      *time.Time `json:"consent_at,omitempty"`
	TermsVersion   string     `json:"terms_version"`
	Status         string     `json:"status"`
	Metadata       string     `json:"metadata,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type ParticipantRequest struct {
	OrganizationID string `json:"organization_id,omitempty"`
	UserID         string `json:"user_id,omitempty"`
	Consent        bool   `json:"consent"`
	TermsVersion   string `json:"terms_version"`
	Metadata       string `json:"metadata,omitempty"`
}

type Approval struct {
	ID        string    `json:"id"`
	PilotID   string    `json:"pilot_id"`
	Approver  string    `json:"approver"`
	Role      string    `json:"role"`
	Decision  string    `json:"decision"`
	Reason    string    `json:"reason,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type ApprovalRequest struct {
	Decision string `json:"decision"`
	Reason   string `json:"reason"`
}

type Scenario struct {
	ID          string    `json:"id"`
	PilotID     string    `json:"pilot_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Expected    string    `json:"expected"`
	CreatedAt   time.Time `json:"created_at"`
}

type ScenarioRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Expected    string `json:"expected"`
}

type Run struct {
	ID          string     `json:"id"`
	ScenarioID  string     `json:"scenario_id"`
	PilotID     string     `json:"pilot_id"`
	Runner      string     `json:"runner"`
	Observed    string     `json:"observed"`
	Outcome     string     `json:"outcome"`
	EvidenceRef string     `json:"evidence_ref,omitempty"`
	StartedAt   time.Time  `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type RunRequest struct {
	Observed       string `json:"observed"`
	Outcome        string `json:"outcome"`
	EvidenceRef    string `json:"evidence_ref,omitempty"`
	IdempotencyKey string `json:"idempotency_key"`
	Completed      bool   `json:"completed"`
}

type Observation struct {
	ID          string    `json:"id"`
	PilotID     string    `json:"pilot_id"`
	Metric      string    `json:"metric"`
	Value       string    `json:"value"`
	Unit        string    `json:"unit,omitempty"`
	ObservedBy  string    `json:"observed_by"`
	EvidenceRef string    `json:"evidence_ref,omitempty"`
	ObservedAt  time.Time `json:"observed_at"`
}

type ObservationRequest struct {
	Metric         string `json:"metric"`
	Value          string `json:"value"`
	Unit           string `json:"unit,omitempty"`
	EvidenceRef    string `json:"evidence_ref,omitempty"`
	IdempotencyKey string `json:"idempotency_key"`
}

type Incident struct {
	ID          string     `json:"id"`
	PilotID     string     `json:"pilot_id"`
	Kind        string     `json:"kind"`
	Severity    string     `json:"severity"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Owner       string     `json:"owner"`
	Resolution  string     `json:"resolution,omitempty"`
	OpenedAt    time.Time  `json:"opened_at"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
}

type IncidentRequest struct {
	Kind        string `json:"kind"`
	Severity    string `json:"severity"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	Resolution  string `json:"resolution,omitempty"`
}

type AuditEvent struct {
	ID        string    `json:"id"`
	PilotID   string    `json:"pilot_id"`
	Actor     string    `json:"actor"`
	Role      string    `json:"role"`
	Action    string    `json:"action"`
	Detail    string    `json:"detail,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (r CreateRequest) Validate() error {
	r.PilotID = strings.TrimSpace(r.PilotID)
	r.CorridorID = strings.TrimSpace(r.CorridorID)
	r.ProviderID = strings.TrimSpace(r.ProviderID)
	r.Environment = strings.ToLower(strings.TrimSpace(r.Environment))
	r.Scope = strings.TrimSpace(r.Scope)
	if r.PilotID == "" || r.CorridorID == "" || r.ProviderID == "" || r.Scope == "" ||
		strings.TrimSpace(r.Owner) == "" || strings.TrimSpace(r.SupportOwner) == "" || strings.TrimSpace(r.IncidentOwner) == "" {
		return fmt.Errorf("%w: pilot_id, corridor_id, provider_id, scope and named owners are required", ErrInvalid)
	}
	if r.Environment != "local" && r.Environment != "sandbox" {
		return fmt.Errorf("%w: environment must be local or sandbox", ErrInvalid)
	}
	if r.MaxParticipants <= 0 || r.AmountLimitMinor <= 0 || r.TransactionLimitMinor <= 0 ||
		r.DailyLimitMinor <= 0 || r.TransactionLimitMinor > r.AmountLimitMinor ||
		r.DailyLimitMinor < r.TransactionLimitMinor || r.StartAt.IsZero() || r.EndAt.IsZero() ||
		!r.EndAt.After(r.StartAt) {
		return fmt.Errorf("%w: invalid participant, limit, or time window", ErrInvalid)
	}
	if r.RequiredApprovals < 2 {
		return fmt.Errorf("%w: at least two approvals are required", ErrInvalid)
	}
	return nil
}

func (r ParticipantRequest) Validate() error {
	if (strings.TrimSpace(r.OrganizationID) == "") == (strings.TrimSpace(r.UserID) == "") {
		return fmt.Errorf("%w: exactly one organization_id or user_id is required", ErrInvalid)
	}
	if !r.Consent || strings.TrimSpace(r.TermsVersion) == "" {
		return fmt.Errorf("%w: consent and terms_version are required", ErrInvalid)
	}
	if len(strings.TrimSpace(r.Metadata)) > 1000 {
		return fmt.Errorf("%w: metadata is limited to 1000 characters and cannot be a document payload", ErrInvalid)
	}
	return nil
}
