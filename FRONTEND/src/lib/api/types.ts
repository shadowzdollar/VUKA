/**
 * Wire types for the VUKA Go engine. Field names are the engine's JSON keys (snake_case).
 * Source of truth: ENGINE/go-bridge-core/internal/**\/models.go. Where a Go struct has no
 * json tags (reconciliation metrics, settlement policy) the keys are PascalCase.
 */

// ---- Auth ----------------------------------------------------------------------------------
export interface TraderSession {
  id: string;
  full_name: string;
  phone_number: string;
  kyc_status: string;
}

export type OperatorRole = "operator" | "arbiter";

export interface OperatorSession {
  email: string;
  role: OperatorRole;
}

// ---- Ledger --------------------------------------------------------------------------------
export type AccountType = "PERSONAL" | "BUSINESS" | "SETTLEMENT" | "FEES";
export type TransferStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REVERSED";

export interface User {
  id: string;
  full_name: string;
  phone_number: string;
  business_reg_number?: string;
  kyc_status: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  type: AccountType;
  currency: string;
  created_at: string;
}

export interface Balance {
  account_id: string;
  type: AccountType;
  currency: string;
  amount: number;
}

export interface Transfer {
  id: string;
  idempotency_key: string;
  invoice_number?: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  fx_rate?: number;
  status: TransferStatus;
  external_reference?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

/** Negative amount = debit, positive = credit. */
export interface LedgerEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  amount: number;
  created_at: string;
}

export interface StatementEntry extends LedgerEntry {
  transfer_status: string;
  invoice_number?: string;
  reference?: string;
}

/** `GET /api/accounts/{id}/statement?format=json` — see also `ledger.statementXmlUrl` for the
 * ISO 20022 camt.053 download, which the engine returns by default (no `format` param). */
export interface Statement {
  account: Account;
  from: string;
  to: string;
  opening_balance: number;
  closing_balance: number;
  entries: StatementEntry[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  issuer_user_id: string;
  issuer_name: string;
  counterparty_user_id: string;
  counterparty_name: string;
  currency: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  terms?: string;
  notes?: string;
  status: "PAID" | "ISSUED" | "DRAFT" | string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  number: string;
  counterparty_user_id: string;
  currency: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  terms?: string;
  notes?: string;
  items: { description: string; quantity: number; unit_price: number }[];
}

export interface Recipient {
  user: { id: string; full_name: string; phone_number: string };
  accounts: Account[];
}

// ---- Corridors, quotes, providers ----------------------------------------------------------
export interface FxQuote {
  /** Source-currency units per ONE destination unit (the ledger convention). */
  rate: number;
  /** Destination units per ONE source unit — "1 RWF = x KES". */
  inverse_rate: number;
  source: string;
  quote_id: string;
  quoted_at: string;
  expires_at: string;
  markup_bps: number;
}

export interface Corridor {
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
  fx: FxQuote;
}

export interface Quote {
  id: string;
  corridor_id: string;
  provider_id: string;
  source_amount_minor: number;
  fee_minor: number;
  deliver_amount_minor: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  inverse_rate: number;
  rate_convention: "source_per_destination";
  rate_source: string;
  quoted_at: string;
  expires_at: string;
  observation_only: boolean;
}

export interface QuoteResponse {
  quote: Quote;
  execution: "disabled" | "local_synthetic";
  observation_only: boolean;
}

export interface ProviderStatus {
  config: {
    id: string;
    display_name: string;
    contract_version: string;
    environment: string;
    enabled: boolean;
    kill_switch: boolean;
    external_calls: boolean;
    supported_countries: string[];
    supported_currencies: string[];
  };
  adapter_ready: boolean;
  healthy: boolean;
  last_checked: string;
  reason?: string;
}

export interface WebhookEvent {
  id: string;
  provider_id: string;
  event_type: string;
  state: string;
  replay_key: string;
  authenticated: boolean;
  received_at: string;
  settlement_action: string;
}

export interface ProviderReconciliation {
  provider_id: string;
  corridor_id: string;
  state: string;
  last_event_at: string;
  open_items: number;
  checked_at: string;
}

// ---- Transaction workflow ------------------------------------------------------------------
export type WorkflowState =
  | "CREATED"
  | "QUOTED"
  | "COLLECTION_PENDING"
  | "COLLECTED"
  | "LEDGER_POSTED"
  | "PAYOUT_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REQUIRES_REVIEW";

export interface Workflow {
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
  state: WorkflowState;
  failed_step?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  workflow_id: string;
  sequence: number;
  from_state: string;
  to_state: string;
  step?: string;
  reason?: string;
  created_at: string;
}

export interface CreateWorkflowInput {
  source_account_id: string;
  destination_account_id: string;
  collection_phone: string;
  payout_phone: string;
  corridor_id: string;
  quote_id: string;
  amount: number;
  currency_from: string;
  currency_to: string;
  rate: number;
  provider_authorization_ref?: string;
  collection_provider?: string;
  payout_provider?: string;
}

// ---- Support -------------------------------------------------------------------------------
export type TicketStatus = "open" | "pending" | "closed";

export interface SupportTicket {
  id: string;
  trader_id: string;
  subject: string;
  description: string;
  priority: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  trader_id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  created_at: string;
  read_at?: string;
}

// ---- Operator: activity, reconciliation, escrows, disputes -----------------------------------
export interface Activity {
  id: string;
  actor: string;
  role: string;
  action: string;
  resource?: string;
  details?: string;
  created_at: string;
}

export type EscrowState = "CREATED" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED" | "SPLIT";

export interface EscrowSummary {
  chain_id: number;
  contract_address: string;
  escrow_id: number;
  buyer: string;
  supplier: string;
  /** Token base units, as a decimal string. */
  amount: string;
  /** Unix seconds. */
  timeout_at: number;
  invoice_ref: string;
  state: EscrowState;
  updated_block: number;
}

export interface EscrowEvent {
  chain_id: number;
  contract_address: string;
  transaction_hash: string;
  log_index: number;
  block_number: number;
  block_hash: string;
  escrow_id: number;
  event_type: string;
  payload: unknown;
  observed_at: string;
}

export interface ReconciliationStatus {
  metrics: { Polls: number; SuccessfulPolls: number; EventsApplied: number; Errors: number };
  cursor: number;
  latest_block: number;
  finalized_block: number;
  lag_blocks: number;
  warning_lag_blocks: number;
  critical_lag_blocks: number;
  alert_level: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledged_level?: string;
  acknowledged_message?: string;
}

export interface Dispute {
  id: string;
  chain_id: number;
  contract_address: string;
  escrow_id: number;
  raised_transaction_hash: string;
  raised_log_index: number;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export interface DisputeReview {
  id: string;
  dispute_id: string;
  reviewer_email: string;
  note: string;
  created_at: string;
}

export interface DisputeDecision {
  id: string;
  dispute_id: string;
  decision: "RELEASE" | "REFUND";
  rationale: string;
  decided_by: string;
  created_at: string;
  approvals: { id: string; decision_id: string; approver_email: string; created_at: string }[];
}

export interface TimelineEntry {
  id: string;
  kind: string;
  actor?: string;
  summary: string;
  details?: string;
  created_at: string;
}

// ---- Operator: identity & compliance -------------------------------------------------------
export interface Organization {
  id: string;
  legal_name: string;
  trading_name?: string;
  country_code: string;
  organization_type: string;
  registration_number?: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  organization_id?: string;
  user_id?: string;
  verification_type: string;
  status: string;
  reference: string;
  evidence_label?: string;
  submitted_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ComplianceReview {
  id: string;
  organization_id: string;
  status: string;
  opened_by: string;
  reviewer?: string;
  reason: string;
  decision_notes?: string;
  version: number;
  created_at: string;
  decided_at?: string;
}

export interface RiskFlag {
  id: string;
  organization_id: string;
  code: string;
  severity: string;
  status: string;
  description: string;
  raised_by: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

// ---- Operator: settlements & pilots --------------------------------------------------------
export interface SettlementCommand {
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
  approved_at?: string;
  executed_at?: string;
}

export interface SettlementPolicy {
  GlobalKillSwitch: boolean;
  ReadOnly: boolean;
  ExecutionEnabled: boolean;
  RequiredApprovals: number;
  MaxAmountMinor: number;
  DailyLimitMinor: number;
  VelocityLimit: number;
}

export interface SettlementApproval {
  id: string;
  command_id: string;
  approver: string;
  role: string;
  decision: string;
  reason?: string;
  created_at: string;
}

export interface PreflightResult {
  command_id: string;
  passed: boolean;
  checks: { name: string; passed: boolean; required: boolean; explain: string }[];
  evaluated_at: string;
}

export interface Pilot {
  id: string;
  corridor_id: string;
  provider_id: string;
  environment: string;
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
  status: string;
  required_approvals: number;
  kill_switch: boolean;
  observation_only: boolean;
  live_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Platform: public config, KYC standing, limits, server trust score -------------------------
export interface PublicCountry {
  code: string;
  name: string;
  currency: string;
  region: string;
  provider_id: string;
  provider_name: string;
}

export interface KycLimits {
  per_txn_usd: number;
  daily_usd: number;
  monthly_usd: number;
}

export interface PublicConfig {
  api_version: string;
  environment: string;
  countries: PublicCountry[];
  currencies: string[];
  corridor_count: number;
  rate_convention: string;
  kyc_limits: Record<string, KycLimits> | null;
  chain: { enabled: boolean; chain_id: number; escrow_contract: string };
  features: Record<string, boolean>;
}

export interface Standing {
  kyc_status: string;
  limits: KycLimits;
  used_day_usd: number;
  used_month_usd: number;
}

export interface TraderVerification {
  id: string;
  verification_type: string;
  status: string;
  reference: string;
  evidence_label?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface TrustFactor {
  key: string;
  label: string;
  weight: number;
  value: number;
  confidence: number;
  detail: string;
}

export interface TrustResult {
  score: number;
  band: string;
  cycles_scored: number;
  factors: TrustFactor[];
  computed_at: string;
  method: string;
}

// ---- Analytics (server-side aggregates, USD-equivalent at reference rates) --------------------
export interface AnalyticsSlice {
  label: string;
  value_usd: number;
  count: number;
}

export interface AnalyticsDay {
  date: string;
  out_usd: number;
  in_usd: number;
  count: number;
  failed: number;
}

export interface AnalyticsBucket {
  label: string;
  min_usd: number;
  max_usd: number;
  count: number;
}

export interface AnalyticsFlow {
  from: string;
  to: string;
  volume_usd: number;
  count: number;
}

export interface AnalyticsTotals {
  sent_usd: number;
  received_usd: number;
  volume_usd: number;
  cash_in_usd: number;
  payments: number;
  payments_out: number;
  payments_in: number;
  succeeded: number;
  failed: number;
  reversed: number;
  success_rate: number;
  avg_payment_usd: number;
  largest_payment_usd: number;
  cross_currency_payments: number;
  active_traders?: number;
  new_traders?: number;
  total_traders?: number;
}

export interface AnalyticsReport {
  scope: "trader" | "platform";
  period_days: number;
  generated_at: string;
  rate_basis: string;
  totals: AnalyticsTotals;
  daily: AnalyticsDay[];
  currencies: AnalyticsSlice[];
  statuses: AnalyticsSlice[];
  histogram: AnalyticsBucket[];
  corridors: AnalyticsFlow[];
  counterparties?: { name: string; volume_usd: number; count: number }[];
  /** weekday (Mon = 0) x hour (UTC) */
  heatmap: number[][];
  kyc?: AnalyticsSlice[];
  workflows?: AnalyticsSlice[];
  providers?: {
    provider: string;
    total: number;
    succeeded: number;
    failed: number;
    success_rate: number;
  }[];
  tickets?: AnalyticsSlice[];
  settlements?: AnalyticsSlice[];
}
