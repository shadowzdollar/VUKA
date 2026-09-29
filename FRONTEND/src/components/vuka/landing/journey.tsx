import { useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { Sheet3D, Tilt } from "./tilt";

const STEPS = [
  {
    k: "Invoice",
    h: "The supplier raises an invoice",
    b: "Goods, quantity, price and currency are written down once. The buyer sees exactly what they are agreeing to, in their own language.",
    doc: ["INVOICE  #0412", "Maize flour · 40 t", "RWF 18,400,000"],
  },
  {
    k: "Quote",
    h: "A firm quote locks the price",
    b: "Fee, FX rate and delivered amount are signed and held for ten minutes. If the rate moves, the buyer is quoted again; nobody is charged more than they were shown.",
    doc: ["QUOTE  q1.7f3a…", "Fee 0.80 %", "Delivers KES 1,733,000"],
  },
  {
    k: "Escrow",
    h: "Funds are held, not handed over",
    b: "The payment goes into a smart-contract escrow. The supplier can see it is committed, and the buyer knows it cannot be spent until the goods are confirmed.",
    doc: ["ESCROW  HELD", "Release: on confirmation", "Timeout: 72 h"],
  },
  {
    k: "Delivery",
    h: "Goods move; both sides confirm",
    b: "The buyer confirms receipt. If they are silent, the escrow refunds them — silence never pays out. A dispute opens an arbitration window with a neutral arbiter.",
    doc: ["DELIVERY  CONFIRMED", "By buyer · 14 Mar", "No dispute raised"],
  },
  {
    k: "Payout",
    h: "Money lands in mobile money",
    b: "The ledger records a balanced double entry and the payout goes to the supplier's mobile-money wallet or bank rail. Every step is auditable afterwards.",
    doc: ["PAYOUT  SENT", "mtn-rw · wallet", "Ledger balanced ✓"],
  },
];

/** Five-step journey with a 3D paper stack that reshuffles to the step the reader selects. */
export function Journey() {
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  return (
    <section id="journey" className="scroll-mt-20 border-t border-border bg-muted/30">
      <div className="mx-auto px-4 py-20 sm:px-6 lg:px-10 2xl:px-16">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            The journey of one payment
          </div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            From a handshake to a settled ledger, in five steps you can see.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div role="tablist" aria-label="Payment journey" className="flex flex-wrap gap-1.5">
              {STEPS.map((s, n) => (
                <button
                  key={s.k}
                  role="tab"
                  id={`journey-tab-${n}`}
                  aria-selected={i === n}
                  aria-controls="journey-panel"
                  tabIndex={i === n ? 0 : -1}
                  onClick={() => setI(n)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") {
                      setI((i + 1) % STEPS.length);
                      document.getElementById(`journey-tab-${(i + 1) % STEPS.length}`)?.focus();
                    }
                    if (e.key === "ArrowLeft") {
                      const p = (i + STEPS.length - 1) % STEPS.length;
                      setI(p);
                      document.getElementById(`journey-tab-${p}`)?.focus();
                    }
                  }}
                  className={cn(
                    "border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    i === n
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span className="mr-1.5 opacity-60">{String(n + 1).padStart(2, "0")}</span>
                  {s.k}
                </button>
              ))}
            </div>
            <div
              id="journey-panel"
              role="tabpanel"
              aria-labelledby={`journey-tab-${i}`}
              tabIndex={0}
              className="mt-8 min-h-[200px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h3 className="font-display text-3xl leading-snug">{step.h}</h3>
              <p className="mt-4 max-w-lg text-muted-foreground">{step.b}</p>
            </div>
            <div className="mt-6 h-0.5 w-full bg-border" aria-hidden="true">
              <div
                className="h-full bg-foreground transition-[width] duration-500"
                style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <Tilt className="mx-auto h-[340px] w-full max-w-[520px]">
            <div aria-hidden="true" className="relative size-full">
              {STEPS.map((s, n) => {
                const depth = n - i; // sheets already handled fly away, upcoming ones stack behind
                const z = depth < 0 ? 90 : 60 - depth * 26;
                const y = depth < 0 ? -60 : depth * 16;
                const x = depth < 0 ? -30 : depth * 12;
                return (
                  <Sheet3D
                    key={s.k}
                    z={z}
                    className="absolute inset-x-6 top-6 h-[230px] p-5 font-mono text-xs transition-[transform,opacity] duration-700 ease-out"
                  >
                    <div
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                        opacity: depth < 0 ? 0 : 1,
                      }}
                      className="size-full transition-[transform,opacity] duration-700"
                    >
                      <div className="flex items-center justify-between border-b border-dashed border-border pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <span>Step {String(n + 1).padStart(2, "0")}</span>
                        <span>{s.k}</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {s.doc.map((l, k) => (
                          <div
                            key={l}
                            className={
                              k === 0 ? "font-display text-2xl" : "text-sm text-foreground/80"
                            }
                          >
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Sheet3D>
                );
              })}
            </div>
          </Tilt>
        </div>
      </div>
    </section>
  );
}
