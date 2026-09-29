import { Link } from "@tanstack/react-router";
import { Languages, Menu, Moon, Sun } from "lucide-react";
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
import { LANGUAGES, useI18n, useT, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { VukaLogo } from "./brand";

const NAV = [
  { href: "/#journey", label: "How it works" },
  { href: "/#estimate", label: "Cost estimator" },
  { href: "/#escrow", label: "Escrow" },
  { href: "/#mobile", label: "On mobile" },
  { href: "/#markets", label: "Markets" },
  { href: "/#trust", label: "Trust score" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10 2xl:px-16">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-none xl:hidden"
          aria-label={t("shell.menu")}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        <Link to="/" aria-label="VUKA — home">
          <VukaLogo tagline={t("app.tagline")} />
        </Link>
        <nav aria-label="Site" className="ml-6 hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
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
                className="h-9 gap-1.5 rounded-none font-mono text-[11px] uppercase"
                aria-label={t("shell.language")}
              >
                <Languages className="size-4" aria-hidden="true" /> {lang}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
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
            variant="ghost"
            size="icon"
            className="size-9 rounded-none"
            aria-label={t("shell.theme")}
            onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
          >
            {resolved === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden rounded-none font-mono text-[11px] uppercase sm:inline-flex"
          >
            <Link to="/login">{t("landing.cta.signin")}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-none font-mono text-[11px] uppercase">
            <Link to="/register">
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">{t("landing.cta.register")}</span>
            </Link>
          </Button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 rounded-none p-0">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <nav aria-label="Site (mobile)" className="flex flex-col p-5 pt-12">
            {NAV.map((n) => (
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
