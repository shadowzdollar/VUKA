import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Flag } from "./landing/flags";
import { ArrowUp, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platform } from "@/lib/api/endpoints";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { VukaLogo } from "./brand";

type FooterLink = { label: string; to?: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How a payment works", href: "/#journey" },
      { label: "Cost estimator", href: "/#estimate" },
      { label: "Escrow explained", href: "/#escrow" },
      { label: "VUKA on mobile", href: "/#mobile" },
      { label: "Markets and corridors", href: "/#markets" },
      { label: "Trust score lab", href: "/#trust" },
      { label: "Questions", href: "/#faq" },
    ],
  },
  {
    title: "For traders",
    links: [
      { label: "Open an account", to: "/register" },
      { label: "Sign in", to: "/login" },
      { label: "Send a payment", to: "/send" },
      { label: "Invoices", to: "/escrow" },
      { label: "Verification and limits", to: "/verification" },
      { label: "Help and support", to: "/support" },
    ],
  },
  {
    title: "Trust and security",
    links: [
      { label: "Security practices", to: "/security" },
      { label: "System status", to: "/status" },
      { label: "Data protection", to: "/privacy" },
      { label: "How disputes are resolved", href: "/#escrow" },
      { label: "Report a vulnerability", to: "/security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About VUKA", to: "/about" },
      { label: "Principles", href: "/about#principles" },
      { label: "Roadmap", href: "/about#roadmap" },
      { label: "Accessibility", href: "/about#accessibility" },
      { label: "Contact", href: "/about#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of use", to: "/terms" },
      { label: "Privacy notice", to: "/privacy" },
      { label: "Cookies and storage", href: "/privacy#storage" },
    ],
  },
];

function FooterAnchor({ l }: { l: FooterLink }) {
  const cls =
    "text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
  return l.to ? (
    <Link to={l.to} className={cls}>
      {l.label}
    </Link>
  ) : (
    <a href={l.href} className={cls}>
      {l.label}
    </a>
  );
}

export function SiteFooter() {
  const { lang, setLang } = useI18n();
  const { resolved, setPreference } = useTheme();
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });
  const markets = config.data?.countries ?? [];

  return (
    <footer className="border-t border-border bg-muted/30" data-app-chrome>
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <VukaLogo size="xl" tagline="Rise & Cross Over" />
            <p className="mt-5 max-w-sm font-display text-xl leading-snug">
              Trade across borders on trust that is <em>enforced</em>, not just displayed.
            </p>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              VUKA is the settlement layer between African mobile money and real trade:
              invoice-linked payments, escrow, firm FX quotes and a ledger both sides can cite.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="footer-lang">
                Language
              </label>
              <select
                id="footer-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="h-9 border border-border bg-background px-2 font-mono text-xs"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-none font-mono text-[11px] uppercase"
                onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
              >
                {resolved === "dark" ? (
                  <Sun className="size-3.5" aria-hidden="true" />
                ) : (
                  <Moon className="size-3.5" aria-hidden="true" />
                )}
                {resolved === "dark" ? "Light" : "Dark"} theme
              </Button>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.22em]">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterAnchor l={l} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {markets.length ? (
          <div className="mt-12 border-t border-border pt-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.22em]">Launch markets</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {markets.map((m) => (
                <li key={m.code} className="flex items-center gap-1.5">
                  <Flag code={m.code} className="w-4 shrink-0" />
                  {m.name} <span className="font-mono text-[11px]">{m.currency}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 border border-dashed border-border p-4 text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">Sandbox environment.</strong> This
          deployment uses simulated payment rails and indicative reference exchange rates; no live
          funds move. VUKA is not a licensed payment provider in any jurisdiction, and nothing on
          this site is financial advice or an offer of services. Operating each corridor requires
          the relevant licences and partner agreements.
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} VUKA · Built for African traders
          </p>
          <div className="flex items-center gap-5 text-xs">
            <Link to="/terms" className="underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link to="/privacy" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link to="/status" className="underline-offset-4 hover:underline">
              Status
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] hover:underline"
            >
              Back to top <ArrowUp className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="select-none overflow-hidden border-t border-border">
        <div
          data-word="vuka"
          className="mx-auto max-w-7xl whitespace-nowrap px-4 text-center font-display text-[24vw] leading-[0.8] tracking-tight text-foreground/[0.06] before:content-[attr(data-word)] sm:px-6 lg:text-[15rem]"
        />
      </div>
    </footer>
  );
}
