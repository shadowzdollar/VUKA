import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loading, ErrorState } from "@/components/vuka/query-state";
import { LazyRadarView } from "@/components/vuka/lazy-charts";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import type { TrustFactor } from "@/lib/api/types";
import { day } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { platform } from "@/lib/api/endpoints";

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
        eyebrow="Credit engine"
        title="Trust & Credit Score"
        description="The score is a deterministic function of your settlement history. Every point is attributable to a recorded ledger outcome — no opaque model, no identity proxies."
        actions={
          <Button
            onClick={() => void exportCertificate()}
            disabled={!result || result.cyclesScored === 0}
            className="rounded-none font-mono text-xs uppercase"
          >
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
          <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
            <div className="border border-border bg-card p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Composite score
              </div>
              <div className="mt-4 font-mono text-6xl tabular-nums tracking-tighter">
                {result.cyclesScored === 0 ? "—" : result.score}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {result.cyclesScored === 0
                  ? "No settled payments yet"
                  : `of 850 · band ${result.band}`}
              </div>
              <div className="mt-6 space-y-2">
                <div className="h-1.5 w-full bg-muted">
                  <div
                    className="h-full bg-foreground"
                    style={{
                      width: `${result.cyclesScored === 0 ? 0 : ((result.score - 300) / 550) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>300</span>
                  <span>850</span>
                </div>
              </div>
              <dl className="mt-6 space-y-2 border-t border-border pt-4 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Trader</dt>
                  <dd>{trader.full_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cycles scored</dt>
                  <dd>{result.cyclesScored}</dd>
                </div>
              </dl>
            </div>

            <Panel title="Factor breakdown" meta={<Chip tone="live">Deterministic</Chip>}>
              <ul className="space-y-5">
                {result.factors.map((f) => (
                  <li key={f.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">{f.label}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        weight {f.weight}% · {Math.round(f.value)}/100 · evidence{" "}
                        {Math.round(f.confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-muted">
                      <div className="h-full bg-foreground" style={{ width: `${f.value}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{f.detail}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Score shape">
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
              meta={<Chip>{opportunities(result.factors).length} levers</Chip>}
            >
              {opportunities(result.factors).length === 0 ? (
                <p className="text-sm text-muted-foreground">Every factor is at its ceiling.</p>
              ) : (
                <ol className="space-y-4">
                  {opportunities(result.factors).map((o, i) => (
                    <li key={o.factor.key} className="flex gap-3">
                      <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                      <div>
                        <div className="text-sm">
                          {o.factor.label}
                          <span className="ml-2 font-mono text-xs">+{o.points} pts possible</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ACTIONS[o.factor.key] ?? o.factor.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-[11px] text-muted-foreground">
                Point values come from the published formula: 300 + 550 × Σ(weight × value ×
                evidence) ÷ 10 000.
              </p>
            </Panel>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Excluded inputs" value="0" sub="No demographic or identity signals" />
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

          <p className="border border-dashed border-border p-3 text-xs text-muted-foreground">
            Mutual-release rate and arbitration record are not part of this score yet: the engine
            keys on-chain escrows to wallet addresses rather than to traders, so they cannot be
            attributed to you.
          </p>
        </>
      )}
    </>
  );
}
