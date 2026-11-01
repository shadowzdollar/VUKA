import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Gavel,
  Lock,
  Radio,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Split,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { PeriodPicker, usd0, usdCompact, type Period } from "@/components/vuka/analytics-parts";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { Gauge, Sparkline } from "@/components/vuka/viz/simple";
import { describeError } from "@/lib/api/client";
import { corridors, operator, pilots, settlements } from "@/lib/api/endpoints";
import type { ReconciliationStatus } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { money, tokenUnits, when } from "@/lib/format";
import { useOperator } from "@/lib/session";

/** Must match the wording the engine computes in handleAcknowledgeReconciliationAlert. */
function alertMessage(s: ReconciliationStatus): string {
  const errs = s.metrics.Errors;
  return errs > 0
    ? `The worker has reported ${errs} error${errs === 1 ? "" : "s"}.`
    : `Indexing is behind by ${s.lag_blocks} finalized blocks.`;
}

export function OperatorCockpit() {
  const me = useOperator();
  const qc = useQueryClient();
  const [scope, setScope] = useChainScope();
  const [period, setPeriod] = useState<Period>(30);
  const ready = scopeReady(scope);

  const status = useQuery({
    queryKey: ["recon-status", scope],
    queryFn: () => operator.reconciliationStatus(scope),
    enabled: ready,
    refetchInterval: 15_000,
    retry: false,
  });
  const escrows = useQuery({
    queryKey: ["escrows", scope],
    queryFn: () => operator.escrows(scope),
    enabled: ready,
    refetchInterval: 30_000,
    retry: false,
  });
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridors.providers,
    refetchInterval: 30_000,
  });
  const policy = useQuery({ queryKey: ["settlements"], queryFn: () => settlements.list() });
  const pilotList = useQuery({ queryKey: ["pilots"], queryFn: pilots.list });

  const platformStats = useQuery({
    queryKey: ["analytics", "platform", period],
    queryFn: () => operator.analytics(period),
    staleTime: 60_000,
    retry: false,
  });

  const ack = useMutation({
    mutationFn: (s: ReconciliationStatus) =>
      operator.ackAlert(scope, s.alert_level as "warning" | "critical", alertMessage(s)),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      void qc.invalidateQueries({ queryKey: ["recon-status"] });
    },
    onError: (e) => toast.error("Could not acknowledge", { description: describeError(e) }),
  });

  const sums = { locked: 0, released: 0, refunded: 0, disputed: 0, split: 0 };
  for (const e of escrows.data ?? []) {
    const v = tokenUnits(e.amount);
    if (e.state === "LOCKED" || e.state === "CREATED") sums.locked += v;
    else if (e.state === "RELEASED") sums.released += v;
    else if (e.state === "REFUNDED") sums.refunded += v;
    else if (e.state === "SPLIT") sums.split += v;
    else sums.disputed += v;
  }
  const totalEscrowVol =
    sums.locked + sums.released + sums.refunded + sums.disputed + sums.split;

  return (
    <div className="space-y-6">
      {/* Executive Network Operations Center (NOC) Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.48)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
        />
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-16 hidden w-[330px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                Executive Operations · NOC
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80">
                {me.email}
              </span>
              <span className="rounded-full bg-[#c2f74d] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#151515]">
                {me.role}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Settlement &amp; Risk Cockpit
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              Real-time Polygon USDC escrow exposure, block-indexer finality, African mobile-money
              rail telemetry, and dual-approval settlement governance in one unified command center.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
              >
                <Link to="/disputes">
                  <Gavel className="mr-1.5 size-3.5" /> Dispute Tribunal
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/escrow">
                  <Lock className="mr-1.5 size-3.5" /> Escrow Register
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/compliance">
                  <ShieldCheck className="mr-1.5 size-3.5" /> Compliance &amp; KYC
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/settlements">
                  <Scale className="mr-1.5 size-3.5" /> Treasury Policy
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Live System & Contract Telemetry */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                On-Chain Escrow Contract TVL
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#c2f74d]">
                <Radio className="size-3" /> {ready ? `Chain #${scope.chain_id ?? 137}` : "Unscoped"}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold tabular-nums text-white">
                {ready ? money(totalEscrowVol) : "—"}
              </span>
              <span className="font-mono text-xs text-white/60">
                {(escrows.data ?? []).length} indexed contracts
              </span>
            </div>

            {/* Segmented Escrow State Bar */}
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              {totalEscrowVol > 0 ? (
                <>
                  <div
                    style={{ width: `${(sums.locked / totalEscrowVol) * 100}%` }}
                    className="bg-[#c2f74d]"
                    title={`Locked: ${money(sums.locked)}`}
                  />
                  <div
                    style={{ width: `${(sums.released / totalEscrowVol) * 100}%` }}
                    className="bg-[#79b200]"
                    title={`Released: ${money(sums.released)}`}
                  />
                  <div
                    style={{ width: `${(sums.refunded / totalEscrowVol) * 100}%` }}
                    className="bg-white/50"
                    title={`Refunded: ${money(sums.refunded)}`}
                  />
                  <div
                    style={{ width: `${(sums.disputed / totalEscrowVol) * 100}%` }}
                    className="bg-destructive"
                    title={`Disputed: ${money(sums.disputed)}`}
                  />
                </>
              ) : (
                <div className="w-full bg-[#c2f74d]/30" />
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-white/65">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-[#c2f74d]" /> Locked {money(sums.locked)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-[#79b200]" /> Released {money(sums.released)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-destructive" /> Disputed {money(sums.disputed)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {/* 5-Column Escrow State Exposure Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          icon={Lock}
          tone="primary"
          label="Escrow Locked"
          value={ready ? money(sums.locked) : "—"}
          sub="Active buyer commitments"
        />
        <Metric
          icon={CheckCircle2}
          tone="success"
          label="Released"
          value={ready ? money(sums.released) : "—"}
          sub="Settled to suppliers"
          delay={50}
        />
        <Metric
          icon={RotateCcw}
          tone="muted"
          label="Refunded"
          value={ready ? money(sums.refunded) : "—"}
          sub="Returned to buyers"
          delay={100}
        />
        <Metric
          icon={Gavel}
          tone="destructive"
          label="Disputed / Frozen"
          value={ready ? money(sums.disputed) : "—"}
          sub="Under arbiter hold"
          delay={150}
        />
        <Metric
          icon={Split}
          tone="muted"
          label="Split Rulings"
          value={ready ? money(sums.split) : "—"}
          sub="Pro-rata arbitration"
          delay={200}
        />
      </div>

      {/* Network Pulse & Multi-Series Throughput Workbench */}
      <Panel
        title={`Network Pulse & Corridor Throughput (${period}d)`}
        delay={240}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={period} onChange={setPeriod} />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
            >
              <Link to="/analytics">Network intelligence →</Link>
            </Button>
          </div>
        }
      >
        <QueryBoundary query={platformStats} disabledCodes={["analytics_unavailable"]}>
          {(r) => (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  icon={Activity}
                  label="Settled Volume"
                  value={usd0(r.totals.volume_usd)}
                  sub={`${r.totals.succeeded} settled payments`}
                  trend={<Sparkline values={r.daily.map((d) => d.out_usd)} />}
                />
                <Metric
                  icon={CheckCircle2}
                  tone="success"
                  label="Network Reliability"
                  value={`${Math.round(r.totals.success_rate * 100)}%`}
                  sub={`${r.totals.failed} failed · ${r.totals.reversed} reversed`}
                />
                <Metric
                  icon={Users}
                  tone="primary"
                  label="Active Traders"
                  value={r.totals.active_traders ?? 0}
                  sub={`${r.totals.new_traders ?? 0} new · ${r.totals.total_traders ?? 0} registered`}
                />
                <Metric
                  label="Wallet Cash-In"
                  value={usd0(r.totals.cash_in_usd)}
                  sub="Mobile-money collection volume"
                  tone="muted"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[240px_1fr_280px] lg:items-center">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <Gauge
                    value={r.totals.success_rate}
                    label="Settlement SLA"
                    sub={`${r.totals.succeeded} ok · ${r.totals.failed} failed`}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                  <LazyTrendChart
                    data={r.daily.map((d) => ({ label: d.date.slice(5), a: d.out_usd }))}
                    aName="Settled volume (USD eq.)"
                    ariaLabel="Settled volume per day, USD equivalent"
                    format={usd0}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Currency Mix
                  </div>
                  <LazyDonutChart
                    data={r.currencies.map((c) => ({ label: c.label, value: c.value_usd }))}
                    ariaLabel="Settled volume by currency"
                    center={{ value: usdCompact(r.totals.volume_usd), label: "USD eq." }}
                    format={usd0}
                  />
                </div>
              </div>
            </div>
          )}
        </QueryBoundary>
      </Panel>

      {/* Live African Provider Rail Matrix */}
      <Panel
        title="African Payment Rail Health & Adapter Telemetry"
        delay={280}
        meta={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-lg font-mono text-[10px] uppercase"
          >
            <Link to="/corridors">Corridors &amp; rails →</Link>
          </Button>
        }
      >
        <QueryBoundary query={providers}>
          {(rows) => (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {rows.map((p) => {
                const country = p.config.supported_countries[0] ?? "RW";
                const currency = p.config.supported_currencies[0] ?? "";
                return (
                  <div
                    key={p.config.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/90 bg-muted/15 p-4 transition-all hover:border-[#79b200]/50 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Flag code={country} className="w-6 rounded-[2px] shadow-2xs" />
                          <span className="font-mono text-xs font-bold">{country}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            · {currency}
                          </span>
                        </div>
                        <Chip tone={p.config.kill_switch ? "warn" : p.healthy ? "live" : "warn"}>
                          {p.config.kill_switch ? "HALTED" : p.healthy ? "ONLINE" : "DEGRADED"}
                        </Chip>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        {p.config.display_name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {p.config.id} · {p.config.contract_version}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 font-mono text-[10px] text-muted-foreground">
                      <span className="uppercase">{p.config.environment}</span>
                      <span>{p.adapter_ready ? "Adapter Ready" : "Offline"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </QueryBoundary>
      </Panel>

      {/* Chain Reconciliation & Settlement Safety Governance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Chain Indexer & Finality Reconciliation"
          className="lg:col-span-2"
          delay={320}
          meta={
            status.data ? (
              <Chip tone={status.data.alert_level === "ok" ? "live" : "warn"}>
                <Cpu className="size-3" /> {status.data.alert_level}
              </Chip>
            ) : null
          }
        >
          {!ready ? (
            <EmptyState>Enter the escrow contract above to see reconciliation status.</EmptyState>
          ) : (
            <QueryBoundary query={status} disabledCodes={["reconciliation_disabled"]}>
              {(s) => {
                const syncPct =
                  s.finalized_block > 0
                    ? Math.min(100, Math.round((s.cursor / s.finalized_block) * 100))
                    : 100;
                return (
                  <div className="space-y-4">
                    {/* Block Sync Progress Bar */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-muted-foreground">
                          Block Finality Sync ({s.cursor.toLocaleString()} /{" "}
                          {s.finalized_block.toLocaleString()})
                        </span>
                        <span className="font-bold text-foreground">{syncPct}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#79b200] to-[#c2f74d]"
                          style={{ width: `${syncPct}%` }}
                        />
                      </div>
                    </div>

                    <dl className="grid gap-2.5 font-mono text-xs sm:grid-cols-2">
                      <Row k="Cursor (indexed to)" v={s.cursor.toLocaleString()} />
                      <Row k="Latest head block" v={s.latest_block.toLocaleString()} />
                      <Row k="Finalized block" v={s.finalized_block.toLocaleString()} />
                      <Row
                        k="Block lag"
                        v={`${s.lag_blocks} (warn ${s.warning_lag_blocks} / crit ${s.critical_lag_blocks})`}
                      />
                      <Row k="Worker polls" v={`${s.metrics.SuccessfulPolls}/${s.metrics.Polls}`} />
                      <Row k="Events applied" v={String(s.metrics.EventsApplied)} />
                      <Row k="Worker errors" v={String(s.metrics.Errors)} />
                    </dl>

                    {s.alert_level !== "ok" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4">
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
                            <ShieldAlert className="size-3.5" /> {s.alert_level} alert
                          </div>
                          <p className="mt-1 text-muted-foreground">{alertMessage(s)}</p>
                          {s.acknowledged_by ? (
                            <p className="mt-1 text-muted-foreground">
                              Acknowledged by {s.acknowledged_by} · {when(s.acknowledged_at)}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg font-mono text-[10px] uppercase"
                          disabled={ack.isPending}
                          onClick={() => ack.mutate(s)}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            </QueryBoundary>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Settlement Safety Policy"
            delay={360}
            meta={<Chip tone="live">Enforced</Chip>}
          >
            <QueryBoundary query={policy}>
              {(p) => (
                <dl className="space-y-2.5 font-mono text-xs">
                  <Row k="Global kill switch" v={p.policy.GlobalKillSwitch ? "ACTIVE" : "off"} />
                  <Row k="Live execution" v={p.policy.ExecutionEnabled ? "enabled" : "disabled"} />
                  <Row k="Approvals required" v={`${p.policy.RequiredApprovals} operators`} />
                  <Row k="Per-command cap" v={money(p.policy.MaxAmountMinor / 100)} />
                  <Row
                    k="Pending commands"
                    v={String(p.commands.filter((c) => c.status === "pending").length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              The global kill switch is deployment configuration
              (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) and cannot be overridden from the browser.
            </p>
          </Panel>

          <Panel title="Corridor Pilots & Readiness" delay={400}>
            <QueryBoundary query={providers}>
              {(rows) => (
                <dl className="space-y-2.5 font-mono text-xs">
                  <Row
                    k="Providers healthy"
                    v={`${rows.filter((r) => r.healthy).length}/${rows.length}`}
                  />
                  <Row
                    k="Providers halted"
                    v={String(rows.filter((r) => r.config.kill_switch).length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <div className="mt-2.5 border-t border-border/60 pt-2.5">
              <QueryBoundary query={pilotList}>
                {(p) => (
                  <dl className="space-y-2.5 font-mono text-xs">
                    <Row
                      k="Active pilots"
                      v={String(p.pilots.filter((x) => x.status === "active").length)}
                    />
                    <Row k="Observation only" v={p.observationOnly ? "yes" : "no"} />
                  </dl>
                )}
              </QueryBoundary>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
