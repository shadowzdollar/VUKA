import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CornerDownLeft,
  Languages,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Sun,
  type LucideIcon,
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
  CommandSeparator,
  CommandShortcut,
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
import { VukaPreloadCanvas } from "@/components/vuka/preloader";
import { VukaLogo, VukaMark } from "./brand";

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "warn" | "dead" | "invert" | "lime";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
        tone === "neutral" && "border-border bg-muted/40 text-muted-foreground",
        tone === "live" && "border-[#79b200]/35 bg-[#c2f74d]/20 text-foreground",
        tone === "lime" && "border-[#79b200]/45 bg-[#c2f74d] text-[#151515]",
        tone === "warn" && "border-destructive/40 bg-destructive/10 text-destructive",
        tone === "dead" && "border-border text-muted-foreground/60 line-through",
        tone === "invert" && "border-foreground bg-foreground text-background",
      )}
    >
      {tone === "live" ? (
        <span className="size-1.5 rounded-full bg-[#79b200]" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  meta,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Entrance-animation stagger, in ms. */
  delay?: number;
}) {
  return (
    <section
      className={cn(
        "dash-in min-w-0 overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_14px_38px_-18px_rgba(0,0,0,0.08)] transition-all hover:border-border",
        className,
      )}
      style={{ "--dash-delay": `${delay}ms` } as React.CSSProperties}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/25 px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#79b200]" aria-hidden="true" />
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/85">
              {title}
            </h2>
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A real, computed change (e.g. this week vs. last week) — never a fabricated figure. */
export type MetricTrend = { direction: "up" | "down" | "flat"; percent: number };

export function Metric({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  tone = "primary",
  accent,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** A sparkline, or a computed MetricTrend rendered as an up/down chip. */
  trend?: ReactNode | MetricTrend;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "muted" | "destructive";
  accent?: "default" | "lime" | "warn";
  delay?: number;
}) {
  const effectiveTone =
    accent === "warn" ? "destructive" : accent === "lime" ? "success" : tone;
  const isTrendObject =
    trend != null && typeof trend === "object" && "direction" in (trend as MetricTrend);
  const trendObj = isTrendObject ? (trend as MetricTrend) : null;
  const trendNode = isTrendObject ? null : (trend as ReactNode);

  return (
    <div
      className="dash-in group relative overflow-hidden rounded-2xl border border-border/90 bg-card px-5 py-4.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#79b200]/45 hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.13)]"
      style={{ "--dash-delay": `${delay}ms` } as React.CSSProperties}
    >
      {/* Subtle top accent stripe */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80",
          effectiveTone === "primary" &&
            "bg-gradient-to-r from-[#79b200] via-[#c2f74d] to-transparent",
          effectiveTone === "success" &&
            "bg-gradient-to-r from-success via-[#79b200] to-transparent",
          effectiveTone === "destructive" && "bg-gradient-to-r from-destructive to-transparent",
          effectiveTone === "muted" && "bg-gradient-to-r from-foreground/25 to-transparent",
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {trendObj && trendObj.direction !== "flat" ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                trendObj.direction === "up"
                  ? "bg-[#c2f74d]/30 text-foreground"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {trendObj.direction === "up" ? (
                <ArrowUpRight className="size-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="size-3" aria-hidden="true" />
              )}
              {trendObj.percent}%
            </span>
          ) : null}
          {Icon ? (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                tone === "primary" && "bg-[#c2f74d]/35 text-foreground",
                tone === "success" && "bg-success/15 text-success",
                tone === "destructive" && "bg-destructive/15 text-destructive",
                tone === "muted" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[26px]">
        {value}
      </div>
      {trendNode ? <div className="mt-2.5 text-foreground">{trendNode}</div> : null}
      {sub ? <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div> : null}
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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 shadow-[0_14px_38px_-20px_rgba(0,0,0,0.08)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-[#79b200]" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
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
    <Button asChild variant="ghost" size="icon" className="relative size-9 rounded-lg">
      <Link
        to="/notifications"
        aria-label={`${t("shell.notifications")}${unread ? ` (${unread})` : ""}`}
      >
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
          className="h-9 gap-2 rounded-lg font-mono text-[11px]"
        >
          <ThemeIcon className="size-3.5" aria-hidden="true" />
          <span className="hidden max-w-[180px] truncate md:inline">{identity}</span>
          <span className="md:hidden">{t("shell.account")}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-lg">
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
  onToggleSidebar,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groups: typeof traderNav;
  onSignOut: () => void;
  onToggleSidebar: () => void;
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
        {/* Executive Dark-Ink Command Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#151515] px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg border border-[#c2f74d]/40 bg-white/[0.06]">
              <VukaMark className="size-4" accent />
            </span>
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span>VUKA Command & Jump Desk</span>
                <Sparkles className="size-3" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-white/60">
                Instant navigation across routes, corridors, ledgers, and workspace controls
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <EngineChip />
          </div>
        </div>

        <CommandInput placeholder={t("shell.search")} />

        <CommandList>
          <CommandEmpty>No matching route or command found.</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.labelKey} heading={t(g.labelKey)}>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.to}
                    value={`${t(item.labelKey)} ${item.to}`}
                    onSelect={() => go(item.to)}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 transition-colors group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                      <Icon className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{t(item.labelKey)}</span>
                    <CommandShortcut>{item.to}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading={t("shell.account")}>
            <CommandItem
              value="Toggle sidebar visibility collapse hide"
              onSelect={() => {
                onToggleSidebar();
                onOpenChange(false);
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                <PanelLeftClose className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
              </span>
              <span>Toggle Sidebar Visibility</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              value={t("shell.theme.light")}
              onSelect={() => {
                setPreference("light");
                onOpenChange(false);
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                <Sun className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
              </span>
              <span>
                {t("shell.theme")}: {t("shell.theme.light")}
              </span>
            </CommandItem>
            <CommandItem
              value={t("shell.theme.dark")}
              onSelect={() => {
                setPreference("dark");
                onOpenChange(false);
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                <Moon className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
              </span>
              <span>
                {t("shell.theme")}: {t("shell.theme.dark")}
              </span>
            </CommandItem>
            <CommandItem
              value={t("shell.signOut")}
              onSelect={() => {
                onOpenChange(false);
                onSignOut();
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                <LogOut className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
              </span>
              <span>{t("shell.signOut")}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Interactive Footer Keycap Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              Jump
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground">
                ⌘B
              </kbd>
              Sidebar
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em]">VUKA OS v2.4</span>
        </div>
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
    <div role="status" aria-live="polite">
      <VukaPreloadCanvas progress={84}>{children}</VukaPreloadCanvas>
    </div>
  );
}

type SidebarMode = "open" | "mini" | "hidden";
const SIDEBAR_STORAGE_KEY = "vuka.sidebar.mode";

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
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "open" || saved === "mini" || saved === "hidden") return saved;
    } catch {
      // ignore storage errors
    }
    return "open";
  });

  const updateSidebarMode = useCallback((next: SidebarMode | ((prev: SidebarMode) => SidebarMode)) => {
    setSidebarMode((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, resolved);
      } catch {
        // ignore storage errors
      }
      return resolved;
    });
  }, []);

  const toggleSidebarHidden = useCallback(() => {
    updateSidebarMode((prev) => (prev === "hidden" ? "open" : "hidden"));
  }, [updateSidebarMode]);

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
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarHidden();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebarHidden]);

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

  const isMini = sidebarMode === "mini";
  const isHidden = sidebarMode === "hidden";

  const brand = (
    <Link to="/" aria-label="VUKA — home">
      <VukaLogo tagline={t("app.tagline")} />
    </Link>
  );
  const brandTile = (
    <Link to="/" aria-label="VUKA — home">
      <VukaLogo tile size="md" collapsed={isMini} />
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

      <div
        className={cn(
          "transition-[grid-template-columns] duration-200",
          isHidden
            ? "lg:block"
            : isMini
              ? "lg:grid lg:grid-cols-[68px_minmax(0,1fr)]"
              : "lg:grid lg:grid-cols-[224px_minmax(0,1fr)]",
        )}
      >
        {!isHidden ? (
          <aside
            data-app-chrome
            aria-label="Primary"
            className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar lg:flex"
          >
            <div
              className={cn(
                "flex items-center border-b border-sidebar-border/70 py-3.5",
                isMini ? " flex-col gap-2 px-2" : "justify-between px-3.5",
              )}
            >
              {brandTile}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => updateSidebarMode(isMini ? "open" : "mini")}
                  title={isMini ? "Expand sidebar" : "Collapse sidebar to icon rail"}
                  aria-label={isMini ? "Expand sidebar" : "Collapse sidebar to icon rail"}
                >
                  {isMini ? (
                    <ChevronsRight className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronsLeft className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
                {!isMini ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => updateSidebarMode("hidden")}
                    title="Hide sidebar (⌘B)"
                    aria-label="Hide sidebar"
                  >
                    <PanelLeftClose className="size-3.5" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </div>

            <nav
              aria-label="Main"
              className={cn("flex-1 overflow-y-auto py-3", isMini ? "px-1.5" : "px-2.5")}
            >
              <NavList groups={groups} collapsed={isMini} />
            </nav>

            {isMini ? (
              <div className="flex flex-col items-center gap-2 border-t border-sidebar-border/70 p-2.5">
                <span
                  className="size-2.5 rounded-full bg-[#79b200] shadow-[0_0_8px_#c2f74d]"
                  title="Settlement Core Online · 10 Markets"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => updateSidebarMode("hidden")}
                  title="Hide sidebar (⌘B)"
                  aria-label="Hide sidebar"
                >
                  <PanelLeftClose className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="p-2.5">
                <div className="relative overflow-hidden rounded-xl border border-[#151515] bg-[#151515] p-3 text-white shadow-md">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 -right-8 size-20 rounded-full opacity-25 blur-xl"
                    style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
                      Settlement Core
                    </span>
                    <EngineChip />
                  </div>
                  <div className="relative mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[9px] text-white/80">
                    <span>Polygon Vault</span>
                    <span className="text-[#c2f74d]">10 Markets</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-col">
          <header
            data-app-chrome
            className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8"
          >
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label={t("shell.menu")}
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>

            {/* Desktop Sidebar Show / Hide Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSidebarHidden}
              className="hidden h-9 gap-1.5 rounded-xl border-border/90 px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-[#79b200]/50 hover:text-foreground lg:inline-flex"
              title={isHidden ? "Show sidebar (⌘B)" : "Hide sidebar (⌘B)"}
              aria-label={isHidden ? "Show sidebar" : "Hide sidebar"}
            >
              {isHidden ? (
                <>
                  <PanelLeftOpen className="size-3.5 text-[#79b200]" aria-hidden="true" />
                  <span>Menu</span>
                </>
              ) : (
                <PanelLeftClose className="size-3.5" aria-hidden="true" />
              )}
            </Button>

            {/* Show brand in top header on mobile OR when desktop sidebar is hidden */}
            <div className={cn(isHidden ? "block" : "lg:hidden")}>{brand}</div>

            {/* Enterprise Network Telemetry Pill (desktop) */}
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-[10px] text-muted-foreground xl:inline-flex">
              <span className="size-1.5 rounded-full bg-[#79b200]" aria-hidden="true" />
              <span>PAN-AFRICAN TREASURY MESH</span>
              <span className="text-border">|</span>
              <span className="text-foreground">EAC · ECOWAS · SADC · HORN</span>
            </div>

            {/* Upgraded Enterprise "Search or Jump To" Card Trigger */}
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="group ml-auto flex h-10 min-w-0 items-center gap-2.5 rounded-xl border border-border/90 bg-card px-2.5 text-left text-xs text-muted-foreground shadow-[0_6px_20px_-10px_rgba(0,0,0,0.1)] transition-all hover:border-[#79b200]/60 hover:shadow-[0_8px_24px_-10px_rgba(121,178,0,0.22)] sm:w-80 sm:flex-none md:w-96"
              aria-label={t("shell.search")}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#151515] text-[#c2f74d] transition-transform group-hover:scale-105">
                <Search className="size-3.5" aria-hidden="true" />
              </span>
              <span className="hidden flex-1 truncate font-medium text-foreground/80 group-hover:text-foreground sm:inline">
                {t("shell.search")}
              </span>
              <span className="hidden rounded-md border border-[#79b200]/30 bg-[#c2f74d]/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground md:inline">
                Jump
              </span>
              <kbd className="hidden rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground sm:inline">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-2">
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
            className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
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
        <SheetContent side="left" className="w-64 rounded-l-2xl bg-sidebar p-0">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <SheetDescription className="sr-only">Primary navigation</SheetDescription>
          <div className="px-4 py-4">
            <Link to="/" aria-label="VUKA — home">
              <VukaLogo tile size="md" />
            </Link>
          </div>
          <nav aria-label="Main" className="overflow-y-auto px-2.5 py-2">
            <NavList groups={groups} onNavigate={() => setDrawer(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <CommandMenu
        open={palette}
        onOpenChange={setPalette}
        groups={groups}
        onSignOut={signOut}
        onToggleSidebar={toggleSidebarHidden}
      />

      <Dialog open={idle.warning} onOpenChange={(o) => !o && idle.stay()}>
        <DialogContent className="rounded-2xl sm:max-w-sm" role="alertdialog">
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
              className="rounded-lg font-mono text-xs uppercase"
              onClick={signOut}
            >
              {t("shell.signOut")}
            </Button>
            <Button className="rounded-lg font-mono text-xs uppercase" onClick={idle.stay}>
              {t("shell.session.stay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
