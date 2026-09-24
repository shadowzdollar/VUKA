import { lazy, Suspense } from "react";
import { Frameworks } from "./landing/frameworks";
import { EscrowLab } from "./landing/escrow-lab";
import { Estimator } from "./landing/estimator";
import { Hero } from "./landing/hero";
import { Journey } from "./landing/journey";
import { MobileSection } from "./landing/mobile";
import { NetworkGallery } from "./landing/network";
import {
  CtaBand,
  Comparison,
  Faq,
  Features,
  Markets,
  Principles,
  Stories,
} from "./landing/sections";
import { TrustLab } from "./landing/trust-lab";
const Atlas = lazy(() => import("./landing/atlas").then((m) => ({ default: m.Atlas })));
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

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
        <Principles />
        <Journey />
        <Estimator />
        <EscrowLab />
        <MobileSection />
        <Features />
        <TrustLab />
        <NetworkGallery />
        <Suspense
          fallback={
            <div className="min-h-[900px] border-t border-border bg-muted/30" aria-hidden="true" />
          }
        >
          <Atlas />
        </Suspense>
        <Markets />
        <Frameworks />
        <Stories />
        <Comparison />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
