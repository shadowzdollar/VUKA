import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { platform } from "@/lib/api/endpoints";
import { REGION_NAMES } from "@/lib/markets";
import { Flag } from "./flags";
import { Reveal } from "./reveal";

const kicker = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground";

/** Trust strip directly under the hero: what is enforced by design, in one line each. */
export function Principles() {
  const items = [
    ["Escrow by contract", "Funds are held by code, not by a person."],
    ["Price before commitment", "Fee, rate and delivered amount are shown first."],
    ["Double-entry ledger", "Every movement balances or is rejected."],
    ["Fail-closed screening", "If a check cannot run, the payment does not."],
  ];
  return (
    <div className="border-y border-border bg-muted/30">
      <ul className="mx-auto grid max-w-7xl gap-px px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {items.map(([h, b]) => (
          <li key={h} className="flex gap-3 py-5 lg:px-4 lg:first:pl-0">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium">{h}</div>
              <div className="text-xs text-muted-foreground">{b}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Features() {
  const cell = "border border-border bg-card p-6 transition-colors hover:bg-accent/40";
  return (
    <section id="features" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className={kicker}>What is inside</div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Everything a trade needs, so nothing has to be improvised.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-3 md:grid-cols-6">
          <Reveal className={`${cell} md:col-span-3 md:row-span-2`}>
            <div className={kicker}>Wallets</div>
            <h3 className="mt-3 font-display text-3xl">
              One account, every currency you trade in.
            </h3>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Hold balances in the ten launch currencies, top up from mobile money, and see a
              real-time statement of every movement, each one traceable to a balanced ledger entry.
            </p>
            <ul
              className="mt-6 grid grid-cols-5 gap-1.5 font-mono text-[11px]"
              aria-label="Launch currencies"
            >
              {["RWF", "KES", "UGX", "TZS", "GHS", "NGN", "XOF", "ETB", "ZMW", "ZAR"].map((c) => (
                <li key={c} className="border border-border px-1 py-2 text-center">
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className={`${cell} md:col-span-3`} delay={60}>
            <div className={kicker}>Invoices</div>
            <h3 className="mt-3 font-display text-2xl">Terms in writing, payable in one tap.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Raise an invoice in your currency; the buyer pays in theirs. Both see the same
              figures.
            </p>
          </Reveal>
          <Reveal className={`${cell} md:col-span-3`} delay={120}>
            <div className={kicker}>Sanctions and risk</div>
            <h3 className="mt-3 font-display text-2xl">Screened before money moves.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Payments are screened and limit-checked up front. A failed check blocks the payment,
              never delays a warning.
            </p>
          </Reveal>
          <Reveal className={`${cell} md:col-span-2`}>
            <div className={kicker}>Verification</div>
            <h3 className="mt-3 font-display text-xl">Tiered limits</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start small; raise your limits as you verify. Documents are never uploaded to VUKA,
              only references.
            </p>
          </Reveal>
          <Reveal className={`${cell} md:col-span-2`} delay={60}>
            <div className={kicker}>Insight</div>
            <h3 className="mt-3 font-display text-xl">Live analytics</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Volume, corridors, fees and settlement times, in charts that also come as accessible
              tables.
            </p>
          </Reveal>
          <Reveal className={`${cell} md:col-span-2`} delay={120}>
            <div className={kicker}>Languages</div>
            <h3 className="mt-3 font-display text-xl">Five, and counting</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              English, French, Kiswahili, Portuguese and Kinyarwanda. Translations are first-pass
              and under native review.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Markets() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const rows = config.data?.countries ?? [];
  const groups = Array.from(new Set(rows.map((r) => r.region)));
  return (
    <section id="markets" className="scroll-mt-20 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className={kicker}>Launch markets</div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Ten countries, four regions, one continent to grow into.
          </h2>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Each market is served by a named payout rail. All rails run in a sandbox today; going
            live per rail needs a licence or licensed partner and a signed agreement, and we say so
            rather than imply otherwise.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {groups.map((g, gi) => (
            <Reveal key={g} delay={gi * 60} className="border border-border bg-card p-5">
              <div className={kicker}>{REGION_NAMES[g] ?? g}</div>
              <ul className="mt-4 divide-y divide-border">
                {rows
                  .filter((r) => r.region === g)
                  .map((r) => (
                    <li key={r.code} className="flex items-baseline justify-between gap-3 py-2.5">
                      <Flag code={r.code} className="w-8 shrink-0 self-center shadow-sm" />
                      <div className="mr-auto">
                        <div className="font-display text-xl leading-none">{r.name}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {r.provider_name}
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        {r.currency}
                        <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                          sandbox
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STORIES = [
  {
    who: "A grain trader",
    where: "Kigali → Nairobi",
    q: "I used to ship first and hope. Now the money is committed before the truck leaves, and I can show the buyer that it is.",
    tag: "Supplier",
  },
  {
    who: "A garment wholesaler",
    where: "Accra → Lagos",
    q: "The fee was on the screen before I agreed to anything. There was no second number waiting at the end.",
    tag: "Buyer",
  },
  {
    who: "A coffee cooperative",
    where: "Addis Ababa → Kampala",
    q: "When a shipment arrived short, the escrow let the arbiter split the payment fairly. Nobody had to chase anyone.",
    tag: "Dispute",
  },
];
export function Stories() {
  return (
    <section className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className={kicker}>Illustrative stories</div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            Built around the trades people actually make.
          </h2>
          <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
            These are composite scenarios written to show how VUKA is designed to work. They are not
            testimonials from real customers.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STORIES.map((s, i) => (
            <Reveal key={s.who} delay={i * 80}>
              <figure className="flex h-full flex-col justify-between border border-border p-6">
                <div
                  aria-hidden="true"
                  className="font-display text-6xl leading-none text-muted-foreground/40"
                >
                  “
                </div>
                <blockquote className="-mt-2 font-display text-xl leading-snug">{s.q}</blockquote>
                <figcaption className="mt-6 flex items-end justify-between border-t border-dashed border-border pt-4 text-xs">
                  <span>
                    <span className="block font-medium">{s.who}</span>
                    <span className="text-muted-foreground">{s.where}</span>
                  </span>
                  <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]">
                    {s.tag}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROWS: [string, boolean | "partial", boolean | "partial", boolean][] = [
  ["Total cost shown before you commit", "partial", false, true],
  ["Funds held until delivery is confirmed", false, false, true],
  ["Neutral arbitration for disputes", false, false, true],
  ["Settles into mobile money", false, "partial", true],
  ["Auditable, balanced ledger of every step", "partial", false, true],
  ["Reputation portable across counterparties", false, false, true],
];
function Mark({ v }: { v: boolean | "partial" }) {
  if (v === true)
    return (
      <>
        <Check className="mx-auto size-4" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </>
    );
  if (v === "partial")
    return (
      <>
        <Minus className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Sometimes</span>
      </>
    );
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span className="sr-only">No</span>
    </span>
  );
}
export function Comparison() {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className={kicker}>How it compares</div>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            What changes when the rules are built in.
          </h2>
          <p className="mt-3 text-xs text-muted-foreground">
            A general comparison of how each approach typically works; individual banks and services
            vary.
          </p>
        </Reveal>
        <Reveal className="mt-8 border border-border bg-card">
          <div
            className="relative overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Capability comparison table"
          >
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Capability comparison</caption>
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.16em]">
                  <th scope="col" className="p-4 text-left font-normal text-muted-foreground">
                    Capability
                  </th>
                  <th scope="col" className="p-4 font-normal text-muted-foreground">
                    Informal / cash
                  </th>
                  <th scope="col" className="p-4 font-normal text-muted-foreground">
                    Typical bank wire
                  </th>
                  <th scope="col" className="bg-foreground p-4 font-normal text-background">
                    VUKA
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, a, b, c]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <th scope="row" className="p-4 text-left font-normal">
                      {label}
                    </th>
                    <td className="p-4 text-center">
                      <Mark v={a} />
                    </td>
                    <td className="p-4 text-center">
                      <Mark v={b} />
                    </td>
                    <td className="bg-accent/50 p-4 text-center">
                      <Mark v={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  [
    "Is VUKA live and moving real money?",
    "No. Every payout rail currently runs in a sandbox with simulated balances. Moving real money requires a licence or licensed partner in each country and signed agreements with each telecom or bank. Nothing on this page claims either.",
  ],
  [
    "Who holds the money during an escrow?",
    "A smart contract on a public blockchain, not VUKA and not the other party. Its rules are fixed: confirmation releases to the supplier, silence refunds the buyer, disputes go to an arbiter, and if the arbiter does not answer anyone can trigger a 50/50 split.",
  ],
  [
    "What does it cost?",
    "A corridor fee of 0.80% inside a regional economic community and 1.20% across regions, shown before you commit. Escrow adds a small protocol fee, capped at 1% by the contract, taken only from an amount paid to a supplier.",
  ],
  [
    "Which currencies and countries?",
    "Ten launch markets (Rwanda, Kenya, Uganda, Tanzania, Ghana, Nigeria, Senegal, Ethiopia, Zambia, South Africa) and their currencies, with any-to-any corridors between them.",
  ],
  [
    "What personal data do you keep?",
    "Your name, phone number, the business details you enter and your transaction history. Identity documents are never uploaded to VUKA; you file a reference from a verification provider or a document hash. See the privacy notice for exactly what is stored in your browser.",
  ],
  [
    "How is the trust score calculated?",
    "From five weighted, ledger-backed factors, each discounted until there is enough evidence. The formula is on this page. No one, including VUKA staff, can edit a score directly.",
  ],
  [
    "Can I use it in my language?",
    "The interface is available in English, French, Kiswahili, Portuguese and Kinyarwanda. Non-English strings are a first pass and are being reviewed by native speakers.",
  ],
  [
    "Is it accessible?",
    "It is built to WCAG 2.1 AA: keyboard operable, screen-reader labelled, reduced-motion aware, with tables behind every chart. We test with automated tooling and welcome reports of anything we missed.",
  ],
];
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <div className={kicker}>Questions</div>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Straight answers, including the uncomfortable ones.
          </h2>
          <p className="mt-5 text-sm text-muted-foreground">
            Still unsure?{" "}
            <Link to="/about" hash="contact" className="underline underline-offset-4">
              Tell us what you need
            </Link>
            .
          </p>
        </Reveal>
        <Accordion type="single" collapsible className="border-t border-border">
          {FAQ.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`}>
              <AccordionTrigger className="py-5 text-left font-display text-xl font-normal hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
            Ready when you are
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">
            Your next cross-border trade can start with a signed quote.
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="group rounded-none font-mono text-xs uppercase"
          >
            <Link to="/register">
              Open a trader account
              <ArrowRight
                className="ml-2 size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-none border-background bg-transparent font-mono text-xs uppercase text-background hover:bg-background hover:text-foreground"
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
