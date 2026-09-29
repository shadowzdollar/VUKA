import { api, newIdempotencyKey } from "./client";
import type {
  Account,
  Activity,
  Balance,
  AnalyticsReport,
  ComplianceReview,
  CreateInvoiceInput,
  CreateWorkflowInput,
  Corridor,
  Dispute,
  DisputeDecision,
  DisputeReview,
  EscrowEvent,
  EscrowSummary,
  Invoice,
  LedgerEntry,
  Notification,
  PublicConfig,
  Standing,
  TraderVerification,
  TrustResult,
  OperatorSession,
  Organization,
  Pilot,
  PreflightResult,
  ProviderReconciliation,
  ProviderStatus,
  QuoteResponse,
  ReconciliationStatus,
  Statement,
  Recipient,
  RiskFlag,
  SettlementApproval,
  SettlementCommand,
  SettlementPolicy,
  SupportTicket,
  TicketStatus,
  TimelineEntry,
  TraderSession,
  Transfer,
  User,
  Verification,
  WebhookEvent,
  Workflow,
  WorkflowEvent,
} from "./types";

// ---- Auth ----------------------------------------------------------------------------------
export const auth = {
  traderLogin: (phone: string, password: string) =>
    api.post<TraderSession>("/api/trader/auth/login", { phone, password }),
  traderLogout: () => api.post<{ status: string }>("/api/trader/auth/logout"),
  traderMe: () => api.get<TraderSession>("/api/trader/me"),
  operatorLogin: (email: string, password: string) =>
    api.post<{ status: string }>("/api/auth/login", { email, password }),
  operatorLogout: () => api.post<{ status: string }>("/api/auth/logout"),
  operatorMe: () => api.get<OperatorSession>("/api/auth/me"),
  /** Public: creates the trader, their PERSONAL + BUSINESS accounts and a login password. */
  register: (
    input: {
      full_name: string;
      phone_number: string;
      business_reg_number?: string;
      password: string;
    },
    currency: string,
  ) => api.post<{ user: User; accounts: Account[] }>("/api/users", input, { query: { currency } }),
};

// ---- Trader: ledger --------------------------------------------------------------------------
export const ledger = {
  accounts: (userId: string) =>
    api
      .get<{ accounts: Account[] | null }>(`/api/users/${userId}/accounts`)
      .then((r) => r.accounts ?? []),
  balance: (accountId: string) => api.get<Balance>(`/api/accounts/${accountId}/balance`),
  account: (accountId: string) => api.get<Account>(`/api/accounts/${accountId}`),
  /** JSON view of the same data the camt.053 download (`GET .../statement`, no `format` param)
   * carries — used for on-page rendering; the XML is for a trader to hand to their bank/auditor. */
  statement: (accountId: string, range: { from: string; to: string }) =>
    api.get<Statement>(`/api/accounts/${accountId}/statement`, { ...range, format: "json" }),
  transfers: (userId: string, filter?: { account_id?: string; status?: string }) =>
    api
      .get<{ transfers: Transfer[] | null }>(`/api/users/${userId}/transfers`, filter)
      .then((r) => r.transfers ?? []),
  transfer: (id: string) => api.get<Transfer>(`/api/transfers/${id}`),
  entries: (transferId: string) =>
    api
      .get<{ entries: LedgerEntry[] | null }>(`/api/transfers/${transferId}/entries`)
      .then((r) => r.entries ?? []),
  fund: (
    accountId: string,
    input: { amount: number; currency: string; reference?: string },
    key = newIdempotencyKey(),
  ) =>
    api.post<{ transfer: Transfer }>(`/api/accounts/${accountId}/fund`, input, {
      idempotencyKey: key,
    }),
  createTransfer: (
    input: {
      source_account_id: string;
      destination_account_id: string;
      amount: number;
      currency: string;
      invoice_number?: string;
    },
    key = newIdempotencyKey(),
  ) =>
    api.post<{ transfer: Transfer; replayed: boolean }>("/api/transfers", input, {
      idempotencyKey: key,
    }),
  /**
   * Book transfer across currencies through the FX settlement accounts. Unlike the provider
   * workflow this can carry an invoice number; the engine applies its own FX default when
   * `fx_rate` is omitted.
   */
  crossBorder: (
    input: {
      source_account_id: string;
      destination_account_id: string;
      amount: number;
      currency_from: string;
      currency_to: string;
      invoice_number?: string;
      quote_id?: string;
      corridor_id?: string;
    },
    key = newIdempotencyKey(),
  ) =>
    api.post<{ transfer: Transfer; replayed: boolean }>("/api/transfers/cross-border", input, {
      idempotencyKey: key,
    }),
  reverse: (transferId: string, reason: string) =>
    api.post<Transfer>(`/api/transfers/${transferId}/reverse`, { reason }),
  recipient: (phone: string) => api.get<Recipient>("/api/trader/recipients", { phone }),
};

// ---- Trader: invoices ------------------------------------------------------------------------
export const invoices = {
  list: (userId: string, direction?: "issued" | "received") =>
    api
      .get<{ invoices: Invoice[] | null }>(`/api/users/${userId}/invoices`, { direction })
      .then((r) => r.invoices ?? []),
  get: (id: string) => api.get<Invoice>(`/api/invoices/${id}`),
  create: (userId: string, input: CreateInvoiceInput) =>
    api.post<Invoice>(`/api/users/${userId}/invoices`, input),
};

// ---- Corridors, quotes, providers ------------------------------------------------------------
export const corridors = {
  list: () =>
    api.get<{ corridors: Corridor[] | null }>("/api/corridors").then((r) => r.corridors ?? []),
  quote: (corridorId: string, amountMinor: number) =>
    api.get<QuoteResponse>("/api/quotes", { corridor_id: corridorId, amount_minor: amountMinor }),
  fx: () => api.get<{ pair: string; rate: number; updated: string; source: string }>("/api/fx"),
  providers: () =>
    api
      .get<{ providers: ProviderStatus[] | null }>("/api/providers/status")
      .then((r) => r.providers ?? []),
  webhookEvents: () =>
    api
      .get<{ events: WebhookEvent[] | null }>("/api/providers/webhooks/events")
      .then((r) => r.events ?? []),
  reconciliation: () =>
    api
      .get<{ reconciliation: ProviderReconciliation[] | null }>("/api/providers/reconciliation")
      .then((r) => r.reconciliation ?? []),
};

// ---- Trader: workflows -----------------------------------------------------------------------
export const workflows = {
  /**
   * Starts a quote-bound collect → ledger → payout workflow. The engine answers 202 while the
   * workflow is in flight or needs review, and may embed `error` next to `workflow`.
   */
  start: (input: CreateWorkflowInput, key: string) =>
    api.post<{ workflow: Workflow; replay?: boolean; error?: string }>(
      "/api/transaction-workflows",
      input,
      { idempotencyKey: key },
    ),
  get: (id: string) => api.get<Workflow>(`/api/transaction-workflows/${id}`),
  events: (id: string) =>
    api
      .get<{ events: WorkflowEvent[] | null }>(`/api/transaction-workflows/${id}/events`)
      .then((r) => r.events ?? []),
  retry: (id: string, phone: string) =>
    api.post<Workflow | { workflow: Workflow; error?: string }>(
      `/api/transaction-workflows/${id}/retry`,
      { phone },
    ),
};

// ---- Trader: support -------------------------------------------------------------------------
export const support = {
  tickets: (status?: TicketStatus) =>
    api
      .get<{ tickets: SupportTicket[] | null }>("/api/support/tickets", { status })
      .then((r) => r.tickets ?? []),
  createTicket: (
    input: { subject: string; description: string; priority: string },
    key = newIdempotencyKey(),
  ) => api.post<{ ticket: SupportTicket }>("/api/support/tickets", input, { idempotencyKey: key }),
  setStatus: (id: string, status: TicketStatus) =>
    api.patch<{ ticket: SupportTicket }>(`/api/support/tickets/${id}`, { status }),
  notifications: () =>
    api
      .get<{ notifications: Notification[] | null }>("/api/notifications")
      .then((r) => r.notifications ?? []),
  markRead: (id: string, traderId: string) =>
    api.post<{ status: string }>(`/api/notifications/${id}/read`, undefined, {
      query: { trader_id: traderId },
    }),
};

// ---- Operator: audit + chain reconciliation --------------------------------------------------
export type ChainScope = {
  contract: string;
  chain_id?: number;
};

export const operator = {
  analytics: (days: number) => api.get<AnalyticsReport>("/api/operator/analytics", { days }),
  activity: (q: {
    limit?: number;
    offset?: number;
    action?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => api.get<{ activities: Activity[]; total: number }>("/api/activity", q),
  reconciliationStatus: (scope: ChainScope) =>
    api.get<ReconciliationStatus>("/api/reconciliation/status", scope),
  /** `level` and `message` must match the engine's current alert text exactly or it answers 409 stale_alert. */
  ackAlert: (scope: ChainScope, level: "warning" | "critical", message: string) =>
    api.post<unknown>("/api/reconciliation/alerts/ack", { ...scope, level, message }),
  escrows: (scope: ChainScope) =>
    api
      .get<{ escrows: EscrowSummary[] | null }>("/api/escrows", scope)
      .then((r) => r.escrows ?? []),
  escrowEvents: (id: number, scope: ChainScope) =>
    api
      .get<{ events: EscrowEvent[] | null }>(`/api/escrows/${id}/events`, scope)
      .then((r) => r.events ?? []),
  disputes: (scope: ChainScope, status?: string) =>
    api
      .get<{ disputes: Dispute[] | null }>("/api/disputes", { ...scope, status })
      .then((r) => r.disputes ?? []),
  disputeTimeline: (id: string) =>
    api
      .get<{ timeline: TimelineEntry[] | null }>(`/api/disputes/${id}/timeline`)
      .then((r) => r.timeline ?? []),
  disputeReviews: (id: string) =>
    api
      .get<{ reviews: DisputeReview[] | null }>(`/api/disputes/${id}/reviews`)
      .then((r) => r.reviews ?? []),
  addReview: (id: string, note: string) =>
    api.post<DisputeReview>(`/api/disputes/${id}/reviews`, { note }),
  disputeDecisions: (id: string) =>
    api
      .get<{ decisions: DisputeDecision[] | null }>(`/api/disputes/${id}/decisions`)
      .then((r) => r.decisions ?? []),
  recommend: (id: string, decision: "RELEASE" | "REFUND", rationale: string) =>
    api.post<DisputeDecision>(`/api/disputes/${id}/decision`, { decision, rationale }),
  approveDecision: (decisionId: string) =>
    api.post<unknown>(`/api/dispute-decisions/${decisionId}/approve`),
};

// ---- Operator: identity & compliance ----------------------------------------------------------
export const compliance = {
  organizations: () =>
    api
      .get<{ organizations: Organization[] | null }>("/api/organizations")
      .then((r) => r.organizations ?? []),
  createOrganization: (input: {
    legal_name: string;
    trading_name?: string;
    country_code: string;
    organization_type: string;
    registration_number?: string;
  }) => api.post<Organization>("/api/organizations", input),
  verifications: () =>
    api
      .get<{ verifications: Verification[] | null }>("/api/verifications")
      .then((r) => r.verifications ?? []),
  createVerification: (input: {
    organization_id?: string;
    user_id?: string;
    verification_type: string;
    reference: string;
    evidence_label?: string;
  }) => api.post<Verification>("/api/verifications", input),
  decideVerification: (id: string, status: string, rationale: string) =>
    api.post<Verification>(`/api/verifications/${id}/decision`, { status, rationale }),
  reviews: () =>
    api
      .get<{ reviews: ComplianceReview[] | null }>("/api/compliance/reviews")
      .then((r) => r.reviews ?? []),
  createReview: (organization_id: string, reason: string) =>
    api.post<ComplianceReview>("/api/compliance/reviews", { organization_id, reason }),
  decideReview: (id: string, status: string, rationale: string) =>
    api.post<{ review: ComplianceReview }>(`/api/compliance/reviews/${id}/decision`, {
      status,
      rationale,
    }),
  riskFlags: (orgId: string) =>
    api
      .get<{ risk_flags: RiskFlag[] | null }>(`/api/organizations/${orgId}/risk-flags`)
      .then((r) => r.risk_flags ?? []),
  addRiskFlag: (orgId: string, input: { code: string; severity: string; description: string }) =>
    api.post<RiskFlag>(`/api/organizations/${orgId}/risk-flags`, input),
  resolveRiskFlag: (orgId: string, flagId: string, resolution: string) =>
    api.post<RiskFlag>(`/api/organizations/${orgId}/risk-flags/${flagId}/resolve`, { resolution }),
};

// ---- Operator: settlements & pilots -----------------------------------------------------------
export const settlements = {
  list: (status?: string) =>
    api
      .get<{ commands: SettlementCommand[] | null; policy: SettlementPolicy }>("/api/settlements", {
        status,
      })
      .then((r) => ({ commands: r.commands ?? [], policy: r.policy })),
  submit: (
    input: {
      action: string;
      target: string;
      provider_id: string;
      corridor_id: string;
      amount_minor: number;
      currency: string;
      reason: string;
    },
    key = newIdempotencyKey(),
  ) =>
    api.post<{ command: SettlementCommand; replay: boolean }>(
      "/api/settlements",
      { ...input, idempotency_key: key },
      { idempotencyKey: key },
    ),
  approvals: (id: string) =>
    api
      .get<{ approvals: SettlementApproval[] | null }>(`/api/settlements/${id}/approvals`)
      .then((r) => r.approvals ?? []),
  preflight: (id: string, identityApproved: boolean) =>
    api.post<PreflightResult>(`/api/settlements/${id}/preflight`, {
      identity_approved: identityApproved,
    }),
  approve: (id: string, decision: "approved" | "rejected", reason: string) =>
    api.post<unknown>(`/api/settlements/${id}/approve`, { decision, reason }),
  execute: (id: string) => api.post<unknown>(`/api/settlements/${id}/execute`),
  cancel: (id: string) => api.post<unknown>(`/api/settlements/${id}/cancel`),
};

export const pilots = {
  list: () =>
    api
      .get<{
        pilots: Pilot[] | null;
        settlement_kill_switch_active: boolean;
        observation_only: boolean;
      }>("/api/pilots")
      .then((r) => ({
        pilots: r.pilots ?? [],
        killSwitch: r.settlement_kill_switch_active,
        observationOnly: r.observation_only,
      })),
  action: (id: string, action: "pause" | "resume" | "cancel" | "complete") =>
    api.post<unknown>(`/api/pilots/${id}/${action}`),
};

// ---- Platform ----------------------------------------------------------------------------------
export const platform = {
  /** Unauthenticated: countries, currencies, corridor count, limits, chain, feature flags. */
  config: () => api.get<PublicConfig>("/api/config/public"),
  standing: () => api.get<Standing>("/api/trader/limits"),
  kyc: () =>
    api
      .get<{ verifications: TraderVerification[] | null; standing?: Standing }>("/api/trader/kyc")
      .then((r) => ({
        verifications: r.verifications ?? [],
        standing: r.standing,
      })),
  submitKyc: (input: { verification_type: string; reference: string; evidence_label?: string }) =>
    api.post<TraderVerification>("/api/trader/kyc", input),
  trust: () => api.get<TrustResult>("/api/trader/trust-score"),
  analytics: (days: number) => api.get<AnalyticsReport>("/api/trader/analytics", { days }),
};
