import type { Dispute, DisputeDecision, DisputeReview, DisputeTimelineEntry, Escrow, EscrowEvent, Operator, OperatorActivity, ReconciliationStatus } from "./types";

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
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
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
