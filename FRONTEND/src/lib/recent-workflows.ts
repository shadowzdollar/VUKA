/**
 * The engine exposes workflows by id only (no list endpoint), so the ids a trader has started are
 * remembered in this browser to let them revisit a payment's status. Per-trader, capped, best-effort.
 */
const MAX = 20;
const key = (traderId: string) => `vuka.workflows.${traderId}`;

export function readRecentWorkflows(traderId: string): string[] {
  try {
    const raw = window.localStorage.getItem(key(traderId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberWorkflow(traderId: string, id: string): void {
  try {
    const next = [id, ...readRecentWorkflows(traderId).filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(key(traderId), JSON.stringify(next));
  } catch {
    /* storage unavailable: the payment still exists server-side */
  }
}
