-- VUKA v2 chain reconciliation tables.
-- Apply event rows and the derived escrow update in one database transaction.

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
