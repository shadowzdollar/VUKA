import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChainScope } from "@/lib/api/endpoints";
import { scopeReady } from "@/lib/chain-scope";

/**
 * Escrow, dispute and reconciliation reads are scoped to a contract on a chain. The engine does
 * not advertise its configured contract, so the operator enters it once (remembered in this browser).
 */
export function ChainScopeBar({
  scope,
  onChange,
}: {
  scope: ChainScope;
  onChange: (s: ChainScope) => void;
}) {
  const [contract, setContract] = useState(scope.contract);
  const [chain, setChain] = useState(String(scope.chain_id ?? 80002));
  const dirty = contract.trim() !== scope.contract || Number(chain) !== scope.chain_id;
  const valid = scopeReady({ contract }) && Number(chain) > 0;

  return (
    <div className="flex flex-wrap items-end gap-2 border border-border p-3">
      <div className="min-w-[280px] flex-1">
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Escrow contract
        </label>
        <Input
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          placeholder="0x… (VUKA_RECONCILIATION_CONTRACT)"
          className="mt-1 h-8 rounded-none font-mono text-xs"
        />
      </div>
      <div className="w-28">
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Chain id
        </label>
        <Input
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          inputMode="numeric"
          className="mt-1 h-8 rounded-none font-mono text-xs"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={!valid || !dirty}
        className="h-8 rounded-none font-mono text-[10px] uppercase"
        onClick={() => onChange({ contract: contract.trim(), chain_id: Number(chain) })}
      >
        Apply
      </Button>
    </div>
  );
}
