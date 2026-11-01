import { useQuery } from "@tanstack/react-query";
import { Blocks, Landmark, Lock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import escrowGlobe from "@/assets/escrow-globe.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { DataTable } from "@/components/vuka/data-table";
import { LazyStateChart } from "@/components/vuka/lazy-charts";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { operator } from "@/lib/api/endpoints";
import type { EscrowState, EscrowSummary } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { money, tokenUnits, truncMid, when } from "@/lib/format";

const STATES: EscrowState[] = ["CREATED", "LOCKED", "RELEASED", "REFUNDED", "DISPUTED", "SPLIT"];

const tone = (s: EscrowState) =>
  s === "RELEASED"
    ? ("invert" as const)
    : s === "DISPUTED"
      ? ("warn" as const)
      : s === "REFUNDED"
        ? ("dead" as const)
        : ("live" as const);

/** Operator view of the reconciled on-chain escrow read model (GET /api/escrows). */
export function OperatorEscrows() {
  const [scope, setScope] = useChainScope();
  const ready = scopeReady(scope);
  const [filter, setFilter] = useState<"ALL" | EscrowState>("ALL");
  const [active, setActive] = useState<EscrowSummary | null>(null);

  const escrows = useQuery({
    queryKey: ["escrows", scope],
    queryFn: () => operator.escrows(scope),
    enabled: ready,
    refetchInterval: 20_000,
  });

  const totals = useMemo(() => {
    const t: Record<EscrowState, number> = {
      CREATED: 0,
      LOCKED: 0,
      RELEASED: 0,
      REFUNDED: 0,
      DISPUTED: 0,
      SPLIT: 0,
    };
    for (const e of escrows.data ?? []) t[e.state] += tokenUnits(e.amount);
    return t;
  }, [escrows.data]);

  return (
    <>
      <PageHeader
        eyebrow="On-chain settlement"
        title="Escrow Register"
        description="Read model of the invoice-linked escrow contract, reconciled from chain events after confirmations. States are chain truth: this desk observes escrows, it cannot move them."
      />

      {/* Executive On-Chain Escrow Register Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Landmark className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Polygon Smart-Contract Read Model · Non-Custodial Observer
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Confirmed Block-Finality Escrow Ledger
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Every state transition (`CREATED`, `LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`,
              `SPLIT`) is indexed strictly from confirmed smart-contract events on chain.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                Custody Invariant
              </div>
              <div className="font-bold text-white">Read-Only Chain Truth</div>
            </div>
          </div>
        </div>
      </div>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>Enter the escrow contract address to load escrows.</EmptyState>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
            <Metric
              label="Locked / created"
              value={money(totals.LOCKED + totals.CREATED)}
              sub="Token units held in escrow"
              accent="lime"
            />
            <Metric label="Released" value={money(totals.RELEASED)} sub="Paid to suppliers" />
            <Metric label="Refunded" value={money(totals.REFUNDED)} sub="Returned to buyers" />
            <Metric
              label="Disputed"
              value={money(totals.DISPUTED)}
              sub="Frozen pending arbitration"
              accent={totals.DISPUTED > 0 ? "warn" : "default"}
            />
            <Metric label="Split" value={money(totals.SPLIT)} sub="Settled by arbiter ruling" />
          </div>

          <Panel
            title="Escrow value by state"
            subtitle="Aggregated token volume across smart-contract lifecycle states"
          >
            <LazyStateChart data={STATES.map((st) => ({ state: st, amount: totals[st] }))} />
          </Panel>

          <Panel
            title="Escrow register"
            subtitle="Click any escrow row to inspect its on-chain event log and block confirmations"
            meta={
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", ...STATES] as const).map((s) => (
                  <button key={s} onClick={() => setFilter(s)} className="cursor-pointer">
                    <Chip tone={filter === s ? "invert" : "neutral"}>{s}</Chip>
                  </button>
                ))}
              </div>
            }
          >
            <QueryBoundary
              query={escrows}
              disabledCodes={["reconciliation_disabled"]}
              isEmpty={(d) => d.length === 0}
              empty="No escrows have been reconciled for this contract yet."
            >
              {(rows) => (
                <DataTable
                  caption="Escrow register"
                  exportName="vuka-escrows.csv"
                  rows={rows.filter((e) => filter === "ALL" || e.state === filter)}
                  rowKey={(e) => String(e.escrow_id)}
                  onRowClick={setActive}
                  initialSort={{ key: "id", dir: "desc" }}
                  empty="No escrows match this filter."
                  columns={[
                    {
                      key: "id",
                      header: "Escrow",
                      sort: (e) => e.escrow_id,
                      text: (e) => `#${e.escrow_id}`,
                      cell: (e) => (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <Lock className="size-3 text-[#79b200]" aria-hidden="true" />#
                          {e.escrow_id}
                        </span>
                      ),
                    },
                    {
                      key: "invoice",
                      header: "Invoice ref",
                      sort: (e) => e.invoice_ref,
                      cell: (e) => (
                        <span className="font-mono text-xs">{truncMid(e.invoice_ref)}</span>
                      ),
                    },
                    {
                      key: "buyer",
                      header: "Buyer",
                      text: (e) => e.buyer,
                      cell: (e) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(e.buyer)}
                        </span>
                      ),
                    },
                    {
                      key: "supplier",
                      header: "Supplier",
                      text: (e) => e.supplier,
                      cell: (e) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(e.supplier)}
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Amount",
                      align: "right",
                      sort: (e) => tokenUnits(e.amount),
                      text: (e) => String(tokenUnits(e.amount)),
                      cell: (e) => (
                        <span className="tabular font-mono font-semibold">
                          {money(tokenUnits(e.amount))}
                        </span>
                      ),
                    },
                    {
                      key: "timeout",
                      header: "Timeout",
                      align: "right",
                      sort: (e) => e.timeout_at,
                      text: (e) => new Date(e.timeout_at * 1000).toISOString(),
                      cell: (e) => (
                        <span className="tabular font-mono text-xs">
                          {when(new Date(e.timeout_at * 1000).toISOString())}
                        </span>
                      ),
                    },
                    {
                      key: "state",
                      header: "State",
                      align: "right",
                      sort: (e) => e.state,
                      cell: (e) => <Chip tone={tone(e.state)}>{e.state}</Chip>,
                    },
                  ]}
                />
              )}
            </QueryBoundary>
          </Panel>
        </>
      )}

      <EscrowDialog escrow={active} scope={scope} onClose={() => setActive(null)} />
    </>
  );
}

function EscrowDialog({
  escrow,
  scope,
  onClose,
}: {
  escrow: EscrowSummary | null;
  scope: { contract: string; chain_id?: number };
  onClose: () => void;
}) {
  const events = useQuery({
    queryKey: ["escrow-events", scope, escrow?.escrow_id],
    queryFn: () => operator.escrowEvents(escrow!.escrow_id, scope),
    enabled: escrow !== null,
  });
  return (
    <Dialog open={escrow !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        {escrow ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                Escrow #{escrow.escrow_id}
              </DialogTitle>
              <DialogDescription>
                Invoice ref {escrow.invoice_ref} · last updated at block {escrow.updated_block}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-2.5 rounded-xl border border-[#151515] bg-[#151515] p-4 font-mono text-[11px] text-white">
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">Buyer</dt>
                <dd className="truncate">{escrow.buyer}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">Supplier</dt>
                <dd className="truncate">{escrow.supplier}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">Amount</dt>
                <dd className="font-bold text-[#c2f74d]">{money(tokenUnits(escrow.amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/55">Contract</dt>
                <dd className="truncate">{escrow.contract_address}</dd>
              </div>
            </dl>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Blocks className="size-3.5 text-[#79b200]" aria-hidden="true" />
              Chain events
            </div>
            <QueryBoundary
              query={events}
              isEmpty={(d) => d.length === 0}
              empty="No events recorded."
            >
              {(rows) => (
                <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                  {rows.map((e) => (
                    <li key={`${e.transaction_hash}-${e.log_index}`} className="px-3.5 py-2.5">
                      <div className="flex justify-between gap-3">
                        <span className="font-mono text-xs font-semibold">{e.event_type}</span>
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          block {e.block_number}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {truncMid(e.transaction_hash, 12, 8)} · {when(e.observed_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </QueryBoundary>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
