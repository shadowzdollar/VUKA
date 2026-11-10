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
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
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
import { LANGUAGES, useI18n, useLangCopy, useT, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useNotifications } from "@/lib/trader-data";
import { cn } from "@/lib/utils";
import { VukaPreloadCanvas } from "@/components/vuka/preloader";
import { VukaLogo, VukaMark } from "./brand";

const SHELL_COPY = {
  en: {
    cmdTitle: "VUKA Command & Jump Desk",
    cmdSubtitle:
      "Instant navigation across routes, corridors, ledgers, and workspace controls",
    cmdEmpty: "No matching route or command found.",
    toggleSidebar: "Toggle Sidebar Visibility",
    navigate: "Navigate",
    jump: "Jump",
    sidebar: "Sidebar",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar to icon rail",
    hideSidebarShortcut: "Hide sidebar (⌘B)",
    hideSidebar: "Hide sidebar",
    showSidebarShortcut: "Show sidebar (⌘B)",
    showSidebar: "Show sidebar",
    settlementCoreOnline: "Settlement Core Online · 10 Markets",
    settlementCore: "Settlement Core",
    polygonVault: "Polygon Vault",
    tenMarkets: "10 Markets",
    treasuryMesh: "PAN-AFRICAN TREASURY MESH",
    wrongAccountTitle: "Wrong account type",
    wrongAccountBody: (role: string, status: string) =>
      `This page is only available to ${role} accounts. You are signed in as ${status}. Sign out and sign in with the right credentials to continue.`,
    footerNotice:
      "VUKA settlement network · sandbox providers · settlement execution disabled",
    primaryNav: "Primary navigation",
  },
  fr: {
    cmdTitle: "Poste de commande et navigation VUKA",
    cmdSubtitle:
      "Navigation instantanée vers les routes, corridors, registres et contrôles de l'espace",
    cmdEmpty: "Aucune route ou commande correspondante trouvée.",
    toggleSidebar: "Afficher / masquer la barre latérale",
    navigate: "Naviguer",
    jump: "Aller",
    sidebar: "Barre latérale",
    expandSidebar: "Développer la barre latérale",
    collapseSidebar: "Réduire la barre latérale en icônes",
    hideSidebarShortcut: "Masquer la barre latérale (⌘B)",
    hideSidebar: "Masquer la barre latérale",
    showSidebarShortcut: "Afficher la barre latérale (⌘B)",
    showSidebar: "Afficher la barre latérale",
    settlementCoreOnline: "Cœur de règlement en ligne · 10 marchés",
    settlementCore: "Cœur de règlement",
    polygonVault: "Coffre Polygon",
    tenMarkets: "10 marchés",
    treasuryMesh: "RÉSEAU DE TRÉSORERIE PANAFRICAIN",
    wrongAccountTitle: "Mauvais type de compte",
    wrongAccountBody: (role: string, status: string) =>
      `Cette page est réservée aux comptes ${role}. Vous êtes connecté en tant que ${status}. Déconnectez-vous et reconnectez-vous avec les bons identifiants pour continuer.`,
    footerNotice:
      "Réseau de règlement VUKA · prestataires bac à sable · exécution des règlements désactivée",
    primaryNav: "Navigation principale",
  },
  sw: {
    cmdTitle: "Dawati la Amri na Urambazaji la VUKA",
    cmdSubtitle:
      "Urambazaji wa papo hapo kwenye njia, korido, leja na vidhibiti vya mfumo",
    cmdEmpty: "Hakuna njia au amri inayolingana iliyopatikana.",
    toggleSidebar: "Badilisha Mwonekano wa Upau wa Pembeni",
    navigate: " Abiri",
    jump: "Ruka",
    sidebar: "Upau wa Pembeni",
    expandSidebar: "Panua upau wa pembeni",
    collapseSidebar: "Kunja upau wa pembeni uwe aikoni",
    hideSidebarShortcut: "Ficha upau wa pembeni (⌘B)",
    hideSidebar: "Ficha upau wa pembeni",
    showSidebarShortcut: "Onyesha upau wa pembeni (⌘B)",
    showSidebar: "Onyesha upau wa pembeni",
    settlementCoreOnline: "Msingi wa Malipo Uko Hewani · Masoko 10",
    settlementCore: "Msingi wa Malipo",
    polygonVault: "Hifadhi ya Polygon",
    tenMarkets: "Masoko 10",
    treasuryMesh: "MTANDAO WA HAZINA WA AFRIKA NZIMA",
    wrongAccountTitle: "Aina ya akaunti isiyo sahihi",
    wrongAccountBody: (role: string, status: string) =>
      `Ukurasa huu unapatikana kwa akaunti za ${role} pekee. Umeingia kama ${status}. Toka na uingie tena kwa vitambulisho sahihi ili kuendelea.`,
    footerNotice:
      "Mtandao wa malipo wa VUKA · watoa huduma wa majaribio (sandbox) · utekelezaji wa malipo umezimwa",
    primaryNav: "Urambazaji mkuu",
  },
  pt: {
    cmdTitle: "Centro de Comando e Navegação VUKA",
    cmdSubtitle:
      "Navegação instantânea entre rotas, corredores, razões e controlos do espaço de trabalho",
    cmdEmpty: "Nenhuma rota ou comando correspondente encontrado.",
    toggleSidebar: "Alternar Visibilidade da Barra Lateral",
    navigate: "Navegar",
    jump: "Ir",
    sidebar: "Barra lateral",
    expandSidebar: "Expandir barra lateral",
    collapseSidebar: "Recolher barra lateral para ícones",
    hideSidebarShortcut: "Ocultar barra lateral (⌘B)",
    hideSidebar: "Ocultar barra lateral",
    showSidebarShortcut: "Mostrar barra lateral (⌘B)",
    showSidebar: "Mostrar barra lateral",
    settlementCoreOnline: "Núcleo de Liquidação Ativo · 10 Mercados",
    settlementCore: "Núcleo de Liquidação",
    polygonVault: "Cofre Polygon",
    tenMarkets: "10 Mercados",
    treasuryMesh: "MALHA DE TESOURARIA PAN-AFRICANA",
    wrongAccountTitle: "Tipo de conta incorreto",
    wrongAccountBody: (role: string, status: string) =>
      `Esta página está disponível apenas para contas ${role}. Iniciou sessão como ${status}. Termine a sessão e entre com as credenciais corretas para continuar.`,
    footerNotice:
      "Rede de liquidação VUKA · operadores sandbox · execução de liquidação desativada",
    primaryNav: "Navegação principal",
  },
  rw: {
    cmdTitle: " Ibiro by'Amabwiriza n'inzira bya VUKA",
    cmdSubtitle:
      " kugera vuba ku nzira, imiyoboro y'ubwishyu, ibitabo n'igenzura ry'aho ukorera",
    cmdEmpty: "Nta nzira cyangwa ibwiriza bihuye byabonetse.",
    toggleSidebar: "Hindura Imigaragarire y'uruhande",
    navigate: "Shakisha",
    jump: "Simbuka",
    sidebar: "Uruhande",
    expandSidebar: "Agura uruhande rw'ibikubiyemo",
    collapseSidebar: "Gabanya uruhande rusigare ari udushushondanga",
    hideSidebarShortcut: "Hisha uruhande rw'ibikubiyemo (⌘B)",
    hideSidebar: "Hisha uruhande rw'ibikubiyemo",
    showSidebarShortcut: "Erekana uruhande rw'ibikubiyemo (⌘B)",
    showSidebar: "Erekana uruhande rw'ibikubiyemo",
    settlementCoreOnline: "Umutima w'Ubwishyu Urakora · Amasoko 10",
    settlementCore: "Umutima w'Ubwishyu",
    polygonVault: "Ububiko bwa Polygon",
    tenMarkets: "Amasoko 10",
    treasuryMesh: "URUSOBE RW'UBUTUNZI NYAFURIKA",
    wrongAccountTitle: "Ubwoko bwa konti butari bwo",
    wrongAccountBody: (role: string, status: string) =>
      `Uru rupapuro rugenewe konti za ${role} gusa. Winjiye nka ${status}. Sohoka hanyuma winjire ukoresheje imyirondoro nyayo kugira ngo ukomeze.`,
    footerNotice:
      "Urusobe rw'ubwishyu rwa VUKA · abafatanyabikorwa b'igerageza (sandbox) · kurangiza ubwishyu birafunze",
    primaryNav: " Inzira nyamukuru",
  },
} as const;

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
  const { lang, setLang } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-lg font-mono text-[11px]"
        >
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
  const copy = useLangCopy(SHELL_COPY);
  const navigate = useNavigate();
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
                <span>{copy.cmdTitle}</span>
                <Sparkles className="size-3" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-white/60">
                {copy.cmdSubtitle}
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <EngineChip />
          </div>
        </div>

        <CommandInput placeholder={t("shell.search")} />

        <CommandList>
          <CommandEmpty>{copy.cmdEmpty}</CommandEmpty>
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
              value={`${copy.toggleSidebar} Toggle sidebar visibility collapse hide`}
              onSelect={() => {
                onToggleSidebar();
                onOpenChange(false);
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 group-data-[selected=true]:border-[#c2f74d]/40 group-data-[selected=true]:bg-white/10">
                <PanelLeftClose className="size-3.5 group-data-[selected=true]:text-[#c2f74d]" aria-hidden="true" />
              </span>
              <span>{copy.toggleSidebar}</span>
              <CommandShortcut>⌘B</CommandShortcut>
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
              {copy.navigate}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              {copy.jump}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground">
                ⌘B
              </kbd>
              {copy.sidebar}
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
  const copy = useLangCopy(SHELL_COPY);
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
                  title={isMini ? copy.expandSidebar : copy.collapseSidebar}
                  aria-label={isMini ? copy.expandSidebar : copy.collapseSidebar}
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
                    title={copy.hideSidebarShortcut}
                    aria-label={copy.hideSidebar}
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
                  title={copy.settlementCoreOnline}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => updateSidebarMode("hidden")}
                  title={copy.hideSidebarShortcut}
                  aria-label={copy.hideSidebar}
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
                      {copy.settlementCore}
                    </span>
                    <EngineChip />
                  </div>
                  <div className="relative mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[9px] text-white/80">
                    <span>{copy.polygonVault}</span>
                    <span className="text-[#c2f74d]">{copy.tenMarkets}</span>
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
              title={isHidden ? copy.showSidebarShortcut : copy.hideSidebarShortcut}
              aria-label={isHidden ? copy.showSidebar : copy.hideSidebar}
            >
              {isHidden ? (
                <>
                  <PanelLeftOpen className="size-3.5 text-[#79b200]" aria-hidden="true" />
                  <span>{t("shell.menu")}</span>
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
              <span>{copy.treasuryMesh}</span>
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
                {copy.jump}
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
                  {copy.wrongAccountTitle}
                </div>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {copy.wrongAccountBody(role, session.status)}
                </p>
              </div>
            ) : (
              children
            )}
          </main>

          <footer data-app-chrome className="border-t border-border px-4 py-5 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {copy.footerNotice}
            </p>
          </footer>
        </div>
      </div>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-64 rounded-l-2xl bg-sidebar p-0">
          <SheetTitle className="sr-only">{t("shell.menu")}</SheetTitle>
          <SheetDescription className="sr-only">{copy.primaryNav}</SheetDescription>
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
