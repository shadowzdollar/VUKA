import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>Enter the escrow contract address to load escrows.</EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric
              label="Locked / created"
              value={money(totals.LOCKED + totals.CREATED)}
              sub="Token units held in escrow"
            />
            <Metric label="Released" value={money(totals.RELEASED)} sub="Paid to suppliers" />
            <Metric label="Refunded" value={money(totals.REFUNDED)} sub="Returned to buyers" />
            <Metric
              label="Disputed"
              value={money(totals.DISPUTED)}
              sub="Frozen pending arbitration"
            />
            <Metric label="Split" value={money(totals.SPLIT)} sub="Settled by arbiter ruling" />
          </div>

          <Panel title="Escrow value by state">
            <LazyStateChart data={STATES.map((st) => ({ state: st, amount: totals[st] }))} />
          </Panel>

          <Panel
            title="Escrow register"
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
                      cell: (e) => <span className="font-mono text-xs">#{e.escrow_id}</span>,
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
                        <span className="tabular font-mono">{money(tokenUnits(e.amount))}</span>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
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
            <dl className="grid gap-2 border border-border p-3 font-mono text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Buyer</dt>
                <dd className="truncate">{escrow.buyer}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Supplier</dt>
                <dd className="truncate">{escrow.supplier}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Amount</dt>
                <dd>{money(tokenUnits(escrow.amount))}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Contract</dt>
                <dd className="truncate">{escrow.contract_address}</dd>
              </div>
            </dl>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Chain events
            </div>
            <QueryBoundary
              query={events}
              isEmpty={(d) => d.length === 0}
              empty="No events recorded."
            >
              {(rows) => (
                <ul className="divide-y divide-border border border-border">
                  {rows.map((e) => (
                    <li key={`${e.transaction_hash}-${e.log_index}`} className="px-3 py-2">
                      <div className="flex justify-between gap-3">
                        <span className="text-xs">{e.event_type}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          block {e.block_number}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
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
