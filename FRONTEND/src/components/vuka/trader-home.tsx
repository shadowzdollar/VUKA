import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  FileText,
  Globe2,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { PeriodPicker, usd0, usdCompact, type Period } from "@/components/vuka/analytics-parts";
import { LazyDonutChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel, type MetricTrend } from "@/components/vuka/shell";
import { RankedBars, Sparkline } from "@/components/vuka/viz/simple";
import { describeError } from "@/lib/api/client";
import { invoices, platform, support } from "@/lib/api/endpoints";
import { money, shortId, when } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { directionFor, useNotifications, useTransfers, useWallet } from "@/lib/trader-data";

/** This-week-vs-last-week change from a daily series — a real computed figure, never fabricated. */
function weekOverWeek(daily: { value: number }[]): MetricTrend | undefined {
  if (daily.length < 14) return undefined;
  const last = daily.slice(-7).reduce((s, d) => s + d.value, 0);
  const prior = daily.slice(-14, -7).reduce((s, d) => s + d.value, 0);
  if (prior === 0) return undefined;
  const percent = Math.round(((last - prior) / prior) * 100);
  if (percent === 0) return { direction: "flat", percent: 0 };
  return { direction: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}

export function TraderHome() {
  const trader = useTrader();
  const qc = useQueryClient();
  const wallet = useWallet();
  const transfers = useTransfers();
  const notifications = useNotifications();
  const [period, setPeriod] = useState<Period>(30);

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );
  const unread = (notifications.data ?? []).filter((n) => !n.read_at);

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, trader.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(describeError(e)),
  });

  const analytics = useQuery({
    queryKey: ["analytics", "trader", period],
    queryFn: () => platform.analytics(period),
    staleTime: 60_000,
  });

  const trust = useQuery({
    queryKey: ["trust-score"],
    queryFn: platform.trust,
    staleTime: 120_000,
    retry: false,
  });

  const standing = useQuery({
    queryKey: ["standing"],
    queryFn: platform.standing,
    staleTime: 120_000,
    retry: false,
  });

  const invoiceList = useQuery({
    queryKey: ["invoices", trader.id],
    queryFn: () => invoices.list(trader.id),
    staleTime: 60_000,
    retry: false,
  });

  const verified =
    trader.kyc_status === "VERIFIED" ||
    trader.kyc_status === "APPROVED" ||
    trader.kyc_status === "BUSINESS_VERIFIED";

  const openInvoices = useMemo(
    () => (invoiceList.data ?? []).filter((inv) => inv.status !== "PAID"),
    [invoiceList.data],
  );

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
        />
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 hidden w-[340px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                Corporate Trade Treasury
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                {trader.phone_number}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  verified
                    ? "bg-[#c2f74d] text-[#151515]"
                    : "border border-white/20 bg-white/10 text-white/80"
                }`}
              >
                {trader.kyc_status}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, {trader.full_name}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              Your business and personal liquidity, strictly segregated on the ledger. Lock
              invoice-backed escrows, settle across 10 African corridors, and build verifiable trade
              credit.
            </p>

            {/* Primary Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
              >
                <Link to="/send">
                  <Send className="mr-1.5 size-3.5" /> Send Cross-Border Payment
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/escrow">
                  <FileText className="mr-1.5 size-3.5" /> Invoices &amp; Escrow
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/wallets">
                  <Wallet className="mr-1.5 size-3.5" /> Fund / Statements
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Live Trade-Credit & Limit Telemetry Card */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/trust-score"
              className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition hover:border-[#c2f74d]/60 hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Trust Passport
                </span>
                <Sparkles className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="font-mono text-3xl font-bold tabular-nums text-white">
                  {trust.data ? trust.data.score : "—"}
                </span>
                <span className="rounded-full bg-[#c2f74d]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#c2f74d]">
                  {trust.data ? trust.data.band : "300–850 scale"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10px] text-white/60">
                <span>
                  {trust.data ? `${trust.data.cycles_scored} settled cycles` : "Ledger-derived"}
                </span>
                <span className="text-[#c2f74d] group-hover:underline">Inspect →</span>
              </div>
            </Link>

            <Link
              to="/verification"
              className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition hover:border-[#c2f74d]/60 hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Daily Corridor Limit
                </span>
                <ShieldCheck className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-3">
                <div className="font-mono text-xl font-bold tabular-nums text-white">
                  {standing.data
                    ? usd0(Math.max(0, standing.data.limits.daily_usd - standing.data.used_day_usd))
                    : trader.kyc_status}
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-white/55">
                  {standing.data
                    ? `of ${usd0(standing.data.limits.daily_usd)} daily cap remaining`
                    : "Tier standing & KYC limits"}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10px] text-white/60">
                <span>Tier: {standing.data?.kyc_status ?? trader.kyc_status}</span>
                <span className="text-[#c2f74d] group-hover:underline">Manage →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Callout if not yet verified */}
      {!verified ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#79b200]/40 bg-[#f5fbe6] px-5 py-4 text-[#151515]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4d7500]">
                Compliance Standing · {trader.kyc_status}
              </div>
              <p className="mt-0.5 max-w-2xl text-xs text-[#33362e]">
                Complete trader identity &amp; business registry verification to unlock higher
                single-payment caps and institutional corridor settlement limits.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-[#151515] font-mono text-[10px] uppercase text-[#c2f74d] hover:bg-[#151515]/90"
          >
            <Link to="/verification">Upgrade verification →</Link>
          </Button>
        </div>
      ) : null}

      {/* Segregated Corporate Treasury Wallets + Live Counterparty Metrics */}
      <QueryBoundary query={wallet}>
        {(w) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a, i) => {
              const isBiz = a.type === "BUSINESS";
              const bal = w.balances[a.id]?.amount ?? 0;
              return (
                <div
                  key={a.id}
                  style={{ "--dash-delay": `${i * 60}ms` } as React.CSSProperties}
                  className={`dash-in relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                    isBiz
                      ? "border-[#79b200]/50 bg-gradient-to-br from-[#f8fde9] via-white to-white text-[#151515] shadow-[0_16px_38px_-18px_rgba(121,178,0,0.22)] dark:from-[#1b2210] dark:via-card dark:to-card dark:text-foreground"
                      : "border-border bg-card text-foreground shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span
                        className={`flex size-7 items-center justify-center rounded-lg ${
                          isBiz
                            ? "bg-[#151515] text-[#c2f74d]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isBiz ? (
                          <Briefcase className="size-3.5" />
                        ) : (
                          <UserRound className="size-3.5" />
                        )}
                      </span>
                      {isBiz ? "Business Trade Vault" : "Personal Wallet"}
                    </span>
                    <span className="rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] font-semibold">
                      {a.currency}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-mono text-2xl font-bold tabular-nums tracking-tight sm:text-[28px]">
                      {money(bal, a.currency)}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      Acct {shortId(a.id)} · Double-entry ledger balance
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                    <Link
                      to="/wallets"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground hover:underline"
                    >
                      Top up / Statement →
                    </Link>
                    {isBiz ? (
                      <span className="rounded-full bg-[#c2f74d]/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground">
                        Escrow Primary
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <Metric
              icon={FileText}
              tone="primary"
              label="Active Invoices"
              value={openInvoices.length}
              sub={`${(invoiceList.data ?? []).length} total invoices on ledger`}
              delay={w.accounts.length * 60}
            />

            <Metric
              icon={Bell}
              tone={unread.length > 0 ? "destructive" : "success"}
              label="Unread Notices"
              value={unread.length}
              sub={unread.length > 0 ? "Actionable settlement alerts" : "All settlement notices read"}
              delay={(w.accounts.length + 1) * 60}
            />
          </div>
        )}
      </QueryBoundary>

      {/* Main Analytics & Cashflow Telemetry Workbench */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={`Cashflow & Corridor Velocity (${period}d)`}
          className="lg:col-span-2"
          delay={200}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <PeriodPicker value={period} onChange={setPeriod} />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 rounded-lg font-mono text-[10px] uppercase"
              >
                <Link to="/analytics">Full analytics →</Link>
              </Button>
            </div>
          }
        >
          <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
            {(r) => (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric
                    label="Outbound Sent"
                    value={usd0(r.totals.sent_usd)}
                    sub={`${r.totals.payments_out} settlements`}
                    trend={
                      weekOverWeek(r.daily.map((d) => ({ value: d.out_usd }))) ?? (
                        <Sparkline values={r.daily.map((d) => d.out_usd)} />
                      )
                    }
                  />
                  <Metric
                    label="Inbound Received"
                    value={usd0(r.totals.received_usd)}
                    sub={`${r.totals.payments_in} settlements`}
                    tone="success"
                    trend={
                      weekOverWeek(r.daily.map((d) => ({ value: d.in_usd }))) ?? (
                        <Sparkline values={r.daily.map((d) => d.in_usd)} />
                      )
                    }
                  />
                  <Metric
                    label="Avg Ticket"
                    value={usd0(r.totals.avg_payment_usd)}
                    sub={`Peak ${usd0(r.totals.largest_payment_usd)}`}
                    tone="muted"
                  />
                  <Metric
                    icon={Globe2}
                    label="Cross-Border"
                    value={r.totals.cross_currency_payments}
                    sub="FX corridor conversions"
                    tone="primary"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
                  <LazyTrendChart
                    data={r.daily.map((d) => ({
                      label: d.date.slice(5),
                      a: d.out_usd,
                      b: d.in_usd,
                    }))}
                    aName="Money out (USD eq.)"
                    bName="Money in (USD eq.)"
                    ariaLabel="Money in and out per day, USD equivalent"
                    format={usd0}
                  />
                </div>
              </div>
            )}
          </QueryBoundary>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Settlement Reliability" delay={260}>
            <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
              {(r) => (
                <div className="space-y-4">
                  <LazyDonutChart
                    ariaLabel="Settlement outcomes"
                    data={[
                      { label: "Succeeded", value: r.totals.succeeded },
                      { label: "Failed", value: r.totals.failed },
                      { label: "Reversed", value: r.totals.reversed },
                    ]}
                    center={{
                      value: `${Math.round(r.totals.success_rate * 100)}%`,
                      label: "Success rate",
                    }}
                    format={(v) => String(v)}
                  />
                  <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center font-mono text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Settled</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.succeeded}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Failed</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.failed}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Reversed</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.reversed}</div>
                    </div>
                  </div>
                </div>
              )}
            </QueryBoundary>
          </Panel>

          <Panel
            title="Top Counterparties"
            delay={300}
            meta={
              <Chip tone="live">
                <TrendingUp className="size-3" /> Volume
              </Chip>
            }
          >
            <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
              {(r) => (
                <RankedBars
                  ariaLabel="Top counterparties by volume"
                  empty="Complete your first cross-border payment to rank counterparties."
                  items={(r.counterparties ?? []).slice(0, 4).map((c) => ({
                    label: c.name,
                    value: c.volume_usd,
                    display: usdCompact(c.volume_usd),
                    note: `${c.count} settled payment${c.count === 1 ? "" : "s"}`,
                  }))}
                />
              )}
            </QueryBoundary>
          </Panel>
        </div>
      </div>

      {/* Bottom Row: Recent Ledger Activity + Active Invoices + Notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          delay={340}
          title="Recent Ledger Transfers"
          className="lg:col-span-2"
          meta={
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
            >
              <Link to="/wallets">All transfers →</Link>
            </Button>
          }
        >
          <QueryBoundary
            query={transfers}
            isEmpty={(d) => d.length === 0}
            empty="No transfers yet. Top up your business wallet to get started."
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((t) => {
                  const dir = directionFor(t, ownIds);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            dir === "out"
                              ? "bg-muted text-foreground"
                              : dir === "in"
                                ? "bg-[#c2f74d]/35 text-foreground"
                                : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {dir === "out" ? (
                            <ArrowUpRight className="size-4" />
                          ) : dir === "in" ? (
                            <ArrowDownLeft className="size-4 text-[#4d7500]" />
                          ) : (
                            <ArrowRight className="size-4" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <span>
                              {dir === "out"
                                ? "Outbound Settlement"
                                : dir === "in"
                                  ? "Inbound Receipt"
                                  : "Internal Book Transfer"}
                            </span>
                            <span className="text-muted-foreground">· {shortId(t.id)}</span>
                            {t.invoice_number ? (
                              <span className="rounded bg-[#c2f74d]/30 px-1.5 py-0.5 text-[10px] text-foreground">
                                {t.invoice_number}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {when(t.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {dir === "out" ? "−" : dir === "in" ? "+" : ""}
                          {money(t.amount, t.currency)}
                        </span>
                        <Chip
                          tone={
                            t.status === "SUCCESS"
                              ? "live"
                              : t.status === "FAILED" || t.status === "REVERSED"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {t.status}
                        </Chip>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </QueryBoundary>
        </Panel>

        <Panel
          delay={400}
          title="Settlement & Support Feed"
          meta={<Chip tone={unread.length > 0 ? "live" : "neutral"}>{unread.length} unread</Chip>}
        >
          <QueryBoundary
            query={notifications}
            isEmpty={(d) => d.length === 0}
            empty="Nothing to report."
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div
                          className={
                            n.read_at
                              ? "text-sm text-muted-foreground"
                              : "flex items-center gap-1.5 text-sm font-semibold text-foreground"
                          }
                        >
                          {!n.read_at ? (
                            <span className="size-1.5 rounded-full bg-[#79b200]" />
                          ) : null}
                          {n.title}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {n.body}
                        </p>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {when(n.created_at)}
                        </div>
                      </div>
                      {!n.read_at ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 shrink-0 rounded-lg px-2 font-mono text-[10px] uppercase"
                          disabled={markRead.isPending}
                          onClick={() => markRead.mutate(n.id)}
                        >
                          Read
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </div>
  );
}
