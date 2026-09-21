import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { NavList } from "@/components/vuka/nav-list";
import { operatorNav, traderNav } from "@/components/vuka/nav";
import { api } from "@/lib/api/client";
import { useIdleTimeout } from "@/lib/idle-timeout";
import { LANGUAGES, useI18n, useT, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { useNotifications } from "@/lib/trader-data";
import { cn } from "@/lib/utils";
import { VukaLogo } from "./brand";

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "warn" | "dead" | "invert";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        tone === "neutral" && "border-border text-muted-foreground",
        tone === "live" && "border-foreground/50 text-foreground",
        tone === "warn" && "border-2 border-foreground text-foreground",
        tone === "dead" && "border-border text-muted-foreground/60 line-through",
        tone === "invert" && "border-foreground bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 border border-border bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </h2>
        {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Optional series drawn as a sparkline under the value. */
  trend?: ReactNode;
}) {
  return (
    <div className="border border-border bg-card px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl tabular-nums tracking-tight text-foreground">
        {value}
      </div>
      {trend ? <div className="mt-2 text-foreground">{trend}</div> : null}
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Live liveness probe of the engine (GET /healthz). */
function EngineChip() {
  const t = useT();
  const q = useQuery({
    queryKey: ["healthz"],
    queryFn: () => api.get<{ status: string }>("/healthz"),
    refetchInterval: 30_000,
    retry: false,
  });
  if (q.isPending) return <Chip>…</Chip>;
  return q.isError ? (
    <Chip tone="warn">{t("shell.engine.down")}</Chip>
  ) : (
    <Chip tone="live">{t("shell.engine.online")}</Chip>
  );
}

function TraderBell() {
  const t = useT();
  const q = useNotifications();
  const unread = (q.data ?? []).filter((n) => !n.read_at).length;
  return (
    <Button asChild variant="ghost" size="icon" className="relative size-9 rounded-none">
      <Link to="/" aria-label={`${t("shell.notifications")}${unread ? ` (${unread})` : ""}`}>
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex min-w-4 items-center justify-center bg-foreground px-1 font-mono text-[9px] leading-4 text-background"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

function AccountMenu({ identity, onSignOut }: { identity: string; onSignOut: () => void }) {
  const t = useT();
  const { preference, setPreference } = useTheme();
  const { lang, setLang } = useI18n();
  const ThemeIcon = preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-none font-mono text-[11px]"
        >
          <ThemeIcon className="size-3.5" aria-hidden="true" />
          <span className="hidden max-w-[180px] truncate md:inline">{identity}</span>
          <span className="md:hidden">{t("shell.account")}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-none">
        <DropdownMenuLabel className="truncate font-mono text-[11px] font-normal text-muted-foreground">
          {identity}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Sun className="size-3" aria-hidden="true" /> {t("shell.theme")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(v) => setPreference(v as ThemePreference)}
        >
          <DropdownMenuRadioItem value="light">{t("shell.theme.light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("shell.theme.dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("shell.theme.system")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Languages className="size-3" aria-hidden="true" /> {t("shell.language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              {l.native}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="gap-2">
          <LogOut className="size-4" aria-hidden="true" /> {t("shell.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommandMenu({
  open,
  onOpenChange,
  groups,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groups: typeof traderNav;
  onSignOut: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const { setPreference } = useTheme();
  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command label={t("shell.search")}>
        <CommandInput placeholder={t("shell.search")} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.labelKey} heading={t(g.labelKey)}>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.to} value={t(item.labelKey)} onSelect={() => go(item.to)}>
                    <Icon className="mr-2 size-4" aria-hidden="true" />
                    {t(item.labelKey)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          <CommandGroup heading={t("shell.account")}>
            <CommandItem
              value={t("shell.theme.light")}
              onSelect={() => {
                setPreference("light");
                onOpenChange(false);
              }}
            >
              <Sun className="mr-2 size-4" aria-hidden="true" /> {t("shell.theme")}:{" "}
              {t("shell.theme.light")}
            </CommandItem>
            <CommandItem
              value={t("shell.theme.dark")}
              onSelect={() => {
                setPreference("dark");
                onOpenChange(false);
              }}
            >
              <Moon className="mr-2 size-4" aria-hidden="true" /> {t("shell.theme")}:{" "}
              {t("shell.theme.dark")}
            </CommandItem>
            <CommandItem
              value={t("shell.signOut")}
              onSelect={() => {
                onOpenChange(false);
                onSignOut();
              }}
            >
              <LogOut className="mr-2 size-4" aria-hidden="true" /> {t("shell.signOut")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/** Announces route changes to assistive tech and moves focus to the new page's content. */
function RouteAnnouncer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [message, setMessage] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => {
      setMessage(document.title);
      document.getElementById("main")?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(id);
  }, [pathname]);
  return (
    <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
      {message}
    </div>
  );
}

function Splash({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

/**
 * Page frame + auth guard.
 *  role="trader"   — phone/password session required
 *  role="operator" — operator/arbiter session required
 *  role="any"      — either (default); pages then branch on the session kind
 * Unauthenticated visitors are sent to /login.
 */
export function Shell({
  children,
  role = "any",
}: {
  children: ReactNode;
  role?: "trader" | "operator" | "any";
}) {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const t = useT();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const signedIn = session.status === "trader" || session.status === "operator";
  const signOut = useCallback(() => {
    void logout().then(() => navigate({ to: "/login" }));
  }, [logout, navigate]);

  const idle = useIdleTimeout({
    enabled: signedIn,
    idleMs: 14 * 60_000,
    graceMs: 60_000,
    onExpire: signOut,
  });

  useEffect(() => {
    if (session.status === "anon") void navigate({ to: "/login" });
  }, [session.status, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (session.status === "loading" || session.status === "anon") {
    return <Splash>{t("common.loading")}…</Splash>;
  }

  const wrongRole =
    (role === "trader" && session.status !== "trader") ||
    (role === "operator" && session.status !== "operator");
  const groups = session.status === "trader" ? traderNav : operatorNav;
  const identity =
    session.status === "trader"
      ? `${session.trader.full_name} · ${session.trader.phone_number}`
      : `${session.operator.email} · ${session.operator.role}`;

  const brand = (
    <Link to="/" aria-label="VUKA — home">
      <VukaLogo tagline={t("app.tagline")} />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        {t("skip.content")}
      </a>
      <RouteAnnouncer />

      <div className="lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside
          data-app-chrome
          aria-label="Primary"
          className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar lg:flex"
        >
          <div className="border-b border-sidebar-border px-5 py-5">{brand}</div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-5">
            <NavList groups={groups} />
          </nav>
          <div className="border-t border-sidebar-border px-5 py-4">
            <EngineChip />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col">
          <header
            data-app-chrome
            className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6"
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-none lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label={t("shell.menu")}
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <div className="lg:hidden">{brand}</div>

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="ml-auto flex h-9 min-w-0 items-center gap-2 border border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-64 sm:flex-none"
              aria-label={t("shell.search")}
            >
              <Search className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden flex-1 truncate sm:inline">{t("shell.search")}</span>
              <kbd className="hidden border border-border px-1 font-mono text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline-flex lg:hidden">
                <EngineChip />
              </span>
              <span className="hidden sm:inline-flex">
                <Chip tone="invert">
                  {session.status === "trader" ? t("auth.trader") : t("auth.operator")}
                </Chip>
              </span>
              {session.status === "trader" ? <TraderBell /> : null}
              <AccountMenu identity={identity} onSignOut={signOut} />
            </div>
          </header>

          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 outline-none sm:px-6 sm:py-8"
          >
            {wrongRole ? (
              <div role="alert" className="border-2 border-foreground p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Wrong account type
                </div>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  This page is only available to {role} accounts. You are signed in as{" "}
                  {session.status}. Sign out and sign in with the right credentials to continue.
                </p>
              </div>
            ) : (
              children
            )}
          </main>

          <footer data-app-chrome className="border-t border-border px-4 py-5 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              VUKA settlement network · sandbox providers · settlement execution disabled
            </p>
          </footer>
        </div>
      </div>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-72 rounded-none bg-sidebar p-0">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <SheetDescription className="sr-only">Primary navigation</SheetDescription>
          <div className="border-b border-sidebar-border px-5 py-5">{brand}</div>
          <nav aria-label="Main" className="overflow-y-auto px-2 py-5">
            <NavList groups={groups} onNavigate={() => setDrawer(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <CommandMenu open={palette} onOpenChange={setPalette} groups={groups} onSignOut={signOut} />

      <Dialog open={idle.warning} onOpenChange={(o) => !o && idle.stay()}>
        <DialogContent className="rounded-none sm:max-w-sm" role="alertdialog">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
              {t("shell.session.title")}
            </DialogTitle>
            <DialogDescription>
              {t("shell.session.body")} ({idle.secondsLeft}s)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-none font-mono text-xs uppercase"
              onClick={signOut}
            >
              {t("shell.signOut")}
            </Button>
            <Button className="rounded-none font-mono text-xs uppercase" onClick={idle.stay}>
              {t("shell.session.stay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
