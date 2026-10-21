import { ArrowRight, CheckCircle2, FileCheck2, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const kicker = "font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground";

/** Editorial panels from the approved landing reference, kept separate from the interactive modules. */
export function ReferencePanels() {
  return (
    <>
      <section className="border-t border-border bg-[#081014] text-white">
        <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
          <Reveal className="border-b border-white/15 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-16">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
              The challenge
            </div>
            <h2 className="mt-5 max-w-xl font-display text-4xl leading-[0.96] sm:text-6xl">
              Cross-border trade is complex.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">
              Multiple documents, different regulations, exchange rates and limited visibility
              create friction at every step. VUKA makes the agreement and its evidence readable in
              one place.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-px border border-white/15 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 sm:grid-cols-4">
              {["Documents", "Compliance", "Payments & FX", "Logistics"].map((item, index) => (
                <div key={item} className="min-h-24 border-white/15 p-4">
                  <span className="block text-white/35">0{index + 1}</span>
                  <span className="mt-7 block">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80} className="relative overflow-hidden p-8 sm:p-12 lg:p-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:44px_44px]"
            />
            <div className="relative max-w-md">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
                Trust &amp; transparency
              </div>
              <h2 className="mt-5 font-display text-4xl leading-[0.96] sm:text-6xl">
                Every transaction has a record.
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-white/70">
                Verified documents, transparent status and a complete audit trail build trust across
                every trade.
              </p>
              <a
                href="#journey"
                className="mt-8 inline-flex items-center gap-2 border-b border-white pb-1 text-sm"
              >
                Learn more <ArrowRight className="size-3.5" />
              </a>
            </div>
            <div className="relative ml-auto mt-10 grid max-w-md grid-cols-[1.25fr_.75fr] gap-3 font-mono text-[10px] text-[#111]">
              <div className="rotate-[-3deg] bg-[#f7f7f4] p-5 shadow-2xl">
                <FileCheck2 className="size-5" />
                <p className="mt-5 text-xs font-semibold">Commercial Invoice</p>
                <div className="mt-5 space-y-2 text-[9px] text-black/55">
                  <p>Exporter · Mombasa Traders Ltd</p>
                  <p>Importer · Lagos Supplies Co</p>
                  <p>Amount · USD 250,000</p>
                  <p>Currency · USD</p>
                </div>
                <span className="mt-8 inline-block rotate-[-8deg] border-2 border-[#111] px-2 py-1 text-[9px] tracking-[.16em]">
                  VERIFIED
                </span>
              </div>
              <div className="self-center border border-white/30 bg-black/40 p-4 text-white">
                <p className="text-white/50">TXN-2024-0012</p>
                <div className="mt-7 space-y-3">
                  <p>◉ Verified</p>
                  <p>◉ Approved</p>
                  <p>◉ Settled</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border bg-[#f7f7f4]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-7 py-16 sm:px-12 lg:grid-cols-[.72fr_1.28fr] lg:px-16 lg:py-20">
          <Reveal>
            <div className={kicker}>The platform</div>
            <h2 className="mt-5 font-display text-4xl leading-[.96] sm:text-6xl">
              Full visibility. Total control.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Track your transactions, manage documents, monitor payments and stay in control — all
              in one place.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Real-time transaction tracking",
                "Document management",
                "Multi-currency support",
                "Role-based access",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-9 rounded-none font-mono text-xs uppercase">
              <Link to="/register">
                Start trading <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </Reveal>
          <Reveal
            delay={100}
            className="min-w-0 border border-[#d7d7d1] bg-white p-3 shadow-xl sm:p-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <strong className="tracking-[.18em]">VUKA</strong>
              <Search className="size-4 text-muted-foreground" />
            </div>
            <div className="grid min-h-[350px] grid-cols-[110px_1fr] pt-4 sm:grid-cols-[150px_1fr]">
              <aside className="hidden border-r border-border pr-4 text-xs text-muted-foreground sm:block">
                <p className="mb-5 font-medium text-foreground">Dashboard</p>
                {["Transactions", "Documents", "Payments", "Trade partners", "Settings"].map(
                  (item) => (
                    <p key={item} className="mb-4">
                      {item}
                    </p>
                  ),
                )}
              </aside>
              <div className="min-w-0 pl-0 sm:pl-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl">Transactions</h3>
                  <span className="bg-foreground px-2 py-1 font-mono text-[9px] uppercase text-background">
                    New transaction
                  </span>
                </div>
                <div className="mt-5 overflow-hidden border border-border">
                  <div className="grid grid-cols-4 border-b border-border bg-muted/50 p-3 font-mono text-[9px] uppercase text-muted-foreground">
                    <span>Reference</span>
                    <span>Partner</span>
                    <span>Amount</span>
                    <span>Status</span>
                  </div>
                  {["TXN-2024-0012", "TXN-2024-0011", "TXN-2024-0010", "TXN-2024-0009"].map(
                    (reference, index) => (
                      <div
                        key={reference}
                        className="grid grid-cols-4 border-b border-border p-3 text-[10px] last:border-0"
                      >
                        <span>{reference}</span>
                        <span className="truncate">Trade partner</span>
                        <span>USD {index ? "18,000" : "250,000"}</span>
                        <span className="font-medium">{index < 2 ? "Settled" : "In transit"}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
