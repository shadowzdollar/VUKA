import type { Escrow, EscrowEvent, Operator, ReconciliationStatus } from "./types";

const contract = import.meta.env.VITE_ESCROW_CONTRACT ??
  "0x491a0E68B440621435B606D17FDa50f7999DE4ef";
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
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

export function getEscrows(): Promise<{ escrows: Escrow[] }> {
  return request(`/api/escrows?chain_id=80002&contract=${contract}`);
}

export function getReconciliationStatus(): Promise<ReconciliationStatus> {
  return request(`/api/reconciliation/status?chain_id=80002&contract=${contract}`);
}

export function getEscrowEvents(escrowId: number): Promise<{ events: EscrowEvent[] }> {
  return request(`/api/escrows/${escrowId}/events?chain_id=80002&contract=${contract}`);
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
