import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Gavel,
  Globe2,
  Layers,
  Lock,
  PackageCheck,
  RotateCcw,
  Smartphone,
  Unlock,
  Wallet,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { platform } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { Flag } from "./landing/flags";
import { HeroDashboard } from "./landing/hero-dashboard";
import { PhoneMockup } from "./landing/phone-mockup";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const Globe = lazy(() => import("./landing/globe"));

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

const STEPS = [
  {
    icon: FileText,
    title: "Issue the invoice",
    body: "The supplier raises an invoice in VUKA. Amount, goods and delivery terms are fixed and shared with both sides.",
  },
  {
    icon: Lock,
    title: "Lock the payment",
    body: "The buyer pays from mobile money. Funds convert at a firm quote and lock in an on-chain escrow — not in the supplier's wallet.",
  },
  {
    icon: PackageCheck,
    title: "Ship and confirm",
    body: "The supplier ships knowing the money is committed. The buyer confirms delivery, or the agreed timeout runs out.",
  },
  {
    icon: Unlock,
    title: "Release and cash out",
    body: "Escrow releases to the supplier, who cashes out to local mobile money. Both trust scores update from the outcome.",
  },
];

// Each step's node tone deepens along the rail — the same visual logic as the money itself,
// which gets progressively more committed (raised -> locked -> shipped -> released).
const STEP_TONE = [
  "bg-muted text-muted-foreground",
  "bg-primary/20 text-foreground",
  "bg-primary/35 text-foreground",
  "bg-success/20 text-success",
];

function Journey() {
  return (
    <section id="journey" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-24">
      <SectionHead
        eyebrow="How a payment works"
        title="Four steps from invoice to cash-out"
        intro="No 50% deposits to a stranger. The buyer proves the money is there, the supplier proves the goods arrived."
      />
      <div className="relative mt-20">
        {/* The rail: a static track with an animated lime pulse that runs its length — the same
            metaphor as the mobile-money "rails" named in the hero. */}
        <div
          aria-hidden="true"
          className="absolute left-[9%] right-[9%] top-9 hidden h-px overflow-hidden bg-border md:block"
        >
          <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-primary to-transparent motion-safe:animate-[rail-pulse_3.2s_ease-in-out_infinite]" />
        </div>

        <ol className="relative grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="group relative flex flex-col items-center text-center">
              <div className="relative z-10 flex size-[72px] shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-float transition-transform duration-300 group-hover:-translate-y-1.5">
                <span className={cn("flex size-12 items-center justify-center rounded-full transition-colors", STEP_TONE[i])}>
                  <s.icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 w-full flex-1 rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 group-hover:shadow-float">
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                  STEP 0{i + 1}
                </span>
                <h3 className="mt-2 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Indicative reference rates in USD per 1 unit of local currency (sandbox only).
const RATES: Record<string, number> = { RWF: 1 / 1380, KES: 1 / 129, UGX: 1 / 3700, TZS: 1 / 2680, BIF: 1 / 2900 };
const CURRENCY_FLAG: Record<string, string> = { RWF: "RW", KES: "KE", UGX: "UG", TZS: "TZ", BIF: "BI" };
const FEE_PCT = 0.012;

function Estimator() {
  const [amount, setAmount] = useState(1_000_000);
  const [from, setFrom] = useState("RWF");
  const [to, setTo] = useState("KES");
  const r = useMemo(() => {
    const usd = amount * (RATES[from] ?? 1);
    const fee = usd * FEE_PCT;
    const received = (usd - fee) / (RATES[to] ?? 1);
    return { usd, fee, received, escrowPct: usd > 0 ? ((usd - fee) / usd) * 100 : 0 };
  }, [amount, from, to]);
  const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const sel = "h-11 rounded-lg border border-input bg-background px-3 font-mono text-sm";

  return (
    <section id="estimate" className="scroll-mt-24 border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
          <SectionHead
            eyebrow="Cost estimator"
            title="See the full cost before you commit"
            intro="Every payment shows the exchange rate and fee up front. The quote you see is the quote that locks — no surprises at release."
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-float">
          {/* Corridor header: the two markets this quote connects, flag to flag. */}
          <div className="flex items-center justify-center gap-4 border-b border-border pb-5">
            <div className="flex flex-col items-center gap-1.5">
              <Flag code={CURRENCY_FLAG[from] ?? "RW"} className="w-9 rounded-md" />
              <span className="font-mono text-[11px] text-muted-foreground">{from}</span>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col items-center gap-1.5">
              <Flag code={CURRENCY_FLAG[to] ?? "KE"} className="w-9 rounded-md" />
              <span className="font-mono text-[11px] text-muted-foreground">{to}</span>
            </div>
          </div>

          <label className="mt-5 block text-xs text-muted-foreground" htmlFor="est-amount">
            You send
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="est-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="h-11 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm"
            />
            <select aria-label="From currency" value={from} onChange={(e) => setFrom(e.target.value)} className={sel}>
              {Object.keys(RATES).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <label className="mt-5 block text-xs text-muted-foreground" htmlFor="est-to">
            Supplier receives in
          </label>
          <select id="est-to" value={to} onChange={(e) => setTo(e.target.value)} className={`${sel} mt-2 w-full`}>
            {Object.keys(RATES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* Where every dollar goes: escrow vs. fee, to scale, animated as inputs change. */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${fmt(r.escrowPct, 0)}% to escrow, ${fmt(100 - r.escrowPct, 0)}% fee`}>
              <div
                className="h-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${r.escrowPct}%` }}
              />
              <div className="h-full flex-1 bg-foreground/25 transition-[width] duration-500 ease-out" />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> To escrow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground/25" /> VUKA fee
              </span>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Locked in escrow</dt>
              <dd className="font-mono">USDC {fmt(r.usd, 2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VUKA fee (1.2%)</dt>
              <dd className="font-mono">USDC {fmt(r.fee, 2)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
              <dt>Supplier receives</dt>
              <dd className="font-mono">
                {to} {fmt(r.received)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Indicative reference rates for illustration. Live quotes are firm for the lock window.
          </p>
        </div>
      </div>
    </section>
  );
}

const LOCKED = { icon: Lock, name: "LOCKED", body: "Buyer's funds are committed on-chain against the invoice." };
const OUTCOMES = [
  {
    icon: CheckCircle2,
    name: "RELEASED",
    body: "Delivery confirmed or timeout passed. Supplier is paid.",
    border: "border-success/40 hover:border-success",
    iconTone: "bg-success/15 text-success",
  },
  {
    icon: RotateCcw,
    name: "REFUNDED",
    body: "Order cancelled by agreement. Buyer is made whole.",
    border: "border-border hover:border-foreground/40",
    iconTone: "bg-muted text-muted-foreground",
  },
  {
    icon: Gavel,
    name: "DISPUTED",
    body: "Funds freeze. Arbitration decides, and the outcome is recorded permanently.",
    border: "border-destructive/40 hover:border-destructive",
    iconTone: "bg-destructive/15 text-destructive",
  },
];

/** The 3D-feeling network view: a real, draggable orthographic globe of Africa, markets lit up and
 * connected by animated corridor arcs — not a static image, so the "transaction" motion is real.
 * Sized to sit beside the section copy rather than take a full-width band of its own. */
function NetworkGlobe() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const [active, setActive] = useState<string | null>(null);
  const markets = config.data?.countries ?? [];
  // Illustrative ring connections across the live sandbox markets — the engine doesn't expose the
  // real corridor graph on this signed-out page, so this is labelled as illustrative, not live data.
  const arcs = useMemo<[string, string][]>(() => {
    if (markets.length < 2) return [];
    return markets.map((m, i) => [m.code, markets[(i + 1) % markets.length]!.code]);
  }, [markets]);

  if (markets.length < 2) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-float">
      <div className="relative h-[280px] sm:h-[320px]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Loading network…
            </div>
          }
        >
          <Globe
            markets={markets}
            arcs={arcs}
            activeCode={active}
            onActive={setActive}
            className="relative h-full w-full"
          />
        </Suspense>
      </div>
      <p className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        Illustrative connections across VUKA's live sandbox markets — drag to rotate. Not a map of
        real settlement traffic.
      </p>
    </div>
  );
}

function EscrowExplained() {
  return (
    <section id="escrow" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <SectionHead
            eyebrow="Escrow explained"
            title="Money moves between states, never silently"
            intro="Each payment lives in a smart-contract escrow. From LOCKED it can only leave through one of three doors — and every move is mirrored in a double-entry ledger."
          />

          {/* A hub-and-spoke diagram: one locked escrow branches to exactly one terminal outcome. */}
          <div className="mt-10 flex flex-col gap-6 xl:flex-row xl:items-center">
            <div className="relative z-10 shrink-0 rounded-2xl border-2 border-foreground bg-foreground p-6 text-background xl:w-56">
              <LOCKED.icon className="size-6" aria-hidden="true" />
              <p className="mt-8 font-mono text-sm tracking-[0.15em]">{LOCKED.name}</p>
              <p className="mt-2 text-sm opacity-75">{LOCKED.body}</p>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {OUTCOMES.map((s) => (
                <div key={s.name} className="flex items-center gap-3 xl:gap-4">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 32 2"
                    preserveAspectRatio="none"
                    className="hidden h-0.5 w-8 shrink-0 text-border xl:block"
                  >
                    <line x1="0" y1="1" x2="32" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  <div
                    className={cn(
                      "flex flex-1 items-center gap-4 rounded-2xl border bg-card p-5 transition-colors duration-200",
                      s.border,
                    )}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", s.iconTone)}>
                      <s.icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm tracking-[0.15em]">{s.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <NetworkGlobe />
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
