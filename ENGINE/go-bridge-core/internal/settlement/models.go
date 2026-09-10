// Package settlement implements the Phase 5 controlled settlement boundary.
//
// The package is deliberately fail-closed: commands are persisted for review,
// preflighted, and can be simulated, but no provider or blockchain call is
// possible through this boundary.
package settlement

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

type ActionType string

const (
	ActionPayout      ActionType = "payout"
	ActionFund        ActionType = "fund"
	ActionRelease     ActionType = "release"
	ActionRefund      ActionType = "refund"
	ActionTimeout     ActionType = "timeout"
	ActionArbitration ActionType = "arbitration"
)

type ApprovalState string

const (
	ApprovalPending  ApprovalState = "pending"
	ApprovalApproved ApprovalState = "approved"
	ApprovalRejected ApprovalState = "rejected"
)

type ExecutionState string

const (
	ExecutionNotStarted  ExecutionState = "not_started"
	ExecutionDryRun      ExecutionState = "dry_run"
	ExecutionLiveRefused ExecutionState = "live_refused"
	ExecutionCompleted   ExecutionState = "completed"
)

type CommandStatus string

const (
	StatusPending         CommandStatus = "pending"
	StatusApproved        CommandStatus = "approved"
	StatusExecuting       CommandStatus = "executing"
	StatusPendingProvider CommandStatus = "pending_provider"
	StatusSucceeded       CommandStatus = "succeeded"
	StatusFailed          CommandStatus = "failed"
	StatusExpired         CommandStatus = "expired"
	StatusCancelled       CommandStatus = "cancelled"
)

var (
	ErrInvalid               = errors.New("settlement: invalid request")
	ErrNotFound              = errors.New("settlement: command not found")
	ErrConflict              = errors.New("settlement: idempotency conflict")
	ErrSelfApproval          = errors.New("settlement: requester cannot approve their own command")
	ErrInsufficientApprovals = errors.New("settlement: required approvals not met")
	ErrLiveExecutionDisabled = errors.New("settlement: live execution is disabled")
	ErrKillSwitch            = errors.New("settlement: kill switch is active")
	ErrReadOnly              = errors.New("settlement: read-only mode blocks state changes")
)

type Command struct {
	ID                string         `json:"id"`
	Action            ActionType     `json:"action"`
	Target            string         `json:"target"`
	ProviderID        string         `json:"provider_id"`
	CorridorID        string         `json:"corridor_id"`
	AmountMinor       int64          `json:"amount_minor"`
	Currency          string         `json:"currency"`
	Reason            string         `json:"reason"`
	RequestedBy       string         `json:"requested_by"`
	ApprovalState     ApprovalState  `json:"approval_state"`
	ExecutionState    ExecutionState `json:"execution_state"`
	Status            CommandStatus  `json:"status"`
	IdempotencyKey    string         `json:"idempotency_key"`
	RequiredApprovals int            `json:"required_approvals"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	ApprovedAt        *time.Time     `json:"approved_at,omitempty"`
	ExecutedAt        *time.Time     `json:"executed_at,omitempty"`
}

type Approval struct {
	ID        string        `json:"id"`
	CommandID string        `json:"command_id"`
	Approver  string        `json:"approver"`
	Role      string        `json:"role"`
	Decision  ApprovalState `json:"decision"`
	Reason    string        `json:"reason,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
}

type Request struct {
	Action            ActionType `json:"action"`
	Target            string     `json:"target"`
	ProviderID        string     `json:"provider_id"`
	CorridorID        string     `json:"corridor_id"`
	AmountMinor       int64      `json:"amount_minor"`
	Currency          string     `json:"currency"`
	Reason            string     `json:"reason"`
	IdempotencyKey    string     `json:"idempotency_key"`
	RequiredApprovals int        `json:"required_approvals,omitempty"`
}

type ApprovalRequest struct {
	Decision ApprovalState `json:"decision"`
	Reason   string        `json:"reason"`
}

type PreflightCheck struct {
	Name     string `json:"name"`
	Passed   bool   `json:"passed"`
	Required bool   `json:"required"`
	Explain  string `json:"explain"`
}

type PreflightResult struct {
	CommandID   string           `json:"command_id"`
	Passed      bool             `json:"passed"`
	Checks      []PreflightCheck `json:"checks"`
	EvaluatedAt time.Time        `json:"evaluated_at"`
}

type Reconciliation struct {
	CommandID         string    `json:"command_id"`
	ProviderReference string    `json:"provider_reference,omitempty"`
	Outcome           string    `json:"outcome"`
	Detail            string    `json:"detail,omitempty"`
	ObservedAt        time.Time `json:"observed_at"`
}

type Policy struct {
	GlobalKillSwitch  bool
	ReadOnly          bool
	ExecutionEnabled  bool
	RequiredApprovals int
	MaxAmountMinor    int64
	DailyLimitMinor   int64
	VelocityLimit     int
	VelocityWindow    time.Duration
}

func DefaultPolicy() Policy {
	return Policy{
		GlobalKillSwitch: true, ReadOnly: false, ExecutionEnabled: false,
		RequiredApprovals: 2, MaxAmountMinor: 50_000_000,
		DailyLimitMinor: 100_000_000, VelocityLimit: 10,
		VelocityWindow: 24 * time.Hour,
	}
}

func (r Request) Validate() error {
	switch r.Action {
	case ActionPayout, ActionFund, ActionRelease, ActionRefund, ActionTimeout, ActionArbitration:
	default:
		return fmt.Errorf("%w: unsupported action", ErrInvalid)
	}
	if strings.TrimSpace(r.Target) == "" || strings.TrimSpace(r.ProviderID) == "" ||
		strings.TrimSpace(r.CorridorID) == "" || strings.TrimSpace(r.Currency) == "" ||
		strings.TrimSpace(r.Reason) == "" || strings.TrimSpace(r.IdempotencyKey) == "" {
		return fmt.Errorf("%w: target, provider, corridor, currency, reason and idempotency_key are required", ErrInvalid)
	}
	if r.AmountMinor <= 0 || r.AmountMinor > math.MaxInt64 {
		return fmt.Errorf("%w: amount_minor must be positive", ErrInvalid)
	}
	if len(strings.TrimSpace(r.Currency)) != 3 {
		return fmt.Errorf("%w: currency must be ISO-shaped", ErrInvalid)
	}
	return nil
}
