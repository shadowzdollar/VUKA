import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PhoneMockup } from "./landing/phone-mockup";
import { VukaLogo } from "./brand";

export const AUTH_INPUT =
  "h-11 rounded-lg border border-input bg-background px-3.5 text-sm text-foreground shadow-none transition-colors " +
  "placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring";

export const AUTH_BUTTON =
  "h-11 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-opacity " +
  "hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";

/**
 * Centered auth layout: logo + form on the left, an illustrative device preview on the right
 * (desktop only). No fabricated stats or non-functional sign-in options — only what the engine
 * actually supports.
 */
export function AuthShell({
  children,
  page = "login",
}: {
  children: ReactNode;
  page?: "login" | "register";
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="VUKA home">
            <VukaLogo size="md" />
          </Link>
          {page === "login" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Don't have an account?</span>
              <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
                Create one
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Already have an account?</span>
              <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </div>
          )}
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</main>
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} VUKA</span>
          <Link to="/support" className="hover:text-foreground">
            Help &amp; support
          </Link>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-surface lg:flex">
        <div className="grid-texture absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <PhoneMockup className="relative" />
      </div>
    </div>
  );
}

/** Field wrapper: label + input + optional hint. */
export function AuthField({ id, label, children, hint }: { id: string; label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Error alert banner. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/20 font-mono text-[10px] font-bold"
      >
        !
      </span>
      <span className="min-w-0 font-medium">{children}</span>
    </div>
  );
}
