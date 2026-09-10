-- Durable provider execution evidence. This schema is intentionally separate
-- from ledger tables: provider retries and callbacks never mutate ledger rows.
CREATE TABLE IF NOT EXISTS provider_executions (
    id VARCHAR(80) PRIMARY KEY,
    transaction_id VARCHAR(120) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    operation VARCHAR(32) NOT NULL CHECK (operation IN ('PAYOUT','COLLECTION')),
    request_reference VARCHAR(255) NOT NULL,
    external_reference VARCHAR(255),
    state VARCHAR(32) NOT NULL CHECK (state IN ('PENDING','ACCEPTED','SUCCEEDED','FAILED','TIMEOUT')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, operation, request_reference)
);
CREATE INDEX IF NOT EXISTS provider_executions_transaction_idx
    ON provider_executions(transaction_id);
CREATE INDEX IF NOT EXISTS provider_executions_state_idx
    ON provider_executions(state, updated_at DESC);

CREATE TABLE IF NOT EXISTS provider_execution_events (
    id VARCHAR(80) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    replay_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(120),
    transaction_id VARCHAR(120),
    request_reference VARCHAR(255),
    external_reference VARCHAR(255),
    state VARCHAR(32) NOT NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}',
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, replay_key)
);
ALTER TABLE provider_execution_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(120);
CREATE INDEX IF NOT EXISTS provider_execution_events_transaction_idx
    ON provider_execution_events(transaction_id, received_at DESC);
CREATE INDEX IF NOT EXISTS provider_execution_events_received_idx
    ON provider_execution_events(received_at DESC);

CREATE OR REPLACE FUNCTION prevent_provider_execution_evidence_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'provider execution evidence is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS provider_execution_events_append_only ON provider_execution_events;
CREATE TRIGGER provider_execution_events_append_only
BEFORE UPDATE OR DELETE ON provider_execution_events
FOR EACH ROW EXECUTE FUNCTION prevent_provider_execution_evidence_mutation();
