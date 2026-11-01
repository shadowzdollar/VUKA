import { CheckCircle2, Layers, Link2 } from "lucide-react";
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
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#151515] bg-[#151515] p-4 text-white shadow-md">
      <div className="min-w-[280px] flex-1">
        <label
          htmlFor="scope-contract"
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c2f74d]"
        >
          <Link2 className="size-3" aria-hidden="true" />
          Escrow contract
        </label>
        <Input
          id="scope-contract"
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          placeholder="0x… (VUKA_RECONCILIATION_CONTRACT)"
          className="mt-1.5 h-9 rounded-lg border-white/15 bg-white/[0.06] font-mono text-xs text-white placeholder:text-white/40"
        />
      </div>
      <div className="w-32">
        <label
          htmlFor="scope-chain"
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65"
        >
          <Layers className="size-3 text-[#c2f74d]" aria-hidden="true" />
          Chain id
        </label>
        <Input
          id="scope-chain"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          inputMode="numeric"
          className="mt-1.5 h-9 rounded-lg border-white/15 bg-white/[0.06] font-mono text-xs text-white"
        />
      </div>
      <Button
        size="sm"
        disabled={!valid || !dirty}
        className="h-9 gap-1.5 rounded-lg bg-[#c2f74d] px-4 font-mono text-[11px] font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90 disabled:opacity-40"
        onClick={() => onChange({ contract: contract.trim(), chain_id: Number(chain) })}
      >
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Apply
      </Button>
    </div>
  );
}
