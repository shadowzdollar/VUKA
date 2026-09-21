import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export const CONTACT_EMAIL = (import.meta.env["VITE_CONTACT_EMAIL"] as string | undefined) || "";
export const SECURITY_EMAIL = (import.meta.env["VITE_SECURITY_EMAIL"] as string | undefined) || "";

/** Reads the contact address from configuration; shows an honest placeholder until one is set. */
export function ContactLink({ address, label }: { address: string; label: string }) {
  return address ? (
    <a className="underline underline-offset-4" href={`mailto:${address}`}>
      {address}
    </a>
  ) : (
    <span className="border border-dashed border-border px-1.5 py-0.5 font-mono text-xs">
      {label} — not yet configured
    </span>
  );
}

/** Shared chrome for long-form public pages: header, an editorial title block, optional draft banner, footer. */
export function PublicPage({
  kicker,
  title,
  lead,
  draft,
  toc,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: string;
  draft?: boolean;
  toc?: { id: string; label: string }[];
  children: ReactNode;
}) {
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
        <header className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span aria-hidden="true" className="h-px w-10 bg-foreground" />
              {kicker}
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
              {title}
            </h1>
            {lead ? <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{lead}</p> : null}
            {draft ? (
              <p role="note" className="mt-8 max-w-2xl border-2 border-foreground p-4 text-sm">
                <strong className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Draft — pending legal review.{" "}
                </strong>
                This document describes how the platform is designed to behave. It has not yet been
                reviewed by counsel and is not a binding agreement.
              </p>
            ) : null}
          </div>
        </header>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[200px_1fr]">
          {toc ? (
            <nav aria-label="On this page" className="hidden lg:block">
              <ul className="sticky top-24 space-y-2 border-l border-border pl-4 text-sm">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-muted-foreground hover:text-foreground">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <div />
          )}
          <div className="min-w-0 space-y-14">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-3xl leading-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
