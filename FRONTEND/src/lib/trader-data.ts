import { useQuery } from "@tanstack/react-query";
import { invoices, ledger, support } from "@/lib/api/endpoints";
import type { Account, Balance, Transfer } from "@/lib/api/types";

import { useTrader } from "@/lib/session";

export interface Wallet {
  accounts: Account[];
  /** Derived server-side as SUM(ledger_entries.amount); the engine never stores a balance. */
  balances: Record<string, Balance>;
}

/** Accounts + derived balances for the signed-in trader. Invalidate ["wallet"] after any payment. */
export function useWallet() {
  const trader = useTrader();
  return useQuery({
    queryKey: ["wallet", trader.id],
    queryFn: async (): Promise<Wallet> => {
      const accounts = await ledger.accounts(trader.id);
      const list = await Promise.all(accounts.map((a) => ledger.balance(a.id)));
      return {
        accounts,
        balances: Object.fromEntries(list.map((b) => [b.account_id, b])),
      };
    },
  });
}

export function useTransfers(filter?: { account_id?: string; status?: string }) {
  const trader = useTrader();
  return useQuery({
    queryKey: ["transfers", trader.id, filter ?? {}],
    queryFn: (): Promise<Transfer[]> => ledger.transfers(trader.id, filter),
  });
}

export function useInvoices(direction?: "issued" | "received") {
  const trader = useTrader();
  return useQuery({
    queryKey: ["invoices", trader.id, direction ?? "all"],
    queryFn: () => invoices.list(trader.id, direction),
  });
}

export function useNotifications() {
  const trader = useTrader();
  return useQuery({
    queryKey: ["notifications", trader.id],
    queryFn: () => support.notifications(),
    refetchInterval: 30_000,
  });
}

/** "Debit"/"credit" from the viewpoint of a set of the trader's own accounts. */
export function directionFor(t: Transfer, ownAccountIds: Set<string>): "out" | "in" | "internal" {
  const src = ownAccountIds.has(t.source_account_id);
  const dst = ownAccountIds.has(t.destination_account_id);
  if (src && dst) return "internal";
  return src ? "out" : "in";
}

/** A human label for an account, consistent everywhere one is shown. */
export const accountLabel = (a: Account): string =>
  `${a.type === "BUSINESS" ? "Business trade wallet" : a.type === "PERSONAL" ? "Personal wallet" : a.type} · ${a.currency}`;
