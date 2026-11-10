import { Link } from "@tanstack/react-router";
import { Languages, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { LANGUAGES, useI18n, useLangCopy, useT, type Lang } from "@/lib/i18n";
import { VukaLogo } from "./brand";

const COPY = {
  en: {
    homeAria: "VUKA — home",
    siteNavAria: "Site",
    mobileNavAria: "Site (mobile)",
    navDescription: "Site navigation",
    joinShort: "Join",
    nav: [
      { href: "/#journey", label: "How it works" },
      { href: "/#estimate", label: "Cost estimator" },
      { href: "/#escrow", label: "Escrow" },
      { href: "/#mobile", label: "On mobile" },
      { href: "/#markets", label: "Markets" },
      { href: "/#trust", label: "Trust score" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  fr: {
    homeAria: "VUKA — accueil",
    siteNavAria: "Site",
    mobileNavAria: "Site (mobile)",
    navDescription: "Navigation du site",
    joinShort: "Rejoindre",
    nav: [
      { href: "/#journey", label: "Comment ça marche" },
      { href: "/#estimate", label: "Simulateur de coûts" },
      { href: "/#escrow", label: "Séquestre" },
      { href: "/#mobile", label: "Sur mobile" },
      { href: "/#markets", label: "Marchés" },
      { href: "/#trust", label: "Score de confiance" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  sw: {
    homeAria: "VUKA — mwanzo",
    siteNavAria: "Tovuti",
    mobileNavAria: "Tovuti (simu)",
    navDescription: "Urambazaji wa tovuti",
    joinShort: "Jiunge",
    nav: [
      { href: "/#journey", label: "Jinsi inavyofanya kazi" },
      { href: "/#estimate", label: "Kikokotoo cha gharama" },
      { href: "/#escrow", label: "Escrow" },
      { href: "/#mobile", label: "Kwenye simu" },
      { href: "/#markets", label: "Masoko" },
      { href: "/#trust", label: "Alama ya uaminifu" },
      { href: "/#faq", label: "Maswali" },
    ],
  },
  pt: {
    homeAria: "VUKA — início",
    siteNavAria: "Site",
    mobileNavAria: "Site (móvel)",
    navDescription: "Navegação do site",
    joinShort: "Registar",
    nav: [
      { href: "/#journey", label: "Como funciona" },
      { href: "/#estimate", label: "Simulador de custos" },
      { href: "/#escrow", label: "Caução" },
      { href: "/#mobile", label: "No telemóvel" },
      { href: "/#markets", label: "Mercados" },
      { href: "/#trust", label: "Pontuação de confiança" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  rw: {
    homeAria: "VUKA — ahabanza",
    siteNavAria: "Urubuga",
    mobileNavAria: "Urubuga (telefone)",
    navDescription: "Kugendana ku rubuga",
    joinShort: "Iyandikishe",
    nav: [
      { href: "/#journey", label: "Uko bikora" },
      { href: "/#estimate", label: "Ibara ry'ikiguzi" },
      { href: "/#escrow", label: "Escrow" },
      { href: "/#mobile", label: "Kuri telefone" },
      { href: "/#markets", label: "Amasoko" },
      { href: "/#trust", label: "Amanota y'icyizere" },
      { href: "/#faq", label: "Ibibazo" },
    ],
  },
};

export function SiteHeader() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const copy = useLangCopy(COPY);
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10 2xl:px-16">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 xl:hidden"
          aria-label={t("shell.menu")}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        <Link to="/" aria-label={copy.homeAria}>
          <VukaLogo tagline={t("app.tagline")} />
        </Link>
        <nav aria-label={copy.siteNavAria} className="ml-6 hidden items-center gap-1 xl:flex">
          {copy.nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="whitespace-nowrap px-2.5 py-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-lg font-mono text-[11px] uppercase"
                aria-label={t("shell.language")}
              >
                <Languages className="size-4" aria-hidden="true" /> {lang}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg">
              <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
                {LANGUAGES.map((l) => (
                  <DropdownMenuRadioItem key={l.code} value={l.code}>
                    {l.native}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden rounded-lg font-mono text-[11px] uppercase sm:inline-flex"
          >
            <Link to="/login">{t("landing.cta.signin")}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-lg font-mono text-[11px] uppercase">
            <Link to="/register">
              <span className="sm:hidden">{copy.joinShort}</span>
              <span className="hidden sm:inline">{t("landing.cta.register")}</span>
            </Link>
          </Button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <SheetDescription className="sr-only">{copy.navDescription}</SheetDescription>
          <nav aria-label={copy.mobileNavAria} className="flex flex-col p-5 pt-12">
            {copy.nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-base"
              >
                {n.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="border-b border-border py-3 text-base"
            >
              {t("landing.cta.signin")}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
