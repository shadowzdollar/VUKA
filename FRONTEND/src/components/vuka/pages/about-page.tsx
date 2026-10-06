import { Link } from "@tanstack/react-router";
import { ContactLink, CONTACT_EMAIL, PublicPage, Section } from "../public-page";

const PRINCIPLES = [
  [
    "Enforce, don't promise",
    "Where a rule matters — who gets paid, when, and how much — it lives in code that anyone can read, not in a policy someone can waive.",
  ],
  [
    "Show the price first",
    "Every fee, rate and delivered amount is visible before a trader commits. A number that appears afterwards is a defect.",
  ],
  [
    "Fail closed",
    "If a screening check, a signature or a limit cannot be verified, the payment does not proceed. We prefer a refused payment to an uncertain one.",
  ],
  [
    "Say what is not done",
    "Sandbox rails, first-pass translations and unaudited contracts are labelled as such. Trust is earned by being precise about limits.",
  ],
  [
    "Small businesses first",
    "The people who most need safer cross-border trade are SMEs with thin margins. Every default is chosen for them, not for institutions.",
  ],
  [
    "Built to be inspected",
    "Double-entry ledger, public escrow rules, exportable activity, tables behind every chart. Auditors are a user group, not an obstacle.",
  ],
];

const ROADMAP: [string, string, string[]][] = [
  [
    "Now",
    "Sandbox platform",
    [
      "Ten launch markets with sandbox rails",
      "Escrow V2 contracts on a public test network",
      "Firm quotes, tiered KYC limits, trust score, analytics",
    ],
  ],
  [
    "Next",
    "Pilot readiness",
    [
      "Independent smart-contract audit",
      "Native-speaker review of all translations",
      "First live rails (MTN MoMo, M-Pesa) under a licensed partner, capped pilot",
    ],
  ],
  [
    "Then",
    "Regional rollout",
    [
      "Remaining rails: Vodacom, Airtel, Orange, Telebirr, NIBSS, instant EFT",
      "Licensed FX and liquidity provider replacing reference rates",
      "Regulatory engagement per corridor",
    ],
  ],
  [
    "Later",
    "Continental network",
    [
      "Interoperability with pan-African payment systems",
      "Expansion beyond the launch markets",
      "Open, documented APIs for banks and fintechs",
    ],
  ],
];

export function AboutPage() {
  return (
    <PublicPage
      kicker="About VUKA"
      title={
        <>
          Rise and <em>cross over</em>: trade that trusts the rules.
        </>
      }
      lead="VUKA is a cross-border payment platform for African small and medium businesses. It combines mobile-money payouts, a transparent double-entry ledger and smart-contract escrow so that a trader in one country can pay a supplier in another without hoping the other side keeps their word."
      photo={{
        src: "/images/landing/lagos-market.webp",
        alt: "Aerial view of a busy produce market in Lagos, Nigeria",
        credit: {
          location: "Lagos, Nigeria",
          credit: "Ayorinde Ogundele",
          license: "CC BY-SA 4.0",
          sourceUrl:
            "https://commons.wikimedia.org/wiki/File:Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg",
        },
      }}
      toc={[
        { id: "problem", label: "The problem" },
        { id: "principles", label: "Principles" },
        { id: "roadmap", label: "Roadmap" },
        { id: "accessibility", label: "Accessibility" },
        { id: "contact", label: "Contact" },
      ]}
    >
      <Section id="problem" title="The problem we are working on">
        <p>
          Intra-African trade is held back by three frictions: uncertain cost, uncertain
          counterparties, and slow or fragmented settlement across currencies and payment rails.
          Small traders feel all three most, and have the least recourse when something goes wrong.
        </p>
        <p>
          VUKA's answer is deliberately modest: make the cost visible, make the money conditional on
          delivery, and make the record complete. It does not replace banks or mobile-money
          operators; it connects to them.
        </p>
      </Section>

      <Section id="principles" title="Principles">
        <ol className="grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map(([h, b], i) => (
            <li key={h} className="!ml-0 list-none border border-border bg-card p-5">
              <div className="font-mono text-[10px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 font-display text-xl text-foreground">{h}</div>
              <p className="mt-2 text-sm">{b}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="roadmap" title="Roadmap">
        <p>
          Dates are deliberately absent: each step depends on licensing, audit and partner
          agreements that are outside the engineering team's control.
        </p>
        <ol className="space-y-3">
          {ROADMAP.map(([when, h, items], i) => (
            <li
              key={when}
              className="!ml-0 grid list-none gap-3 border border-border bg-card p-5 sm:grid-cols-[100px_1fr]"
            >
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                {when}
                {i === 0 ? (
                  <span className="ml-2 border border-foreground px-1 text-[9px]">here</span>
                ) : null}
              </div>
              <div>
                <div className="font-display text-xl text-foreground">{h}</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="accessibility" title="Accessibility statement">
        <p>
          We aim for conformance with WCAG 2.1 level AA. The interface is keyboard operable, uses
          semantic landmarks and labelled controls, respects reduced-motion and light/dark
          preferences, and every chart has an equivalent data table.
        </p>
        <p>
          <strong>Known limits:</strong> non-English translations are first-pass; the decorative
          globe on the home page is pointer-driven but has button and market-list alternatives. We
          test with automated tooling; that does not find everything, so please tell us if you hit a
          barrier.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p>
          General enquiries and accessibility reports:{" "}
          <ContactLink address={CONTACT_EMAIL} label="Contact address" />. Security reports go to
          the address on the{" "}
          <Link to="/security" className="underline underline-offset-4">
            security page
          </Link>
          .
        </p>
      </Section>
    </PublicPage>
  );
}
