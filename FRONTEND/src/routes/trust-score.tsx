import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scoreFactors, trustScore, traders, usd } from "@/lib/vuka-data";

export const Route = createFileRoute("/trust-score")({
  head: () => ({
    meta: [
      { title: "Algorithmic Trust & Credit Score — VUKA" },
      {
        name: "description",
        content:
          "A trade-credit score computed strictly from settlement outcomes: completed cycles, mutual releases, arbitration record, volume and counterparty diversity.",
      },
      { property: "og:title", content: "Algorithmic Trust & Credit Score — VUKA" },
      {
        property: "og:description",
        content: "Transparent, non-black-box trade credit scoring for East African SME traders.",
      },
    ],
  }),
  component: TrustScore,
});

function TrustScore() {
  function exportCertificate() {
    const lines = [
      "VUKA TRADE-CREDIT CERTIFICATE",
      "=============================",
      "Trader: Gikondo Coffee Collective (TRD-1041)",
      `Composite score: ${trustScore} / 850`,
      "",
      ...scoreFactors.map(
        (f) => `${f.label.padEnd(34)} weight ${f.weight}%  score ${f.value}/100  — ${f.detail}`,
      ),
      "",
      "Derived exclusively from on-platform settlement outcomes.",
      "No demographic, identity or inferred behavioural inputs are used.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vuka-trade-credit-certificate.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Trade-credit certificate exported");
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Credit engine"
        title="Algorithmic Trust & Credit Score"
        description="The score is a deterministic function of settlement history. Every point is attributable to a recorded escrow outcome — no opaque model, no identity proxies."
        actions={
          <Button onClick={exportCertificate} className="rounded-none font-mono text-xs uppercase">
            Export credit certificate
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="border border-border bg-card p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Composite score
          </div>
          <div className="mt-4 font-mono text-6xl tabular-nums tracking-tighter">{trustScore}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">of 850 · band A−</div>
          <div className="mt-6 space-y-2">
            <div className="h-1.5 w-full bg-muted">
              <div className="h-full bg-foreground" style={{ width: `${(trustScore / 850) * 100}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>300</span>
              <span>850</span>
            </div>
          </div>
          <dl className="mt-6 space-y-2 border-t border-border pt-4 font-mono text-[11px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Trader</dt>
              <dd>TRD-1041</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cycles scored</dt>
              <dd>51</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last recompute</dt>
              <dd>2026-09-12 06:00Z</dd>
            </div>
          </dl>
        </div>

        <Panel title="Factor breakdown" meta={<Chip tone="live">Deterministic</Chip>}>
          <ul className="space-y-5">
            {scoreFactors.map((f) => (
              <li key={f.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">{f.label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    weight {f.weight}% · {f.value}/100
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Excluded inputs" value="0" sub="No demographic or identity signals" />
        <Metric label="Appealable factors" value={scoreFactors.length} sub="Each factor is contestable at the tribunal" />
        <Metric label="Lender view" value="Read-only" sub="Certificate hash verifiable on chain" />
      </div>

      <Panel title="Counterparty scorecards" meta={<Chip>Network view</Chip>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="py-2">Trader</th>
              <th className="py-2">Country</th>
              <th className="py-2 text-right">30d volume</th>
              <th className="py-2 text-right">Tier</th>
              <th className="py-2 text-right">Indicative score</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((t, i) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5">{t.name}</td>
                <td className="py-2.5 text-muted-foreground">{t.country}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">${usd(t.volume30d)}</td>
                <td className="py-2.5 text-right font-mono">T{t.tier}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {t.tier === 0 ? "—" : trustScore - i * 37}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Shell>
  );
}
