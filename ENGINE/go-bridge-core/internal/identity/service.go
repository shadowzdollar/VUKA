package identity

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound          = errors.New("identity: record not found")
	ErrConflict          = errors.New("identity: conflict")
	ErrInvalid           = errors.New("identity: invalid request")
	ErrSelfApproval      = errors.New("identity: self approval is not allowed")
	ErrInvalidTransition = errors.New("identity: invalid compliance transition")
)

type Service struct{ pool *pgxpool.Pool }

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool} }

func (s *Service) CreateOrganization(ctx context.Context, req CreateOrganizationRequest) (*Organization, error) {
	req.LegalName = strings.TrimSpace(req.LegalName)
	req.CountryCode = strings.ToUpper(strings.TrimSpace(req.CountryCode))
	req.OrganizationType = strings.ToLower(strings.TrimSpace(req.OrganizationType))
	if req.LegalName == "" || len(req.LegalName) > 200 || len(req.CountryCode) != 2 ||
		!validOrganizationType(req.OrganizationType) {
		return nil, fmt.Errorf("%w: legal_name, two-letter country_code, and organization_type are required", ErrInvalid)
	}
	var o Organization
	err := s.pool.QueryRow(ctx, `INSERT INTO organizations
		(legal_name,trading_name,country_code,organization_type,registration_number)
		VALUES ($1,NULLIF($2,''),$3,$4,NULLIF($5,'')) RETURNING id,legal_name,trading_name,
		country_code,organization_type,registration_number,verification_status,created_at,updated_at`,
		req.LegalName, strings.TrimSpace(req.TradingName), req.CountryCode, req.OrganizationType,
		strings.TrimSpace(req.RegistrationNumber)).Scan(&o.ID, &o.LegalName, &o.TradingName, &o.CountryCode,
		&o.OrganizationType, &o.RegistrationNumber, &o.VerificationStatus, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		if isUnique(err) {
			return nil, fmt.Errorf("%w: registration number already exists", ErrConflict)
		}
		return nil, fmt.Errorf("identity: create organization: %w", err)
	}
	return &o, nil
}

func (s *Service) GetOrganization(ctx context.Context, id string) (*Organization, error) {
	var o Organization
	err := s.pool.QueryRow(ctx, `SELECT id,legal_name,trading_name,country_code,organization_type,
		registration_number,verification_status,created_at,updated_at FROM organizations WHERE id=$1`, id).
		Scan(&o.ID, &o.LegalName, &o.TradingName, &o.CountryCode, &o.OrganizationType,
			&o.RegistrationNumber, &o.VerificationStatus, &o.CreatedAt, &o.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("identity: get organization: %w", err)
	}
	return &o, nil
}

func (s *Service) ListOrganizations(ctx context.Context, status string) ([]*Organization, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,legal_name,trading_name,country_code,organization_type,
		registration_number,verification_status,created_at,updated_at FROM organizations
		WHERE ($1='' OR verification_status=$1) ORDER BY created_at DESC`, strings.ToLower(strings.TrimSpace(status)))
	if err != nil {
		return nil, fmt.Errorf("identity: list organizations: %w", err)
	}
	defer rows.Close()
	var out []*Organization
	for rows.Next() {
		var o Organization
		if err := rows.Scan(&o.ID, &o.LegalName, &o.TradingName, &o.CountryCode, &o.OrganizationType, &o.RegistrationNumber, &o.VerificationStatus, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, &o)
	}
	return out, rows.Err()
}

func (s *Service) AddMembership(ctx context.Context, orgID string, req CreateMembershipRequest) (*Membership, error) {
	req.Role = strings.ToLower(strings.TrimSpace(req.Role))
	req.UserID = strings.TrimSpace(req.UserID)
	req.OperatorEmail = strings.ToLower(strings.TrimSpace(req.OperatorEmail))
	if (req.UserID == "") == (req.OperatorEmail == "") || !validMembershipRole(req.Role) {
		return nil, fmt.Errorf("%w: exactly one member and a role are required", ErrInvalid)
	}
	active := true
	if req.Active != nil {
		active = *req.Active
	}
	var operatorID *string
	if req.OperatorEmail != "" {
		var id string
		if err := s.pool.QueryRow(ctx, `SELECT id FROM operators WHERE email=$1`, req.OperatorEmail).Scan(&id); errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		} else if err != nil {
			return nil, err
		} else {
			operatorID = &id
		}
	}
	var m Membership
	err := s.pool.QueryRow(ctx, `INSERT INTO organization_memberships(organization_id,user_id,operator_id,role,active)
		VALUES($1,$2,$3,$4,$5) RETURNING id,organization_id,user_id,
		(SELECT email FROM operators WHERE id=organization_memberships.operator_id),role,active,created_at`,
		orgID, nullString(req.UserID), operatorID, req.Role, active).Scan(&m.ID, &m.OrganizationID, &m.UserID, &m.OperatorEmail, &m.Role, &m.Active, &m.CreatedAt)
	if err != nil {
		if isUnique(err) {
			return nil, fmt.Errorf("%w: membership already exists", ErrConflict)
		}
		if isForeign(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("identity: add membership: %w", err)
	}
	return &m, nil
}

func (s *Service) ListMemberships(ctx context.Context, orgID string) ([]*Membership, error) {
	rows, err := s.pool.Query(ctx, `SELECT m.id,m.organization_id,m.user_id,o.email,m.role,m.active,m.created_at
		FROM organization_memberships m LEFT JOIN operators o ON o.id=m.operator_id WHERE m.organization_id=$1 ORDER BY m.created_at`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Membership
	for rows.Next() {
		var m Membership
		if err := rows.Scan(&m.ID, &m.OrganizationID, &m.UserID, &m.OperatorEmail, &m.Role, &m.Active, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &m)
	}
	return out, rows.Err()
}

func (s *Service) UpdateMembership(ctx context.Context, orgID, membershipID string, req UpdateMembershipRequest) (*Membership, error) {
	if req.Active == nil && strings.TrimSpace(req.Role) == "" {
		return nil, fmt.Errorf("%w: active or role is required", ErrInvalid)
	}
	role := strings.ToLower(strings.TrimSpace(req.Role))
	if role != "" && !validMembershipRole(role) {
		return nil, fmt.Errorf("%w: invalid membership role", ErrInvalid)
	}
	var m Membership
	err := s.pool.QueryRow(ctx, `UPDATE organization_memberships m SET
		role=COALESCE(NULLIF($1,''),m.role), active=COALESCE($2,m.active)
		WHERE m.id=$3 AND m.organization_id=$4
		RETURNING m.id,m.organization_id,m.user_id,
		(SELECT email FROM operators WHERE id=m.operator_id),m.role,m.active,m.created_at`,
		role, req.Active, membershipID, orgID).Scan(&m.ID, &m.OrganizationID, &m.UserID, &m.OperatorEmail, &m.Role, &m.Active, &m.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Service) CreateVerification(ctx context.Context, req CreateVerificationRequest, submittedBy string) (*Verification, error) {
	req.VerificationType = strings.ToLower(strings.TrimSpace(req.VerificationType))
	req.Reference = strings.TrimSpace(req.Reference)
	if req.VerificationType == "" || !validVerificationType(req.VerificationType) ||
		(req.OrganizationID == "") == (req.UserID == "") || !MetadataReferenceAllowed(req.Reference, req.EvidenceLabel) || submittedBy == "" {
		return nil, fmt.Errorf("%w: one subject and a reference are required", ErrInvalid)
	}
	var v Verification
	err := s.pool.QueryRow(ctx, `INSERT INTO identity_verifications(organization_id,user_id,verification_type,reference,evidence_label,submitted_by)
		VALUES($1,$2,$3,$4,NULLIF($5,''),$6) RETURNING id,organization_id,user_id,verification_type,status,reference,evidence_label,submitted_by,reviewed_by,reviewed_at,created_at`,
		nullString(req.OrganizationID), nullString(req.UserID), req.VerificationType, req.Reference, strings.TrimSpace(req.EvidenceLabel), submittedBy).
		Scan(&v.ID, &v.OrganizationID, &v.UserID, &v.VerificationType, &v.Status, &v.Reference, &v.EvidenceLabel, &v.SubmittedBy, &v.ReviewedBy, &v.ReviewedAt, &v.CreatedAt)
	if err != nil {
		if isForeign(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("identity: create verification: %w", err)
	}
	eligibleAt := v.CreatedAt.Add(time.Duration(DefaultRetentionPolicy.VerificationMetadataDays) * 24 * time.Hour)
	if _, err := s.pool.Exec(ctx, `INSERT INTO identity_retention_metadata
		(verification_id,retention_class,deletion_eligible_at) VALUES($1,$2,$3)
		ON CONFLICT (verification_id) DO NOTHING`, v.ID, "verification_metadata", eligibleAt); err != nil {
		return nil, fmt.Errorf("identity: record retention metadata: %w", err)
	}
	return &v, nil
}

func (s *Service) ListVerifications(ctx context.Context, orgID, userID string) ([]*Verification, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,organization_id,user_id,verification_type,status,reference,evidence_label,submitted_by,reviewed_by,reviewed_at,created_at
		FROM identity_verifications
		WHERE ($1 = '' OR organization_id = NULLIF($1, '')::uuid)
		  AND ($2 = '' OR user_id = NULLIF($2, '')::uuid)
		ORDER BY created_at DESC`, orgID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Verification
	for rows.Next() {
		var v Verification
		if err := rows.Scan(&v.ID, &v.OrganizationID, &v.UserID, &v.VerificationType, &v.Status, &v.Reference, &v.EvidenceLabel, &v.SubmittedBy, &v.ReviewedBy, &v.ReviewedAt, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &v)
	}
	return out, rows.Err()
}

func (s *Service) DecideVerification(ctx context.Context, verificationID, reviewer string, req DecideVerificationRequest) (*Verification, error) {
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	req.Rationale = strings.TrimSpace(req.Rationale)
	if reviewer == "" || req.Rationale == "" || (req.Status != "verified" && req.Status != "rejected" && req.Status != "expired") {
		return nil, fmt.Errorf("%w: status and rationale are required", ErrInvalid)
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	var v Verification
	err = tx.QueryRow(ctx, `SELECT id,organization_id,user_id,verification_type,status,reference,
		evidence_label,submitted_by,reviewed_by,reviewed_at,created_at
		FROM identity_verifications WHERE id=$1 FOR UPDATE`, verificationID).
		Scan(&v.ID, &v.OrganizationID, &v.UserID, &v.VerificationType, &v.Status, &v.Reference,
			&v.EvidenceLabel, &v.SubmittedBy, &v.ReviewedBy, &v.ReviewedAt, &v.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if strings.EqualFold(v.SubmittedBy, reviewer) {
		return nil, ErrSelfApproval
	}
	if v.Status != "pending" {
		return nil, fmt.Errorf("%w: verification is already decided", ErrConflict)
	}
	now := time.Now().UTC()
	if _, err := tx.Exec(ctx, `INSERT INTO identity_verification_decisions
		(verification_id,from_status,to_status,decided_by,rationale) VALUES($1,$2,$3,$4,$5)`,
		verificationID, v.Status, req.Status, reviewer, req.Rationale); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE identity_verifications SET status=$1,reviewed_by=$2,reviewed_at=$3 WHERE id=$4`,
		req.Status, reviewer, now, verificationID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	v.Status = req.Status
	v.ReviewedBy = &reviewer
	v.ReviewedAt = &now
	return &v, nil
}

func (s *Service) ListVerificationDecisions(ctx context.Context, verificationID string) ([]*VerificationDecision, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,verification_id,from_status,to_status,decided_by,rationale,created_at
		FROM identity_verification_decisions WHERE verification_id=$1 ORDER BY created_at`, verificationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*VerificationDecision
	for rows.Next() {
		var d VerificationDecision
		if err := rows.Scan(&d.ID, &d.VerificationID, &d.FromStatus, &d.ToStatus, &d.DecidedBy, &d.Rationale, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &d)
	}
	return out, rows.Err()
}

func (s *Service) CreateReview(ctx context.Context, req CreateReviewRequest, openedBy string) (*Review, error) {
	req.Reason = strings.TrimSpace(req.Reason)
	if req.OrganizationID == "" || req.Reason == "" || openedBy == "" {
		return nil, fmt.Errorf("%w: organization_id and reason are required", ErrInvalid)
	}
	var r Review
	err := s.pool.QueryRow(ctx, `INSERT INTO compliance_reviews(organization_id,reason,opened_by) VALUES($1,$2,$3)
		RETURNING id,organization_id,status,opened_by,reviewer,reason,decision_notes,version,created_at,decided_at`, req.OrganizationID, req.Reason, openedBy).
		Scan(&r.ID, &r.OrganizationID, &r.Status, &r.OpenedBy, &r.Reviewer, &r.Reason, &r.DecisionNotes, &r.Version, &r.CreatedAt, &r.DecidedAt)
	if err != nil {
		if isForeign(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("identity: create review: %w", err)
	}
	return &r, nil
}

func (s *Service) ListReviews(ctx context.Context, orgID, status string) ([]*Review, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,organization_id,status,opened_by,reviewer,reason,decision_notes,version,created_at,decided_at
		FROM compliance_reviews
		WHERE ($1 = '' OR organization_id = NULLIF($1, '')::uuid)
		  AND ($2 = '' OR status = $2)
		ORDER BY created_at DESC`, orgID, strings.ToLower(strings.TrimSpace(status)))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Review
	for rows.Next() {
		var r Review
		if err := rows.Scan(&r.ID, &r.OrganizationID, &r.Status, &r.OpenedBy, &r.Reviewer, &r.Reason, &r.DecisionNotes, &r.Version, &r.CreatedAt, &r.DecidedAt); err != nil {
			return nil, err
		}
		out = append(out, &r)
	}
	return out, rows.Err()
}

func (s *Service) DecideReview(ctx context.Context, reviewID, reviewer string, req DecideReviewRequest) (*Review, *Decision, error) {
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	req.Rationale = strings.TrimSpace(req.Rationale)
	if reviewer == "" || req.Rationale == "" || !validStatus(req.Status) {
		return nil, nil, fmt.Errorf("%w: status and rationale are required", ErrInvalid)
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback(ctx)
	var r Review
	err = tx.QueryRow(ctx, `SELECT id,organization_id,status,opened_by,reviewer,reason,decision_notes,version,created_at,decided_at FROM compliance_reviews WHERE id=$1 FOR UPDATE`, reviewID).
		Scan(&r.ID, &r.OrganizationID, &r.Status, &r.OpenedBy, &r.Reviewer, &r.Reason, &r.DecisionNotes, &r.Version, &r.CreatedAt, &r.DecidedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, ErrNotFound
	}
	if err != nil {
		return nil, nil, err
	}
	if strings.EqualFold(r.OpenedBy, reviewer) {
		return nil, nil, ErrSelfApproval
	}
	if !allowedTransition(r.Status, req.Status) {
		return nil, nil, fmt.Errorf("%w: %s to %s", ErrInvalidTransition, r.Status, req.Status)
	}
	now := time.Now().UTC()
	var d Decision
	err = tx.QueryRow(ctx, `INSERT INTO compliance_decisions(review_id,from_status,to_status,decided_by,rationale) VALUES($1,$2,$3,$4,$5)
		RETURNING id,review_id,from_status,to_status,decided_by,rationale,created_at`, r.ID, r.Status, req.Status, reviewer, req.Rationale).
		Scan(&d.ID, &d.ReviewID, &d.FromStatus, &d.ToStatus, &d.DecidedBy, &d.Rationale, &d.CreatedAt)
	if err != nil {
		return nil, nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE compliance_reviews SET status=$1,reviewer=$2,decision_notes=$3,version=version+1,decided_at=$4 WHERE id=$5`, req.Status, reviewer, req.Rationale, now, r.ID)
	if err != nil {
		return nil, nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE organizations SET verification_status=$1,updated_at=$2 WHERE id=$3`, req.Status, now, r.OrganizationID)
	if err != nil {
		return nil, nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, nil, err
	}
	r.Status = req.Status
	r.Reviewer = &reviewer
	r.DecisionNotes = &req.Rationale
	r.Version++
	r.DecidedAt = &now
	return &r, &d, nil
}

func (s *Service) AddRiskFlag(ctx context.Context, orgID string, req CreateRiskFlagRequest, actor string) (*RiskFlag, error) {
	req.Code = strings.TrimSpace(req.Code)
	req.Severity = strings.ToLower(strings.TrimSpace(req.Severity))
	req.Description = strings.TrimSpace(req.Description)
	if req.Code == "" || req.Description == "" || actor == "" || !validSeverity(req.Severity) {
		return nil, fmt.Errorf("%w: code, severity and description are required", ErrInvalid)
	}
	var f RiskFlag
	err := s.pool.QueryRow(ctx, `INSERT INTO compliance_risk_flags(organization_id,code,severity,description,raised_by)
		VALUES($1,$2,$3,$4,$5) RETURNING id,organization_id,code,severity,status,description,raised_by,resolved_by,created_at,resolved_at`, orgID, req.Code, req.Severity, req.Description, actor).
		Scan(&f.ID, &f.OrganizationID, &f.Code, &f.Severity, &f.Status, &f.Description, &f.RaisedBy, &f.ResolvedBy, &f.CreatedAt, &f.ResolvedAt)
	if err != nil {
		if isForeign(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &f, nil
}

func (s *Service) ListRiskFlags(ctx context.Context, orgID, status string) ([]*RiskFlag, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,organization_id,code,severity,status,description,raised_by,resolved_by,created_at,resolved_at FROM compliance_risk_flags WHERE organization_id=$1 AND ($2='' OR status=$2) ORDER BY created_at DESC`, orgID, strings.ToLower(status))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*RiskFlag
	for rows.Next() {
		var f RiskFlag
		if err := rows.Scan(&f.ID, &f.OrganizationID, &f.Code, &f.Severity, &f.Status, &f.Description, &f.RaisedBy, &f.ResolvedBy, &f.CreatedAt, &f.ResolvedAt); err != nil {
			return nil, err
		}
		out = append(out, &f)
	}
	return out, rows.Err()
}

func (s *Service) ResolveRiskFlag(ctx context.Context, orgID, flagID, actor, resolution string) (*RiskFlag, error) {
	resolution = strings.TrimSpace(resolution)
	if actor == "" || resolution == "" {
		return nil, fmt.Errorf("%w: resolution is required", ErrInvalid)
	}
	now := time.Now().UTC()
	var f RiskFlag
	err := s.pool.QueryRow(ctx, `UPDATE compliance_risk_flags SET status='resolved',
		resolved_by=$1,resolved_at=$2,description=description || E'\nResolution: ' || $3
		WHERE id=$4 AND organization_id=$5 AND status='open'
		RETURNING id,organization_id,code,severity,status,description,raised_by,resolved_by,created_at,resolved_at`,
		actor, now, resolution, flagID, orgID).Scan(&f.ID, &f.OrganizationID, &f.Code, &f.Severity, &f.Status,
		&f.Description, &f.RaisedBy, &f.ResolvedBy, &f.CreatedAt, &f.ResolvedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConflict
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (s *Service) AddReviewNote(ctx context.Context, reviewID, author, note string) (*ReviewNote, error) {
	note = strings.TrimSpace(note)
	if note == "" || author == "" {
		return nil, fmt.Errorf("%w: note is required", ErrInvalid)
	}
	var n ReviewNote
	err := s.pool.QueryRow(ctx, `INSERT INTO compliance_review_notes(review_id,author_email,note) VALUES($1,$2,$3) RETURNING id,review_id,author_email,note,created_at`, reviewID, author, note).Scan(&n.ID, &n.ReviewID, &n.Author, &n.Note, &n.CreatedAt)
	if err != nil {
		if isForeign(err) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &n, nil
}
func (s *Service) ListReviewNotes(ctx context.Context, reviewID string) ([]*ReviewNote, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,review_id,author_email,note,created_at FROM compliance_review_notes WHERE review_id=$1 ORDER BY created_at`, reviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*ReviewNote
	for rows.Next() {
		var n ReviewNote
		if err := rows.Scan(&n.ID, &n.ReviewID, &n.Author, &n.Note, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &n)
	}
	return out, rows.Err()
}
func (s *Service) ListDecisions(ctx context.Context, reviewID string) ([]*Decision, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,review_id,from_status,to_status,decided_by,rationale,created_at FROM compliance_decisions WHERE review_id=$1 ORDER BY created_at`, reviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*Decision
	for rows.Next() {
		var d Decision
		if err := rows.Scan(&d.ID, &d.ReviewID, &d.FromStatus, &d.ToStatus, &d.DecidedBy, &d.Rationale, &d.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &d)
	}
	return out, rows.Err()
}

func validStatus(s string) bool {
	switch s {
	case StatusPending, StatusApproved, StatusRejected, StatusSuspended, StatusNeedsInformation:
		return true
	}
	return false
}
func allowedTransition(from, to string) bool {
	if from == to {
		return false
	}
	switch from {
	case StatusPending:
		return true
	case StatusNeedsInformation:
		return to == StatusPending || to == StatusRejected || to == StatusSuspended
	case StatusApproved:
		return to == StatusSuspended || to == StatusNeedsInformation
	case StatusRejected:
		return to == StatusPending
	case StatusSuspended:
		return to == StatusPending || to == StatusApproved
	}
	return false
}
func validSeverity(s string) bool {
	return s == "low" || s == "medium" || s == "high" || s == "critical"
}

func validMembershipRole(s string) bool {
	switch s {
	case "owner", "admin", "reviewer", "viewer", "member":
		return true
	default:
		return false
	}
}

func validOrganizationType(s string) bool {
	switch s {
	case "company", "sole_trader", "partnership", "cooperative", "nonprofit":
		return true
	default:
		return false
	}
}

func validVerificationType(s string) bool {
	switch s {
	case "identity", "business", "address", "ownership":
		return true
	default:
		return false
	}
}
func nullString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
func isUnique(err error) bool  { var e *pgconn.PgError; return errors.As(err, &e) && e.Code == "23505" }
func isForeign(err error) bool { var e *pgconn.PgError; return errors.As(err, &e) && e.Code == "23503" }
