import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity as ActivityIcon, Download, Eye, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { operator } from "@/lib/api/endpoints";
import { when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity Log — VUKA" }] }),
  component: () => (
    <Shell role="operator">
      <Activity />
    </Shell>
  ),
});

const PAGE = 25;

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    exportCsv: string;
    bannerBadge: string;
    bannerTitle: (total: number | string) => string;
    bannerDesc: string;
    observerRule: string;
    observerRuleDesc: string;
    panelTitle: string;
    panelSubtitle: string;
    recordsCount: (n: number | string) => string;
    searchPlaceholder: string;
    actionPlaceholder: string;
    empty: string;
    colTime: string;
    colActor: string;
    colRole: string;
    colAction: string;
    colResource: string;
    colDetails: string;
    pageOf: (cur: number, total: number) => string;
    prev: string;
    next: string;
  }
> = {
  en: {
    eyebrow: "Immutable Operator Audit",
    title: "Activity Log",
    description:
      "Append-only record of every operator action: sign-ins, approvals, exports and alert acknowledgements. Viewing this page is itself recorded.",
    exportCsv: "Export CSV",
    bannerBadge: "Append-Only Security & Governance Log",
    bannerTitle: (total) => `${total} Recorded Operator & Arbiter Events`,
    bannerDesc:
      "Every administrative read, dispute approval, compliance decision, and CSV export is permanently stamped with actor identity, role, and UTC timestamp.",
    observerRule: "Observer Rule",
    observerRuleDesc: "Reads Logged as ACTIVITY_VIEWED",
    panelTitle: "Operator activity",
    panelSubtitle: "Filter by actor, resource, action code, or date window",
    recordsCount: (n) => `${n} records`,
    searchPlaceholder: "Search actor, resource, details…",
    actionPlaceholder: "ACTION",
    empty: "No activity matches these filters.",
    colTime: "Time",
    colActor: "Actor",
    colRole: "Role",
    colAction: "Action",
    colResource: "Resource",
    colDetails: "Details",
    pageOf: (cur, total) => `Page ${cur} of ${total}`,
    prev: "Prev",
    next: "Next",
  },
  fr: {
    eyebrow: "Audit Opérateur Immuable",
    title: "Journal d'Activité",
    description:
      "Registre infalsifiable de chaque action opérateur : connexions, approbations, exports et acquittements d'alertes. La consultation de cette page est elle-même consignée.",
    exportCsv: "Exporter CSV",
    bannerBadge: "Journal de Sécurité & Gouvernance Immuable",
    bannerTitle: (total) => `${total} Événements Opérateur & Arbitre Enregistrés`,
    bannerDesc:
      "Chaque lecture administrative, décision de litige, conformité et export CSV est horodaté avec identité, rôle et signature UTC.",
    observerRule: "Règle d'Observation",
    observerRuleDesc: "Lectures Enregistrées sous ACTIVITY_VIEWED",
    panelTitle: "Activité des opérateurs",
    panelSubtitle: "Filtrer par acteur, ressource, code d'action ou période",
    recordsCount: (n) => `${n} enregistrements`,
    searchPlaceholder: "Rechercher acteur, ressource, détails…",
    actionPlaceholder: "ACTION",
    empty: "Aucune activité ne correspond à ces filtres.",
    colTime: "Heure",
    colActor: "Acteur",
    colRole: "Rôle",
    colAction: "Action",
    colResource: "Ressource",
    colDetails: "Détails",
    pageOf: (cur, total) => `Page ${cur} sur ${total}`,
    prev: "Préc",
    next: "Suiv",
  },
  sw: {
    eyebrow: "Ukaguzi Usioweza Kubadilika wa Waendeshaji",
    title: "Kumbukumbu ya Shughuli",
    description:
      "Kumbukumbu ya kila kitendo cha mwendeshaji: kuingia, idhini, usafirishaji na uthibitisho wa tahadhari. Kutazama ukurasa huu pia hurekodiwa.",
    exportCsv: "Hamisha CSV",
    bannerBadge: "Kumbukumbu ya Usalama na Utawala",
    bannerTitle: (total) => `Matukio ${total} ya Waendeshaji na Wasuluhishi Yaliyorekodiwa`,
    bannerDesc:
      "Kila usomaji wa kiutawala, idhini ya mzozo, uamuzi wa utiifu, na usafirishaji wa CSV umewekewa muhuri wa utambulisho, wajibu, na muda wa UTC.",
    observerRule: "Kanuni ya Mwangalizi",
    observerRuleDesc: "Kusoma Kurekodiwa kama ACTIVITY_VIEWED",
    panelTitle: "Shughuli za waendeshaji",
    panelSubtitle: "Chuja kwa mhusika, rasilimali, msimbo wa kitendo, au muda",
    recordsCount: (n) => `Kumbukumbu ${n}`,
    searchPlaceholder: "Tafuta mhusika, rasilimali, maelezo…",
    actionPlaceholder: "KITENDO",
    empty: "Hakuna shughuli inayolingana na vichujio hivi.",
    colTime: "Muda",
    colActor: "Mhusika",
    colRole: "Wajibu",
    colAction: "Kitendo",
    colResource: "Rasilimali",
    colDetails: "Maelezo",
    pageOf: (cur, total) => `Ukurasa wa ${cur} kati ya ${total}`,
    prev: "Iliyopita",
    next: "Ifuatayo",
  },
  pt: {
    eyebrow: "Auditoria Imutável do Operador",
    title: "Registo de Atividades",
    description:
      "Registo inviolável de cada ação de operador: inícios de sessão, aprovações, exportações e alertas. A visualização desta página é registada.",
    exportCsv: "Exportar CSV",
    bannerBadge: "Registo de Segurança & Governança Imutável",
    bannerTitle: (total) => `${total} Eventos de Operadores & Árbitros Registados`,
    bannerDesc:
      "Toda a leitura administrativa, aprovação de disputa, decisão de conformidade e exportação de CSV é carimbada com identidade, função e horário UTC.",
    observerRule: "Regra do Observador",
    observerRuleDesc: "Leituras Registadas como ACTIVITY_VIEWED",
    panelTitle: "Atividade do operador",
    panelSubtitle: "Filtrar por agente, recurso, código de ação ou intervalo de datas",
    recordsCount: (n) => `${n} registos`,
    searchPlaceholder: "Pesquisar interveniente, recurso, detalhes…",
    actionPlaceholder: "AÇÃO",
    empty: "Nenhuma atividade corresponde a estes filtros.",
    colTime: "Hora",
    colActor: "Interveniente",
    colRole: "Função",
    colAction: "Ação",
    colResource: "Recurso",
    colDetails: "Detalhes",
    pageOf: (cur, total) => `Página ${cur} de ${total}`,
    prev: "Ant",
    next: "Próx",
  },
  rw: {
    eyebrow: "Igenzura Ridahinduka ry'Abakoresha Sisitemu",
    title: "Urutonde rw'Ibikorwa",
    description:
      "Inyandiko itazasibama ya buri gikorwa cy'umukozi: kwinjira, kwemeza, kohereza dosiye no kwakira integuza. Kureba iyi paji ubwabyo birandikwa.",
    exportCsv: "Kuramo CSV",
    bannerBadge: "Igitabo cy'Umutekano n'Imiyoborere",
    bannerTitle: (total) => `Ibikorwa ${total} by'Abagenzuzi n'Abahuza Byanditswe`,
    bannerDesc:
      "Buri gusoma k'ubuyobozi, kwemeza amakimbirane, icyemezo cy'amategeko, no gukuramo CSV bishyirwaho kashe y'umwirondoro, inshingano, n'igihe cya UTC.",
    observerRule: "Itegeko ry'Indorerezi",
    observerRuleDesc: "Gusoma Byanditswe nka ACTIVITY_VIEWED",
    panelTitle: "Ibikorwa by'abakoresha",
    panelSubtitle: "Shungura hakurikijwe uwabikoze, umutungo, kode y'igikorwa, cyangwa igihe",
    recordsCount: (n) => `Inyandiko ${n}`,
    searchPlaceholder: "Shakisha umukozi, umutungo, birambuye…",
    actionPlaceholder: "IGIKORWA",
    empty: "Nta gikorwa gihuye n'ibi bishungurwa.",
    colTime: "Igihe",
    colActor: "Uwabikoze",
    colRole: "Inshingano",
    colAction: "Igikorwa",
    colResource: "Umutungo",
    colDetails: "Birambuye",
    pageOf: (cur, total) => `Paji ya ${cur} kuri ${total}`,
    prev: "Ibanziriza",
    next: "Ikirikira",
  },
};

function Activity() {
  const t = useLangCopy(COPY);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  // No polling here: every read of this log is itself recorded as ACTIVITY_VIEWED by the engine.
  const q = useQuery({
    queryKey: ["activity", search, action, from, to, page],
    queryFn: () =>
      operator.activity({ limit: PAGE, offset: page * PAGE, search, action, from, to }),
    staleTime: 60_000,
  });
  const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / PAGE));

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <Button
            variant="outline"
            className="gap-1.5 rounded-lg font-mono text-xs uppercase"
            onClick={() =>
              void download("/api/activity/export", "vuka-operator-activity.csv", {
                search,
                action,
                from,
                to,
              }).catch((e) => toast.error(describeError(e)))
            }
          >
            <Download className="size-3.5 text-[#79b200]" aria-hidden="true" />
            {t.exportCsv}
          </Button>
        }
      />

      {/* Executive Append-Only Audit Banner */}
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
              <ActivityIcon className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {t.bannerBadge}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t.bannerTitle(q.data?.total ?? "—")}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {t.bannerDesc}
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <Eye className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                {t.observerRule}
              </div>
              <div className="font-bold text-white">{t.observerRuleDesc}</div>
            </div>
          </div>
        </div>
      </div>

      <Panel
        title={t.panelTitle}
        subtitle={t.panelSubtitle}
        meta={<Chip tone="lime">{t.recordsCount(q.data?.total ?? "—")}</Chip>}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            aria-label="Search actor, resource or details"
            placeholder={t.searchPlaceholder}
            className="w-72 rounded-lg font-mono text-xs"
          />
          <Input
            value={action}
            onChange={(e) => {
              setAction(e.target.value.toUpperCase());
              setPage(0);
            }}
            aria-label="Filter by action"
            placeholder={t.actionPlaceholder}
            className="w-48 rounded-lg font-mono text-xs"
          />
          <Input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-lg font-mono text-xs"
          />
          <Input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="w-40 rounded-lg font-mono text-xs"
          />
        </div>
        <QueryBoundary
          query={q}
          isEmpty={(d) => d.activities.length === 0}
          empty={t.empty}
        >
          {({ activities }) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-2.5 py-2.5">{t.colTime}</th>
                    <th className="px-2.5 py-2.5">{t.colActor}</th>
                    <th className="px-2.5 py-2.5">{t.colRole}</th>
                    <th className="px-2.5 py-2.5">{t.colAction}</th>
                    <th className="px-2.5 py-2.5">{t.colResource}</th>
                    <th className="px-2.5 py-2.5">{t.colDetails}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-2.5 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                        {when(a.created_at)}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs font-medium">{a.actor}</td>
                      <td className="px-2.5 py-3 font-mono text-xs uppercase text-muted-foreground">
                        {a.role}
                      </td>
                      <td className="px-2.5 py-3">
                        <Chip tone="live">{a.action}</Chip>
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                        {a.resource ?? "—"}
                      </td>
                      <td className="px-2.5 py-3 text-xs text-muted-foreground">
                        {a.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[#79b200]" aria-hidden="true" />
            {t.pageOf(page + 1, pages)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t.prev}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.next}
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
