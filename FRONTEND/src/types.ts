export type EscrowState = "CREATED" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED";

export type Escrow = {
  chain_id: number;
  contract_address: string;
  escrow_id: number;
  buyer: string;
  supplier: string;
  amount: string;
  timeout_at: number;
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
  warning_lag_blocks: number;
  critical_lag_blocks: number;
  alert_level: "ok" | "warning" | "critical";
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledged_level?: "warning" | "critical";
  acknowledged_message?: string;
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

export type Trader = {
  id: string;
  full_name: string;
  phone_number: string;
  kyc_status: string;
};

export type TraderAccount = {
  id: string;
  user_id: string;
  type: string;
  currency: string;
  created_at: string;
};

export type TraderRecipient = {
  user: { id: string; full_name: string; phone_number: string };
  accounts: TraderAccount[];
};

export type TraderBalance = {
  account_id: string;
  type: string;
  currency: string;
  amount: number;
};

export type TraderTransfer = {
  id: string;
  idempotency_key: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  invoice_number?: string;
  failure_reason?: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type TraderInvoice = {
  id: string;
  number: string;
  issuer_user_id: string;
  counterparty_user_id: string;
  currency: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  terms?: string;
  notes?: string;
  status: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
};

export type TraderQuote = {
  id: string;
  corridor_id: string;
  provider_id: string;
  source_amount_minor: number;
  fee_minor: number;
  deliver_amount_minor: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  quoted_at: string;
  expires_at: string;
  observation_only: boolean;
};

export type TransactionWorkflow = {
  id: string;
  idempotency_key: string;
  trader_id: string;
  source_account_id: string;
  destination_account_id: string;
  corridor_id: string;
  quote_id: string;
  collection_provider: string;
  payout_provider: string;
  collection_execution_id?: string;
  payout_execution_id?: string;
  ledger_transfer_id?: string;
  amount: number;
  currency_from: string;
  currency_to: string;
  rate: number;
  state: string;
  failed_step?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
};

export type SupportTicket = {
  id: string;
  trader_id: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  trader_id: string;
  severity?: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  read_at?: string;
  created_at: string;
};

export type Organization = {
  id: string;
  legal_name: string;
  trading_name?: string;
  country_code: string;
  organization_type: string;
  registration_number?: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended" | "needs_information";
  created_at: string;
  updated_at: string;
};

export type ComplianceReview = {
  id: string;
  organization_id: string;
  status: Organization["verification_status"];
  opened_by: string;
  reviewer?: string;
  reason: string;
  decision_notes?: string;
  version: number;
  created_at: string;
  decided_at?: string;
};

export type OperatorActivity = {
  id: string;
  actor: string;
  role: string;
  action: string;
  resource?: string;
  details?: string;
  created_at: string;
};

export type ProviderStatus = {
  config: {
    id: string;
    display_name: string;
    contract_version: string;
    environment: string;
    enabled: boolean;
    kill_switch: boolean;
  };
  adapter_ready: boolean;
  healthy: boolean;
  reason?: string;
  last_checked: string;
};

export type CorridorConfig = {
  id: string;
  from_country: string;
  to_country: string;
  from_currency: string;
  to_currency: string;
  provider_id: string;
  fees_bps: number;
  fixed_fee_minor: number;
  min_amount_minor: number;
  max_amount_minor: number;
  daily_limit_minor: number;
  liquidity_owner: string;
  operations_owner: string;
  kill_switch: boolean;
  enabled: boolean;
  fx: { rate: number; source: string; quote_id: string; quoted_at: string; expires_at: string };
};

export type ProviderWebhookEvent = {
  id: string;
  provider_id: string;
  event_type: string;
  state: string;
  replay_key: string;
  authenticated: boolean;
  received_at: string;
  settlement_action: string;
};

export type SettlementCommand = {
  id: string;
  action: string;
  target: string;
  provider_id: string;
  corridor_id: string;
  amount_minor: number;
  currency: string;
  reason: string;
  requested_by: string;
  approval_state: string;
  execution_state: string;
  status: string;
  idempotency_key: string;
  required_approvals: number;
  created_at: string;
  updated_at: string;
};

export type Pilot = {
  id: string;
  pilot_id: string;
  corridor_id: string;
  provider_id: string;
  environment: "local" | "sandbox";
  scope: string;
  max_participants: number;
  amount_limit_minor: number;
  transaction_limit_minor: number;
  daily_limit_minor: number;
  start_at: string;
  end_at: string;
  owner: string;
  support_owner: string;
  incident_owner: string;
  status: "draft" | "planned" | "approved" | "active" | "paused" | "completed" | "cancelled";
  required_approvals: number;
  kill_switch: boolean;
  observation_only: boolean;
  live_enabled: boolean;
  created_at: string;
  updated_at: string;
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
