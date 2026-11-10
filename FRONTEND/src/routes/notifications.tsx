import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Info,
  Radio,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { support } from "@/lib/api/endpoints";
import type { Notification } from "@/lib/api/types";
import { relativeTime, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { useTrader } from "@/lib/session";
import { useNotifications } from "@/lib/trader-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — VUKA" },
      {
        name: "description",
        content: "Account and payment notifications for your trader account.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <Notifications />
    </Shell>
  ),
});

const SEVERITIES = ["success", "info", "warning", "error"] as const;
type Severity = (typeof SEVERITIES)[number];

const COPY = {
  en: {
    eyebrow: "Account Telemetry",
    title: "Notifications",
    description: "Payment, verification and trust-score updates for your account, newest first.",
    markAllRead: "Mark all as read",
    bannerPill: "Live Settlement & Compliance Event Stream",
    allReviewed: "All Account Alerts Reviewed",
    unreadSingle: "1 Unread Account Notification",
    unreadPlural: (n: number) => `${n} Unread Account Notifications`,
    bannerDesc:
      "Every mobile-money debit confirmation, corridor payout completion, and KYC tier change emits an immutable notification to your trader inbox.",
    metricUnread: "Unread",
    metricUnreadSub: "Awaiting review",
    metricTotal: "Total events",
    metricTotalSub: "Recorded in inbox",
    metricSuccess: "Settlements & OK",
    metricSuccessSub: "Positive confirmations",
    metricAlerts: "Warnings & alerts",
    metricAlertsSub: "Actionable notices",
    panelTitle: "Notification stream",
    panelSubtitle: "Filter by read state or event severity",
    filterAria: "Filter notifications",
    tabAll: "All",
    tabUnread: "Unread",
    sevSuccess: "Success",
    sevInfo: "Info",
    sevWarning: "Warning",
    sevError: "Error",
    loading: "Loading notifications",
    emptyAll:
      "No notifications yet. Payment, verification and trust-score updates will show up here.",
    emptyFilter: "Nothing matches this filter.",
    srUnread: "Unread",
    srRead: "Read",
    markRead: "Mark read",
  },
  fr: {
    eyebrow: "Télémétrie du compte",
    title: "Notifications",
    description:
      "Mises à jour des paiements, de la vérification et du score de confiance pour votre compte, des plus récentes aux plus anciennes.",
    markAllRead: "Tout marquer comme lu",
    bannerPill: "Flux d'événements de règlement et de conformité en direct",
    allReviewed: "Toutes les alertes du compte ont été consultées",
    unreadSingle: "1 notification de compte non lue",
    unreadPlural: (n: number) => `${n} notifications de compte non lues`,
    bannerDesc:
      "Chaque confirmation de débit mobile money, finalisation de paiement de corridor et changement de niveau KYC émet une notification immuable dans votre boîte de réception commerçant.",
    metricUnread: "Non lues",
    metricUnreadSub: "En attente de lecture",
    metricTotal: "Total des événements",
    metricTotalSub: "Enregistrés dans la boîte",
    metricSuccess: "Règlements et OK",
    metricSuccessSub: "Confirmations positives",
    metricAlerts: "Avertissements et alertes",
    metricAlertsSub: "Avis nécessitant une action",
    panelTitle: "Flux de notifications",
    panelSubtitle: "Filtrer par état de lecture ou gravité de l'événement",
    filterAria: "Filtrer les notifications",
    tabAll: "Toutes",
    tabUnread: "Non lues",
    sevSuccess: "Succès",
    sevInfo: "Info",
    sevWarning: "Avertissement",
    sevError: "Erreur",
    loading: "Chargement des notifications",
    emptyAll:
      "Aucune notification pour le moment. Les mises à jour de paiement, de vérification et de score de confiance apparaîtront ici.",
    emptyFilter: "Aucun élément ne correspond à ce filtre.",
    srUnread: "Non lue",
    srRead: "Lue",
    markRead: "Marquer lu",
  },
  sw: {
    eyebrow: "Telemetria ya Akaunti",
    title: "Arifa",
    description:
      "Taarifa mpya za malipo, uthibitisho na alama ya uaminifu kwa akaunti yako, kuanzia za hivi karibuni.",
    markAllRead: "Weka zote kuwa zimesomwa",
    bannerPill: "Mtiririko Mubashara wa Matukio ya Malipo na Utii",
    allReviewed: "Arifa Zote za Akaunti Zimekaguliwa",
    unreadSingle: "Arifa 1 ya Akaunti Haijasomwa",
    unreadPlural: (n: number) => `Arifa ${n} za Akaunti Hazijasomwa`,
    bannerDesc:
      "Kila uthibitisho wa makato ya pesa za simu, ukamilishaji wa malipo ya njia, na mabadiliko ya daraja la KYC hutuma arifa isiyobadilika kwenye kikasha chako cha mfanyabiashara.",
    metricUnread: "Hazijasomwa",
    metricUnreadSub: "Zinasubiri kukaguliwa",
    metricTotal: "Jumla ya matukio",
    metricTotalSub: "Zimerekodiwa kwenye kikasha",
    metricSuccess: "Malipo & Sawa",
    metricSuccessSub: "Uthibitisho chanya",
    metricAlerts: "Maonyo & tahadhari",
    metricAlertsSub: "Taarifa zinazohitaji hatua",
    panelTitle: "Mtiririko wa arifa",
    panelSubtitle: "Chuja kwa hali ya kusomwa au ukali wa tukio",
    filterAria: "Chuja arifa",
    tabAll: "Zote",
    tabUnread: "Hazijasomwa",
    sevSuccess: "Mafanikio",
    sevInfo: "Taarifa",
    sevWarning: "Onyo",
    sevError: "Hitilafu",
    loading: "Inapakia arifa",
    emptyAll:
      "Hakuna arifa bado. Taarifa za malipo, uthibitisho na alama ya uaminifu zitaonekana hapa.",
    emptyFilter: "Hakuna kinacholingana na kichujio hiki.",
    srUnread: "Haijasomwa",
    srRead: "Imesomwa",
    markRead: "Weka imesomwa",
  },
  pt: {
    eyebrow: "Telemetria da Conta",
    title: "Notificações",
    description:
      "Atualizações de pagamentos, verificação e pontuação de confiança da sua conta, das mais recentes para as mais antigas.",
    markAllRead: "Marcar todas como lidas",
    bannerPill: "Fluxo em Direto de Eventos de Liquidação e Conformidade",
    allReviewed: "Todos os Alertas da Conta Revistos",
    unreadSingle: "1 Notificação de Conta Não Lida",
    unreadPlural: (n: number) => `${n} Notificações de Conta Não Lidas`,
    bannerDesc:
      "Cada confirmação de débito de dinheiro móvel, conclusão de pagamento no corredor e alteração de nível KYC emite uma notificação imutável na sua caixa de entrada de comerciante.",
    metricUnread: "Não lidas",
    metricUnreadSub: "A aguardar revisão",
    metricTotal: "Total de eventos",
    metricTotalSub: "Registados na caixa de entrada",
    metricSuccess: "Liquidações e OK",
    metricSuccessSub: "Confirmações positivas",
    metricAlerts: "Avisos e alertas",
    metricAlertsSub: "Avisos acionáveis",
    panelTitle: "Fluxo de notificações",
    panelSubtitle: "Filtrar por estado de leitura ou gravidade do evento",
    filterAria: "Filtrar notificações",
    tabAll: "Todas",
    tabUnread: "Não lidas",
    sevSuccess: "Sucesso",
    sevInfo: "Info",
    sevWarning: "Aviso",
    sevError: "Erro",
    loading: "A carregar notificações",
    emptyAll:
      "Ainda sem notificações. As atualizações de pagamentos, verificação e pontuação de confiança aparecerão aqui.",
    emptyFilter: "Nada corresponde a este filtro.",
    srUnread: "Não lida",
    srRead: "Lida",
    markRead: "Marcar lida",
  },
  rw: {
    eyebrow: "Ikurikiranabikorwa rya Konti",
    title: "Imenyesha",
    description:
      "Amakuru mashya ku bwishyu, igenzura n'amanota y'icyizere kuri konti yawe, uhereye ku bigezweho.",
    markAllRead: "Shyira byose nk'ibyasomwe",
    bannerPill: "Urutonde rw'Ibikorwa by'Ubwishyu n'Iyubahirizamabwiriza Ako kanya",
    allReviewed: "Imenyesha Ryose rya Konti Ryasuzumwe",
    unreadSingle: "Imenyesha 1 rya Konti Ritarasomwa",
    unreadPlural: (n: number) => `Imenyesha ${n} rya Konti Ritarasomwa`,
    bannerDesc:
      "Buri kwemeza kw'amafaranga avuye kuri mobile money, kurangiza kwishyura mu nzira, n'ihinduka ry'urwego rwa KYC byohereza imenyesha ridahinduka mu gasanduku kawe k'umucuruzi.",
    metricUnread: "Ibitarasomwa",
    metricUnreadSub: "Bitegereje gusuzumwa",
    metricTotal: "Ibikorwa byose",
    metricTotalSub: "Byanditswe mu gasanduku",
    metricSuccess: "Ubwishyu & Byagenze neza",
    metricSuccessSub: "Ibyemejwe neza",
    metricAlerts: "Iburira & impuruza",
    metricAlertsSub: "Ibisaba gukorwaho",
    panelTitle: "Urutonde rw'imenyesha",
    panelSubtitle: "Shungura ukurikije ibyasomwe cyangwa uburemere bw'igikorwa",
    filterAria: "Shungura imenyesha",
    tabAll: "Byose",
    tabUnread: "Ibitarasomwa",
    sevSuccess: "Byagenze neza",
    sevInfo: "Amakuru",
    sevWarning: "Iburira",
    sevError: "Ikosa",
    loading: "Birimo gupakira imenyesha",
    emptyAll:
      "Nta menyesha riraboneka. Amakuru mashya ku bwishyu, igenzura n'amanota y'icyizere azagaragara hano.",
    emptyFilter: "Nta kijyanye n'iyi akayunguruzo.",
    srUnread: "Ntikirasomwa",
    srRead: "Cyasomwe",
    markRead: "Shyira ko cyasomwe",
  },
} as const;

function severityMeta(
  s: string,
  c: (typeof COPY)[keyof typeof COPY],
): {
  icon: ReactNode;
  label: string;
  tone: "neutral" | "live" | "warn" | "invert";
} {
  switch (s) {
    case "success":
      return {
        icon: <CheckCircle2 className="size-4 text-[#79b200]" aria-hidden="true" />,
        label: c.sevSuccess,
        tone: "invert",
      };
    case "error":
      return {
        icon: <AlertCircle className="size-4 text-destructive" aria-hidden="true" />,
        label: c.sevError,
        tone: "warn",
      };
    case "warning":
      return {
        icon: <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />,
        label: c.sevWarning,
        tone: "warn",
      };
    default:
      return {
        icon: <Info className="size-4 text-sky-500" aria-hidden="true" />,
        label: c.sevInfo,
        tone: "neutral",
      };
  }
}

function Notifications() {
  const c = useLangCopy(COPY);
  const trader = useTrader();
  const qc = useQueryClient();
  const q = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | Severity>("all");

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, trader.id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications", trader.id] });
      const prev = qc.getQueryData<Notification[]>(["notifications", trader.id]);
      qc.setQueryData<Notification[]>(["notifications", trader.id], (list) =>
        (list ?? []).map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications", trader.id], ctx.prev);
      toast.error(describeError(err));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["notifications", trader.id] }),
  });

  const all = useMemo(() => q.data ?? [], [q.data]);
  const unreadIds = useMemo(() => all.filter((n) => !n.read_at).map((n) => n.id), [all]);
  const successCount = useMemo(
    () => all.filter((n) => n.severity === "success").length,
    [all],
  );
  const alertCount = useMemo(
    () => all.filter((n) => n.severity === "warning" || n.severity === "error").length,
    [all],
  );
  const items = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "unread") return all.filter((n) => !n.read_at);
    return all.filter((n) => n.severity === filter);
  }, [all, filter]);

  async function markAllRead() {
    const ids = unreadIds;
    for (const id of ids) {
      try {
        await markRead.mutateAsync(id);
      } catch {
        // markRead already surfaces a toast per failure; keep going through the rest.
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        actions={
          <Button
            variant="outline"
            disabled={unreadIds.length === 0 || markRead.isPending}
            onClick={() => void markAllRead()}
            className="gap-2 rounded-lg font-mono text-xs uppercase"
          >
            <CheckCheck className="size-3.5 text-[#79b200]" aria-hidden="true" />
            {c.markAllRead}
          </Button>
        }
      />

      {/* Executive Account Telemetry Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Radio className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerPill}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {unreadIds.length === 0
                ? c.allReviewed
                : unreadIds.length === 1
                  ? c.unreadSingle
                  : c.unreadPlural(unreadIds.length)}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={c.metricUnread} value={unreadIds.length} sub={c.metricUnreadSub} accent="lime" />
        <Metric label={c.metricTotal} value={all.length} sub={c.metricTotalSub} />
        <Metric label={c.metricSuccess} value={successCount} sub={c.metricSuccessSub} />
        <Metric
          label={c.metricAlerts}
          value={alertCount}
          sub={c.metricAlertsSub}
          accent={alertCount > 0 ? "warn" : "default"}
        />
      </div>

      <Panel
        title={c.panelTitle}
        subtitle={c.panelSubtitle}
        meta={
          <div role="tablist" aria-label={c.filterAria} className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", `${c.tabAll}${all.length ? ` (${all.length})` : ""}`],
                ["unread", `${c.tabUnread}${unreadIds.length ? ` (${unreadIds.length})` : ""}`],
                ...SEVERITIES.map((s) => [s, severityMeta(s, c).label] as const),
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={
                  "rounded-lg border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors " +
                  (filter === key
                    ? "border-[#151515] bg-[#151515] text-[#c2f74d]"
                    : "border-border bg-muted/25 text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {q.isPending ? (
          <Loading label={c.loading} />
        ) : q.isError ? (
          <div className="rounded-xl border-2 border-foreground p-4 text-sm">
            {describeError(q.error)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState>
            <Bell className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden="true" />
            {all.length === 0 ? c.emptyAll : c.emptyFilter}
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {items.map((n) => {
              const meta = severityMeta(n.severity, c);
              const unread = !n.read_at;
              return (
                <li
                  key={n.id}
                  className={
                    unread
                      ? "rounded-xl border-2 border-[#151515]/80 bg-card p-4 shadow-sm"
                      : "rounded-xl border border-border/80 bg-muted/10 p-4"
                  }
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40"
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={unread ? "text-sm font-bold" : "text-sm font-medium"}>
                          {n.title}
                        </span>
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                        {unread ? (
                          <span
                            className="size-2 rounded-full bg-[#79b200] shadow-[0_0_8px_#c2f74d]"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="sr-only">{unread ? c.srUnread : c.srRead}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                      <time
                        dateTime={n.created_at}
                        title={when(n.created_at)}
                        className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        <Clock className="size-3" aria-hidden="true" />
                        {relativeTime(n.created_at)}
                      </time>
                    </div>
                    {unread ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(n.id)}
                        className="h-7 shrink-0 rounded-lg font-mono text-[10px] uppercase"
                      >
                        {c.markRead}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
