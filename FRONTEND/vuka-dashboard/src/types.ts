export type EscrowState = "CREATED" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED";

export type Escrow = {
  chain_id: number;
  contract_address: string;
  escrow_id: number;
  buyer: string;
  supplier: string;
  amount: string;
  invoice_ref: string;
  state: EscrowState;
  updated_block: number;
};

export type ReconciliationStatus = {
  metrics: {
    Polls: number;
    SuccessfulPolls: number;
    EventsApplied: number;
    Errors: number;
  };
  cursor: number;
  latest_block: number;
  finalized_block: number;
  lag_blocks: number;
};

export type EscrowEvent = {
  chain_id: number;
  contract_address: string;
  transaction_hash: string;
  log_index: number;
  block_number: number;
  block_hash: string;
  escrow_id: number;
  event_type: string;
  payload: Record<string, unknown>;
  observed_at: string;
};

export type Operator = {
  email: string;
  role: string;
};
