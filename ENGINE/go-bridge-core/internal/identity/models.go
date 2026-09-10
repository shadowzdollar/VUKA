package identity

import "time"

const (
	StatusPending          = "pending"
	StatusApproved         = "approved"
	StatusRejected         = "rejected"
	StatusSuspended        = "suspended"
	StatusNeedsInformation = "needs_information"
)

type Organization struct {
	ID                 string    `json:"id"`
	LegalName          string    `json:"legal_name"`
	TradingName        *string   `json:"trading_name,omitempty"`
	CountryCode        string    `json:"country_code"`
	OrganizationType   string    `json:"organization_type"`
	RegistrationNumber *string   `json:"registration_number,omitempty"`
	VerificationStatus string    `json:"verification_status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Membership struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	UserID         *string   `json:"user_id,omitempty"`
	OperatorEmail  *string   `json:"operator_email,omitempty"`
	Role           string    `json:"role"`
	Active         bool      `json:"active"`
	CreatedAt      time.Time `json:"created_at"`
}

type Verification struct {
	ID               string     `json:"id"`
	OrganizationID   *string    `json:"organization_id,omitempty"`
	UserID           *string    `json:"user_id,omitempty"`
	VerificationType string     `json:"verification_type"`
	Status           string     `json:"status"`
	Reference        string     `json:"reference"`
	EvidenceLabel    *string    `json:"evidence_label,omitempty"`
	SubmittedBy      string     `json:"submitted_by"`
	ReviewedBy       *string    `json:"reviewed_by,omitempty"`
	ReviewedAt       *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

type VerificationDecision struct {
	ID             string    `json:"id"`
	VerificationID string    `json:"verification_id"`
	FromStatus     string    `json:"from_status"`
	ToStatus       string    `json:"to_status"`
	DecidedBy      string    `json:"decided_by"`
	Rationale      string    `json:"rationale"`
	CreatedAt      time.Time `json:"created_at"`
}

type Review struct {
	ID             string     `json:"id"`
	OrganizationID string     `json:"organization_id"`
	Status         string     `json:"status"`
	OpenedBy       string     `json:"opened_by"`
	Reviewer       *string    `json:"reviewer,omitempty"`
	Reason         string     `json:"reason"`
	DecisionNotes  *string    `json:"decision_notes,omitempty"`
	Version        int        `json:"version"`
	CreatedAt      time.Time  `json:"created_at"`
	DecidedAt      *time.Time `json:"decided_at,omitempty"`
}

type RiskFlag struct {
	ID             string     `json:"id"`
	OrganizationID string     `json:"organization_id"`
	Code           string     `json:"code"`
	Severity       string     `json:"severity"`
	Status         string     `json:"status"`
	Description    string     `json:"description"`
	RaisedBy       string     `json:"raised_by"`
	ResolvedBy     *string    `json:"resolved_by,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	ResolvedAt     *time.Time `json:"resolved_at,omitempty"`
}

type ReviewNote struct {
	ID        string    `json:"id"`
	ReviewID  string    `json:"review_id"`
	Author    string    `json:"author"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

type Decision struct {
	ID         string    `json:"id"`
	ReviewID   string    `json:"review_id"`
	FromStatus string    `json:"from_status"`
	ToStatus   string    `json:"to_status"`
	DecidedBy  string    `json:"decided_by"`
	Rationale  string    `json:"rationale"`
	CreatedAt  time.Time `json:"created_at"`
}

type CreateOrganizationRequest struct {
	LegalName          string `json:"legal_name"`
	TradingName        string `json:"trading_name,omitempty"`
	CountryCode        string `json:"country_code"`
	OrganizationType   string `json:"organization_type"`
	RegistrationNumber string `json:"registration_number,omitempty"`
}

type CreateMembershipRequest struct {
	UserID        string `json:"user_id,omitempty"`
	OperatorEmail string `json:"operator_email,omitempty"`
	Role          string `json:"role"`
	Active        *bool  `json:"active,omitempty"`
}

type UpdateMembershipRequest struct {
	Role   string `json:"role,omitempty"`
	Active *bool  `json:"active,omitempty"`
}

type CreateVerificationRequest struct {
	OrganizationID   string `json:"organization_id,omitempty"`
	UserID           string `json:"user_id,omitempty"`
	VerificationType string `json:"verification_type"`
	Reference        string `json:"reference"`
	EvidenceLabel    string `json:"evidence_label,omitempty"`
}

type CreateReviewRequest struct {
	OrganizationID string `json:"organization_id"`
	Reason         string `json:"reason"`
}

type DecideReviewRequest struct {
	Status    string `json:"status"`
	Rationale string `json:"rationale"`
}

type DecideVerificationRequest struct {
	Status    string `json:"status"`
	Rationale string `json:"rationale"`
}

type CreateRiskFlagRequest struct {
	Code        string `json:"code"`
	Severity    string `json:"severity"`
	Description string `json:"description"`
}

type ResolveRiskFlagRequest struct {
	Resolution string `json:"resolution"`
}

type CreateReviewNoteRequest struct {
	Note string `json:"note"`
}
