import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Dark-console building blocks shared by /login and /register so both pages
 * carry the same visual language: near-black ground, one elevated card, square
 * corners, hairline borders and mono uppercase labels. State is carried by
 * weight and fill — never hue.
 */

/** Standard input treatment for the auth pages (icons may add left padding). */
export const AUTH_INPUT =
  "h-12 rounded-none border border-neutral-700 bg-neutral-950 text-sm text-neutral-100 shadow-none transition-colors " +
  "placeholder:text-neutral-500 hover:border-neutral-600 focus-visible:border-neutral-100 focus-visible:ring-1 focus-visible:ring-neutral-100";

/** Standard primary-action treatment: light fill inverts the ground. */
export const AUTH_BUTTON =
  "rounded-none bg-neutral-100 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-950 " +
  "shadow-none transition-colors hover:bg-white";

/** The VUKA word mark. Inherits the surrounding text colour. */
export function AuthMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link to="/" aria-label="VUKA home" className="inline-flex items-center gap-3">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className={cn("h-10 w-10", className)}
        aria-hidden="true"
      >
        <path d="M4 5L20 35L36 5L25 13L20 24L15 13L4 5Z" fill="currentColor" />
      </svg>
      <span
        className={cn(
          "font-medium tracking-[0.24em]",
          compact ? "text-xl tracking-[0.22em]" : "text-3xl",
        )}
      >
        VUKA
      </span>
    </Link>
  );
}

/**
 * Page frame for the auth routes: masthead, one centered elevated card, and a
 * thin utility footer. `color-scheme: dark` keeps native controls consistent.
 */
export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 [color-scheme:dark]">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 sm:px-10">
        <AuthMark compact className="h-8 w-8" />

        <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 sm:block">
          Trade / Operate / Grow
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className={cn("w-full", wide ? "max-w-xl" : "max-w-md")}>
          <div className="border border-neutral-800 bg-neutral-900/40 p-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,1)] sm:p-8">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-between gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 sm:flex-row">
          <span>© {new Date().getFullYear()} VUKA</span>
          <span>Sandbox environment — no real money moves</span>
        </div>
      </footer>
    </div>
  );
}

/** Field with the shared mono uppercase label and optional hint. */
export function AuthField({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500"
      >
        {label}
      </label>

      {children}

      {hint && <p className="text-xs leading-5 text-neutral-500">{hint}</p>}
    </div>
  );
}

/** Error surface: weight and fill, never hue. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 border border-neutral-600 bg-neutral-100/[0.06] p-3 text-sm leading-5 font-medium text-neutral-100"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-none border border-neutral-500 font-mono text-[11px] font-medium"
      >
        !
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
