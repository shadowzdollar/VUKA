import { useCallback, useState } from "react";
import type { ChainScope } from "@/lib/api/endpoints";

/**
 * The engine's escrow / dispute / reconciliation reads are scoped to one contract on one chain
 * (`?contract=0x…&chain_id=80002`). The engine does not advertise its configured contract, so the
 * operator supplies it once here. VITE_ESCROW_CONTRACT / VITE_ESCROW_CHAIN_ID provide defaults.
 */
const STORAGE_KEY = "vuka.chainScope";
const DEFAULT_CHAIN = Number(import.meta.env["VITE_ESCROW_CHAIN_ID"] ?? 80002);

function read(): ChainScope {
  const fallback: ChainScope = {
    contract: (import.meta.env["VITE_ESCROW_CONTRACT"] as string | undefined) ?? "",
    chain_id: DEFAULT_CHAIN,
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ChainScope>;
    return {
      contract: typeof parsed.contract === "string" ? parsed.contract : fallback.contract,
      chain_id: typeof parsed.chain_id === "number" ? parsed.chain_id : DEFAULT_CHAIN,
    };
  } catch {
    return fallback;
  }
}

export function useChainScope(): [ChainScope, (next: ChainScope) => void] {
  const [scope, setScope] = useState<ChainScope>(() =>
    typeof window === "undefined" ? { contract: "", chain_id: DEFAULT_CHAIN } : read(),
  );
  const update = useCallback((next: ChainScope) => {
    setScope(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep in-memory only */
    }
  }, []);
  return [scope, update];
}

export function scopeReady(scope: ChainScope): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(scope.contract.trim());
}
