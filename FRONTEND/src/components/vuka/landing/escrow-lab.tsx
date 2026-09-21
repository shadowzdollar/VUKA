import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { parseAmount } from "@/lib/schemas";
import { Reveal } from "./reveal";

const FEE_BPS = 50; // illustrative protocol fee; the contract caps it at 100 bps (1%)

interface Scenario {
  id: string;
  title: string;
  story: string;
  /** share of the escrow to the supplier, basis points */
  supplierBps: number;
  fee: boolean;
  steps: string[];
  rule: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "ok",
    title: "Goods arrive",
    story: "Buyer confirms delivery.",
    supplierBps: 10000,
    fee: true,
    steps: [
      "Buyer funds escrow",
      "Goods delivered",
      "Buyer confirms",
      "Escrow releases to supplier",
    ],
    rule: "Any confirmation releases the funds to the supplier.",
  },
  {
    id: "silence",
    title: "Buyer goes silent",
    story: "Nobody confirms before the timeout.",
    supplierBps: 0,
    fee: false,
    steps: [
      "Buyer funds escrow",
      "Timeout passes",
      "No confirmation on record",
      "Escrow refunds the buyer",
    ],
    rule: "Silence never pays out. If nobody confirms, the buyer is refunded in full.",
  },
  {
    id: "split",
    title: "Partial delivery",
    story: "Dispute; arbiter awards 70% to the supplier.",
    supplierBps: 7000,
    fee: true,
    steps: [
      "Buyer funds escrow",
      "Buyer disputes",
      "Arbiter reviews evidence",
      "Escrow splits 70 / 30",
    ],
    rule: "An arbiter can split the escrow in any proportion. The fee applies only to the supplier's share.",
  },
  {
    id: "absent",
    title: "Arbiter never answers",
    story: "The dispute window closes with no ruling.",
    supplierBps: 5000,
    fee: true,
    steps: [
      "Buyer funds escrow",
      "Dispute opened",
      "Arbiter silent past window",
      "Anyone triggers the 50 / 50 fallback",
    ],
    rule: "After the window, anyone can trigger an even split. A missing arbiter cannot lock funds forever.",
  },
];

export function EscrowLab() {
  const [sid, setSid] = useState("ok");
  const [text, setText] = useState("10000");
  const amount = parseAmount(text) ?? 0;
  const s = SCENARIOS.find((x) => x.id === sid)!;

  const r = useMemo(() => {
    const supplierGross = (amount * s.supplierBps) / 10000;
    const fee = s.fee ? (supplierGross * FEE_BPS) / 10000 : 0;
    return { supplier: supplierGross - fee, buyer: amount - supplierGross, fee };
  }, [amount, s]);
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <section id="escrow" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Escrow lab
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Pick what goes wrong. See where the money goes.
          </h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            The escrow contract is public code with a small set of rules. These four scenarios are
            the ones every cross-border trader worries about, worked through with your own amount.
            Illustrative protocol fee: {(FEE_BPS / 100).toFixed(2)}% (the contract caps it at 1%).
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div
            role="radiogroup"
            aria-label="Scenario"
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
          >
            {SCENARIOS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={sid === x.id}
                onClick={() => setSid(x.id)}
                className={cn(
                  "border p-4 text-left transition-colors",
                  sid === x.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-accent",
                )}
              >
                <div className="font-display text-xl">{x.title}</div>
                <div
                  className={cn(
                    "mt-1 text-xs",
                    sid === x.id ? "opacity-80" : "text-muted-foreground",
                  )}
                >
                  {x.story}
                </div>
              </button>
            ))}
          </div>

          <div className="border border-border bg-card p-5 sm:p-7">
            <div className="max-w-xs space-y-1.5">
              <Label
                htmlFor="escrow-amount"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Amount held in escrow
              </Label>
              <Input
                id="escrow-amount"
                inputMode="decimal"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-10 rounded-none font-mono"
              />
            </div>

            <ol className="mt-6 grid gap-2 sm:grid-cols-4" aria-label="What happens">
              {s.steps.map((st, n) => (
                <li key={st} className="border border-border p-3 text-xs">
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {String(n + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1">{st}</div>
                </li>
              ))}
            </ol>

            <div className="mt-6" aria-live="polite">
              <div
                className="flex h-10 w-full overflow-hidden border border-foreground"
                role="img"
                aria-label={`Supplier ${fmt(r.supplier)}, buyer ${fmt(r.buyer)}, protocol fee ${fmt(r.fee)}`}
              >
                {amount > 0 ? (
                  <>
                    <div
                      className="bg-foreground transition-[width] duration-500"
                      style={{ width: `${(r.supplier / amount) * 100}%` }}
                    />
                    <div
                      className="bg-[repeating-linear-gradient(135deg,var(--color-foreground)_0_2px,transparent_2px_6px)] transition-[width] duration-500"
                      style={{ width: `${(r.fee / amount) * 100}%` }}
                    />
                    <div
                      className="transition-[width] duration-500"
                      style={{ width: `${(r.buyer / amount) * 100}%` }}
                    />
                  </>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <dt className="text-muted-foreground">Supplier receives</dt>
                  <dd className="tabular font-display text-2xl">{fmt(r.supplier)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Buyer refunded</dt>
                  <dd className="tabular font-display text-2xl">{fmt(r.buyer)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Protocol fee</dt>
                  <dd className="tabular font-display text-2xl">{fmt(r.fee)}</dd>
                </div>
              </dl>
            </div>
            <p className="mt-5 border-t border-dashed border-border pt-4 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                The rule ·{" "}
              </span>
              {s.rule}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
