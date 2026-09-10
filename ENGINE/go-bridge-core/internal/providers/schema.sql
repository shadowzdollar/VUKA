-- Phase 4 provider/corridor control-plane schema.
-- This stores configuration and webhook/reconciliation evidence only. It is
-- intentionally not connected to ledger settlement or blockchain writes.
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations(version) VALUES (4) ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS provider_configs (
    id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(160) NOT NULL,
    contract_version VARCHAR(16) NOT NULL,
    environment VARCHAR(16) NOT NULL CHECK (environment IN ('sandbox','simulated')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    kill_switch BOOLEAN NOT NULL DEFAULT false,
    secret_ref VARCHAR(255),
    endpoint VARCHAR(500),
    external_calls BOOLEAN NOT NULL DEFAULT false,
    supported_countries JSONB NOT NULL DEFAULT '[]',
    supported_currencies JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corridor_configs (
    id VARCHAR(80) PRIMARY KEY,
    from_country CHAR(2) NOT NULL,
    to_country CHAR(2) NOT NULL,
    from_currency CHAR(3) NOT NULL,
    to_currency CHAR(3) NOT NULL,
    provider_id VARCHAR(64) NOT NULL REFERENCES provider_configs(id),
    fees_bps INTEGER NOT NULL CHECK (fees_bps >= 0),
    fixed_fee_minor BIGINT NOT NULL CHECK (fixed_fee_minor >= 0),
    min_amount_minor BIGINT NOT NULL CHECK (min_amount_minor > 0),
    max_amount_minor BIGINT NOT NULL,
    daily_limit_minor BIGINT NOT NULL,
    liquidity_owner VARCHAR(160) NOT NULL,
    operations_owner VARCHAR(160) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    kill_switch BOOLEAN NOT NULL DEFAULT false,
    fx_quote JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (max_amount_minor >= min_amount_minor),
    CHECK (daily_limit_minor >= max_amount_minor)
);

CREATE TABLE IF NOT EXISTS provider_webhook_events (
    id VARCHAR(255) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL REFERENCES provider_configs(id),
    event_type VARCHAR(120),
    state VARCHAR(32) NOT NULL,
    replay_key VARCHAR(255) NOT NULL,
    authenticated BOOLEAN NOT NULL DEFAULT false,
    payload JSONB NOT NULL DEFAULT '{}',
    settlement_action VARCHAR(32) NOT NULL DEFAULT 'NOT_SETTLED',
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider_id, replay_key)
);
CREATE INDEX IF NOT EXISTS provider_webhook_events_received_idx ON provider_webhook_events(received_at DESC);

CREATE TABLE IF NOT EXISTS provider_reconciliation_status (
    provider_id VARCHAR(64) NOT NULL,
    corridor_id VARCHAR(80) NOT NULL DEFAULT '',
    state VARCHAR(32) NOT NULL,
    last_event_at TIMESTAMPTZ,
    open_items INTEGER NOT NULL DEFAULT 0,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(provider_id, corridor_id)
);

CREATE OR REPLACE FUNCTION prevent_provider_webhook_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'provider webhook evidence is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS provider_webhook_events_append_only ON provider_webhook_events;
CREATE TRIGGER provider_webhook_events_append_only
BEFORE UPDATE OR DELETE ON provider_webhook_events
FOR EACH ROW EXECUTE FUNCTION prevent_provider_webhook_mutation();
