import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  InsightList,
  PeriodPicker,
  usd0,
  usdCompact,
  type Period,
} from "@/components/vuka/analytics-parts";
import { LazyDonutChart, LazyHistogramChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import {
  ActivityHeatmap,
  FlowMatrix,
  Funnel,
  Gauge,
  RankedBars,
  Sparkline,
} from "@/components/vuka/viz/simple";
import { operator, platform } from "@/lib/api/endpoints";
import type { AnalyticsReport } from "@/lib/api/types";
import { buildInsights } from "@/lib/insights";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — VUKA" },
      {
        name: "description",
        content:
          "Volume trends, corridor flows, payment-size distribution, reliability and activity patterns.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <ByRole />
    </Shell>
  ),
});

function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <Intelligence /> : <Insights />;
}

const monthDay = (iso: string) => iso.slice(5);

function Trend({ r, aName, bName }: { r: AnalyticsReport; aName: string; bName?: string }) {
  const data = r.daily.map((d) => ({
    label: monthDay(d.date),
    a: d.out_usd,
    ...(bName ? { b: d.in_usd } : {}),
  }));
  return (
    <LazyTrendChart
      data={data}
      aName={aName}
      {...(bName ? { bName } : {})}
      ariaLabel={`${aName}${bName ? ` and ${bName}` : ""} per day, USD equivalent`}
      format={usd0}
    />
  );
}

function Basis({ r }: { r: AnalyticsReport }) {
  return (
    <p className="text-[11px] text-muted-foreground">
      Figures are USD-equivalent at the platform's <span className="font-mono">{r.rate_basis}</span>{" "}
      reference rates, over the last {r.period_days} days, counting settled payments between
      traders. Generated {new Date(r.generated_at).toLocaleString()}.
    </p>
  );
}

// ------------------------------------------------------------------------------------------------
// Trader
// ------------------------------------------------------------------------------------------------
function Insights() {
  const [days, setDays] = useState<Period>(30);
  const q = useQuery({
    queryKey: ["analytics", "trader", days],
    queryFn: () => platform.analytics(days),
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Your trade, in numbers"
        description="How money moves through your business: trends, where it goes, how reliably it settles and when you are most active. Everything is computed from your own ledger history."
        actions={<PeriodPicker value={days} onChange={setDays} />}
      />
      <QueryBoundary query={q} disabledCodes={["analytics_unavailable"]}>
        {(r) => <TraderBody r={r} />}
      </QueryBoundary>
    </>
  );
}

function TraderBody({ r }: { r: AnalyticsReport }) {
  const t = r.totals;
  const insights = useMemo(() => buildInsights(r), [r]);
  const outSeries = r.daily.map((d) => d.out_usd);
  const inSeries = r.daily.map((d) => d.in_usd);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Sent"
          value={usd0(t.sent_usd)}
          sub={`${t.payments_out} payments`}
          trend={<Sparkline values={outSeries} />}
        />
        <Metric
          label="Received"
          value={usd0(t.received_usd)}
          sub={`${t.payments_in} payments`}
          trend={<Sparkline values={inSeries} />}
        />
        <Metric
          label="Average payment"
          value={usd0(t.avg_payment_usd)}
          sub={`Largest ${usd0(t.largest_payment_usd)}`}
        />
        <Metric
          label="Cross-border"
          value={t.cross_currency_payments}
          sub="Settled payments across currencies"
        />
      </div>

      <Panel title="What the numbers say" meta={<Chip>{insights.length} observations</Chip>}>
        <InsightList items={insights} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <Panel title="Money in and out per day">
          <Trend r={r} aName="Money out" bName="Money in" />
        </Panel>
        <Panel title="Settlement reliability">
          <Gauge
            value={t.success_rate}
            label="Success rate"
            sub={`${t.succeeded} settled · ${t.failed} failed · ${t.reversed} reversed`}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Where your money moves">
          <LazyDonutChart
            data={r.currencies.map((c) => ({ label: c.label, value: c.value_usd }))}
            ariaLabel="Settled volume by currency"
            center={{ value: usdCompact(t.volume_usd), label: "settled" }}
            format={usd0}
          />
        </Panel>
        <Panel title="Payment outcomes">
          <LazyDonutChart
            data={r.statuses.map((s) => ({ label: s.label, value: s.count }))}
            ariaLabel="Payments by outcome"
            center={{ value: String(t.payments), label: "payments" }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Payment size distribution">
          <LazyHistogramChart
            data={r.histogram.map((b) => ({ label: b.label, count: b.count }))}
            ariaLabel="Settled payments by size, USD equivalent"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Each bar counts settled payments whose USD value falls in the range.
          </p>
        </Panel>
        <Panel title="Top counterparties">
          <RankedBars
            ariaLabel="Counterparties by settled volume"
            items={(r.counterparties ?? []).map((c) => ({
              label: c.name,
              value: c.volume_usd,
              display: usd0(c.volume_usd),
              note: `${c.count} payment${c.count === 1 ? "" : "s"}`,
            }))}
          />
        </Panel>
      </div>

      <Panel title="Corridor flows">
        <FlowMatrix flows={r.corridors} format={usdCompact} />
      </Panel>

      <Panel title="When you are active">
        <ActivityHeatmap grid={r.heatmap} />
      </Panel>
      <Basis r={r} />
    </>
  );
}

// ------------------------------------------------------------------------------------------------
// Operator
// ------------------------------------------------------------------------------------------------
function Intelligence() {
  const [days, setDays] = useState<Period>(30);
  const q = useQuery({
    queryKey: ["analytics", "platform", days],
    queryFn: () => operator.analytics(days),
    staleTime: 60_000,
  });
  return (
    <>
      <PageHeader
        eyebrow="Network intelligence"
        title="Platform analytics"
        description="Throughput, corridor flows, payment mix, verification funnel and rail reliability across the whole network — the operational picture an oversight body would ask for."
        actions={<PeriodPicker value={days} onChange={setDays} />}
      />
      <QueryBoundary query={q} disabledCodes={["analytics_unavailable"]}>
        {(r) => <PlatformBody r={r} />}
      </QueryBoundary>
    </>
  );
}

const KYC_LABEL: Record<string, string> = {
  PENDING: "Unverified",
  VERIFIED: "Verified",
  APPROVED: "Verified",
  BUSINESS_VERIFIED: "Business verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

function PlatformBody({ r }: { r: AnalyticsReport }) {
  const t = r.totals;
  const insights = useMemo(() => buildInsights(r), [r]);
  const kyc = r.kyc ?? [];
  const count = (k: string) => kyc.find((x) => x.label === k)?.count ?? 0;
  const total = t.total_traders ?? 0;
  const verified = count("VERIFIED") + count("APPROVED") + count("BUSINESS_VERIFIED");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Settled volume"
          value={usd0(t.volume_usd)}
          sub={`${t.succeeded} payments`}
          trend={<Sparkline values={r.daily.map((d) => d.out_usd)} />}
        />
        <Metric
          label="Success rate"
          value={`${Math.round(t.success_rate * 100)}%`}
          sub={`${t.failed} failed · ${t.reversed} reversed`}
          trend={<Sparkline values={r.daily.map((d) => d.failed)} />}
        />
        <Metric
          label="Active traders"
          value={t.active_traders ?? 0}
          sub={`${t.new_traders ?? 0} new · ${total} total`}
        />
        <Metric label="Cash-in" value={usd0(t.cash_in_usd)} sub="Wallet top-ups settled" />
      </div>

      <Panel title="What the numbers say" meta={<Chip>{insights.length} observations</Chip>}>
        <InsightList items={insights} />
      </Panel>

      <Panel title="Settled volume per day">
        <Trend r={r} aName="Settled volume" />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Volume by currency">
          <LazyDonutChart
            data={r.currencies.map((c) => ({ label: c.label, value: c.value_usd }))}
            ariaLabel="Settled volume by currency"
            center={{ value: usdCompact(t.volume_usd), label: "settled" }}
            format={usd0}
          />
        </Panel>
        <Panel title="Payment outcomes">
          <LazyDonutChart
            data={r.statuses.map((s) => ({ label: s.label, value: s.count }))}
            ariaLabel="Payments by outcome"
            center={{ value: String(t.payments), label: "payments" }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel title="Corridor flow matrix">
        <FlowMatrix flows={r.corridors} format={usdCompact} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Payment size distribution">
          <LazyHistogramChart
            data={r.histogram.map((b) => ({ label: b.label, count: b.count }))}
            ariaLabel="Settled payments by size, USD equivalent"
          />
        </Panel>
        <Panel title="Verification funnel">
          <Funnel
            ariaLabel="Trader verification funnel"
            stages={[
              { label: "All traders", count: total },
              { label: "Verified or above", count: verified },
              { label: "Business verified", count: count("BUSINESS_VERIFIED") },
            ]}
          />
          <div className="mt-5">
            <LazyDonutChart
              data={kyc.map((k) => ({ label: KYC_LABEL[k.label] ?? k.label, value: k.count }))}
              ariaLabel="Traders by verification level"
              center={{ value: String(total), label: "traders" }}
              format={(v) => String(v)}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Rail reliability">
          <RankedBars
            ariaLabel="Provider success rate"
            empty="No provider executions in this period."
            items={(r.providers ?? []).map((p) => ({
              label: p.provider,
              value: p.success_rate * 100,
              display: `${Math.round(p.success_rate * 100)}%`,
              note: `${p.succeeded} ok · ${p.failed} failed · ${p.total} calls`,
            }))}
          />
        </Panel>
        <Panel title="Cross-border workflows">
          <RankedBars
            ariaLabel="Workflows by state"
            empty="No workflows in this period."
            items={(r.workflows ?? []).map((w) => ({
              label: w.label.replaceAll("_", " "),
              value: w.count,
              display: String(w.count),
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Support load">
          <LazyDonutChart
            data={(r.tickets ?? []).map((k) => ({ label: k.label, value: k.count }))}
            ariaLabel="Support tickets by status"
            center={{
              value: String((r.tickets ?? []).reduce((s, k) => s + k.count, 0)),
              label: "tickets",
            }}
            format={(v) => String(v)}
          />
        </Panel>
        <Panel title="Settlement commands">
          <LazyDonutChart
            data={(r.settlements ?? []).map((k) => ({ label: k.label, value: k.count }))}
            ariaLabel="Settlement commands by status"
            center={{
              value: String((r.settlements ?? []).reduce((s, k) => s + k.count, 0)),
              label: "commands",
            }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel title="Network activity by weekday and hour">
        <ActivityHeatmap grid={r.heatmap} />
      </Panel>
      <Basis r={r} />
    </>
  );
}
