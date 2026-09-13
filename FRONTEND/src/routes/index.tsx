import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { corridors, escrows, ledger, usd } from "@/lib/vuka-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VUKA Operations Cockpit — Cross-Border Trade Settlement" },
      {
        name: "description",
        content:
          "Live corridor volumes, escrow settlement state and double-entry ledger health for East African SME cross-border trade.",
      },
      { property: "og:title", content: "VUKA Operations Cockpit" },
      {
        property: "og:description",
        content:
          "Executive view of Kigali–Nairobi corridor volume, escrow lifecycle state and ledger reconciliation.",
      },
    ],
  }),
  component: Cockpit,
});

function Cockpit() {
  const [killSwitch, setKillSwitch] = useState(false);
  const [observation, setObservation] = useState(true);

  const totals = escrows.reduce(
    (acc, e) => {
      if (e.status === "LOCKED" || e.status === "CREATED") acc.locked += e.amountUsdc;
      if (e.status === "RELEASED") acc.released += e.amountUsdc;
      if (e.status === "REFUNDED") acc.refunded += e.amountUsdc;
      if (e.status === "DISPUTED") acc.disputed += e.amountUsdc;
      return acc;
    },
    { locked: 0, released: 0, refunded: 0, disputed: 0 },
  );

  const debits = ledger.reduce((s, l) => s + l.debit, 0);
  const credits = ledger.reduce((s, l) => s + l.credit, 0);
  const delta = Math.round((debits - credits) * 100) / 100;

  return (
    <Shell>
      <PageHeader
        eyebrow="Executive operations"
        title="Continental Settlement Cockpit"
        description="Single-pane control of corridor throughput, escrow exposure and ledger integrity across the East African trade network."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-none font-mono text-xs uppercase">
              <Link to="/escrow">Open escrow desk</Link>
            </Button>
            <Button asChild className="rounded-none font-mono text-xs uppercase">
              <Link to="/corridors">Corridor gateway</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="24h settlement volume"
          value={`$${usd(corridors.reduce((s, c) => s + c.volume24h, 0))}`}
          sub="Across 4 live and pilot corridors"
        />
        <Metric
          label="Escrow locked"
          value={`$${usd(totals.locked)}`}
          sub={`${escrows.filter((e) => e.status === "LOCKED" || e.status === "CREATED").length} contracts on Polygon`}
        />
        <Metric
          label="Released (mutual)"
          value={`$${usd(totals.released)}`}
          sub="Dual confirmation settlement"
        />
        <Metric
          label="Disputed / frozen"
          value={`$${usd(totals.disputed)}`}
          sub="Assets under arbiter control"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Corridor throughput"
          className="lg:col-span-2"
          meta={<Chip tone="live">Realtime</Chip>}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Corridor</th>
                <th className="py-2">Route</th>
                <th className="py-2 text-right">24h volume</th>
                <th className="py-2 text-right">Settlements</th>
                <th className="py-2 text-right">Median latency</th>
                <th className="py-2 text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {corridors.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 font-mono text-xs">{c.pair}</td>
                  <td className="py-2.5 text-muted-foreground">{c.route}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">${usd(c.volume24h)}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{c.settlements24h}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {c.latencyMin ? `${c.latencyMin} min` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <Chip tone={c.status === "LIVE" ? "invert" : c.status === "PILOT" ? "live" : "dead"}>
                      {c.status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-3">
          <Panel title="Ledger health" meta={<Chip tone={delta === 0 ? "invert" : "warn"}>{delta === 0 ? "Balanced" : "Drift"}</Chip>}>
            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">SUM(debits)</dt>
                <dd className="tabular-nums">${usd(debits)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">SUM(credits)</dt>
                <dd className="tabular-nums">${usd(credits)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-foreground">
                <dt>Δ reconciliation</dt>
                <dd className="tabular-nums">{usd(delta)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Atomic invariant <span className="font-mono">SUM(debits) − SUM(credits) = 0</span> enforced
              on every escrow state transition.
            </p>
          </Panel>

          <Panel title="Pilot controls">
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-mono text-xs uppercase tracking-[0.14em]">
                    Emergency kill-switch
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Halts all new escrow creation and on-ramp funding network-wide.
                  </span>
                </span>
                <Switch checked={killSwitch} onCheckedChange={setKillSwitch} />
              </label>
              <label className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-mono text-xs uppercase tracking-[0.14em]">
                    Pilot observation mode
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Records every adapter call and chain event for audit replay.
                  </span>
                </span>
                <Switch checked={observation} onCheckedChange={setObservation} />
              </label>
              <div className="border border-dashed border-border p-3 font-mono text-[11px] text-muted-foreground">
                {killSwitch
                  ? "STATE: NETWORK HALTED — existing escrows remain releasable by arbiter only."
                  : "STATE: NETWORK OPERATIONAL — corridors accepting new invoice-linked escrows."}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Recent settlement events" meta={<Chip>Last 8 days</Chip>}>
        <ul className="divide-y divide-border/60">
          {escrows.slice(0, 5).map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="font-mono text-xs">
                  {e.id} · {e.invoice}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.buyer} → {e.supplier} · {e.rail}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm tabular-nums">${usd(e.amountUsdc)}</span>
                <Chip tone={e.status === "RELEASED" ? "invert" : e.status === "DISPUTED" ? "warn" : "live"}>
                  {e.status}
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </Shell>
  );
}
