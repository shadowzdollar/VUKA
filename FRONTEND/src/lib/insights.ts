import type { AnalyticsReport } from "@/lib/api/types";
import { busiest } from "@/components/vuka/viz/simple";

export interface Insight {
  title: string;
  body: string;
  /** "watch" items deserve attention; "info" items are neutral facts. */
  tone: "info" | "watch";
}

const usd = (n: number) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Plain-language observations derived deterministically from a report. Each statement quotes the
 * figures it is based on, so a reader can verify it against the charts.
 */
export function buildInsights(r: AnalyticsReport): Insight[] {
  const t = r.totals;
  const out: Insight[] = [];
  if (t.payments === 0) {
    return [
      {
        title: "No payments in this period",
        body: "Once payments settle, this page shows volume trends, corridor usage and reliability. Send a payment or widen the period to see data.",
        tone: "info",
      },
    ];
  }

  // Momentum: second half of the period vs the first half.
  const half = Math.floor(r.daily.length / 2);
  const sum = (days: typeof r.daily) => days.reduce((s, d) => s + d.out_usd + d.in_usd, 0);
  const first = sum(r.daily.slice(0, half));
  const second = sum(r.daily.slice(half));
  if (first > 0 && second > 0) {
    const change = (second - first) / first;
    out.push({
      title: change >= 0 ? "Volume is growing" : "Volume is slowing",
      body: `The second half of the period moved ${usd(second)} against ${usd(first)} in the first half (${change >= 0 ? "+" : ""}${Math.round(change * 100)}%).`,
      tone: change < -0.25 ? "watch" : "info",
    });
  }

  const finished = t.succeeded + t.failed + t.reversed;
  if (finished >= 5) {
    const bad = t.failed + t.reversed;
    out.push({
      title:
        t.success_rate >= 0.9 ? "Reliable settlement" : "Settlement reliability needs attention",
      body: `${t.succeeded} of ${finished} finished payments settled (${pct(t.success_rate)}); ${bad} failed or were reversed.`,
      tone: t.success_rate >= 0.9 ? "info" : "watch",
    });
  }

  const top = r.counterparties?.[0];
  if (top && t.volume_usd > 0) {
    const share = top.volume_usd / t.volume_usd;
    if (share >= 0.5) {
      out.push({
        title: "Concentrated on one counterparty",
        body: `${top.name} accounts for ${pct(share)} of your settled volume. Spreading activity across partners also strengthens your trust score.`,
        tone: "watch",
      });
    }
  }

  if (t.succeeded > 0) {
    const share = t.cross_currency_payments / t.succeeded;
    out.push({
      title: share > 0 ? "Cross-border share" : "All activity is domestic",
      body:
        share > 0
          ? `${pct(share)} of settled payments crossed a currency border${r.corridors[0] ? `, led by ${r.corridors[0].from} → ${r.corridors[0].to} (${usd(r.corridors[0].volume_usd)})` : ""}.`
          : "No settled payment crossed a currency border in this period.",
      tone: "info",
    });
    out.push({
      title: "Typical payment size",
      body: `The average settled payment is ${usd(t.avg_payment_usd)}; the largest was ${usd(t.largest_payment_usd)}.`,
      tone: "info",
    });
  }

  const slot = busiest(r.heatmap);
  if (slot !== "—")
    out.push({
      title: "Busiest time",
      body: `Most activity happens on ${slot} UTC.`,
      tone: "info",
    });
  return out;
}
