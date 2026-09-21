import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { auth } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/client";
import type { OperatorSession, TraderSession } from "@/lib/api/types";

/**
 * The engine has two independent identities, each with its own HttpOnly cookie:
 *  - trader   (phone + password)  -> /api/trader/*, ledger, invoices, workflows, support
 *  - operator (email + password)  -> reconciliation, disputes, compliance, settlements, pilots
 * The UI adapts its navigation and pages to whichever session is present.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "trader"; trader: TraderSession }
  | { status: "operator"; operator: OperatorSession };

interface SessionContextValue {
  session: SessionState;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const KEYS = { trader: ["session", "trader"], operator: ["session", "operator"] } as const;

/** A 401/403/501 just means "not signed in as this identity"; anything else is a real failure. */
function signedOut(e: unknown): boolean {
  return isApiError(e) && [401, 403, 501].includes(e.status);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const trader = useQuery({
    queryKey: KEYS.trader,
    queryFn: () => auth.traderMe().catch((e) => (signedOut(e) ? null : Promise.reject(e))),
    staleTime: 60_000,
    retry: false,
  });
  const operator = useQuery({
    queryKey: KEYS.operator,
    queryFn: () => auth.operatorMe().catch((e) => (signedOut(e) ? null : Promise.reject(e))),
    staleTime: 60_000,
    retry: false,
  });

  const session: SessionState = useMemo(() => {
    if (trader.data) return { status: "trader", trader: trader.data };
    if (operator.data) return { status: "operator", operator: operator.data };
    if (trader.isPending || operator.isPending) return { status: "loading" };
    return { status: "anon" };
  }, [trader.data, trader.isPending, operator.data, operator.isPending]);

  const refresh = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: KEYS.trader }),
      qc.invalidateQueries({ queryKey: KEYS.operator }),
    ]);
  }, [qc]);

  const logout = useCallback(async () => {
    if (session.status === "trader") await auth.traderLogout().catch(() => undefined);
    if (session.status === "operator") await auth.operatorLogout().catch(() => undefined);
    // Drop every cached server response: none of it may leak into the next session.
    qc.clear();
    qc.setQueryData(KEYS.trader, null);
    qc.setQueryData(KEYS.operator, null);
  }, [qc, session.status]);

  const value = useMemo(() => ({ session, refresh, logout }), [session, refresh, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Only call from components rendered inside `<Shell role="trader">`. */
export function useTrader(): TraderSession {
  const { session } = useSession();
  if (session.status !== "trader") throw new Error("useTrader requires a trader session");
  return session.trader;
}

/** Only call from components rendered inside `<Shell role="operator">`. */
export function useOperator(): OperatorSession {
  const { session } = useSession();
  if (session.status !== "operator") throw new Error("useOperator requires an operator session");
  return session.operator;
}
