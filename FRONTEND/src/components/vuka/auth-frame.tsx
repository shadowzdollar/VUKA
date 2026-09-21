import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { platform } from "@/lib/api/endpoints";
import { Flag } from "./landing/flags";
import { SiteControls } from "./site-controls";
import { Sheet3D, Tilt } from "./landing/tilt";
import { VukaLogo } from "./brand";

const PILLARS = [
  ["Invoice-linked", "Every payment is bound to the invoice it settles."],
  ["Escrow-backed", "Funds are committed before goods ship and released on evidence."],
  ["Ledger-true", "Balances are derived from immutable double-entry postings."],
];

const FOOT = [
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/security", "Security"],
  ["/status", "Status"],
  ["/support", "Help"],
] as const;

/**
 * Split-screen frame shared by /login and /register. The left column is the form; the right panel
 * shows an illustrative receipt on a 3D paper stack, the launch markets, and what the platform enforces.
 */
export function AuthFrame({
  children,
  variant = "login",
  wide = false,
}: {
  children: ReactNode;
  variant?: "login" | "register";
  wide?: boolean;
}) {
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];
  const isReg = variant === "register";

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(460px,640px)_1fr]">
      <div className="flex min-h-screen flex-col border-border lg:border-r">
        <div className="flex items-center justify-between px-6 py-4 sm:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to home
          </Link>
          <SiteControls />
        </div>

        <div
          className={`mx-auto flex w-full flex-1 flex-col justify-center px-6 py-8 sm:px-12 ${wide ? "max-w-2xl" : "max-w-xl"}`}
        >
          <Link to="/" className="mb-10 block" aria-label="VUKA — home">
            <VukaLogo size="lg" tagline="Rise & Cross Over" />
          </Link>
          {children}

          <ul className="mt-12 grid gap-3 border-t border-border pt-6 text-xs text-muted-foreground lg:hidden">
            {PILLARS.map(([h, b]) => (
              <li key={h}>
                <span className="font-mono uppercase tracking-[0.14em] text-foreground">{h}</span> —{" "}
                {b}
              </li>
            ))}
          </ul>
        </div>

        <footer className="border-t border-border px-6 py-4 text-[11px] text-muted-foreground sm:px-12">
          <nav aria-label="Legal and help" className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOT.map(([to, l]) => (
              <Link
                key={to}
                to={to}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {l}
              </Link>
            ))}
          </nav>
          <p className="mt-2">
            Sandbox environment. No real money moves. © {new Date().getFullYear()} VUKA
          </p>
        </footer>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
          <span aria-hidden="true" className="h-px w-10 bg-background" />
          Continental cross-border payments
        </div>

        <div>
          <h2 className="max-w-lg font-display text-5xl font-normal leading-[1.05] tracking-tight">
            {isReg ? (
              <>
                Open an account. <em>Your first quote</em> is minutes away.
              </>
            ) : (
              <>
                Trade across borders on trust that is <em>enforced</em>.
              </>
            )}
          </h2>

          <Tilt className="mt-12 h-[250px] max-w-md" max={7}>
            <div aria-hidden="true" className="relative size-full text-card-foreground">
              <Sheet3D z={0} className="absolute inset-x-8 top-10 h-[190px] opacity-75" />
              <Sheet3D z={30} className="absolute inset-x-4 top-5 h-[190px] opacity-80" />
              <Sheet3D z={64} className="absolute inset-x-0 top-0 h-[200px] p-5 font-mono text-xs">
                <div className="flex justify-between border-b border-dashed border-border pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Settlement receipt</span>
                  <span>Illustrative</span>
                </div>
                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sent</dt>
                    <dd className="tabular">RWF 500,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Fee · 0.80%</dt>
                    <dd className="tabular">RWF 4,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Escrow</dt>
                    <dd>Released ✓</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
                    <dt>Delivered</dt>
                    <dd className="tabular font-display text-2xl">KES 46,100</dd>
                  </div>
                </dl>
              </Sheet3D>
            </div>
          </Tilt>

          <ul className="mt-12 grid max-w-lg gap-5 sm:grid-cols-3">
            {PILLARS.map(([h, b]) => (
              <li key={h} className="border-t border-background/30 pt-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em]">{h}</div>
                <p className="mt-1 text-xs opacity-70">{b}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ul className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
            {markets.map((m) => (
              <li key={m.code} className="flex items-center gap-1.5">
                <Flag code={m.code} className="w-4 shrink-0 shadow-sm" />
                {m.name}
              </li>
            ))}
          </ul>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] opacity-75">
            Sandbox environment
          </div>
        </div>
      </aside>
    </div>
  );
}
