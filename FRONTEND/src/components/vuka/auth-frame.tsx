import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const pillars = [
  ["Invoice-linked", "Every payment is bound to the invoice it settles."],
  ["Escrow-backed", "Funds are committed before goods ship and released on evidence."],
  ["Ledger-true", "Balances are derived from immutable double-entry postings."],
];

/** Split-screen frame shared by /login and /register (monochrome, no gradients). */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(420px,520px)_1fr]">
      <div className="flex flex-col justify-center border-border px-6 py-10 sm:px-12 lg:border-r">
        <Link to="/login" className="mb-10 block">
          <span className="text-xl font-semibold tracking-[0.4em]">VUKA</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Rise &amp; Cross Over
          </span>
        </Link>
        {children}
      </div>
      <aside className="hidden flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
          Continental cross-border payments
        </div>
        <div>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight">
            Trade across borders on trust that is enforced, not just displayed.
          </h2>
          <ul className="mt-10 max-w-md space-y-5">
            {pillars.map(([title, text]) => (
              <li key={title} className="border-t border-background/30 pt-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em]">{title}</div>
                <p className="mt-1 text-sm opacity-70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
          Rwanda · Kenya · Uganda · Tanzania · sandbox environment
        </div>
      </aside>
    </div>
  );
}
