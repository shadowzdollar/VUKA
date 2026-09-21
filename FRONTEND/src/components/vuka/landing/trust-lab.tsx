import { useState } from "react";
import { Reveal } from "./reveal";

interface Factor {
  id: string;
  label: string;
  weight: number;
  denom: number;
  unit: string;
  hint: string;
}
const FACTORS: Factor[] = [
  {
    id: "cycles",
    label: "Completed escrow cycles",
    weight: 35,
    denom: 10,
    unit: "cycles",
    hint: "Trades finished without a dispute against you",
  },
  {
    id: "invoices",
    label: "Invoices settled on time",
    weight: 25,
    denom: 5,
    unit: "invoices",
    hint: "Paid within the agreed terms",
  },
  {
    id: "reversals",
    label: "Clean payment record",
    weight: 20,
    denom: 10,
    unit: "payments",
    hint: "Share of payments never reversed",
  },
  {
    id: "volume",
    label: "Trading volume history",
    weight: 10,
    denom: 4,
    unit: "months",
    hint: "Months of steady activity",
  },
  {
    id: "diversity",
    label: "Counterparty diversity",
    weight: 10,
    denom: 5,
    unit: "partners",
    hint: "Distinct businesses you have traded with",
  },
];

export function TrustLab() {
  const [quality, setQuality] = useState<Record<string, number>>({
    cycles: 90,
    invoices: 90,
    reversals: 95,
    volume: 70,
    diversity: 60,
  });
  const [evidence, setEvidence] = useState<Record<string, number>>({
    cycles: 4,
    invoices: 2,
    reversals: 4,
    volume: 1,
    diversity: 2,
  });

  const rows = FACTORS.map((f) => {
    const conf = Math.min(1, (evidence[f.id] ?? 0) / f.denom);
    const pts = (550 * f.weight * (quality[f.id] ?? 0) * conf) / 10000;
    return { f, conf, pts };
  });
  const score = Math.round(300 + rows.reduce((a, r) => a + r.pts, 0));
  const band =
    score >= 750 ? "Excellent" : score >= 650 ? "Strong" : score >= 550 ? "Building" : "New";

  return (
    <section id="trust" className="scroll-mt-20 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Trust score lab
          </div>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            A reputation you can build, and can read.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            A VUKA trust score runs from 300 to 850. It is computed from five ledger-backed factors,
            each weighted, and each discounted until there is enough evidence to trust it. One good
            trade cannot buy a top score. Move the sliders to see how it works.
          </p>
          <div className="mt-8 border border-foreground p-6" aria-live="polite">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Your simulated score
            </div>
            <div className="mt-2 flex items-baseline gap-4">
              <span className="tabular font-display text-7xl leading-none">{score}</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em]">{band}</span>
            </div>
            <div
              className="relative mt-5 h-2 border border-foreground"
              role="img"
              aria-label={`Score ${score} on a 300 to 850 scale`}
            >
              <div
                className="h-full bg-foreground transition-[width] duration-500"
                style={{ width: `${((score - 300) / 550) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>300</span>
              <span>850</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Illustration of the published formula. A real score is computed by the engine from your
            own ledger history.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="space-y-5">
            {rows.map(({ f, conf, pts }) => (
              <fieldset key={f.id} className="border border-border bg-card p-4">
                <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                  {f.label} · weight {f.weight}%
                </legend>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs">
                    <span className="flex justify-between">
                      <span>Quality</span>
                      <span className="tabular font-mono">{quality[f.id]}%</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={quality[f.id]}
                      onChange={(e) => setQuality({ ...quality, [f.id]: Number(e.target.value) })}
                      className="mt-1 w-full accent-[var(--color-foreground)]"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="flex justify-between">
                      <span>Evidence ({f.unit})</span>
                      <span className="tabular font-mono">
                        {evidence[f.id]} / {f.denom}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={f.denom + 4}
                      value={evidence[f.id]}
                      onChange={(e) => setEvidence({ ...evidence, [f.id]: Number(e.target.value) })}
                      className="mt-1 w-full accent-[var(--color-foreground)]"
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span>confidence {(conf * 100).toFixed(0)}%</span>
                  <span className="h-1.5 flex-1 border border-border" aria-hidden="true">
                    <span
                      className="block h-full bg-foreground transition-[width]"
                      style={{ width: `${(pts / ((550 * f.weight) / 100)) * 100}%` }}
                    />
                  </span>
                  <span className="tabular text-foreground">+{pts.toFixed(0)} pts</span>
                </div>
              </fieldset>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
