-- Phase 5 controlled settlement control plane. This migration stores commands,
-- approvals, reconciliation observations, and audit only; it never moves funds.
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations(version) VALUES (5) ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS settlement_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(32) NOT NULL,
    target VARCHAR(255) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    corridor_id VARCHAR(80) NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL,
    reason TEXT NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    approval_state VARCHAR(32) NOT NULL DEFAULT 'pending',
    execution_state VARCHAR(32) NOT NULL DEFAULT 'not_started',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    required_approvals INTEGER NOT NULL DEFAULT 2 CHECK (required_approvals > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS settlement_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID NOT NULL REFERENCES settlement_commands(id) ON DELETE CASCADE,
    approver VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(command_id, approver)
);
CREATE TABLE IF NOT EXISTS settlement_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID NOT NULL REFERENCES settlement_commands(id) ON DELETE CASCADE,
    provider_reference VARCHAR(255),
    outcome VARCHAR(32) NOT NULL,
    detail TEXT,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settlement_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID REFERENCES settlement_commands(id) ON DELETE SET NULL,
    actor VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
