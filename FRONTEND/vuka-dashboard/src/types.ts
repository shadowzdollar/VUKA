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

export type Dispute = {
  id: string;
  chain_id: number;
  contract_address: string;
  escrow_id: number;
  raised_transaction_hash: string;
  raised_log_index: number;
  reason: string;
  status: "OPEN" | "RESOLVED";
  created_at: string;
  resolved_at?: string;
};

export type DisputeReview = {
  id: string;
  dispute_id: string;
  reviewer_email: string;
  note: string;
  created_at: string;
};

export type DisputeDecision = {
  id: string;
  dispute_id: string;
  decision: "RELEASE" | "REFUND";
  rationale: string;
  decided_by: string;
  created_at: string;
  approvals: DisputeDecisionApproval[];
};

export type DisputeDecisionApproval = {
  id: string;
  decision_id: string;
  approver_email: string;
  created_at: string;
};

export type DisputeTimelineEntry = {
  id: string;
  kind: "CHAIN_EVENT" | "REVIEW" | "RECOMMENDATION" | "APPROVAL";
  actor?: string;
  summary: string;
  details?: string;
  created_at: string;
};
