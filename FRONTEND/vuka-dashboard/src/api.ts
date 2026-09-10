import type { ComplianceReview, CorridorConfig, Dispute, DisputeDecision, DisputeReview, DisputeTimelineEntry, Escrow, EscrowEvent, Operator, OperatorActivity, Organization, Pilot, ProviderStatus, ProviderWebhookEvent, ReconciliationStatus, SettlementCommand, Trader, TraderAccount, TraderBalance, TraderQuote, TraderTransfer, SupportTicket, Notification, TraderInvoice, TraderRecipient, TransactionWorkflow } from "./types";

const contract = import.meta.env.VITE_ESCROW_CONTRACT ??
  "0x491a0E68B440621435B606D17FDa50f7999DE4ef";
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: controller.signal,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers }
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { message?: string; error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
      else if (body.message) message = body.message;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    const error = new Error(message);
    if (response.status === 401) error.name = "AuthenticationRequired";
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<void> {
  await request<void>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

export function getCurrentOperator(): Promise<Operator> {
  return request("/api/auth/me");
}

export function traderLogin(phone: string, password: string): Promise<Trader> {
  return request("/api/trader/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password })
  });
}

export function registerTrader(payload: {
  full_name: string;
  phone_number: string;
  business_reg_number?: string;
  password: string;
  currency: string;
}): Promise<{ user: Trader }> {
  const { currency, ...body } = payload;
  return request(`/api/users?currency=${encodeURIComponent(currency)}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function traderLogout(): Promise<void> {
  return request("/api/trader/auth/logout", { method: "POST" });
}

export function getCurrentTrader(): Promise<Trader> {
  return request("/api/trader/auth/me");
}

export function getTraderAccounts(userId: string): Promise<{ accounts: TraderAccount[] }> {
  return request(`/api/users/${encodeURIComponent(userId)}/accounts`);
}

export function getTraderBalance(accountId: string): Promise<TraderBalance> {
  return request(`/api/accounts/${encodeURIComponent(accountId)}/balance`);
}

export function findTraderRecipient(phone: string): Promise<TraderRecipient> {
  return request(`/api/trader/recipients?phone=${encodeURIComponent(phone)}`);
}

export function getTraderTransfers(userId: string): Promise<{ transfers: TraderTransfer[] }> {
  return request(`/api/users/${encodeURIComponent(userId)}/transfers`);
}

export function getTraderTransfer(id: string): Promise<TraderTransfer> {
  return request(`/api/transfers/${encodeURIComponent(id)}`);
}

export function getTraderInvoices(userId: string): Promise<{ invoices: TraderInvoice[] }> {
  return request(`/api/users/${encodeURIComponent(userId)}/invoices`);
}

export function createTraderInvoice(userId: string, payload: {
  number: string;
  counterparty_user_id: string;
  currency: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  terms?: string;
  notes?: string;
  items: { description: string; quantity: number; unit_price: number }[];
}): Promise<TraderInvoice> {
  return request(`/api/users/${encodeURIComponent(userId)}/invoices`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCorridorQuote(corridorId: string, amountMinor: number): Promise<{ quote: TraderQuote; execution: string; observation_only: boolean }> {
  return request(`/api/quotes?corridor_id=${encodeURIComponent(corridorId)}&amount_minor=${amountMinor}`);
}

export function createTraderTransfer(payload: {
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency: string;
  invoice_number?: string;
}, idempotencyKey: string): Promise<{ transfer: TraderTransfer; replayed: boolean }> {
  return request("/api/transfers", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload)
  });
}

export function createTraderCrossBorderTransfer(payload: {
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  currency_from: string;
  currency_to: string;
  fx_rate: number;
  quote_id: string;
  corridor_id: string;
}, idempotencyKey: string): Promise<{ transfer: TraderTransfer; replayed: boolean }> {
  return request("/api/transfers/cross-border", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload)
  });
}

export function createTransactionWorkflow(payload: {
  source_account_id: string;
  destination_account_id: string;
  collection_provider: string;
  payout_provider: string;
  collection_phone: string;
  payout_phone: string;
  corridor_id: string;
  quote_id: string;
  amount: number;
  currency_from: string;
  currency_to: string;
  rate: number;
  provider_authorization_ref: string;
}, idempotencyKey: string): Promise<{ workflow: TransactionWorkflow; replay?: boolean }> {
  return request("/api/transaction-workflows", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload)
  });
}

export function getTransactionWorkflow(id: string): Promise<TransactionWorkflow> {
  return request(`/api/transaction-workflows/${encodeURIComponent(id)}`);
}

export function getTraderSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
  return request("/api/support/tickets");
}

export function createTraderSupportTicket(subject: string, description: string, idempotencyKey: string): Promise<{ ticket: SupportTicket; replay: boolean }> {
  return request("/api/support/tickets", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ subject, description })
  });
}

export function getTraderNotifications(): Promise<{ notifications: Notification[] }> {
  return request("/api/notifications");
}

export function markTraderNotificationRead(id: string, traderId: string): Promise<{ status: string }> {
  return request(`/api/notifications/${encodeURIComponent(id)}/read?trader_id=${encodeURIComponent(traderId)}`, { method: "POST" });
}

export function getActivity(filters: { action: string; search: string; from: string; to: string; offset: number }): Promise<{ activities: OperatorActivity[]; total: number }> {
  const params = new URLSearchParams({
    action: filters.action === "ALL" ? "" : filters.action,
    search: filters.search,
    from: filters.from,
    to: filters.to,
    limit: "20",
    offset: String(filters.offset)
  });
  return request(`/api/activity?${params.toString()}`);
}

export function getAlertHistory(): Promise<{ activities: OperatorActivity[]; total: number }> {
  return getActivity({
    action: "ALERT_ACKNOWLEDGED",
    search: "",
    from: "",
    to: "",
    offset: 0
  });
}

export function getOrganizations(status = ""): Promise<{ organizations: Organization[] }> {
  return request(`/api/organizations?status=${encodeURIComponent(status)}`);
}

export function getComplianceReviews(status = ""): Promise<{ reviews: ComplianceReview[] }> {
  return request(`/api/compliance/reviews?status=${encodeURIComponent(status)}`);
}

export function getProviderStatus(): Promise<{ providers: ProviderStatus[] }> {
  return request("/api/providers/status");
}

export function getCorridors(): Promise<{ corridors: CorridorConfig[] }> {
  return request("/api/corridors");
}

export function getProviderWebhookEvents(): Promise<{ events: ProviderWebhookEvent[] }> {
  return request("/api/providers/webhooks/events");
}

export function getSettlementCommands(status = ""): Promise<{ commands: SettlementCommand[] }> {
  return request(`/api/settlements?status=${encodeURIComponent(status)}`);
}

export function getPilots(status = ""): Promise<{ pilots: Pilot[] }> {
  return request(`/api/pilots?status=${encodeURIComponent(status)}`);
}

export function approvePilot(id: string, reason = "Approved for supervised observation"): Promise<{ pilot: Pilot }> {
  return request(`/api/pilots/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify({ decision: "approved", reason })
  });
}

export function pausePilot(id: string): Promise<{ pilot: Pilot }> {
  return request(`/api/pilots/${encodeURIComponent(id)}/pause`, { method: "POST" });
}

export function resumePilot(id: string): Promise<{ pilot: Pilot }> {
  return request(`/api/pilots/${encodeURIComponent(id)}/resume`, { method: "POST" });
}

export function cancelPilot(id: string): Promise<{ pilot: Pilot }> {
  return request(`/api/pilots/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export function completePilot(id: string): Promise<{ pilot: Pilot }> {
  return request(`/api/pilots/${encodeURIComponent(id)}/complete`, { method: "POST" });
}

export function decideComplianceReview(reviewId: string, status: ComplianceReview["status"], rationale: string): Promise<{ review: ComplianceReview }> {
  return request(`/api/compliance/reviews/${encodeURIComponent(reviewId)}/decision`, {
    method: "POST",
    body: JSON.stringify({ status, rationale })
  });
}

export function getActivityExportUrl(filters: { action: string; search: string; from: string; to: string }): string {
  const params = new URLSearchParams({
    action: filters.action === "ALL" ? "" : filters.action,
    search: filters.search,
    from: filters.from,
    to: filters.to
  });
  return `${baseUrl}/api/activity/export?${params.toString()}`;
}

export function getEscrows(): Promise<{ escrows: Escrow[] }> {
  return request(`/api/escrows?chain_id=80002&contract=${contract}`);
}

export function getReconciliationStatus(): Promise<ReconciliationStatus> {
  return request(`/api/reconciliation/status?chain_id=80002&contract=${contract}`);
}

export function acknowledgeReconciliationAlert(level: "warning" | "critical", message: string): Promise<{ status: string }> {
  return request("/api/reconciliation/alerts/ack", {
    method: "POST",
    body: JSON.stringify({
      chain_id: 80002,
      contract,
      level,
      message
    })
  });
}

export function getReconciliationStatusExportUrl(): string {
  return `${baseUrl}/api/reconciliation/status/export?chain_id=80002&contract=${contract}`;
}

export function getEscrowEvents(escrowId: number): Promise<{ events: EscrowEvent[] }> {
  return request(`/api/escrows/${escrowId}/events?chain_id=80002&contract=${contract}`);
}

export function getDisputes(): Promise<{ disputes: Dispute[] }> {
  return request(`/api/disputes?chain_id=80002&contract=${contract}&status=OPEN`);
}

export function addDisputeReview(disputeId: string, note: string): Promise<DisputeReview> {
  return request(`/api/disputes/${disputeId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ note })
  });
}

export function getDisputeReviews(disputeId: string): Promise<{ reviews: DisputeReview[] }> {
  return request(`/api/disputes/${disputeId}/reviews`);
}

export function getDisputeTimeline(disputeId: string): Promise<{ timeline: DisputeTimelineEntry[] }> {
  return request(`/api/disputes/${disputeId}/timeline`);
}

export function getDisputeExportUrl(disputeId: string): string {
  return `${baseUrl}/api/disputes/${encodeURIComponent(disputeId)}/export`;
}

export function addDisputeDecision(disputeId: string, decision: DisputeDecision["decision"], rationale: string): Promise<DisputeDecision> {
  return request(`/api/disputes/${disputeId}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, rationale })
  });
}

export function getDisputeDecisions(disputeId: string): Promise<{ decisions: DisputeDecision[] }> {
  return request(`/api/disputes/${disputeId}/decisions`);
}

export function approveDisputeDecision(decisionId: string): Promise<DisputeDecision["approvals"][number]> {
  return request(`/api/dispute-decisions/${decisionId}/approve`, { method: "POST" });
}

export async function getHealth(): Promise<boolean> {
  try {
    await request<{ status: string }>("/healthz");
    return true;
  } catch {
    return false;
  }
}

export { contract };
