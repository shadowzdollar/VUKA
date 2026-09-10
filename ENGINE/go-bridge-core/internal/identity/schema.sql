-- Phase 3 local-only identity and compliance schema.
-- Evidence labels and references are metadata only: no document bytes or
-- external provider credentials are stored here.
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations(version) VALUES (3) ON CONFLICT (version) DO NOTHING;
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    role VARCHAR(32) NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(200) NOT NULL,
    trading_name VARCHAR(200),
    country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    organization_type VARCHAR(32) NOT NULL CHECK (organization_type IN ('company','sole_trader','partnership','cooperative','nonprofit')),
    registration_number VARCHAR(120),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending'
      CHECK (verification_status IN ('pending','approved','rejected','suspended','needs_information')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS organizations_registration_number_uq
  ON organizations(registration_number) WHERE registration_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner','admin','reviewer','viewer','member')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((user_id IS NOT NULL) <> (operator_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_user_membership_uq
  ON organization_memberships(organization_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organization_operator_membership_uq
  ON organization_memberships(organization_id, operator_id) WHERE operator_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(32) NOT NULL CHECK (verification_type IN ('identity','business','address','ownership')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','verified','rejected','expired')),
    reference VARCHAR(160) NOT NULL,
    evidence_label VARCHAR(160),
    submitted_by VARCHAR(255) NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((organization_id IS NOT NULL) <> (user_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS identity_verification_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES identity_verifications(id) ON DELETE CASCADE,
    from_status VARCHAR(32) NOT NULL,
    to_status VARCHAR(32) NOT NULL,
    decided_by VARCHAR(255) NOT NULL,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Retention metadata is policy state only; it is never a document store.
CREATE TABLE IF NOT EXISTS identity_retention_metadata (
    verification_id UUID PRIMARY KEY REFERENCES identity_verifications(id) ON DELETE CASCADE,
    retention_class VARCHAR(32) NOT NULL DEFAULT 'verification_metadata',
    deletion_eligible_at TIMESTAMPTZ,
    legal_hold BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','approved','rejected','suspended','needs_information')),
    opened_by VARCHAR(255) NOT NULL,
    reviewer VARCHAR(255),
    reason TEXT NOT NULL,
    decision_notes TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS compliance_review_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES compliance_reviews(id) ON DELETE CASCADE,
    author_email VARCHAR(255) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS compliance_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES compliance_reviews(id) ON DELETE CASCADE,
    from_status VARCHAR(32) NOT NULL,
    to_status VARCHAR(32) NOT NULL,
    decided_by VARCHAR(255) NOT NULL,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS compliance_risk_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
    description TEXT NOT NULL,
    raised_by VARCHAR(255) NOT NULL,
    resolved_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS compliance_reviews_org_created_idx ON compliance_reviews(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS identity_verifications_org_created_idx ON identity_verifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS identity_verification_decisions_verification_idx ON identity_verification_decisions(verification_id, created_at);
CREATE INDEX IF NOT EXISTS identity_retention_metadata_eligible_idx ON identity_retention_metadata(deletion_eligible_at) WHERE legal_hold = false;
CREATE INDEX IF NOT EXISTS compliance_risk_flags_org_status_idx ON compliance_risk_flags(organization_id, status);

CREATE OR REPLACE FUNCTION prevent_phase3_history_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'phase 3 history is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS compliance_decisions_append_only ON compliance_decisions;
CREATE TRIGGER compliance_decisions_append_only BEFORE UPDATE OR DELETE ON compliance_decisions
FOR EACH ROW EXECUTE FUNCTION prevent_phase3_history_mutation();
DROP TRIGGER IF EXISTS compliance_review_notes_append_only ON compliance_review_notes;
CREATE TRIGGER compliance_review_notes_append_only BEFORE UPDATE OR DELETE ON compliance_review_notes
FOR EACH ROW EXECUTE FUNCTION prevent_phase3_history_mutation();
DROP TRIGGER IF EXISTS identity_verification_decisions_append_only ON identity_verification_decisions;
CREATE TRIGGER identity_verification_decisions_append_only BEFORE UPDATE OR DELETE ON identity_verification_decisions
FOR EACH ROW EXECUTE FUNCTION prevent_phase3_history_mutation();
