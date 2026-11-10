import type { ReactNode } from "react";
import { useLangCopy } from "@/lib/i18n";
import { Photo, type PhotoCredit } from "./landing/photo";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export const CONTACT_EMAIL = (import.meta.env["VITE_CONTACT_EMAIL"] as string | undefined) || "";
export const SECURITY_EMAIL = (import.meta.env["VITE_SECURITY_EMAIL"] as string | undefined) || "";

const COPY = {
  en: {
    notConfigured: "not yet configured",
    skipToContent: "Skip to content",
    draftBadge: "Draft — pending legal review. ",
    draftBody:
      "This document describes how the platform is designed to behave. It has not yet been reviewed by counsel and is not a binding agreement.",
    onThisPage: "On this page",
  },
  fr: {
    notConfigured: "non encore configuré",
    skipToContent: "Aller au contenu",
    draftBadge: "Projet — en attente de révision juridique. ",
    draftBody:
      "Ce document décrit le fonctionnement prévu de la plateforme. Il n'a pas encore été revu par un conseil juridique et ne constitue pas un contrat contraignant.",
    onThisPage: "Sur cette page",
  },
  sw: {
    notConfigured: "bado haijawekwa",
    skipToContent: "Ruka hadi maudhui",
    draftBadge: "Rasimu — inasubiri ukaguzi wa kisheria. ",
    draftBody:
      "Hati hii inaelezea jinsi jukwaa lilivyoundwa kufanya kazi. Bado haijakaguliwa na wanasheria na si mkataba unaofunga kisheria.",
    onThisPage: "Katika ukurasa huu",
  },
  pt: {
    notConfigured: "ainda não configurado",
    skipToContent: "Saltar para o conteúdo",
    draftBadge: "Rascunho — pendente de revisão jurídica. ",
    draftBody:
      "Este documento descreve como a plataforma foi concebida para funcionar. Ainda não foi revisto por consultores jurídicos e não constitui um acordo vinculativo.",
    onThisPage: "Nesta página",
  },
  rw: {
    notConfigured: "ntirashyirwaho",
    skipToContent: "Simbukira ku bikubiyemo",
    draftBadge: "Umushinga — utegereje isuzuma ry'amategeko. ",
    draftBody:
      "iyi nyandiko isobanura uko urubuga rwateguwe gukora. Ntiragenzurwa n'abanyamategeko kandi ntabwo ari amasezerano agenga impande zombi.",
    onThisPage: "Kuri uru rupapuro",
  },
};

/** Reads the contact address from configuration; shows an honest placeholder until one is set. */
export function ContactLink({ address, label }: { address: string; label: string }) {
  const copy = useLangCopy(COPY);
  return address ? (
    <a className="underline underline-offset-4" href={`mailto:${address}`}>
      {address}
    </a>
  ) : (
    <span className="border border-dashed border-border px-1.5 py-0.5 font-mono text-xs">
      {label} — {copy.notConfigured}
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
  photo,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: string;
  draft?: boolean;
  toc?: { id: string; label: string }[];
  photo?: { src: string; alt: string; credit: PhotoCredit };
  children: ReactNode;
}) {
  const copy = useLangCopy(COPY);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {copy.skipToContent}
      </a>
      <SiteHeader />
      <main id="main">
        <header className="border-b border-border bg-muted/30">
          <div
            className={`mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 ${photo ? "grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : ""}`}
          >
            <div>
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
                    {copy.draftBadge}
                  </strong>
                  {copy.draftBody}
                </p>
              ) : null}
            </div>
            {photo ? (
              <Photo
                src={photo.src}
                alt={photo.alt}
                width={1200}
                height={900}
                credit={photo.credit}
                imgClassName="aspect-[4/3]"
              />
            ) : null}
          </div>
        </header>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[200px_1fr]">
          {toc ? (
            <nav aria-label={copy.onThisPage} className="hidden lg:block">
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
