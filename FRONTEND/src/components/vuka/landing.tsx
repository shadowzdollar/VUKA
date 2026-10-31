import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Globe2,
  Layers,
  Smartphone,
  Wallet,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import escrowGlobe from "@/assets/escrow-globe.png";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { platform } from "@/lib/api/endpoints";
import { Flag } from "./landing/flags";
import { HeroDashboard } from "./landing/hero-dashboard";
import { PhoneMockup } from "./landing/phone-mockup";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const RAILS = ["MTN MoMo", "M-Pesa", "Airtel Money", "Polygon", "USDC", "PAPSS-ready"];

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{children}</p>;
}

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-gradient mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{intro}</p>
    </div>
  );
}

function Hero() {
  const features = [
    { icon: ShieldCheck, title: "Escrow", detail: "Protected" },
    { icon: Smartphone, title: "Mobile", detail: "Money" },
    { icon: Layers, title: "Invoice", detail: "Linked" },
    { icon: Wallet, title: "Business", detail: "Payments" },
    { icon: Globe2, title: "Cross-border", detail: "Trade" },
    { icon: Zap, title: "Trust", detail: "Built in" },
  ];
  return (
    <>
      <section className="vuka-hero">
        <img className="hero-backdrop" src={heroBackdrop} alt="" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span /> CROSS-BORDER TRADE PAYMENTS
          </p>
          <h1>
            Move money.
            <br />
            Trade without
            <br />
            borders.
          </h1>
          <p className="hero-description">
            Pay suppliers with confidence. Invoice-linked escrow and mobile money, built for African
            trade.
          </p>
          <ul className="hero-features">
            {features.map(({ icon: Icon, title, detail }) => (
              <li key={title}>
                <span className="hero-feature-icon">
                  <Icon size={23} strokeWidth={1.6} />
                </span>
                <p>
                  {title}
                  <br />
                  {detail}
                </p>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="hero-cta">
            <Link to="/register">
              Open an account <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="hero-device-scene">
          <HeroDashboard />
          <PhoneMockup className="hero-phone" />
        </div>
      </section>
      <div className="border-b border-border bg-background">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-14 gap-y-4 px-6 py-7">
          {RAILS.map((r) => (
            <li key={r} className="text-base font-semibold text-muted-foreground">
              {r}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Journey() {
  const bullets = [
    "Suppliers raise an invoice in VUKA with the amount, goods and delivery terms fixed and shared with both sides.",
    "Buyers pay from mobile money. Funds convert at a firm quote and lock in an on-chain escrow — never in a stranger's wallet.",
    "Suppliers ship knowing the money is committed, while the buyer confirms delivery or the agreed timeout runs out.",
    "Escrow releases and the supplier cashes out to local mobile money, with both trust scores updated from the outcome.",
  ];

  // Scattered green network dots in the background outside the globe/card graphic
  const dots: [string, string][] = [
    ["52%", "8.5%"],
    ["66%", "2.5%"],
    ["71%", "4.5%"],
    ["80%", "7.5%"],
    ["95%", "11%"],
    ["63%", "12.5%"],
    ["84%", "15.5%"],
    ["88%", "20.5%"],
    ["49%", "30.5%"],
    ["90%", "32%"],
    ["86%", "36%"],
    ["97%", "44%"],
    ["93%", "52%"],
    ["46%", "60%"],
    ["99%", "62%"],
    ["96%", "81.5%"],
    ["47%", "91.5%"],
  ];

  return (
    <section id="journey" className="relative scroll-mt-24 overflow-hidden bg-white text-[#151515]">
      {/* Scattered background dots */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {dots.map(([left, top], idx) => (
          <span
            key={idx}
            className="absolute size-[4px] rounded-full bg-[#79b200]"
            style={{ left, top }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-[1220px] items-center gap-10 px-6 py-16 lg:min-h-[680px] lg:grid-cols-[500px_1fr] lg:gap-12">
        {/* Left column: Heading and 4 bullet points */}
        <div className="relative z-10">
          <h2 className="text-[40px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            Built on Escrow, Proven
            <br />
            by Trade
          </h2>
          <ul className="mt-9 space-y-6 text-[16px] leading-[1.6] text-[#222222]">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-[10px] size-[5px] shrink-0 rounded-full bg-[#151515]" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Full globe + floating stat cards centered vertically and shifted rightward */}
        <div className="relative flex items-center justify-center lg:justify-end lg:pr-2">
          <img
            src={escrowGlobe}
            alt="Low-poly globe showing 156K+ USDC settled, 5 live markets, and 4 steps to cash-out"
            className="block h-auto w-[605px] max-w-full select-none lg:translate-x-6"
          />
        </div>
      </div>
    </section>
  );
}

function Estimator() {
  const cards = [
    {
      body: "Send a request here to get a payment quote.",
      cta: "Request a Quote",
      to: "/send",
    },
    {
      body: "Book a demo to see how VUKA protects your trade.",
      cta: "Get a Demo",
      to: "/register",
    },
    {
      body: "Talk to a VUKA expert to help you choose the right plan.",
      cta: "Contact Sales",
      to: "/support",
    },
  ];

  return (
    <section id="estimate" className="relative scroll-mt-24 overflow-hidden bg-[#f6f6f6] pt-36 pb-3 text-[#151515]">
      {/* Background curved lime arches and dark bottom band */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 1642 738"
          preserveAspectRatio="none"
          className="size-full"
        >
          {/* Outer pale-lime arch band */}
          <path
            d="M -40 280 Q 821 -10 1682 280 L 1682 738 L -40 738 Z"
            fill="#eef6dd"
            stroke="#9fc84b"
            strokeWidth="1.2"
          />
          {/* Inner bright-lime arch */}
          <path
            d="M -40 448 Q 821 155 1682 448 L 1682 738 L -40 738 Z"
            fill="#c2f74d"
          />
          {/* Green dot on the right between the two curves */}
          <circle cx="1474" cy="364" r="8" fill="#79b200" />
        </svg>
        {/* Bottom dark bar */}
        <div className="absolute inset-x-0 bottom-0 h-[81px] bg-[#151515]" />
      </div>

      {/* Main translucent/frosted center container */}
      <div className="relative z-10 mx-auto max-w-[1104px] px-4 sm:px-0">
        <div
          className="relative overflow-hidden rounded-t-[8px] border border-b-0 border-[#dcdcdc] px-6 pt-14 pb-0 text-center shadow-[0_18px_50px_rgba(0,0,0,0.06)]"
          style={{
            background:
              "radial-gradient(62% 72% at 50% 68%, rgba(194, 247, 77, 0.72) 0%, rgba(235, 252, 197, 0.78) 48%, rgba(249, 252, 245, 0.96) 82%)",
          }}
        >
          <h2 className="mx-auto max-w-3xl text-[36px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            See Your Full Cost Before You Pay
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[#222222]">
            Get a firm exchange rate and fee up front — the quote you see
            <br className="hidden sm:inline" /> is the quote that locks
          </p>
          <div className="mt-8">
            <Link
              to="/send"
              className="inline-flex h-[54px] w-full max-w-[448px] items-center justify-center rounded-full bg-[#151515] px-8 text-[16px] font-normal text-white transition-opacity hover:opacity-90"
            >
              Estimate a Payment
            </Link>
          </div>

          {/* 3 bottom white action cards */}
          <div className="mt-14 -mx-6 grid gap-6 sm:mx-0 md:grid-cols-3 md:gap-[33px]">
            {cards.map((c) => (
              <div
                key={c.cta}
                className="flex flex-col items-center justify-between rounded-[6px] border border-[#e6e6e6] bg-[#fcfdf9] px-7 pt-9 pb-6 text-center shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
              >
                <p className="max-w-[250px] text-[16px] leading-[1.55] font-normal text-[#151515]">
                  {c.body}
                </p>
                <Link
                  to={c.to}
                  className="mt-6 inline-flex h-[47px] w-full max-w-[255px] items-center justify-center rounded-full border border-[#79b200] bg-white px-6 text-[16px] font-semibold text-[#79b200] transition-colors hover:bg-[#79b200]/5"
                >
                  {c.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EscrowExplained() {
  const doors = [
    {
      name: "Locked",
      body: "Buyer's funds are committed on-chain against the invoice.",
    },
    {
      name: "Released",
      body: "Delivery confirmed or timeout passed. Supplier is paid.",
    },
    {
      name: "Refunded",
      body: "Order cancelled by agreement. Buyer is made whole.",
    },
    {
      name: "Disputed",
      body: "Funds freeze while arbitration decides the outcome.",
    },
  ];

  return (
    <section id="escrow" className="scroll-mt-24 bg-[#f6f6f6] px-6 pt-20 pb-28 text-[#151515]">
      <div className="mx-auto max-w-[1104px] text-center">
        <h2 className="text-[36px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
          Money Never Moves Silently
        </h2>
        <p className="mx-auto mt-5 max-w-[580px] text-[16px] leading-[1.6] text-[#222222]">
          Every payment lives in a smart-contract escrow and can only
          <br className="hidden sm:inline" /> leave through one of four doors
        </p>
        <div className="mt-9">
          <Link
            to="/escrow"
            className="inline-flex h-[55px] w-full max-w-[448px] items-center justify-center rounded-full bg-[#151515] px-8 text-[16px] font-normal text-white transition-opacity hover:opacity-90"
          >
            How Escrow Works
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[36px]">
          {doors.map((d) => (
            <div
              key={d.name}
              className="flex min-h-[250px] flex-col items-center justify-between rounded-[6px] border border-[#ebebeb] bg-white px-5 pt-9 pb-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
            >
              <div>
                <h3 className="text-[22px] leading-snug font-bold text-[#79b200]">{d.name}</h3>
                <p className="mt-3.5 text-[15px] leading-[1.55] text-[#151515]">{d.body}</p>
              </div>
              <Link
                to="/escrow"
                className="mt-6 inline-flex h-[47px] w-full max-w-[204px] items-center justify-center rounded-full border border-[#79b200] bg-white px-5 text-[15px] font-semibold text-[#79b200] transition-colors hover:bg-[#79b200]/5"
              >
                Learn More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SCORE_MAX = 1000;
const BANDS = [
  { min: 800, label: "Strong", var: "--success" },
  { min: 600, label: "Established", var: "--primary" },
  { min: 450, label: "Building", var: "--chart-4" },
  { min: 0, label: "New", var: "--muted-foreground" },
] as const;

/** A full-circle SVG gauge that animates its fill via stroke-dashoffset, coloured by trust band. */
function ScoreRing({ score, band }: { score: number; band: (typeof BANDS)[number] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(score / SCORE_MAX, 1));
  return (
    <div className="relative mx-auto size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx={60} cy={60} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={`var(${band.var})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tabular-nums">{score}</span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          / {SCORE_MAX}
        </span>
      </div>
    </div>
  );
}

function TrustLab() {
  const [onTime, setOnTime] = useState([42]);
  const [disputes, setDisputes] = useState([2]);
  const [months, setMonths] = useState([8]);
  const score = useMemo(() => {
    const vol = Math.min((onTime[0] ?? 0) / 60, 1) * 450;
    const tenure = Math.min((months[0] ?? 0) / 24, 1) * 250;
    const ot = onTime[0] ?? 0;
    const ratio = ot === 0 ? 0 : 1 - Math.min((disputes[0] ?? 0) / Math.max(ot, 1), 1);
    return Math.round(300 + vol * ratio + tenure * ratio);
  }, [onTime, disputes, months]);
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]!;

  const row = (label: string, v: number[], set: (v: number[]) => void, max: number) => (
    <div key={label}>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono">{v[0]}</span>
      </div>
      <Slider className="mt-3" value={v} onValueChange={set} max={max} step={1} aria-label={label} />
    </div>
  );

  return (
    <section id="trust" className="scroll-mt-24 border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
          <SectionHead
            eyebrow="Trust score lab"
            title="A score earned from settlements, not self-reported"
            intro="Every completed escrow feeds the score: released on time, refunded, disputed, resolved. Move the sliders to see how behaviour shapes it."
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-float">
          <div className="flex items-center gap-6 border-b border-border pb-6">
            <ScoreRing score={score} band={band} />
            <div>
              <p className="text-xs text-muted-foreground">Illustrative trust score</p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{ borderColor: `var(${band.var})`, color: `var(${band.var})` }}
              >
                <span className="size-1.5 rounded-full" style={{ background: `var(${band.var})` }} />
                {band.label}
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            {row("Escrows released on time", onTime, setOnTime, 80)}
            {row("Disputes raised against you", disputes, setDisputes, 20)}
            {row("Months trading on VUKA", months, setMonths, 36)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Mobile() {
  return (
    <section id="mobile" className="scroll-mt-24 mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
      <div>
        <SectionHead
          eyebrow="VUKA on mobile"
          title="Built for the phone in your pocket"
          intro="Cash in and cash out through the mobile money you already trust. Track every escrow, confirm deliveries and check a counterparty's score on the go."
        />
        <ul className="mt-8 space-y-3 text-sm">
          {[
            "Confirm delivery with one tap",
            "Live status from lock to release",
            "Separate business balance from personal wallet",
            "Works on low-bandwidth connections",
          ].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <Smartphone className="size-4 text-muted-foreground" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center py-8">
        <PhoneMockup />
      </div>
    </section>
  );
}

function Markets() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];
  if (!markets.length) return null;

  return (
    <section id="markets" className="scroll-mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead
          eyebrow="Markets and corridors"
          title="Starting where trade already flows"
          intro="Live sandbox corridors first, with every market opened for real money only once the right licences and partners are in place."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {markets.map((m) => (
            <li key={m.code} className="rounded-2xl border border-border bg-card p-5">
              <Flag code={m.code} className="w-8 rounded-sm" />
              <p className="mt-6 font-medium">{m.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{m.currency}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  [
    "Is VUKA a bank or a mobile money provider?",
    "No. VUKA sits on top of existing mobile money rails. It adds invoices, escrow and a trust record — your money still moves through providers you know.",
  ],
  [
    "Why stablecoin escrow?",
    "A stablecoin escrow on a public chain lets funds lock in a neutral contract both sides can verify, with low fees. You never have to hold crypto: conversion happens at lock and at release.",
  ],
  [
    "What happens if the goods never arrive?",
    "Raise a dispute before release. The funds freeze in the contract until arbitration decides, and the outcome is recorded permanently for both parties.",
  ],
  [
    "Do I need business registration?",
    "No. Informal traders can start with light verification. Fuller verification is only required once your volumes cross a threshold.",
  ],
  [
    "How is my trust score calculated?",
    "Only from real settlement behaviour on VUKA: on-time releases, refunds, disputes and how they resolved. It is never bought or self-reported.",
  ],
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1.4fr]">
        <SectionHead
          eyebrow="Questions"
          title="What traders ask us first"
          intro="Something else on your mind? Our support team answers in English, French and Kiswahili."
        />
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="hero-glow pointer-events-none absolute inset-0 rotate-180 opacity-70" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
        <h2 className="text-gradient text-3xl font-semibold tracking-tight sm:text-5xl">
          Your next supplier doesn't need to know you. They need to trust the payment.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open an account
          </Link>
          <Link to="/support" className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent">
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Public landing page shown to signed-out visitors. */
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Journey />
        <Estimator />
        <EscrowExplained />
        <TrustLab />
        <Mobile />
        <Markets />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  );
}
