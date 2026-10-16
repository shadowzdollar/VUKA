import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SiteControls } from "./site-controls";
import { VukaLogo } from "./brand";

const FOOT = [
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/security", "Security"],
  ["/status", "Status"],
  ["/support", "Help"],
] as const;

/**
 * Plain, centered frame shared by /login and /register: logo, a single card, minimal footer.
 * No decorative panel — this is a tool people sign into, not a marketing surface.
 */
export function AuthFrame({
  children,
  wide = false,
}: {
  children: ReactNode;
  variant?: "login" | "register";
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex items-center justify-between px-6 py-4 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to home
        </Link>
        <SiteControls />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"}`}>
          <Link to="/" className="mb-8 flex justify-center" aria-label="VUKA — home">
            <VukaLogo size="md" />
          </Link>
          <div className="border border-border bg-card p-6 sm:p-8">{children}</div>
        </div>
      </div>

      <footer className="border-t border-border px-6 py-4 text-[11px] text-muted-foreground sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
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
          <p>Sandbox environment. No real money moves. © {new Date().getFullYear()} VUKA</p>
        </div>
      </footer>
    </div>
  );
}
