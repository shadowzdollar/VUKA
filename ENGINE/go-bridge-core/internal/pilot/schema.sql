-- Phase 6 supervised pilot control plane. All records are local/sandbox
-- metadata and observations; no settlement or provider side effects exist.
CREATE TABLE IF NOT EXISTS pilot_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id VARCHAR(120) UNIQUE NOT NULL,
    corridor_id VARCHAR(80) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    environment VARCHAR(16) NOT NULL CHECK (environment IN ('local','sandbox')),
    scope TEXT NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    amount_limit_minor BIGINT NOT NULL CHECK (amount_limit_minor > 0),
    transaction_limit_minor BIGINT NOT NULL CHECK (transaction_limit_minor > 0),
    daily_limit_minor BIGINT NOT NULL CHECK (daily_limit_minor > 0),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    owner VARCHAR(255) NOT NULL,
    support_owner VARCHAR(255) NOT NULL,
    incident_owner VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    required_approvals INTEGER NOT NULL DEFAULT 2 CHECK (required_approvals >= 2),
    kill_switch BOOLEAN NOT NULL DEFAULT TRUE,
    observation_only BOOLEAN NOT NULL DEFAULT TRUE,
    live_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_at > start_at),
    CHECK (transaction_limit_minor <= amount_limit_minor),
    CHECK (daily_limit_minor >= transaction_limit_minor),
    CHECK (observation_only = TRUE AND live_enabled = FALSE)
);
CREATE TABLE IF NOT EXISTS pilot_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    kyc_status VARCHAR(32) NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL,
    terms_version VARCHAR(80) NOT NULL,
    metadata TEXT NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'allowlisted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((organization_id IS NOT NULL) <> (user_id IS NOT NULL)),
    UNIQUE(pilot_id, organization_id),
    UNIQUE(pilot_id, user_id)
);
CREATE TABLE IF NOT EXISTS pilot_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    approver VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('approved','rejected')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(pilot_id, approver)
);
CREATE TABLE IF NOT EXISTS pilot_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    expected TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(pilot_id, code)
);
CREATE TABLE IF NOT EXISTS pilot_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES pilot_scenarios(id) ON DELETE CASCADE,
    runner VARCHAR(255) NOT NULL,
    observed TEXT NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    evidence_ref VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS pilot_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    metric VARCHAR(120) NOT NULL,
    value TEXT NOT NULL,
    unit VARCHAR(40),
    observed_by VARCHAR(255) NOT NULL,
    evidence_ref VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pilot_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
    kind VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    owner VARCHAR(255) NOT NULL,
    resolution TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS pilot_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID REFERENCES pilot_programs(id) ON DELETE SET NULL,
    actor VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pilot_participants_pilot_idx ON pilot_participants(pilot_id, created_at);
CREATE INDEX IF NOT EXISTS pilot_audit_pilot_idx ON pilot_audit_events(pilot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pilot_observations_pilot_idx ON pilot_observations(pilot_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS pilot_incidents_pilot_idx ON pilot_incidents(pilot_id, opened_at DESC);

CREATE OR REPLACE FUNCTION prevent_pilot_history_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pilot history is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pilot_approvals_append_only ON pilot_approvals;
CREATE TRIGGER pilot_approvals_append_only BEFORE UPDATE OR DELETE ON pilot_approvals
FOR EACH ROW EXECUTE FUNCTION prevent_pilot_history_mutation();
DROP TRIGGER IF EXISTS pilot_runs_append_only ON pilot_runs;
CREATE TRIGGER pilot_runs_append_only BEFORE UPDATE OR DELETE ON pilot_runs
FOR EACH ROW EXECUTE FUNCTION prevent_pilot_history_mutation();
DROP TRIGGER IF EXISTS pilot_observations_append_only ON pilot_observations;
CREATE TRIGGER pilot_observations_append_only BEFORE UPDATE OR DELETE ON pilot_observations
FOR EACH ROW EXECUTE FUNCTION prevent_pilot_history_mutation();
DROP TRIGGER IF EXISTS pilot_incidents_append_only ON pilot_incidents;
CREATE TRIGGER pilot_incidents_append_only BEFORE UPDATE OR DELETE ON pilot_incidents
FOR EACH ROW EXECUTE FUNCTION prevent_pilot_history_mutation();
DROP TRIGGER IF EXISTS pilot_audit_append_only ON pilot_audit_events;
CREATE TRIGGER pilot_audit_append_only BEFORE UPDATE OR DELETE ON pilot_audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_pilot_history_mutation();
