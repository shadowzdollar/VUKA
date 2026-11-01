import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowRight,
  Globe2,
  Layers,
  Smartphone,
  Wallet,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import escrowGlobe from "@/assets/escrow-globe.png";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { corridors, platform } from "@/lib/api/endpoints";
import { CENTRAL_BANKS, corridorFeeBps, DIAL, REGION_NAMES } from "@/lib/markets";
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
        <ul className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center justify-between gap-x-10 gap-y-4 px-4 py-7 sm:px-6 lg:px-10 2xl:px-14">
          {RAILS.map((r) => (
            <li
              key={r}
              className="inline-flex items-center gap-2 text-base font-semibold text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground"
            >
              <span className="size-1.5 rounded-full bg-[#79b200]/70" aria-hidden="true" />
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
            className="vuka-dot-pulse absolute size-[4px] rounded-full bg-[#79b200]"
            style={{ left, top, animationDelay: `${(idx % 6) * 420}ms` }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-[1560px] items-center gap-10 px-4 py-16 sm:px-6 lg:min-h-[680px] lg:grid-cols-[1fr_1.15fr] lg:gap-12 lg:px-10 2xl:px-14">
        {/* Left column: Heading and 4 bullet points */}
        <div className="vuka-reveal relative z-10 max-w-xl">
          <h2 className="text-[40px] leading-[1.18] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
            Built on Escrow, Proven
            <br />
            by Trade
          </h2>
          <ul className="mt-9 space-y-6 text-[16px] leading-[1.6] text-[#222222]">
            {bullets.map((b, i) => (
              <li
                key={b}
                className="vuka-reveal flex items-start gap-3 transition-transform duration-300 hover:translate-x-1"
                style={{ "--reveal-delay": `${(i + 1) * 90}ms` } as CSSProperties}
              >
                <span className="mt-[10px] size-[5px] shrink-0 rounded-full bg-[#151515]" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Full globe + floating stat cards centered vertically and shifted rightward */}
        <div
          className="vuka-reveal relative flex items-center justify-center lg:justify-end"
          style={{ "--reveal-delay": "150ms" } as CSSProperties}
        >
          <img
            src={escrowGlobe}
            alt="Low-poly globe showing 156K+ USDC settled, 5 live markets, and 4 steps to cash-out"
            className="vuka-float-slow block h-auto w-[620px] max-w-full select-none"
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
      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 2xl:px-14">
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
            {cards.map((c, idx) => (
              <div
                key={c.cta}
                style={{ "--reveal-delay": `${idx * 90}ms` } as CSSProperties}
                className="vuka-reveal vuka-card-lift flex flex-col items-center justify-between rounded-[6px] border border-[#e6e6e6] bg-[#fcfdf9] px-7 pt-9 pb-6 text-center shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
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
    <section id="escrow" className="scroll-mt-24 bg-[#f6f6f6] pt-20 pb-28 text-[#151515]">
      <div className="mx-auto w-full max-w-[1560px] px-4 text-center sm:px-6 lg:px-10 2xl:px-14">
        <div className="vuka-reveal">
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
              className="inline-flex h-[55px] w-full max-w-[448px] items-center justify-center rounded-full bg-[#151515] px-8 text-[16px] font-normal text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
            >
              How Escrow Works
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[36px]">
          {doors.map((d, idx) => (
            <div
              key={d.name}
              style={{ "--reveal-delay": `${idx * 90}ms` } as CSSProperties}
              className="vuka-reveal vuka-card-lift flex min-h-[250px] flex-col items-center justify-between rounded-[6px] border border-[#ebebeb] bg-white px-5 pt-9 pb-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
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

const SCORE_MIN = 300;
const SCORE_MAX = 850;

const TRUST_BANDS = [
  {
    min: 760,
    band: "A+",
    label: "Strong",
    deposit: "0–10% deposit",
    window: "24h release",
    limit: "$25,000 / tx",
    desc: "Proven settlement record across corridors. Counterparties extend open terms with confidence.",
  },
  {
    min: 660,
    band: "A",
    label: "Established",
    deposit: "15% deposit",
    window: "48h release",
    limit: "$10,000 / tx",
    desc: "Consistent on-time escrow releases and low reversal rate across repeat trade cycles.",
  },
  {
    min: 520,
    band: "B",
    label: "Building",
    deposit: "30% deposit",
    window: "5-day release",
    limit: "$2,500 / tx",
    desc: "Early ledger track record. Each completed invoice cycle raises evidence confidence.",
  },
  {
    min: 0,
    band: "C",
    label: "New",
    deposit: "50% deposit",
    window: "7-day release",
    limit: "$500 / tx",
    desc: "Starting baseline before sufficient on-chain and ledger settlement evidence accumulates.",
  },
] as const;

type TrustPreset = {
  id: string;
  name: string;
  corridor: string;
  tag: string;
  onTime: number;
  invoices: number;
  disputes: number;
  months: number;
  partners: number;
};

const TRUST_PRESETS: TrustPreset[] = [
  {
    id: "established",
    name: "Kigali Textiles exporter",
    corridor: "RW → KE · 48 cycles",
    tag: "Established exporter",
    onTime: 48,
    invoices: 22,
    disputes: 1,
    months: 14,
    partners: 9,
  },
  {
    id: "rising",
    name: "Nairobi Coffee buyer",
    corridor: "KE → UG · 16 cycles",
    tag: "Rising SME",
    onTime: 16,
    invoices: 8,
    disputes: 1,
    months: 5,
    partners: 4,
  },
  {
    id: "new",
    name: "First-time cross-border trader",
    corridor: "RW → TZ · 3 cycles",
    tag: "New trader",
    onTime: 3,
    invoices: 2,
    disputes: 0,
    months: 1,
    partners: 2,
  },
  {
    id: "friction",
    name: "High-dispute supplier",
    corridor: "UG → KE · 24 cycles",
    tag: "Dispute friction",
    onTime: 19,
    invoices: 9,
    disputes: 6,
    months: 8,
    partners: 3,
  },
];

interface RadarFactor {
  key: string;
  label: string;
  short: string;
  weight: number;
  value: number;
  confidence: number;
  points: number;
  maxPoints: number;
}

/** 5-axis SVG radar polygon + precision arc dial for the interactive Trust Score Lab. */
function TrustRadarDial({
  score,
  band,
  factors,
}: {
  score: number;
  band: (typeof TRUST_BANDS)[number];
  factors: RadarFactor[];
}) {
  const pct = Math.max(0, Math.min((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN), 1));
  const arcR = 78;
  const arcC = 2 * Math.PI * arcR;
  // 250-degree speedometer sweep
  const sweep = arcC * (250 / 360);
  const dashOffset = sweep * (1 - pct);

  // 5-axis radar geometry
  const rCx = 95;
  const rCy = 95;
  const rMax = 66;
  const axisPoint = (i: number, radiusRatio: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / factors.length;
    return [rCx + Math.cos(angle) * rMax * radiusRatio, rCy + Math.sin(angle) * rMax * radiusRatio] as const;
  };

  const ceilingPts = factors.map((_, i) => axisPoint(i, 1).join(",")).join(" ");
  const midPts = factors.map((_, i) => axisPoint(i, 0.6).join(",")).join(" ");
  const innerPts = factors.map((_, i) => axisPoint(i, 0.3).join(",")).join(" ");
  const effectivePts = factors
    .map((f, i) => axisPoint(i, Math.max(0.08, (f.value / 100) * f.confidence)).join(","))
    .join(" ");
  const rawPts = factors
    .map((f, i) => axisPoint(i, Math.max(0.08, f.value / 100)).join(","))
    .join(" ");

  return (
    <div className="grid items-center gap-6 sm:grid-cols-2">
      {/* Left: Precision 250° speedometer dial */}
      <div className="relative mx-auto flex flex-col items-center">
        <div className="relative size-48">
          <svg viewBox="0 0 200 200" className="size-full">
            <defs>
              <linearGradient id="trust-dial-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#79b200" />
                <stop offset="100%" stopColor="#c2f74d" />
              </linearGradient>
            </defs>
            {/* Outer subtle tick ring */}
            {Array.from({ length: 21 }).map((_, idx) => {
              const deg = 145 + (idx / 20) * 250;
              const rad = (deg * Math.PI) / 180;
              const active = idx / 20 <= pct;
              const x1 = 100 + Math.cos(rad) * 90;
              const y1 = 100 + Math.sin(rad) * 90;
              const x2 = 100 + Math.cos(rad) * (idx % 5 === 0 ? 83 : 86);
              const y2 = 100 + Math.sin(rad) * (idx % 5 === 0 ? 83 : 86);
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={active ? "#c2f74d" : "rgba(255,255,255,0.16)"}
                  strokeWidth={idx % 5 === 0 ? 2 : 1.2}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Background track arc */}
            <circle
              cx={100}
              cy={100}
              r={arcR}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${sweep} ${arcC}`}
              transform="rotate(145 100 100)"
            />
            {/* Active lime arc */}
            <circle
              cx={100}
              cy={100}
              r={arcR}
              fill="none"
              stroke="url(#trust-dial-grad)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${sweep} ${arcC}`}
              strokeDashoffset={dashOffset}
              transform="rotate(145 100 100)"
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">
              COMPOSITE
            </span>
            <span className="mt-0.5 font-mono text-5xl font-bold tracking-tight text-white tabular-nums">
              {score}
            </span>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-0.5 font-mono text-[11px] font-semibold text-[#c2f74d]">
              <span className="size-1.5 rounded-full bg-[#c2f74d]" />
              Band {band.band} · {band.label}
            </div>
          </div>
        </div>
        <div className="mt-1 flex w-40 justify-between font-mono text-[10px] text-white/45">
          <span>300 FLOOR</span>
          <span>850 CEILING</span>
        </div>
      </div>

      {/* Right: 5-axis telemetry radar */}
      <div className="relative mx-auto flex flex-col items-center">
        <svg viewBox="0 0 190 190" className="size-48 overflow-visible" role="img" aria-label="Five-factor trust score radar">
          <polygon points={ceilingPts} fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" strokeWidth="1" />
          <polygon points={midPts} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <polygon points={innerPts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {factors.map((f, i) => {
            const [ex, ey] = axisPoint(i, 1);
            const [lx, ly] = axisPoint(i, 1.24);
            return (
              <g key={f.key}>
                <line x1={rCx} y1={rCy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white/65 font-mono text-[9px] uppercase"
                >
                  {f.short}
                </text>
              </g>
            );
          })}
          {/* Raw performance outline */}
          <polygon
            points={rawPts}
            fill="none"
            stroke="rgba(194,247,77,0.4)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className="transition-all duration-300"
          />
          {/* Evidence-weighted effective polygon */}
          <polygon
            points={effectivePts}
            fill="rgba(194,247,77,0.22)"
            stroke="#c2f74d"
            strokeWidth="2"
            className="transition-all duration-300"
          />
          {factors.map((f, i) => {
            const [px, py] = axisPoint(i, Math.max(0.08, (f.value / 100) * f.confidence));
            return <circle key={f.key} cx={px} cy={py} r={3} fill="#c2f74d" className="transition-all duration-300" />;
          })}
        </svg>
        <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-white/55">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-xs bg-[#c2f74d]" /> Weighted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-[#c2f74d]/60" /> Raw factor
          </span>
        </div>
      </div>
    </div>
  );
}

function TrustLab() {
  const [activePreset, setActivePreset] = useState<string>("established");
  const [onTime, setOnTime] = useState([48]);
  const [invoices, setInvoices] = useState([22]);
  const [disputes, setDisputes] = useState([1]);
  const [months, setMonths] = useState([14]);
  const [partners, setPartners] = useState([9]);

  const applyPreset = (p: TrustPreset) => {
    setActivePreset(p.id);
    setOnTime([p.onTime]);
    setInvoices([p.invoices]);
    setDisputes([p.disputes]);
    setMonths([p.months]);
    setPartners([p.partners]);
  };

  // Exact 5-factor deterministic formula mirroring the VUKA credit engine:
  // score = 300 + 550 * sum(weight * value * confidence) / 10000
  const { score, factors, band, nextUnlock } = useMemo(() => {
    const ot = onTime[0] ?? 0;
    const inv = invoices[0] ?? 0;
    const disp = disputes[0] ?? 0;
    const mo = months[0] ?? 0;
    const part = partners[0] ?? 0;
    const totalCycles = ot + disp;

    // 1. Settlement completion (weight 30%)
    const completionVal = totalCycles === 0 ? 0 : Math.round((ot / totalCycles) * 100);
    const completionConf = Math.min(1, totalCycles / 12);

    // 2. Invoice discipline (weight 20%)
    const invoiceVal = totalCycles === 0 ? 0 : Math.min(100, Math.round((inv / Math.max(1, ot)) * 130));
    const invoiceConf = Math.min(1, inv / 6);

    // 3. Dispute & reversal cleanliness (weight 25%)
    const disputePenalty = totalCycles === 0 ? 0 : Math.min(1, (disp * 2.2) / Math.max(1, totalCycles));
    const disputeVal = totalCycles === 0 ? 0 : Math.round((1 - disputePenalty) * 100);
    const disputeConf = Math.min(1, totalCycles / 8);

    // 4. Tenure & volume consistency (weight 15%)
    const volumeVal = Math.min(100, Math.round((mo / 18) * 100));
    const volumeConf = Math.min(1, mo / 6);

    // 5. Counterparty diversity (weight 10%)
    const diversityVal = Math.min(100, Math.round((part / 8) * 100));
    const diversityConf = Math.min(1, part / 4);

    const rawFactors = [
      { key: "cycles", label: "Escrow completion rate", short: "Cycles", weight: 30, value: completionVal, confidence: completionConf },
      { key: "disputes", label: "Dispute-free record", short: "Clean", weight: 25, value: disputeVal, confidence: disputeConf },
      { key: "invoices", label: "Invoice-linked discipline", short: "Invoices", weight: 20, value: invoiceVal, confidence: invoiceConf },
      { key: "volume", label: "Trading tenure & cadence", short: "Cadence", weight: 15, value: volumeVal, confidence: volumeConf },
      { key: "diversity", label: "Counterparty diversity", short: "Partners", weight: 10, value: diversityVal, confidence: diversityConf },
    ];

    const computed: RadarFactor[] = rawFactors.map((f) => {
      const maxPoints = Math.round((550 * f.weight) / 100);
      const points = Math.round((550 * f.weight * f.value * f.confidence) / 10_000);
      return { ...f, points, maxPoints };
    });

    const totalPoints = computed.reduce((acc, f) => acc + (550 * f.weight * f.value * f.confidence) / 10_000, 0);
    const finalScore = totalCycles === 0 ? SCORE_MIN : Math.min(SCORE_MAX, Math.round(SCORE_MIN + totalPoints));
    const currentBand = TRUST_BANDS.find((b) => finalScore >= b.min) ?? TRUST_BANDS[TRUST_BANDS.length - 1]!;

    // Best single lever to raise score
    const bestLever = [...computed].sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))[0]!;

    return { score: finalScore, factors: computed, band: currentBand, nextUnlock: bestLever };
  }, [onTime, invoices, disputes, months, partners]);

  const sliderRow = (
    id: string,
    label: string,
    unit: string,
    v: number[],
    set: (val: number[]) => void,
    max: number,
  ) => (
    <div key={id} className="rounded-xl border border-[#ebebeb] bg-[#fafafa] p-4 transition-colors hover:border-[#79b200]/50">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#151515]">{label}</span>
        <span className="rounded-md bg-[#151515] px-2 py-0.5 font-mono text-xs font-semibold text-[#c2f74d] tabular-nums">
          {v[0]} {unit}
        </span>
      </div>
      <Slider
        className="mt-3.5"
        value={v}
        onValueChange={(next) => {
          setActivePreset("custom");
          set(next);
        }}
        max={max}
        step={1}
        aria-label={label}
      />
    </div>
  );

  return (
    <section id="trust" className="relative scroll-mt-24 overflow-hidden border-y border-[#e5e5e5] bg-white py-24 text-[#151515]">
      {/* Subtle radial lime glow in the top-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 2xl:px-14">
        {/* Top header + formula pill */}
        <div className="vuka-reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#79b200]/30 bg-[#eef6dd] px-3.5 py-1 font-mono text-[11px] font-semibold tracking-[0.18em] text-[#557d00] uppercase">
              <span className="vuka-dot-pulse size-2 rounded-full bg-[#79b200]" />
              Algorithmic Trust Engine
            </div>
            <h2 className="mt-4 text-[36px] leading-[1.15] font-bold tracking-[-0.02em] text-[#151515] sm:text-[44px]">
              A Credit Score Earned From Settlements, Never Self-Reported
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-[#444444]">
              Every completed escrow updates your deterministic trade-credit certificate. Test real trader profiles or move the telemetry sliders to see how settlement behaviour unlocks lower deposits and faster releases.
            </p>
          </div>

          {/* Transparent published formula badge */}
          <div className="vuka-card-lift shrink-0 rounded-xl border border-[#e2e8d5] bg-[#f8fbf2] px-4 py-3 font-mono text-xs text-[#222222]">
            <div className="text-[10px] tracking-[0.16em] text-[#79b200] uppercase">Published Deterministic Formula</div>
            <div className="mt-1 font-semibold">
              Score = 300 + 550 × Σ(Weight × Value × Evidence)
            </div>
          </div>
        </div>

        {/* Interactive Trader Persona Switcher */}
        <div className="vuka-reveal mt-10 flex flex-wrap items-center gap-2.5" style={{ "--reveal-delay": "90ms" } as CSSProperties}>
          <span className="mr-1 font-mono text-[11px] tracking-[0.15em] text-[#666666] uppercase">
            Simulate profile:
          </span>
          {TRUST_PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-[#151515] bg-[#151515] text-white shadow-sm"
                    : "border-[#dcdcdc] bg-white text-[#222222] hover:border-[#79b200] hover:bg-[#f9fcf2]"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${isSelected ? "bg-[#c2f74d]" : "bg-[#79b200]"}`}
                />
                <span>{p.tag}</span>
                <span className={`font-mono text-[11px] ${isSelected ? "text-white/70" : "text-[#777777]"}`}>
                  ({p.corridor})
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Lab Workbench: Left Controls + Right Dark Telemetry Certificate */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
          {/* Left column: Interactive Sliders + Guardrail Pill */}
          <div className="vuka-reveal vuka-card-lift flex flex-col justify-between rounded-2xl border border-[#e2e2e2] bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.05)] sm:p-7" style={{ "--reveal-delay": "140ms" } as CSSProperties}>
            <div>
              <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#151515]">Settlement Telemetry Inputs</h3>
                  <p className="text-xs text-[#666666]">Drag any slider to recompute the ledger score in real time</p>
                </div>
                <span className="rounded-full border border-[#dcdcdc] bg-[#fafafa] px-3 py-1 font-mono text-[11px] text-[#444444]">
                  {(onTime[0] ?? 0) + (disputes[0] ?? 0)} total cycles
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                {sliderRow("on-time", "Escrows released on time", "releases", onTime, setOnTime, 80)}
                {sliderRow("invoices", "Invoice-backed payments settled", "invoices", invoices, setInvoices, 50)}
                {sliderRow("disputes", "Disputes or reversals raised against you", "disputes", disputes, setDisputes, 20)}
                {sliderRow("months", "Active months trading on VUKA", "months", months, setMonths, 36)}
                {sliderRow("partners", "Verified corridor counterparties", "partners", partners, setPartners, 20)}
              </div>
            </div>

            {/* Next score unlock insight box */}
            <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-[#cfe899] bg-[#f4fbe4] p-4">
              <div>
                <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#557d00] uppercase">
                  Highest-Impact Score Lever
                </div>
                <p className="mt-1 text-sm font-semibold text-[#151515]">
                  {nextUnlock.label}
                </p>
                <p className="mt-0.5 text-xs text-[#444444]">
                   Strengthening this factor unlocks up to{" "}
                  <strong className="font-mono text-[#151515]">
                    +{Math.max(0, nextUnlock.maxPoints - nextUnlock.points)} pts
                  </strong>{" "}
                  toward the 850 ceiling.
                </p>
              </div>
              <Link
                to="/trust-score"
                className="shrink-0 rounded-full bg-[#151515] px-3.5 py-2 font-mono text-[11px] font-medium text-[#c2f74d] transition-opacity hover:opacity-90"
              >
                Inspect formula →
              </Link>
            </div>
          </div>

          {/* Right column: Dark Ink Live Trade-Credit Certificate & Telemetry Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_rgba(21,21,21,0.18)] sm:p-8">
            {/* Certificate Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#c2f74d] text-[#151515]">
                  <ShieldCheck className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#c2f74d] uppercase">
                    VUKA TRADE-CREDIT CERTIFICATE
                  </div>
                  <div className="text-xs text-white/65">
                    Live counterparty preview · SHA-256 verifiable
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-white/80 uppercase">
                0 Identity Proxies
              </span>
            </div>

            {/* Center Gauges: Speedometer Dial + 5-Axis Radar */}
            <div className="my-6">
              <TrustRadarDial score={score} band={band} factors={factors} />
            </div>

            {/* 5-Factor Attribution Bars */}
            <div className="space-y-3 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">
                <span>Factor Attribution Breakdown</span>
                <span>Earned / Max pts</span>
              </div>
              {factors.map((f) => {
                const fillPct = f.maxPoints > 0 ? Math.min(100, (f.points / f.maxPoints) * 100) : 0;
                return (
                  <div key={f.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/90">
                        {f.label}{" "}
                        <span className="font-mono text-[10px] text-white/45">({f.weight}% wt)</span>
                      </span>
                      <span className="font-mono text-xs text-[#c2f74d] tabular-nums">
                        +{f.points} <span className="text-white/40">/ {f.maxPoints} pts</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#c2f74d] transition-[width] duration-300 ease-out"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unlocked Trade Terms Footer Strip */}
            <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#c2f74d] uppercase">
                  Counterparty Terms Unlocked ({band.label})
                </span>
                <span className="font-mono text-[11px] text-white/60">Band {band.band}</span>
              </div>
              <p className="mt-1 text-xs text-white/70">{band.desc}</p>
              <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">Upfront Ask</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-white">{band.deposit}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">Auto-Release</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-[#c2f74d]">{band.window}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-white/45 uppercase">Corridor Tier</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-white">{band.limit}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mobile() {
  return (
    <section id="mobile" className="scroll-mt-24 mx-auto grid w-full max-w-[1560px] items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-10 2xl:px-14">
      <div className="vuka-reveal">
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
          ].map((t, i) => (
            <li
              key={t}
              style={{ "--reveal-delay": `${(i + 1) * 80}ms` } as CSSProperties}
              className="vuka-reveal flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-300 hover:translate-x-1 hover:border-border hover:bg-muted/30"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#151515] text-[#c2f74d]">
                <Smartphone className="size-3.5" />
              </span>
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="vuka-reveal flex justify-center py-8"
        style={{ "--reveal-delay": "160ms" } as CSSProperties}
      >
        <PhoneMockup className="vuka-float-slow" />
      </div>
    </section>
  );
}

const FEATURED_CORRIDORS: {
  label: string;
  from: string;
  to: string;
  commodity: string;
}[] = [
  { label: "Kigali ↔ Nairobi", from: "RW", to: "KE", commodity: "Tea, specialty coffee & FMCG" },
  { label: "Lagos ↔ Accra", from: "NG", to: "GH", commodity: "Electronics, textiles & industrial parts" },
  { label: "Joburg ↔ Lusaka", from: "ZA", to: "ZM", commodity: "Mining equipment & agri-inputs" },
  { label: "Nairobi ↔ Lagos", from: "KE", to: "NG", commodity: "Packaged goods & B2B services" },
  { label: "Addis ↔ Kampala", from: "ET", to: "UG", commodity: "Grains, oilseeds & leather" },
  { label: "Dakar ↔ Kigali", from: "SN", to: "RW", commodity: "Cross-continental wholesale trade" },
];

const MARKET_HUB_CITIES: Record<string, string> = {
  RW: "Kigali",
  KE: "Nairobi",
  UG: "Kampala",
  TZ: "Dar es Salaam",
  GH: "Accra",
  NG: "Lagos",
  SN: "Dakar",
  ET: "Addis Ababa",
  ZM: "Lusaka",
  ZA: "Johannesburg",
};

function Markets() {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];
  const corridorCount = config.data?.corridor_count ?? markets.length * Math.max(0, markets.length - 1);

  const [originCode, setOriginCode] = useState("RW");
  const [destCode, setDestCode] = useState("KE");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [arcMode, setArcMode] = useState<"corridor" | "hub" | "mesh">("hub");

  const origin = useMemo(
    () => markets.find((m) => m.code === originCode) ?? markets[0],
    [markets, originCode],
  );
  const dest = useMemo(
    () =>
      markets.find((m) => m.code === destCode && m.code !== origin?.code) ??
      markets.find((m) => m.code !== origin?.code) ??
      markets[0],
    [markets, destCode, origin],
  );

  const sampleAmount = 1_000_000;
  const corridorId = origin && dest ? `${origin.code}-${dest.code}` : "";
  const routeQuote = useQuery({
    queryKey: ["market-corridor-quote", corridorId],
    queryFn: () => corridors.quote(corridorId, sampleAmount),
    enabled: Boolean(origin && dest && origin.code !== dest.code),
    staleTime: 120_000,
    retry: false,
  });

  const arcs = useMemo<[string, string][]>(() => {
    if (!markets.length || !origin || !dest) return [];
    if (arcMode === "corridor") {
      return [[origin.code, dest.code]];
    }
    if (arcMode === "hub") {
      return markets
        .filter((m) => m.code !== origin.code)
        .map((m) => [origin.code, m.code] as [string, string]);
    }
    const pairs: [string, string][] = [];
    for (let i = 0; i < markets.length; i += 1) {
      for (let j = i + 1; j < markets.length; j += 1) {
        const mA = markets[i];
        const mB = markets[j];
        if (mA && mB) {
          pairs.push([mA.code, mB.code]);
        }
      }
    }
    return pairs;
  }, [markets, origin, dest, arcMode]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: markets.length };
    for (const m of markets) {
      counts[m.region] = (counts[m.region] ?? 0) + 1;
    }
    return counts;
  }, [markets]);

  const filteredMarkets = useMemo(
    () => (regionFilter === "ALL" ? markets : markets.filter((m) => m.region === regionFilter)),
    [markets, regionFilter],
  );

  if (!markets.length || !origin || !dest) return null;

  const feeBps = corridorFeeBps(origin.region, dest.region);
  const isIntraBloc = origin.region === dest.region;
  const feePct = (feeBps / 100).toFixed(2);

  const handleSelectPair = (from: string, to: string) => {
    setOriginCode(from);
    setDestCode(to);
  };

  const handleSwap = () => {
    setOriginCode(dest.code);
    setDestCode(origin.code);
  };

  const handleGlobeSelect = (code: string | null) => {
    if (!code) return;
    if (code === origin.code) return;
    if (code === dest.code) {
      handleSwap();
      return;
    }
    setDestCode(code);
  };

  return (
    <section
      id="markets"
      className="relative scroll-mt-24 overflow-hidden border-t border-border bg-[#f6f6f4] text-[#141414]"
    >
      {/* Subtle architectural grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 18%, rgba(194, 247, 77, 0.24), transparent 36%), radial-gradient(circle at 86% 78%, rgba(194, 247, 77, 0.16), transparent 40%), linear-gradient(to right, rgba(20, 20, 20, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(20, 20, 20, 0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1560px] px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        {/* Header & Live Engine Network Telemetry Strip */}
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end vuka-reveal">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#141414]/10 bg-white px-3.5 py-1.5 shadow-2xs">
              <span className="size-2 rounded-full bg-[#79b200]" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#141414]/80">
                Markets &amp; Corridors · Pan-African Settlement Mesh
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#141414] sm:text-[42px] sm:leading-[1.1]">
              Starting where trade already flows.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a5d55]">
              Ten launch markets and {corridorCount} directed corridors across four regional economic
              blocs. Live sandbox corridors today — with every market opened for real money only once
              the right licences and local rail partners are in place.
            </p>
          </div>

          {/* 4 Live Network KPI Badges */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:shrink-0">
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                Launch Markets
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                {markets.length}
              </p>
              <p className="text-[11px] text-[#686b62]">Sovereign currencies</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                Active Corridors
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                {corridorCount}
              </p>
              <p className="text-[11px] text-[#686b62]">Directed trade pairs</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                Intra-Bloc Fee
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#4d7500]">
                0.80%
              </p>
              <p className="text-[11px] text-[#686b62]">80 bps same-region</p>
            </div>
            <div className="rounded-2xl border border-[#e3e4de] bg-white px-4 py-3 shadow-2xs vuka-card-lift">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767a70]">
                Cross-Bloc Fee
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#141414]">
                1.20%
              </p>
              <p className="text-[11px] text-[#686b62]">120 bps inter-region</p>
            </div>
          </div>
        </div>

        {/* Featured Corridor Quick-Preset Bar */}
        <div className="mt-9 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6d7067]">
            Featured corridors:
          </span>
          {FEATURED_CORRIDORS.map((preset) => {
            const active = origin.code === preset.from && dest.code === preset.to;
            const pFrom = markets.find((m) => m.code === preset.from);
            const pTo = markets.find((m) => m.code === preset.to);
            const sameBloc = pFrom && pTo && pFrom.region === pTo.region;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPair(preset.from, preset.to)}
                className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border-[#141414] bg-[#141414] text-white shadow-sm"
                    : "border-[#dfdfd9] bg-white text-[#2c2e29] hover:border-[#141414]/40 hover:bg-[#fafaf8]"
                }`}
              >
                <Flag code={preset.from} className="w-4 rounded-[2px]" />
                <span>{preset.label}</span>
                <Flag code={preset.to} className="w-4 rounded-[2px]" />
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                    active
                      ? "bg-[#c2f74d] font-semibold text-[#141414]"
                      : sameBloc
                        ? "bg-[#eef8d6] text-[#456b00]"
                        : "bg-[#f1f2ee] text-[#686b62]"
                  }`}
                >
                  {sameBloc ? "0.80%" : "1.20%"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Interactive Workbench: 3D Orthographic Globe + Dark Ink Corridor Inspector */}
        <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
          {/* Left Column: Interactive 3D Orthographic Globe Card */}
          <div className="flex flex-col justify-between rounded-[28px] border border-[#e2e3dd] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.08)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeea] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#75796e]">
                    Orthographic Corridor Projection
                  </span>
                  <span className="rounded-full bg-[#eef8d6] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#476d00]">
                    {arcs.length} {arcs.length === 1 ? "route" : "routes"} drawn
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#141414]">
                  {MARKET_HUB_CITIES[origin.code] ?? origin.name} ({origin.code}) →{" "}
                  {MARKET_HUB_CITIES[dest.code] ?? dest.name} ({dest.code})
                </p>
              </div>

              {/* Arc topology switcher */}
              <div className="inline-flex rounded-xl border border-[#e3e4de] bg-[#f7f7f5] p-1">
                {(
                  [
                    { id: "corridor", label: "Active Pair" },
                    { id: "hub", label: `${origin.code} Hub (${markets.length - 1})` },
                    { id: "mesh", label: "Full Mesh" },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setArcMode(mode.id)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                      arcMode === mode.id
                        ? "bg-[#141414] text-[#c2f74d] shadow-2xs"
                        : "text-[#63665d] hover:text-[#141414]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Canvas Globe */}
            <div className="relative my-2 h-[380px] w-full sm:h-[420px]">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#f9f9f7] font-mono text-xs text-[#75796e]">
                    Initialising African corridor projection…
                  </div>
                }
              >
                <Globe
                  markets={markets}
                  arcs={arcs}
                  activeCode={origin.code}
                  onActive={handleGlobeSelect}
                  className="h-full w-full"
                />
              </Suspense>

              {/* Floating Origin / Destination quick pill in top-left of globe */}
              <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5 rounded-2xl border border-[#e3e4de]/90 bg-white/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-[#141414]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#75796e]">
                    Origin Hub:
                  </span>
                  <Flag code={origin.code} className="w-4 rounded-[2px]" />
                  <span className="font-semibold text-[#141414]">
                    {origin.name} ({origin.currency})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-[#79b200]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#75796e]">
                    Target Hub:
                  </span>
                  <Flag code={dest.code} className="w-4 rounded-[2px]" />
                  <span className="font-semibold text-[#141414]">
                    {dest.name} ({dest.currency})
                  </span>
                </div>
              </div>
            </div>

            {/* Legend & interaction hint */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeea] pt-4 text-xs text-[#666960]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#c2f74d] ring-1 ring-[#141414]/30" />
                  Launch Market
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#141414]" />
                  Selected Origin Hub
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[#141414]" />
                  Elevated Settlement Arc
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#7a7d74]">
                Drag globe to rotate · Click any market to route
              </span>
            </div>
          </div>

          {/* Right Column: Dark Ink Live Corridor Route Inspector */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#141414] bg-[#151515] p-6 text-white shadow-[0_28px_70px_-24px_rgba(0,0,0,0.45)] sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-20 blur-3xl"
              style={{
                background: "radial-gradient(circle, #c2f74d 0%, rgba(194,247,77,0) 70%)",
              }}
            />

            <div>
              {/* Top Inspector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Live Corridor Specification
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/80">
                    CORRIDOR ID ·{" "}
                    <span className="font-semibold text-[#c2f74d]">
                      {origin.code}-{dest.code}-{origin.region}
                    </span>
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold ${
                    isIntraBloc
                      ? "border-[#c2f74d]/40 bg-[#c2f74d]/15 text-[#c2f74d]"
                      : "border-white/20 bg-white/10 text-white"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {isIntraBloc
                    ? `INTRA-${origin.region} · ${feePct}% (${feeBps} bps)`
                    : `${origin.region} → ${dest.region} · ${feePct}% (${feeBps} bps)`}
                </span>
              </div>

              {/* Interactive Origin <-> Destination Route Selector */}
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                {/* Origin selector */}
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                      Origin (Buyer)
                    </span>
                    <span className="font-mono text-[10px] text-[#c2f74d]">
                      +{DIAL[origin.code] ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <Flag code={origin.code} className="w-7 shrink-0 rounded-xs" />
                    <select
                      aria-label="Origin market"
                      value={origin.code}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === dest.code) {
                          handleSwap();
                        } else {
                          setOriginCode(next);
                        }
                      }}
                      className="w-full cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none"
                    >
                      {markets.map((m) => (
                        <option key={m.code} value={m.code} className="bg-[#151515] text-white">
                          {m.name} ({m.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-white/55">
                    {origin.region} · {REGION_NAMES[origin.region] ?? origin.region}
                  </p>
                </div>

                {/* Swap Direction Button */}
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Swap origin and destination markets"
                  className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#c2f74d] transition hover:border-[#c2f74d] hover:bg-[#c2f74d] hover:text-[#141414]"
                >
                  <ArrowLeftRight className="size-4" />
                </button>

                {/* Destination selector */}
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                      Destination (Supplier)
                    </span>
                    <span className="font-mono text-[10px] text-[#c2f74d]">
                      +{DIAL[dest.code] ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <Flag code={dest.code} className="w-7 shrink-0 rounded-xs" />
                    <select
                      aria-label="Destination market"
                      value={dest.code}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === origin.code) {
                          handleSwap();
                        } else {
                          setDestCode(next);
                        }
                      }}
                      className="w-full cursor-pointer bg-transparent text-sm font-semibold text-white focus:outline-none"
                    >
                      {markets.map((m) => (
                        <option key={m.code} value={m.code} className="bg-[#151515] text-white">
                          {m.name} ({m.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-white/55">
                    {dest.region} · {REGION_NAMES[dest.region] ?? dest.region}
                  </p>
                </div>
              </div>

              {/* 3-Hop Settlement Pipeline Architecture */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                    3-Hop Settlement Pipeline
                  </p>
                  <span className="font-mono text-[10px] text-[#c2f74d]">
                    Atomic Lock → Confirm → Release
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="font-mono text-[10px] text-white/45">1 · COLLECTION RAIL</p>
                    <p className="mt-1 text-xs font-semibold text-white">{origin.provider_name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#c2f74d]">
                      {origin.currency} Cash-In · {origin.provider_id}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#c2f74d]/30 bg-[#c2f74d]/[0.07] p-3">
                    <p className="font-mono text-[10px] text-[#c2f74d]">2 · ESCROW VAULT</p>
                    <p className="mt-1 text-xs font-semibold text-white">Polygon USDC Contract</p>
                    <p className="mt-1 font-mono text-[11px] text-white/70">
                      Invoice-linked neutral lock
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="font-mono text-[10px] text-white/45">3 · PAYOUT RAIL</p>
                    <p className="mt-1 text-xs font-semibold text-white">{dest.provider_name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#c2f74d]">
                      {dest.currency} Release · {dest.provider_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Engine Quote & FX Telemetry */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    Indicative FX Rate
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {routeQuote.data?.quote
                      ? `1 ${origin.currency} = ${routeQuote.data.quote.inverse_rate.toFixed(4)} ${dest.currency}`
                      : `${origin.currency} → ${dest.currency}`}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    Engine quote feed (live)
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    Protocol Fee Tier
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[#c2f74d]">
                    {feePct}% ({feeBps} bps)
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    {isIntraBloc ? `Same bloc (${origin.region})` : "Cross-bloc corridor"}
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:col-span-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    1M {origin.currency} Net Payout
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-white">
                    {routeQuote.data?.quote
                      ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(routeQuote.data.quote.deliver_amount_minor)} ${dest.currency}`
                      : "Calculating…"}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/45">
                    After {feePct}% escrow fee
                  </p>
                </div>
              </div>
            </div>

            {/* Factual Monetary Jurisdiction & Sandbox Honesty Footer */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/75">
                <span>
                  <strong className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                    Monetary Areas:
                  </strong>{" "}
                  {CENTRAL_BANKS[origin.code]} ({origin.currency}) ↔ {CENTRAL_BANKS[dest.code]} (
                  {dest.currency})
                </span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#c2f74d] hover:underline"
                >
                  Test this corridor <ArrowRight className="size-3" />
                </Link>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                Central banks and rail operators are listed for factual monetary context only. VUKA is
                currently running in a simulated sandbox environment and claims no regulatory licence,
                partnership, or endorsement.
              </p>
            </div>
          </div>
        </div>

        {/* Regional Bloc Filter Bar & 10-Market Directory Cards */}
        <div className="mt-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#141414]">
                Launch Market &amp; Local Rail Directory
              </h3>
              <p className="text-xs text-[#666960]">
                Click any market card to assign it as Origin or Destination in the corridor workbench
                above.
              </p>
            </div>

            {/* Regional Bloc Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {["ALL", "EAC", "ECOWAS", "SADC", "HORN"].map((bloc) => {
                const count = regionCounts[bloc] ?? 0;
                const active = regionFilter === bloc;
                return (
                  <button
                    key={bloc}
                    type="button"
                    onClick={() => setRegionFilter(bloc)}
                    className={`rounded-full border px-3 py-1 font-mono text-xs font-medium transition ${
                      active
                        ? "border-[#141414] bg-[#141414] text-[#c2f74d]"
                        : "border-[#dfdfd9] bg-white text-[#555850] hover:border-[#141414]/40"
                    }`}
                  >
                    {bloc === "ALL" ? "All Blocs" : bloc} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {filteredMarkets.map((m) => {
              const isOrigin = m.code === origin.code;
              const isDest = m.code === dest.code;
              return (
                <li
                  key={m.code}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isOrigin
                      ? "border-[#141414] bg-[#141414] text-white shadow-lg"
                      : isDest
                        ? "border-[#79b200] bg-white ring-2 ring-[#c2f74d]/70"
                        : "border-[#e2e3dd] bg-white hover:border-[#141414]/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Flag code={m.code} className="w-8 rounded-xs shadow-2xs" />
                        <div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isOrigin ? "text-white" : "text-[#141414]"
                            }`}
                          >
                            {m.code}
                          </span>
                          <span
                            className={`ml-1.5 font-mono text-[11px] ${
                              isOrigin ? "text-white/60" : "text-[#767a70]"
                            }`}
                          >
                            +{DIAL[m.code] ?? ""}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          isOrigin
                            ? "bg-[#c2f74d] text-[#141414]"
                            : isDest
                              ? "bg-[#141414] text-[#c2f74d]"
                              : "bg-[#f2f3ef] text-[#5c5f57]"
                        }`}
                      >
                        {isOrigin ? "ORIGIN" : isDest ? "TARGET" : m.region}
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline justify-between">
                      <p
                        className={`text-base font-semibold ${
                          isOrigin ? "text-white" : "text-[#141414]"
                        }`}
                      >
                        {m.name}
                      </p>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isOrigin ? "text-[#c2f74d]" : "text-[#4d7500]"
                        }`}
                      >
                        {m.currency}
                      </span>
                    </div>

                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 ${
                        isOrigin
                          ? "border-white/12 bg-white/[0.05]"
                          : "border-[#ebece6] bg-[#f9f9f7]"
                      }`}
                    >
                      <p
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                          isOrigin ? "text-white/50" : "text-[#7a7d74]"
                        }`}
                      >
                        Primary Rail
                      </p>
                      <p
                        className={`mt-0.5 truncate text-xs font-medium ${
                          isOrigin ? "text-white/90" : "text-[#22241f]"
                        }`}
                      >
                        {m.provider_name}
                      </p>
                    </div>
                  </div>

                  {/* Quick Set Origin / Set Target Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (m.code === dest.code) {
                          handleSwap();
                        } else {
                          setOriginCode(m.code);
                        }
                      }}
                      className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition ${
                        isOrigin
                          ? "border-[#c2f74d] bg-[#c2f74d] text-[#141414]"
                          : "border-[#dfdfd9] bg-white text-[#353731] hover:border-[#141414]"
                      }`}
                    >
                      {isOrigin ? "✓ Origin" : "Set Origin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (m.code === origin.code) {
                          handleSwap();
                        } else {
                          setDestCode(m.code);
                        }
                      }}
                      className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition ${
                        isDest
                          ? "border-[#141414] bg-[#141414] text-[#c2f74d]"
                          : isOrigin
                            ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                            : "border-[#dfdfd9] bg-white text-[#353731] hover:border-[#141414]"
                      }`}
                    >
                      {isDest ? "✓ Target" : "Set Target"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
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
      <div className="vuka-reveal mx-auto grid w-full max-w-[1560px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-10 2xl:px-14">
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
      <div className="vuka-reveal relative mx-auto w-full max-w-[1560px] px-4 py-28 text-center sm:px-6 lg:px-10 2xl:px-14">
        <h2 className="text-gradient mx-auto max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Your next supplier doesn't need to know you. They need to trust the payment.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
          >
            Open an account
          </Link>
          <Link to="/support" className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent">
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Public landing page shown to signed-out visitors. */
export function Landing() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".vuka-reveal"));
    if (!els.length) return;
    if (typeof IntersectionObserver === "undefined") {
      for (const el of els) el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -36px 0px" },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

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
        <EscrowExplained />
        <TrustLab />
        <Mobile />
        <Markets />
        <Faq />
        <Cta />
        <Estimator />
      </main>
      <SiteFooter />
    </div>
  );
}
