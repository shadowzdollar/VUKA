-- VUKA v2 chain reconciliation tables.
-- Apply event rows and the derived escrow update in one database transaction.

CREATE TABLE IF NOT EXISTS reconciliation_schema (
    name VARCHAR(64) PRIMARY KEY,
    version INTEGER NOT NULL CHECK (version >= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrows (
    chain_id BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    escrow_id BIGINT NOT NULL CHECK (escrow_id >= 0),
    buyer_address VARCHAR(42) NOT NULL,
    supplier_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL CHECK (amount > 0),
    invoice_ref VARCHAR(255) NOT NULL,
    state VARCHAR(12) NOT NULL CHECK (state IN ('CREATED', 'LOCKED', 'RELEASED', 'REFUNDED', 'DISPUTED')),
    updated_block BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, contract_address, escrow_id)
);

CREATE TABLE IF NOT EXISTS chain_events (
    chain_id BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL CHECK (log_index >= 0),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    escrow_id BIGINT NOT NULL CHECK (escrow_id >= 0),
    event_type VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, contract_address, transaction_hash, log_index)
);

CREATE TABLE IF NOT EXISTS reconciliation_cursors (
    chain_id BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    next_block BIGINT NOT NULL CHECK (next_block >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, contract_address)
);

CREATE TABLE IF NOT EXISTS canonical_blocks (
    chain_id BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    block_number BIGINT NOT NULL CHECK (block_number >= 0),
    block_hash VARCHAR(66) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chain_id, contract_address, block_number)
);

CREATE INDEX IF NOT EXISTS idx_chain_events_escrow
    ON chain_events (chain_id, contract_address, escrow_id, block_number, log_index);

CREATE TABLE IF NOT EXISTS escrow_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    escrow_id BIGINT NOT NULL,
    raised_transaction_hash VARCHAR(66) NOT NULL,
    raised_log_index INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    UNIQUE (chain_id, contract_address, escrow_id, raised_transaction_hash, raised_log_index)
);

CREATE TABLE IF NOT EXISTS dispute_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES escrow_disputes(id) ON DELETE CASCADE,
    reviewer_email VARCHAR(255) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispute_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES escrow_disputes(id) ON DELETE CASCADE,
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('RELEASE', 'REFUND')),
    rationale TEXT NOT NULL,
    decided_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dispute_id)
);

CREATE TABLE IF NOT EXISTS dispute_decision_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES dispute_decisions(id) ON DELETE CASCADE,
    approver_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (decision_id, approver_email)
);

CREATE INDEX IF NOT EXISTS idx_escrow_disputes_scope
    ON escrow_disputes (chain_id, contract_address, status, created_at);
