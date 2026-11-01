import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Download,
  FileCode2,
  Fingerprint,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { LazyRadarView } from "@/components/vuka/lazy-charts";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { platform } from "@/lib/api/endpoints";
import type { TrustFactor } from "@/lib/api/types";
import { day } from "@/lib/format";
import { useTrader } from "@/lib/session";

export const Route = createFileRoute("/trust-score")({
  head: () => ({
    meta: [
      { title: "Trust & Credit Score — VUKA" },
      {
        name: "description",
        content: "A transparent score computed from your real settlement history in the ledger.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <TrustScore />
    </Shell>
  ),
});

const ACTIONS: Record<string, string> = {
  cycles:
    "Complete more payments. Ten finished payments give this factor its full weight; failed payments lower the rate.",
  invoices: "Issue invoices and get them paid. Five invoices give this factor its full weight.",
  reversals: "Avoid reversals: agree amounts and recipients before sending.",
  volume:
    "Keep activity steady across consecutive 30-day windows (four settled payments across two windows).",
  diversity:
    "Trade with more distinct partners. Five different counterparties give this factor its full weight.",
};

const ACTION_LINKS: Record<string, { label: string; to: "/send" | "/escrow" }> = {
  cycles: { label: "Send Payment", to: "/send" },
  invoices: { label: "Issue Invoice", to: "/escrow" },
  reversals: { label: "Send Payment", to: "/send" },
  volume: { label: "Send Payment", to: "/send" },
  diversity: { label: "Send Payment", to: "/send" },
};

/** score = 300 + 550 × Σ(weight × value × confidence) / 10 000, so each lever has an exact point value. */
function opportunities(factors: TrustFactor[]) {
  return factors
    .map((f) => {
      const raiseValue = (550 * f.weight * (100 - f.value) * f.confidence) / 10_000;
      const addEvidence = (550 * f.weight * f.value * (1 - f.confidence)) / 10_000;
      const potential =
        raiseValue + addEvidence + (550 * f.weight * (100 - f.value) * (1 - f.confidence)) / 10_000;
      return {
        factor: f,
        points: Math.round(potential),
        lever: addEvidence >= raiseValue ? "evidence" : "quality",
      };
    })
    .filter((o) => o.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function ScoreSpeedometer({ score, cyclesScored }: { score: number; cyclesScored: number }) {
  const pct = cyclesScored === 0 ? 0 : Math.max(0, Math.min(1, (score - 300) / 550));
  const r = 74;
  const cx = 96;
  const cy = 96;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 250 / 360;
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength * (1 - pct);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 192 164" className="w-52 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="vuka-trust-gauge" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="45%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#c2f74d" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={13}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(145 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#vuka-trust-gauge)"
          strokeWidth={13}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(145 ${cx} ${cy})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
          Composite Index
        </span>
        <span className="mt-0.5 font-mono text-4xl font-bold tabular-nums tracking-tighter text-white">
          {cyclesScored === 0 ? "—" : score}
        </span>
        <span className="mt-1 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/15 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2f74d]">
          {cyclesScored === 0 ? "Unscored" : `${Math.round(pct * 100)}th pct`}
        </span>
      </div>
      <div className="-mt-2 flex w-44 justify-between font-mono text-[10px] text-white/45">
        <span>300 FLOOR</span>
        <span>850 CEILING</span>
      </div>
    </div>
  );
}

function TrustScore() {
  const trader = useTrader();
  const trustQuery = useQuery({
    queryKey: ["trust", trader.id],
    queryFn: platform.trust,
    staleTime: 60_000,
  });
  const result = trustQuery.data
    ? { ...trustQuery.data, cyclesScored: trustQuery.data.cycles_scored }
    : null;
  const failure = trustQuery.isError ? trustQuery : undefined;

  async function exportCertificate() {
    if (!result) return;
    const issued = new Date().toISOString();
    const lines = [
      "VUKA TRADE-CREDIT CERTIFICATE",
      "=============================",
      `Trader: ${trader.full_name} (${trader.id})`,
      `Issued: ${issued}`,
      `Composite score: ${result.score} / 850 (band ${result.band})`,
      `Settlement cycles scored: ${result.cyclesScored}`,
      "",
      ...result.factors.map(
        (f) =>
          `${f.label.padEnd(32)} weight ${String(f.weight).padStart(2)}%  score ${Math.round(f.value)}/100  evidence ${Math.round(f.confidence * 100)}%  — ${f.detail}`,
      ),
      "",
      "Derived exclusively from on-platform ledger settlement outcomes.",
      "No demographic, identity or inferred behavioural inputs are used.",
      "Informational only; not a credit decision.",
    ];
    const body = lines.join("\n");
    const digest = await sha256Hex(body);
    const url = URL.createObjectURL(
      new Blob([`${body}\n\nSHA-256 of the text above: ${digest}\n`], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `vuka-trade-credit-certificate-${day(issued)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Trade-credit certificate exported", {
      description: `SHA-256 ${digest.slice(0, 12)}…`,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Deterministic Credit Engine"
        title="Trust & Credit Score"
        description="The score is a deterministic function of your settlement history. Every point is attributable to a recorded ledger outcome — no opaque model, no identity proxies."
        actions={
          <Button
            onClick={() => void exportCertificate()}
            disabled={!result || result.cyclesScored === 0}
            className="gap-2 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <Download className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
            Export credit certificate
          </Button>
        }
      />

      {failure ? (
        <ErrorState error={failure.error} onRetry={() => void trustQuery.refetch()} />
      ) : !result ? (
        <Loading />
      ) : (
        <>
          {/* Executive Trade-Credit Passport Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
            <img
              src={escrowGlobe}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -bottom-16 w-[340px] opacity-[0.14] mix-blend-screen select-none"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-[#c2f74d]/10 blur-3xl"
            />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_240px_280px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                  <Award className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                    Verified Ledger Credit Passport · Band {result.band}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {trader.full_name}
                </h2>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/65">
                  Computed directly from double-entry journal postings using the published linear
                  formula{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#c2f74d]">
                    300 + 550 × Σ(weight × value × evidence) ÷ 10,000
                  </code>
                  . Export a SHA-256 signed certificate at any time for supplier or trade-finance
                  underwriting.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <Layers className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                    <span>Cycles Scored:</span>
                    <strong className="text-white">{result.cyclesScored}</strong>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Credit Band:</span>
                    <strong className="text-[#c2f74d]">
                      {result.cyclesScored === 0 ? "Unscored" : `Band ${result.band}`}
                    </strong>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <Fingerprint className="size-3.5 text-sky-400" aria-hidden="true" />
                    <span>Demographic Inputs:</span>
                    <strong className="text-white">0 (Excluded)</strong>
                  </div>
                </div>
              </div>

              {/* Center: Speedometer Gauge */}
              <div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <ScoreSpeedometer score={result.score} cyclesScored={result.cyclesScored} />
              </div>

              {/* Right: Certificate Preview Card */}
              <div className="flex flex-col justify-between rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      SHA-256 Attestation
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#c2f74d]">
                      <FileCode2 className="size-3" aria-hidden="true" />
                      Deterministic
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-white/50">Composite score</dt>
                      <dd className="font-bold text-white">
                        {result.cyclesScored === 0 ? "—" : `${result.score} / 850`}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">Standing tier</dt>
                      <dd className="text-[#c2f74d]">
                        {result.cyclesScored === 0 ? "No history" : `of 850 · band ${result.band}`}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">Active factors</dt>
                      <dd className="text-white">{result.factors.length} weighted vectors</dd>
                    </div>
                  </dl>
                </div>

                <Button
                  onClick={() => void exportCertificate()}
                  disabled={result.cyclesScored === 0}
                  className="mt-4 w-full gap-1.5 rounded-lg bg-[#c2f74d] font-mono text-[11px] font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Download Signed .TXT
                </Button>
              </div>
            </div>
          </div>

          {/* 3-Column Governance Metrics */}
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label="Excluded inputs"
              value="0"
              sub="No demographic or identity signals"
              accent="lime"
            />
            <Metric
              label="Scored factors"
              value={result.factors.length}
              sub="Each traceable to ledger rows"
            />
            <Metric
              label="Evidence weighting"
              value="On"
              sub="Thin history is pulled toward the floor"
            />
          </div>

          {/* Factor Breakdown + Radar & Levers */}
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel
              title="Factor breakdown"
              subtitle="Exact point contribution, raw factor performance, and ledger evidence depth"
              meta={<Chip tone="live">Deterministic</Chip>}
            >
              <ul className="space-y-4">
                {result.factors.map((f) => {
                  const maxPts = Math.round((550 * f.weight) / 100);
                  const earnedPts = Math.round((550 * f.weight * f.value * f.confidence) / 10_000);
                  return (
                    <li
                      key={f.key}
                      className="rounded-xl border border-border/80 bg-muted/15 p-4 transition-colors hover:border-foreground/25"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight text-foreground">
                            {f.label}
                          </span>
                          <span className="rounded bg-[#151515] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c2f74d]">
                            +{earnedPts} / {maxPts} pts
                          </span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          weight {f.weight}% · {Math.round(f.value)}/100 · evidence{" "}
                          {Math.round(f.confidence * 100)}%
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                            <span>Factor Quality</span>
                            <span className="font-semibold text-foreground">
                              {Math.round(f.value)} / 100
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#151515] transition-all duration-500"
                              style={{ width: `${f.value}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                            <span>Evidence Confidence</span>
                            <span className="font-semibold text-foreground">
                              {Math.round(f.confidence * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#79b200] transition-all duration-500"
                              style={{ width: `${Math.round(f.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-muted-foreground">{f.detail}</p>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <div className="space-y-4">
              <Panel
                title="Score shape"
                subtitle="Effective weighted footprint vs theoretical 850 ceiling"
              >
                <LazyRadarView
                  ariaLabel="Trust factors: current effective value and potential"
                  data={result.factors.map((f) => ({
                    axis: f.label.split(" ")[0] ?? f.label,
                    value: f.value * f.confidence,
                    potential: 100,
                  }))}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  The solid shape is each factor's value weighted by how much evidence backs it; the
                  dashed outline is the ceiling.
                </p>
              </Panel>

              <Panel
                title="Path to a higher score"
                subtitle="Highest-yield ledger actions ranked by exact point unlock"
                meta={<Chip tone="lime">{opportunities(result.factors).length} levers</Chip>}
              >
                {opportunities(result.factors).length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-950">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>Every factor is at its ceiling.</span>
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {opportunities(result.factors).map((o, i) => {
                      const cta = ACTION_LINKS[o.factor.key];
                      return (
                        <li
                          key={o.factor.key}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-muted/15 p-3.5"
                        >
                          <div className="flex gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#151515] font-mono text-[11px] font-bold text-[#c2f74d]">
                              0{i + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                <span>{o.factor.label}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#79b200]/35 bg-[#c2f74d]/25 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                                  <TrendingUp className="size-3 text-[#4d7300]" />+{o.points} pts
                                  possible
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {ACTIONS[o.factor.key] ?? o.factor.detail}
                              </p>
                            </div>
                          </div>
                          {cta ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 shrink-0 gap-1 rounded-md font-mono text-[10px] uppercase"
                            >
                              <Link to={cta.to}>
                                {cta.label}
                                <ArrowUpRight className="size-3" />
                              </Link>
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}
                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Sparkles className="size-3.5 shrink-0 text-[#79b200]" aria-hidden="true" />
                  Point values come from the published formula: 300 + 550 × Σ(weight × value ×
                  evidence) ÷ 10 000.
                </p>
              </Panel>
            </div>
          </div>

          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            Mutual-release rate and arbitration record are not part of this score yet: the engine
            keys on-chain escrows to wallet addresses rather than to traders, so they cannot be
            attributed to you.
          </p>
        </>
      )}
    </>
  );
}
