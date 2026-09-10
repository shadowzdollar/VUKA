CREATE TABLE IF NOT EXISTS transaction_workflows (
    id VARCHAR(80) PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    trader_id VARCHAR(120) NOT NULL,
    source_account_id VARCHAR(120) NOT NULL,
    destination_account_id VARCHAR(120) NOT NULL,
    corridor_id VARCHAR(80) NOT NULL,
    quote_id VARCHAR(120) NOT NULL,
    collection_provider VARCHAR(64) NOT NULL,
    payout_provider VARCHAR(64) NOT NULL,
    collection_execution_id VARCHAR(80),
    payout_execution_id VARCHAR(80),
    ledger_transfer_id VARCHAR(120),
    amount NUMERIC(18,4) NOT NULL CHECK (amount > 0),
    currency_from CHAR(3) NOT NULL,
    currency_to CHAR(3) NOT NULL,
    rate NUMERIC(18,8) NOT NULL CHECK (rate > 0),
    state VARCHAR(32) NOT NULL,
    failed_step VARCHAR(32),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transaction_workflows_trader_idx ON transaction_workflows(trader_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_workflows_state_idx ON transaction_workflows(state, updated_at DESC);

CREATE TABLE IF NOT EXISTS transaction_workflow_events (
    id VARCHAR(80) PRIMARY KEY,
    workflow_id VARCHAR(80) NOT NULL REFERENCES transaction_workflows(id),
    sequence BIGSERIAL NOT NULL,
    from_state VARCHAR(32) NOT NULL,
    to_state VARCHAR(32) NOT NULL,
    step VARCHAR(32),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workflow_id, sequence),
    UNIQUE(workflow_id, id)
);
CREATE INDEX IF NOT EXISTS transaction_workflow_events_workflow_idx ON transaction_workflow_events(workflow_id, sequence);

CREATE OR REPLACE FUNCTION prevent_transaction_workflow_event_mutation()
RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'transaction workflow events are append-only'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS transaction_workflow_events_append_only ON transaction_workflow_events;
CREATE TRIGGER transaction_workflow_events_append_only
BEFORE UPDATE OR DELETE ON transaction_workflow_events
FOR EACH ROW EXECUTE FUNCTION prevent_transaction_workflow_event_mutation();
