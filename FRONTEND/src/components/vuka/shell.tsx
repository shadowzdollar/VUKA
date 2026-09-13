import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Operations Cockpit", code: "OPS" },
  { to: "/wallets", label: "Wallets & Ledger", code: "LDG" },
  { to: "/escrow", label: "Invoices & Escrow", code: "ESC" },
  { to: "/trust-score", label: "Trust & Credit", code: "TRS" },
  { to: "/disputes", label: "Dispute Tribunal", code: "DSP" },
  { to: "/compliance", label: "Compliance & KYC", code: "KYC" },
  { to: "/corridors", label: "Corridors & ISO 20022", code: "COR" },
] as const;

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "warn" | "dead" | "invert";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        tone === "neutral" && "border-border text-muted-foreground",
        tone === "live" && "border-foreground/50 text-foreground",
        tone === "warn" && "border-dashed border-foreground/60 text-foreground",
        tone === "dead" && "border-border text-muted-foreground/60 line-through",
        tone === "invert" && "border-foreground bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </h2>
        {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="border border-border bg-card px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl tabular-nums tracking-tight text-foreground">
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-[0.35em] text-foreground">VUKA</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
              Rise &amp; Cross Over
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Chip tone="live">Pilot · RW↔KE</Chip>
            <Chip>Ledger balanced</Chip>
            <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
              arbiter@vuka.africa
            </span>
          </div>
        </div>
        <nav className="flex gap-0 overflow-x-auto border-t border-border px-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="group border-b-2 border-transparent px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "border-foreground text-foreground" }}
            >
              <span className="mr-2 text-muted-foreground/60 group-hover:text-foreground/60">
                {item.code}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-5 py-7">{children}</main>
      <footer className="border-t border-border px-5 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          VUKA settlement network · simulated pilot environment · no live funds
        </p>
      </footer>
    </div>
  );
}
