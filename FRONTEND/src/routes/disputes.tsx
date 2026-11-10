import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gavel, Scale, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { DataTable } from "@/components/vuka/data-table";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { operator } from "@/lib/api/endpoints";
import type { Dispute } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { truncMid, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { useOperator } from "@/lib/session";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    bannerBadge: (role: string) => string;
    bannerTitle: string;
    bannerDesc: string;
    activeRole: string;
    enterContract: string;
    openDisputes: string;
    openDisputesSub: string;
    resolved: string;
    resolvedSub: string;
    total: string;
    totalSub: string;
    byStatusTitle: string;
    byStatusSubtitle: string;
    disputesLabel: string;
    queueTitle: string;
    queueSubtitle: string;
    live: string;
    emptyDisputes: string;
    colCase: string;
    colEscrow: string;
    colClaim: string;
    colRaised: string;
    colTx: string;
    colStatus: string;
    noteRecorded: string;
    recRecorded: (choice: string) => string;
    recRecordedSub: string;
    decisionApproved: string;
    approvalRefused: string;
    dialogTitle: (caseId: string, escrowId: number) => string;
    dialogDesc: (raised: string, status: string) => string;
    decisionsTitle: string;
    noRecommendation: string;
    byActorAt: (actor: string, at: string) => string;
    approvalsCount: (n: number) => string;
    approveBtn: string;
    reviewNotesTitle: string;
    noNotes: string;
    addNotePlaceholder: string;
    addNoteBtn: string;
    recordRecTitle: string;
    recAria: string;
    releaseToSupplier: string;
    refundToBuyer: string;
    rationalePlaceholder: string;
    recordRecBtn: string;
    operatorInfoNote: string;
    auditTimelineTitle: string;
    exportCsv: string;
    noTimeline: string;
  }
> = {
  en: {
    eyebrow: "Arbitration & Separation of Duties",
    title: "Dispute Tribunal",
    description:
      "Disputes are raised on-chain and freeze the escrow. Arbiters record review notes and a RELEASE / REFUND recommendation; an operator approves it before the outcome is executed by the contract.",
    bannerBadge: (role) => `Two-Stage Arbitration Governance · ${role.toUpperCase()} DESK`,
    bannerTitle: "On-Chain Escrow Dispute Resolution",
    bannerDesc:
      "Arbiters investigate claims and file written `RELEASE` or `REFUND` recommendations. Operators countersign and approve decisions before any smart-contract settlement is authorized.",
    activeRole: "Active Role",
    enterContract: "Enter the escrow contract address to load disputes.",
    openDisputes: "Open disputes",
    openDisputesSub: "Awaiting a resolution",
    resolved: "Resolved",
    resolvedSub: "Closed on-chain",
    total: "Total",
    totalSub: "For this contract",
    byStatusTitle: "Disputes by status",
    byStatusSubtitle: "Distribution of active vs resolved arbitration cases",
    disputesLabel: "Disputes",
    queueTitle: "Arbitration queue",
    queueSubtitle:
      "Click any case row to inspect decisions, arbiter notes, and the append-only audit timeline",
    live: "Live",
    emptyDisputes: "No disputes have been raised for this contract.",
    colCase: "Case",
    colEscrow: "Escrow",
    colClaim: "Claim",
    colRaised: "Raised",
    colTx: "Tx",
    colStatus: "Status",
    noteRecorded: "Review note recorded",
    recRecorded: (choice) => `${choice} recommendation recorded`,
    recRecordedSub: "Awaiting operator approval.",
    decisionApproved: "Decision approved",
    approvalRefused: "Approval refused",
    dialogTitle: (caseId, escrowId) => `Case ${caseId} · escrow #${escrowId}`,
    dialogDesc: (raised, status) => `Raised ${raised} · ${status}`,
    decisionsTitle: "Decisions",
    noRecommendation: "No recommendation yet.",
    byActorAt: (actor, at) => `by ${actor} · ${at}`,
    approvalsCount: (n) => `${n} approval${n === 1 ? "" : "s"}`,
    approveBtn: "Approve",
    reviewNotesTitle: "Review notes",
    noNotes: "No notes yet.",
    addNotePlaceholder: "Add a review note…",
    addNoteBtn: "Add note",
    recordRecTitle: "Record recommendation",
    recAria: "Recommendation",
    releaseToSupplier: "Release to supplier",
    refundToBuyer: "Refund to buyer",
    rationalePlaceholder: "Written rationale (required, permanently recorded)…",
    recordRecBtn: "Record recommendation",
    operatorInfoNote:
      "Review notes and recommendations are recorded by arbiters. As an operator you can approve a recommendation above and export the audit trail.",
    auditTimelineTitle: "Audit timeline",
    exportCsv: "Export CSV",
    noTimeline: "No timeline entries.",
  },
  fr: {
    eyebrow: "Arbitrage et séparation des tâches",
    title: "Tribunal des litiges",
    description:
      "Les litiges sont ouverts sur la chaîne et gèlent le séquestre. Les arbitres consignent des notes d'examen et une recommandation RELEASE / REFUND ; un opérateur l'approuve avant son exécution par le contrat.",
    bannerBadge: (role) => `Gouvernance d'arbitrage à deux niveaux · BUREAU ${role.toUpperCase()}`,
    bannerTitle: "Résolution des litiges de séquestre sur chaîne",
    bannerDesc:
      "Les arbitres instruisent les réclamations et déposent des recommandations écrites `RELEASE` ou `REFUND`. Les opérateurs contresignent et approuvent les décisions avant toute autorisation de règlement sur contrat intelligent.",
    activeRole: "Rôle actif",
    enterContract: "Saisissez l'adresse du contrat de séquestre pour charger les litiges.",
    openDisputes: "Litiges ouverts",
    openDisputesSub: "En attente de résolution",
    resolved: "Résolus",
    resolvedSub: "Clôturés sur chaîne",
    total: "Total",
    totalSub: "Pour ce contrat",
    byStatusTitle: "Litiges par statut",
    byStatusSubtitle: "Répartition des dossiers d'arbitrage actifs et résolus",
    disputesLabel: "Litiges",
    queueTitle: "File d'arbitrage",
    queueSubtitle:
      "Cliquez sur un dossier pour inspecter les décisions, les notes d'arbitre et la chronologie d'audit immuable",
    live: "En direct",
    emptyDisputes: "Aucun litige n'a été ouvert pour ce contrat.",
    colCase: "Dossier",
    colEscrow: "Séquestre",
    colClaim: "Réclamation",
    colRaised: "Ouvert le",
    colTx: "Tx",
    colStatus: "Statut",
    noteRecorded: "Note d'examen enregistrée",
    recRecorded: (choice) => `Recommandation ${choice} enregistrée`,
    recRecordedSub: "En attente de l'approbation d'un opérateur.",
    decisionApproved: "Décision approuvée",
    approvalRefused: "Approbation refusée",
    dialogTitle: (caseId, escrowId) => `Dossier ${caseId} · séquestre #${escrowId}`,
    dialogDesc: (raised, status) => `Ouvert ${raised} · ${status}`,
    decisionsTitle: "Décisions",
    noRecommendation: "Aucune recommandation pour l'instant.",
    byActorAt: (actor, at) => `par ${actor} · ${at}`,
    approvalsCount: (n) => `${n} approbation${n === 1 ? "" : "s"}`,
    approveBtn: "Approuver",
    reviewNotesTitle: "Notes d'examen",
    noNotes: "Aucune note pour l'instant.",
    addNotePlaceholder: "Ajouter une note d'examen…",
    addNoteBtn: "Ajouter une note",
    recordRecTitle: "Enregistrer une recommandation",
    recAria: "Recommandation",
    releaseToSupplier: "Libérer au fournisseur",
    refundToBuyer: "Rembourser à l'acheteur",
    rationalePlaceholder: "Motif écrit (obligatoire, enregistré de façon permanente)…",
    recordRecBtn: "Enregistrer la recommandation",
    operatorInfoNote:
      "Les notes d'examen et les recommandations sont consignées par les arbitres. En tant qu'opérateur, vous pouvez approuver une recommandation ci-dessus et exporter la piste d'audit.",
    auditTimelineTitle: "Chronologie d'audit",
    exportCsv: "Exporter en CSV",
    noTimeline: "Aucune entrée dans la chronologie.",
  },
  sw: {
    eyebrow: "Usuluhishi na Mgawanyo wa Majukumu",
    title: "Baraza la Migogoro",
    description:
      "Migogoro inafunguliwa kwenye mnyororo na kugandisha escrow. Wasuluhishi wanarekodi maelezo ya mapitio na pendekezo la RELEASE / REFUND; mwendeshaji anaithibitisha kabla ya kutekelezwa na mkataba.",
    bannerBadge: (role) => `Usimamizi wa Usuluhishi wa Hatua Mbili · DAWATI LA ${role.toUpperCase()}`,
    bannerTitle: "Utatuzi wa Migogoro ya Escrow kwenye Mnyororo",
    bannerDesc:
      "Wasuluhishi wanachunguza madai na kuwasilisha mapendekezo ya maandishi ya `RELEASE` au `REFUND`. Waendeshaji wanatia saini na kuidhinisha maamuzi kabla ya malipo yoyote ya mkataba-janja kuruhusiwa.",
    activeRole: "Jukumu Hai",
    enterContract: "Weka anwani ya mkataba wa escrow ili kupakia migogoro.",
    openDisputes: "Migogoro iliyo wazi",
    openDisputesSub: "Inasubiri utatuzi",
    resolved: "Imetatuliwa",
    resolvedSub: "Imefungwa kwenye mnyororo",
    total: "Jumla",
    totalSub: "Kwa mkataba huu",
    byStatusTitle: "Migogoro kwa hali",
    byStatusSubtitle: "Mgawanyo wa kesi za usuluhishi zilizo hai dhidi ya zilizotatuliwa",
    disputesLabel: "Migogoro",
    queueTitle: "Foleni ya usuluhishi",
    queueSubtitle:
      "Bofya kesi yoyote kukagua maamuzi, maelezo ya msuluhishi, na mfuatano wa ukaguzi",
    live: " Mubashara",
    emptyDisputes: "Hakuna migogoro iliyofunguliwa kwa mkataba huu.",
    colCase: "Kesi",
    colEscrow: "Escrow",
    colClaim: "Dai",
    colRaised: "Ilifunguliwa",
    colTx: "Tx",
    colStatus: "Hali",
    noteRecorded: "Ujumbe wa mapitio umerekodiwa",
    recRecorded: (choice) => `Pendekezo la ${choice} limerekodiwa`,
    recRecordedSub: "Inasubiri idhini ya mwendeshaji.",
    decisionApproved: "Uamuzi umeidhinishwa",
    approvalRefused: "Idhini imekataliwa",
    dialogTitle: (caseId, escrowId) => `Kesi ${caseId} · escrow #${escrowId}`,
    dialogDesc: (raised, status) => `Ilifunguliwa ${raised} · ${status}`,
    decisionsTitle: "Maamuzi",
    noRecommendation: "Bado hakuna pendekezo.",
    byActorAt: (actor, at) => `na ${actor} · ${at}`,
    approvalsCount: (n) => `idhini ${n}`,
    approveBtn: "Idhinisha",
    reviewNotesTitle: "Maelezo ya mapitio",
    noNotes: "Bado hakuna maelezo.",
    addNotePlaceholder: "Ongeza maelezo ya mapitio…",
    addNoteBtn: "Ongeza maelezo",
    recordRecTitle: "Rekodi pendekezo",
    recAria: "Pendekezo",
    releaseToSupplier: "Toa kwa msambazaji",
    refundToBuyer: "Rudisha kwa mnunuzi",
    rationalePlaceholder: "Sababu ya maandishi (inahitajika, inahifadhiwa kudumu)…",
    recordRecBtn: "Rekodi pendekezo",
    operatorInfoNote:
      "Maelezo ya mapitio na mapendekezo yanarekodiwa na wasuluhishi. Kama mwendeshaji unaweza kuidhinisha pendekezo hapo juu na kuhamisha kumbukumbu ya ukaguzi.",
    auditTimelineTitle: "Mfuatano wa ukaguzi",
    exportCsv: "Hamisha CSV",
    noTimeline: "Hakuna maingizo ya mfuatano.",
  },
  pt: {
    eyebrow: "Arbitragem e Separação de Funções",
    title: "Tribunal de Litígios",
    description:
      "Os litígios são abertos on-chain e congelam a caução. Os árbitros registam notas de revisão e uma recomendação RELEASE / REFUND; um operador aprova-a antes de o resultado ser executado pelo contrato.",
    bannerBadge: (role) => `Governação de Arbitragem em Duas Fases · MESA ${role.toUpperCase()}`,
    bannerTitle: "Resolução de Litígios de Caução On-Chain",
    bannerDesc:
      "Os árbitros investigam reclamações e submetem recomendações escritas `RELEASE` ou `REFUND`. Os operadores co-assinam e aprovam decisões antes de qualquer liquidação por contrato inteligente ser autorizada.",
    activeRole: "Função Ativa",
    enterContract: "Introduza o endereço do contrato de caução para carregar os litígios.",
    openDisputes: "Litígios abertos",
    openDisputesSub: "A aguardar resolução",
    resolved: "Resolvidos",
    resolvedSub: "Encerrados on-chain",
    total: "Total",
    totalSub: "Para este contrato",
    byStatusTitle: "Litígios por estado",
    byStatusSubtitle: "Distribuição de processos de arbitragem ativos vs. resolvidos",
    disputesLabel: "Litígios",
    queueTitle: "Fila de arbitragem",
    queueSubtitle:
      "Clique em qualquer processo para inspecionar decisões, notas de árbitro e a cronologia de auditoria",
    live: "Ativo",
    emptyDisputes: "Não foram abertos litígios para este contrato.",
    colCase: "Processo",
    colEscrow: "Caução",
    colClaim: "Reclamação",
    colRaised: "Aberto em",
    colTx: "Tx",
    colStatus: "Estado",
    noteRecorded: "Nota de revisão registada",
    recRecorded: (choice) => `Recomendação ${choice} registada`,
    recRecordedSub: "A aguardar aprovação do operador.",
    decisionApproved: "Decisão aprovada",
    approvalRefused: "Aprovação recusada",
    dialogTitle: (caseId, escrowId) => `Processo ${caseId} · caução #${escrowId}`,
    dialogDesc: (raised, status) => `Aberto ${raised} · ${status}`,
    decisionsTitle: "Decisões",
    noRecommendation: "Ainda sem recomendação.",
    byActorAt: (actor, at) => `por ${actor} · ${at}`,
    approvalsCount: (n) => `${n} aprovação${n === 1 ? "" : "ões"}`,
    approveBtn: "Aprovar",
    reviewNotesTitle: "Notas de revisão",
    noNotes: "Ainda sem notas.",
    addNotePlaceholder: "Adicionar nota de revisão…",
    addNoteBtn: "Adicionar nota",
    recordRecTitle: "Registar recomendação",
    recAria: "Recomendação",
    releaseToSupplier: "Libertar para o fornecedor",
    refundToBuyer: "Reembolsar ao comprador",
    rationalePlaceholder: "Fundamentação escrita (obrigatória, registada permanentemente)…",
    recordRecBtn: "Registar recomendação",
    operatorInfoNote:
      "As notas de revisão e recomendações são registadas por árbitros. Como operador, pode aprovar uma recomendação acima e exportar o registo de auditoria.",
    auditTimelineTitle: "Cronologia de auditoria",
    exportCsv: "Exportar CSV",
    noTimeline: "Sem entradas na cronologia.",
  },
  rw: {
    eyebrow: "Ubukemurampaka n'Igabana ry'Inshingano",
    title: "Urukiko rw'Impaka",
    description:
      "Impaka zitangizwa kuri chain bigahagarika escrow. Abakemurampaka bandika inyandiko z'isuzuma n'icyifuzo cya RELEASE / REFUND; umukozi akabyemeza mbere y'uko bishyirwa mu bikorwa n'amasezerano.",
    bannerBadge: (role) => `Imiyoborere y'Ubukemurampaka mu Byiciro Bibiri · BIRO YA ${role.toUpperCase()}`,
    bannerTitle: "Gukemura Impaka za Escrow kuri Chain",
    bannerDesc:
      "Abakemurampaka bakora iperereza ku birego bakandika ibyifuzo bya `RELEASE` cyangwa `REFUND`. Abakozi bashyiraho umukono kandi bakemeza imyanzuro mbere y'uko ubwishyu bwa smart-contract bwemererwa.",
    activeRole: "Urwego Rukora",
    enterContract: "Shyiramo aderesi y'amasezerano ya escrow kugira ngo ufungure impaka.",
    openDisputes: "Impaka zifunguye",
    openDisputesSub: "Zitegereje umwanzuro",
    resolved: "Zakemuwe",
    resolvedSub: "Zafunzwe kuri chain",
    total: "Igiteranyo",
    totalSub: "Kuri aya masezerano",
    byStatusTitle: "Impaka ukurikije imiterere",
    byStatusSubtitle: "Ikigero cy'imanza zikora n'izakemuwe",
    disputesLabel: "Impaka",
    queueTitle: "Urutonde rw'ubukemurampaka",
    queueSubtitle:
      "Kanda ku rubanza urwo ari rwo rwose kugira ngo usuzume imyanzuro, inyandiko z'umukemurampaka n'amateka y'igenzura",
    live: "Ako kanya",
    emptyDisputes: "Nta mpaka zigeze zitangizwa kuri aya masezerano.",
    colCase: "Urubanza",
    colEscrow: "Escrow",
    colClaim: "Ikirego",
    colRaised: "Rwatangiye",
    colTx: "Tx",
    colStatus: "Imiterere",
    noteRecorded: "Inyandiko y'isuzuma yanditswe",
    recRecorded: (choice) => `Icyifuzo cya ${choice} cyanditswe`,
    recRecordedSub: "Bitegereje kwemezwa n'umukozi.",
    decisionApproved: "Umwanzuro wemejwe",
    approvalRefused: "Kwemeza byanze",
    dialogTitle: (caseId, escrowId) => `Urubanza ${caseId} · escrow #${escrowId}`,
    dialogDesc: (raised, status) => `Rwatangiye ${raised} · ${status}`,
    decisionsTitle: "Imyanzuro",
    noRecommendation: "Nta cyifuzo kiratangwa.",
    byActorAt: (actor, at) => `na ${actor} · ${at}`,
    approvalsCount: (n) => `kwemeza ${n}`,
    approveBtn: "Emeza",
    reviewNotesTitle: "Inyandiko z'isuzuma",
    noNotes: "Nta nyandiko ziraboneka.",
    addNotePlaceholder: "Ongeraho inyandiko y'isuzuma…",
    addNoteBtn: "Ongeraho inyandiko",
    recordRecTitle: "Andika icyifuzo",
    recAria: "Icyifuzo",
    releaseToSupplier: "Rekurira umugurisha",
    refundToBuyer: "Subiza umuguzi",
    rationalePlaceholder: "Impamvu yanditse (irasabwa, ibikwa burundu)…",
    recordRecBtn: "Andika icyifuzo",
    operatorInfoNote:
      "Inyandiko z'isuzuma n'ibyifuzo byandikwa n'abakemurampaka. Nk'umukozi ushobora kwemeza icyifuzo haruguru no gusohora raporo y'igenzura.",
    auditTimelineTitle: "Urutonde rw'igenzura",
    exportCsv: "avanamo CSV",
    noTimeline: "Nta makuru ari ku rutonde.",
  },
};

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title: "Dispute Tribunal — VUKA" },
      {
        name: "description",
        content:
          "Arbitration queue for disputed escrows with review notes, arbiter recommendations and operator approval.",
      },
    ],
  }),
  component: () => (
    <Shell role="operator">
      <Tribunal />
    </Shell>
  ),
});

const isOpen = (d: Dispute) => !d.resolved_at && d.status.toLowerCase() !== "resolved";

function Tribunal() {
  const me = useOperator();
  const c = useLangCopy(COPY);
  const [scope, setScope] = useChainScope();
  const ready = scopeReady(scope);
  const [active, setActive] = useState<Dispute | null>(null);

  const disputes = useQuery({
    queryKey: ["disputes", scope],
    queryFn: () => operator.disputes(scope),
    enabled: ready,
    refetchInterval: 20_000,
  });
  const open = useMemo(() => (disputes.data ?? []).filter(isOpen).length, [disputes.data]);

  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      {/* Executive Dispute Tribunal Banner */}
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
              <Scale className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerBadge(me.role)}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {c.bannerTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <Gavel className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                {c.activeRole}
              </div>
              <div className="font-bold uppercase text-white">{me.role}</div>
            </div>
          </div>
        </div>
      </div>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>{c.enterContract}</EmptyState>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label={c.openDisputes}
              value={open}
              sub={c.openDisputesSub}
              accent={open > 0 ? "warn" : "lime"}
            />
            <Metric
              label={c.resolved}
              value={(disputes.data?.length ?? 0) - open}
              sub={c.resolvedSub}
            />
            <Metric label={c.total} value={disputes.data?.length ?? "—"} sub={c.totalSub} />
          </div>

          {disputes.data && disputes.data.length > 0 ? (
            <Panel title={c.byStatusTitle} subtitle={c.byStatusSubtitle}>
              <LazyDonutChart
                ariaLabel={c.byStatusTitle}
                data={Object.entries(
                  disputes.data.reduce<Record<string, number>>((acc, d) => {
                    acc[d.status] = (acc[d.status] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([label, value]) => ({ label, value }))}
                center={{ value: String(disputes.data.length), label: c.disputesLabel }}
                format={(v) => String(v)}
              />
            </Panel>
          ) : null}

          <Panel
            title={c.queueTitle}
            subtitle={c.queueSubtitle}
            meta={<Chip tone="live">{c.live}</Chip>}
          >
            <QueryBoundary
              query={disputes}
              disabledCodes={["reconciliation_disabled"]}
              isEmpty={(d) => d.length === 0}
              empty={c.emptyDisputes}
            >
              {(rows) => (
                <DataTable
                  caption={c.queueTitle}
                  exportName="vuka-disputes.csv"
                  rows={rows}
                  rowKey={(d) => d.id}
                  onRowClick={setActive}
                  initialSort={{ key: "raised", dir: "desc" }}
                  columns={[
                    {
                      key: "case",
                      header: c.colCase,
                      sort: (d) => d.id,
                      text: (d) => d.id,
                      cell: (d) => (
                        <span className="font-mono text-xs font-semibold">
                          {truncMid(d.id, 8, 4)}
                        </span>
                      ),
                    },
                    {
                      key: "escrow",
                      header: c.colEscrow,
                      sort: (d) => d.escrow_id,
                      text: (d) => `#${d.escrow_id}`,
                      cell: (d) => <span className="font-mono text-xs">#{d.escrow_id}</span>,
                    },
                    {
                      key: "claim",
                      header: c.colClaim,
                      text: (d) => d.reason,
                      cell: (d) => <span className="line-clamp-2 text-xs">{d.reason}</span>,
                    },
                    {
                      key: "raised",
                      header: c.colRaised,
                      sort: (d) => d.created_at,
                      text: (d) => d.created_at,
                      cell: (d) => (
                        <span className="tabular font-mono text-xs text-muted-foreground">
                          {when(d.created_at)}
                        </span>
                      ),
                    },
                    {
                      key: "tx",
                      header: c.colTx,
                      text: (d) => d.raised_transaction_hash,
                      cell: (d) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(d.raised_transaction_hash)}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: c.colStatus,
                      align: "right",
                      sort: (d) => d.status,
                      cell: (d) => <Chip tone={isOpen(d) ? "warn" : "invert"}>{d.status}</Chip>,
                    },
                  ]}
                />
              )}
            </QueryBoundary>
          </Panel>
        </>
      )}

      <CaseDialog dispute={active} onClose={() => setActive(null)} />
    </>
  );
}

function CaseDialog({ dispute, onClose }: { dispute: Dispute | null; onClose: () => void }) {
  const me = useOperator();
  const c = useLangCopy(COPY);
  const qc = useQueryClient();
  const id = dispute?.id;
  const isArbiter = me.role === "arbiter";

  const timeline = useQuery({
    queryKey: ["dispute-timeline", id],
    queryFn: () => operator.disputeTimeline(id!),
    enabled: !!id,
  });
  // Review notes are arbiter-only on the engine (403 for operators), so do not even ask.
  const reviews = useQuery({
    queryKey: ["dispute-reviews", id],
    queryFn: () => operator.disputeReviews(id!),
    enabled: !!id && isArbiter,
  });
  const decisions = useQuery({
    queryKey: ["dispute-decisions", id],
    queryFn: () => operator.disputeDecisions(id!),
    enabled: !!id,
  });

  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<"RELEASE" | "REFUND">("RELEASE");
  const [rationale, setRationale] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["dispute-timeline", id] });
    void qc.invalidateQueries({ queryKey: ["dispute-reviews", id] });
    void qc.invalidateQueries({ queryKey: ["dispute-decisions", id] });
  };

  const addNote = useMutation({
    mutationFn: () => operator.addReview(id!, note.trim()),
    onSuccess: () => {
      toast.success(c.noteRecorded);
      setNote("");
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const recommend = useMutation({
    mutationFn: () => operator.recommend(id!, choice, rationale.trim()),
    onSuccess: () => {
      toast.success(c.recRecorded(choice), {
        description: c.recRecordedSub,
      });
      setRationale("");
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const approve = useMutation({
    mutationFn: (decisionId: string) => operator.approveDecision(decisionId),
    onSuccess: () => {
      toast.success(c.decisionApproved);
      refresh();
    },
    onError: (e) => toast.error(c.approvalRefused, { description: describeError(e) }),
  });

  return (
    <Dialog open={dispute !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        {dispute ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {c.dialogTitle(truncMid(dispute.id, 8, 4), dispute.escrow_id)}
              </DialogTitle>
              <DialogDescription>
                {c.dialogDesc(when(dispute.created_at), dispute.status)}
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-xl border border-border bg-muted/20 p-3.5 text-sm">
              {dispute.reason}
            </p>

            <Section title={c.decisionsTitle}>
              <QueryBoundary
                query={decisions}
                isEmpty={(d) => d.length === 0}
                empty={c.noRecommendation}
              >
                {(rows) => (
                  <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                    {rows.map((d) => (
                      <li key={d.id} className="space-y-1.5 px-3.5 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <Chip tone="invert">{d.decision}</Chip>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {c.byActorAt(d.decided_by, when(d.created_at))}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <Chip tone={d.approvals.length > 0 ? "invert" : "warn"}>
                              {c.approvalsCount(d.approvals.length)}
                            </Chip>
                            {me.role === "operator" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-lg font-mono text-[10px] uppercase"
                                disabled={
                                  approve.isPending ||
                                  d.approvals.some((a) => a.approver_email === me.email)
                                }
                                onClick={() => approve.mutate(d.id)}
                              >
                                {c.approveBtn}
                              </Button>
                            ) : null}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.rationale}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </QueryBoundary>
            </Section>

            {isArbiter ? (
              <>
                <Section title={c.reviewNotesTitle}>
                  <QueryBoundary
                    query={reviews}
                    isEmpty={(d) => d.length === 0}
                    empty={c.noNotes}
                  >
                    {(rows) => (
                      <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                        {rows.map((r) => (
                          <li key={r.id} className="px-3.5 py-2.5">
                            <p className="text-xs">{r.note}</p>
                            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                              {r.reviewer_email} · {when(r.created_at)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </QueryBoundary>
                  <div className="mt-2 flex gap-2">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={c.addNotePlaceholder}
                      className="min-h-16 rounded-lg"
                    />
                    <Button
                      variant="outline"
                      className="rounded-lg font-mono text-[10px] uppercase"
                      disabled={!note.trim() || addNote.isPending}
                      onClick={() => addNote.mutate()}
                    >
                      {c.addNoteBtn}
                    </Button>
                  </div>
                </Section>

                {isOpen(dispute) ? (
                  <Section title={c.recordRecTitle}>
                    <div className="space-y-2.5">
                      <Select value={choice} onValueChange={(v) => setChoice(v as typeof choice)}>
                        <SelectTrigger
                          aria-label={c.recAria}
                          className="w-52 rounded-lg font-mono text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="RELEASE">{c.releaseToSupplier}</SelectItem>
                          <SelectItem value="REFUND">{c.refundToBuyer}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder={c.rationalePlaceholder}
                        className="min-h-20 rounded-lg"
                      />
                      <Button
                        className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
                        disabled={rationale.trim().length < 12 || recommend.isPending}
                        onClick={() => recommend.mutate()}
                      >
                        {c.recordRecBtn}
                      </Button>
                    </div>
                  </Section>
                ) : null}
              </>
            ) : (
              <p className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/15 p-3.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-[#79b200]" aria-hidden="true" />
                {c.operatorInfoNote}
              </p>
            )}

            <Section
              title={c.auditTimelineTitle}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg font-mono text-[10px] uppercase"
                  onClick={() =>
                    void download(
                      `/api/disputes/${dispute.id}/export`,
                      `dispute-${dispute.escrow_id}-audit.csv`,
                    ).catch((e) => toast.error(describeError(e)))
                  }
                >
                  {c.exportCsv}
                </Button>
              }
            >
              <QueryBoundary
                query={timeline}
                isEmpty={(d) => d.length === 0}
                empty={c.noTimeline}
              >
                {(rows) => (
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
                    {rows.map((t) => (
                      <li key={t.id} className="px-3.5 py-2.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-xs font-medium">{t.summary}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {when(t.created_at)}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {t.kind}
                          {t.actor ? ` · ${t.actor}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </QueryBoundary>
            </Section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
