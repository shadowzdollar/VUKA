import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle, Send, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { corridors, pilots, settlements } from "@/lib/api/endpoints";
import type { PreflightResult, SettlementCommand } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { useOperator } from "@/lib/session";

export const Route = createFileRoute("/settlements")({
  head: () => ({ meta: [{ title: "Settlements & Pilots — VUKA" }] }),
  component: () => (
    <Shell role="operator">
      <Settlements />
    </Shell>
  ),
});

const ACTIONS = ["payout", "fund", "release", "refund", "timeout", "arbitration"];
const tone = (s: string) =>
  ["succeeded", "approved", "active", "completed"].includes(s)
    ? ("invert" as const)
    : ["failed", "cancelled", "expired", "rejected", "paused"].includes(s)
      ? ("warn" as const)
      : ("live" as const);

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    newCommand: string;
    bannerBadge: string;
    bannerTitle: string;
    bannerDesc: (req: number) => string;
    executionMode: string;
    liveEnabled: string;
    dryRunEnforced: string;
    killSwitch: string;
    deploymentConfig: string;
    liveExecution: string;
    dryRunDisabledSub: string;
    approvalsRequired: string;
    distinctApprovers: string;
    perCommandCap: string;
    dailySub: (d: string) => string;
    commandsByStatus: string;
    lifecycleDist: string;
    commandsLabel: string;
    settlementCommands: string;
    settlementSubtitle: string;
    commandsCount: (n: number) => string;
    noCommandsSubmitted: string;
    colCommand: string;
    colAction: string;
    colTarget: string;
    colAmount: string;
    colRequested: string;
    colApproval: string;
    colStatus: string;
    btnPreflight: string;
    btnApprove: string;
    btnExecute: string;
    btnCancel: string;
    approvalsNote: string;
    supervisedPilots: string;
    pilotsSubtitle: string;
    observationOnly: string;
    noPilots: string;
    colPilot: string;
    colCorridor: string;
    colScope: string;
    colLimits: string;
    colWindow: string;
    btnPause: string;
    btnResume: string;
    btnComplete: string;
    preflightPassed: string;
    preflightFailed: string;
    advisory: string;
    dialogNewCommandTitle: string;
    dialogNewCommandDesc: string;
    fieldAction: string;
    fieldProvider: string;
    fieldTarget: string;
    targetPlaceholder: string;
    fieldCorridor: string;
    fieldAmount: string;
    fieldCurrency: string;
    fieldReason: string;
    btnSubmitCommand: string;
    dialogApprovalTitle: string;
    approvalPlaceholder: string;
    btnReject: string;
  }
> = {
  en: {
    eyebrow: "Controlled settlement",
    title: "Settlements & Pilots",
    description:
      "Settlement commands need multiple approvals and pass preflight checks. Live execution is refused by policy: execute records a dry run only. Pilots are supervised, observation-only programmes.",
    newCommand: "New command",
    bannerBadge: "Multi-Approval Settlement Governance · Dry-Run Policy Guard",
    bannerTitle: "Preflight-Gated Settlement Command Queue",
    bannerDesc: (req) =>
      `Every command requires ${req} distinct arbiter approval(s) and passes deterministic preflight checks before dry-run execution is recorded.`,
    executionMode: "Execution Mode",
    liveEnabled: "Live Enabled",
    dryRunEnforced: "Dry-Run Enforced",
    killSwitch: "Kill switch",
    deploymentConfig: "Deployment configuration",
    liveExecution: "Live execution",
    dryRunDisabledSub: "Dry run only when disabled",
    approvalsRequired: "Approvals required",
    distinctApprovers: "Distinct approvers",
    perCommandCap: "Per-command cap",
    dailySub: (d) => `Daily ${d}`,
    commandsByStatus: "Commands by status",
    lifecycleDist: "Lifecycle distribution across submitted settlement commands",
    commandsLabel: "Commands",
    settlementCommands: "Settlement commands",
    settlementSubtitle:
      "Run preflight checks, approve (arbiter), or execute dry-run settlement actions",
    commandsCount: (n) => `${n} commands`,
    noCommandsSubmitted: "No settlement commands submitted.",
    colCommand: "Command",
    colAction: "Action",
    colTarget: "Target",
    colAmount: "Amount",
    colRequested: "Requested",
    colApproval: "Approval",
    colStatus: "Status",
    btnPreflight: "Preflight",
    btnApprove: "Approve",
    btnExecute: "Execute",
    btnCancel: "Cancel",
    approvalsNote:
      "Approvals can only be given by an arbiter account; operators submit, run preflight and cancel.",
    supervisedPilots: "Supervised pilots",
    pilotsSubtitle: "Bounded corridor pilot programmes with per-transaction and daily caps",
    observationOnly: "Observation only",
    noPilots: "No pilots configured. Seed one with `make pilot-seed` or create it via the API.",
    colPilot: "Pilot",
    colCorridor: "Corridor",
    colScope: "Scope",
    colLimits: "Limits (txn / day)",
    colWindow: "Window",
    btnPause: "Pause",
    btnResume: "Resume",
    btnComplete: "Complete",
    preflightPassed: "All required checks passed.",
    preflightFailed: "One or more required checks failed.",
    advisory: " (advisory)",
    dialogNewCommandTitle: "New settlement command",
    dialogNewCommandDesc:
      "Submitted commands are idempotent and can never move real funds while live execution is disabled.",
    fieldAction: "Action",
    fieldProvider: "Provider",
    fieldTarget: "Target",
    targetPlaceholder: "escrow / transfer reference",
    fieldCorridor: "Corridor",
    fieldAmount: "Amount",
    fieldCurrency: "Currency",
    fieldReason: "Reason",
    btnSubmitCommand: "Submit command",
    dialogApprovalTitle: "Approval",
    approvalPlaceholder: "Reason for your decision…",
    btnReject: "Reject",
  },
  fr: {
    eyebrow: "Règlement contrôlé",
    title: "Règlements & Pilotes",
    description:
      "Les ordres de règlement nécessitent des approbations multiples et des vérifications préalables. L'exécution réelle est bloquée par politique : seul le mode simulation est consigné.",
    newCommand: "Nouvel ordre",
    bannerBadge: "Gouvernance Multi-Approbation · Garde-Fou de Simulation",
    bannerTitle: "File d'Ordres de Règlement avec Contrôle Préalable",
    bannerDesc: (req) =>
      `Chaque ordre requiert ${req} approbation(s) d'arbitre distincte(s) et réussit les contrôles préalables déterministes avant enregistrement en simulation.`,
    executionMode: "Mode d'Exécution",
    liveEnabled: "Direct Activé",
    dryRunEnforced: "Simulation Imposée",
    killSwitch: "Arrêt d'urgence",
    deploymentConfig: "Configuration de déploiement",
    liveExecution: "Exécution directe",
    dryRunDisabledSub: "Simulation seule quand désactivée",
    approvalsRequired: "Approbations requises",
    distinctApprovers: "Approbateurs distincts",
    perCommandCap: "Plafond par ordre",
    dailySub: (d) => `Quotidien ${d}`,
    commandsByStatus: "Ordres par statut",
    lifecycleDist: "Distribution du cycle de vie des ordres de règlement",
    commandsLabel: "Ordres",
    settlementCommands: "Ordres de règlement",
    settlementSubtitle:
      "Exécuter les vérifications préalables, approuver (arbitre) ou simuler les règlements",
    commandsCount: (n) => `${n} ordres`,
    noCommandsSubmitted: "Aucun ordre de règlement soumis.",
    colCommand: "Ordre",
    colAction: "Action",
    colTarget: "Cible",
    colAmount: "Montant",
    colRequested: "Demandé",
    colApproval: "Approbation",
    colStatus: "Statut",
    btnPreflight: "Contrôle",
    btnApprove: "Approuver",
    btnExecute: "Exécuter",
    btnCancel: "Annuler",
    approvalsNote:
      "Les approbations ne peuvent être données que par un compte arbitre ; les opérateurs soumettent, contrôlent et annulent.",
    supervisedPilots: "Programmes pilotes supervisés",
    pilotsSubtitle: "Programmes pilotes délimités avec plafonds par transaction et journaliers",
    observationOnly: "Observation seule",
    noPilots: "Aucun pilote configuré. Initialisez avec `make pilot-seed` ou via l'API.",
    colPilot: "Pilote",
    colCorridor: "Corridor",
    colScope: "Portée",
    colLimits: "Limites (txn / jour)",
    colWindow: "Période",
    btnPause: "Suspendre",
    btnResume: "Reprendre",
    btnComplete: "Terminer",
    preflightPassed: "Tous les contrôles requis ont réussi.",
    preflightFailed: "Un ou plusieurs contrôles requis ont échoué.",
    advisory: " (consultatif)",
    dialogNewCommandTitle: "Nouvel ordre de règlement",
    dialogNewCommandDesc:
      "Les ordres soumis sont idempotents et ne peuvent jamais déplacer de fonds réels tant que l'exécution réelle est désactivée.",
    fieldAction: "Action",
    fieldProvider: "Opérateur",
    fieldTarget: "Cible",
    targetPlaceholder: "référence séquestre / transfert",
    fieldCorridor: "Corridor",
    fieldAmount: "Montant",
    fieldCurrency: "Devise",
    fieldReason: "Motif",
    btnSubmitCommand: "Soumettre l'ordre",
    dialogApprovalTitle: "Approbation",
    approvalPlaceholder: "Motif de votre décision…",
    btnReject: "Rejeter",
  },
  sw: {
    eyebrow: "Ulipaji unaodhibitiwa",
    title: "Malipo na Miradi ya Majaribio",
    description:
      "Amri za ulipaji zinahitaji idhini kadhaa na ukaguzi wa awali. Utekelezaji wa moja kwa moja umekataliwa na sera: majaribio pekee ndiyo hurekodiwa. Miradi ya majaribio ni ya uangalizi pekee.",
    newCommand: "Amri mpya",
    bannerBadge: "Utawala wa Idhini Nyingi · Ulinzi wa Majaribio",
    bannerTitle: "Foleni ya Amri za Ulipaji Zilizothibitishwa Awali",
    bannerDesc: (req) =>
      `Kila amri inahitaji idhini ${req} tofauti ya msuluhishi na kufaulu ukaguzi kabla ya kurekodi utekelezaji wa majaribio.`,
    executionMode: "Mfumo wa Utekelezaji",
    liveEnabled: "Utekelezaji Halisi Umewashwa",
    dryRunEnforced: "Majaribio Pekee Yamelazimishwa",
    killSwitch: "Kitufe cha dharura",
    deploymentConfig: "Usanidi wa mfumo",
    liveExecution: "Utekelezaji halisi",
    dryRunDisabledSub: "Majaribio pekee yakiwa yamezimwa",
    approvalsRequired: "Idhini zinazohitajika",
    distinctApprovers: "Waidhinishaji tofauti",
    perCommandCap: "Kikomo kwa kila amri",
    dailySub: (d) => `Kila siku ${d}`,
    commandsByStatus: "Amri kulingana na hali",
    lifecycleDist: "Mgawanyo wa amri za ulipaji zilizowasilishwa",
    commandsLabel: "Amri",
    settlementCommands: "Amri za ulipaji",
    settlementSubtitle:
      "Fanya ukaguzi wa awali, idhinisha (msuluhishi), au tekeleza vitendo vya majaribio",
    commandsCount: (n) => `Amri ${n}`,
    noCommandsSubmitted: "Hakuna amri za ulipaji zilizowasilishwa.",
    colCommand: "Amri",
    colAction: "Kitendo",
    colTarget: "Lengo",
    colAmount: "Kiasi",
    colRequested: "Iliyoombwa",
    colApproval: "Idhini",
    colStatus: "Hali",
    btnPreflight: "Kagua",
    btnApprove: "Idhinisha",
    btnExecute: "Tekeleza",
    btnCancel: "Ghairi",
    approvalsNote:
      "Idhini zinaweza kutolewa tu na akaunti ya msuluhishi; waendeshaji huwasilisha, hukagua na kughairi.",
    supervisedPilots: "Miradi ya majaribio inayosimamiwa",
    pilotsSubtitle: "Miradi yenye mipaka ya miamala na vikomo vya kila siku",
    observationOnly: "Uchunguzi pekee",
    noPilots: "Hakuna majaribio yaliyowekwa. Sanidi kwa kutumia `make pilot-seed` au kupitia API.",
    colPilot: "Majaribio",
    colCorridor: "Njia",
    colScope: "Upeo",
    colLimits: "Vikomo (muamala / siku)",
    colWindow: "Muda",
    btnPause: "Sitisha",
    btnResume: "Endelea",
    btnComplete: "Kamilisha",
    preflightPassed: "Ukaguzi wote unaohitajika umefaulu.",
    preflightFailed: "Ukaguzi mmoja au zaidi umeshindwa.",
    advisory: " (ushauri)",
    dialogNewCommandTitle: "Amri mpya ya ulipaji",
    dialogNewCommandDesc:
      "Amri zilizowasilishwa haziwezi kuhamisha fedha halisi wakati utekelezaji halisi umezimwa.",
    fieldAction: "Kitendo",
    fieldProvider: "Mtoa huduma",
    fieldTarget: "Lengo",
    targetPlaceholder: "rejeleo la amana / uhamisho",
    fieldCorridor: "Njia",
    fieldAmount: "Kiasi",
    fieldCurrency: "Sarafu",
    fieldReason: "Sababu",
    btnSubmitCommand: "Wasilisha amri",
    dialogApprovalTitle: "Idhini",
    approvalPlaceholder: "Sababu ya uamuzi wako…",
    btnReject: "Kataa",
  },
  pt: {
    eyebrow: "Liquidação controlada",
    title: "Liquidações & Pilotos",
    description:
      "As ordens de liquidação exigem múltiplas aprovações e passam por verificações prévias. A execução real é recusada por política: apenas simulações são gravadas. Os pilotos são programas apenas de observação.",
    newCommand: "Nova ordem",
    bannerBadge: "Governança Multi-Aprovação · Proteção de Simulação",
    bannerTitle: "Fila de Ordens de Liquidação com Verificação Prévia",
    bannerDesc: (req) =>
      `Cada ordem requer ${req} aprovação(ões) de árbitro distinta(s) e passa por verificações prévias determinísticas antes de a simulação ser gravada.`,
    executionMode: "Modo de Execução",
    liveEnabled: "Direto Ativo",
    dryRunEnforced: "Simulação Forçada",
    killSwitch: "Interruptor geral",
    deploymentConfig: "Configuração de implantação",
    liveExecution: "Execução direta",
    dryRunDisabledSub: "Apenas simulação quando desativado",
    approvalsRequired: "Aprovações necessárias",
    distinctApprovers: "Aprovadores distintos",
    perCommandCap: "Limite por ordem",
    dailySub: (d) => `Diário ${d}`,
    commandsByStatus: "Ordens por estado",
    lifecycleDist: "Distribuição do ciclo de vida das ordens de liquidação",
    commandsLabel: "Ordens",
    settlementCommands: "Ordens de liquidação",
    settlementSubtitle:
      "Executar verificações, aprovar (árbitro) ou executar ações de liquidação em simulação",
    commandsCount: (n) => `${n} ordens`,
    noCommandsSubmitted: "Nenhuma ordem de liquidação submetida.",
    colCommand: "Ordem",
    colAction: "Ação",
    colTarget: "Destino",
    colAmount: "Montante",
    colRequested: "Requerente",
    colApproval: "Aprovação",
    colStatus: "Estado",
    btnPreflight: "Verificar",
    btnApprove: "Aprovar",
    btnExecute: "Executar",
    btnCancel: "Cancelar",
    approvalsNote:
      "As aprovações só podem ser concedidas por conta de árbitro; operadores submetem, verificam e cancelam.",
    supervisedPilots: "Pilotos supervisionados",
    pilotsSubtitle: "Programas piloto delimitados com limites diários e por transação",
    observationOnly: "Apenas observação",
    noPilots: "Nenhum piloto configurado. Crie um com `make pilot-seed` ou pela API.",
    colPilot: "Piloto",
    colCorridor: "Corredor",
    colScope: "Âmbito",
    colLimits: "Limites (trans / dia)",
    colWindow: "Janela",
    btnPause: "Pausar",
    btnResume: "Retomar",
    btnComplete: "Concluir",
    preflightPassed: "Todas as verificações obrigatórias foram aprovadas.",
    preflightFailed: "Uma ou mais verificações obrigatórias falharam.",
    advisory: " (consultivo)",
    dialogNewCommandTitle: "Nova ordem de liquidação",
    dialogNewCommandDesc:
      "As ordens submetidas são idempotentes e nunca movem fundos reais enquanto a execução direta estiver desativada.",
    fieldAction: "Ação",
    fieldProvider: "Fornecedor",
    fieldTarget: "Destino",
    targetPlaceholder: "referência de caução / transferência",
    fieldCorridor: "Corredor",
    fieldAmount: "Montante",
    fieldCurrency: "Moeda",
    fieldReason: "Motivo",
    btnSubmitCommand: "Submeter ordem",
    dialogApprovalTitle: "Aprovação",
    approvalPlaceholder: "Motivo da sua decisão…",
    btnReject: "Rejeitar",
  },
  rw: {
    eyebrow: "Ihererekanya rigenzurwa",
    title: "Ibyemezo by'Ubwishyu n'Ibikorwa By'Icyitegererezo",
    description:
      "Amabwiriza yo kwishyura asaba kwemezwa n'abantu benshi no kubanza kugenzurwa. Kwishyura by'ukuri birahagaritswe: ibikorwa by'igerageza gusa nibyo byandikwa.",
    newCommand: "Ibwiriza rishya",
    bannerBadge: "Ubuyobozi bwo Kwemeza Kw'Abantu Benshi · Uburinzi bw'Igerageza",
    bannerTitle: "Urutonde rw'Amabwiriza yo Kwishyura Yagenzuwe Mbere",
    bannerDesc: (req) =>
      `Buri bwiriza risaba kwemezwa n'umuhuza ${req} wigenga no gutsinda igenzura rya mbere mbere y'uko ryandikwa mu igerageza.`,
    executionMode: "Uburyo bwo Gukora",
    liveEnabled: "Gukora By'ukuri Birafunguye",
    dryRunEnforced: "Igerageza Gusa Rirakora",
    killSwitch: "Uburyo bwo guhagarika byose",
    deploymentConfig: "Imiterere y'ishyirwa mu bikorwa",
    liveExecution: "Gukora by'ukuri",
    dryRunDisabledSub: "Igerageza gusa igihe bidafunguye",
    approvalsRequired: "Ibyemezo bisabwa",
    distinctApprovers: "Abemeza batandukanye",
    perCommandCap: "Ikiruta byose ku bwiriza",
    dailySub: (d) => `Ku munsi ${d}`,
    commandsByStatus: "Amabwiriza hakurikijwe uko ameze",
    lifecycleDist: "Imiterere y'urugendo rw'amabwiriza yatanzwe",
    commandsLabel: "Amabwiriza",
    settlementCommands: "Amabwiriza yo kwishyura",
    settlementSubtitle:
      "Kora igenzura rya mbere, emeza (umuhuza), cyangwa ukore ibikorwa by'igerageza",
    commandsCount: (n) => `Amabwiriza ${n}`,
    noCommandsSubmitted: "Nta mabwiriza yo kwishyura yatanzwe.",
    colCommand: "Ibwiriza",
    colAction: "Igikorwa",
    colTarget: "Intego",
    colAmount: "Amafaranga",
    colRequested: "Uwasabye",
    colApproval: "Ubwemezwe",
    colStatus: "Uko bimeze",
    btnPreflight: "Igenzura",
    btnApprove: "Emeza",
    btnExecute: "Shyira mu bikorwa",
    btnCancel: "Kureka",
    approvalsNote:
      "Ibyemezo bitangwa gusa na konti y'umuhuza; abakoresha basanzwe batanga amabwiriza, bagakora igenzura no kureka.",
    supervisedPilots: "Imishinga y'igerageza igenzurwa",
    pilotsSubtitle: "Imishinga ifite imbibi zo guhererekanya no ku munsi",
    observationOnly: "Kureba gusa",
    noPilots: "Nta mishinga y'igerageza yateganyijwe. Tangiza ukoresheje `make pilot-seed` cyangwa API.",
    colPilot: "Igerageza",
    colCorridor: "Inzira",
    colScope: "Urwego",
    colLimits: "Imbibi (ihererekanya / umunsi)",
    colWindow: "Igihe",
    btnPause: "Hagarika akanya",
    btnResume: "Komeza",
    btnComplete: "Rangiza",
    preflightPassed: "Igenzura ryose ryagenze neza.",
    preflightFailed: "Igenzura rimwe cyangwa menshi yanze.",
    advisory: " (inama)",
    dialogNewCommandTitle: "Ibwiriza rishya ryo kwishyura",
    dialogNewCommandDesc:
      "Amabwiriza yatanzwe ntashobora kwimura amafaranga nyayo igihe uburyo bwa nyabwo budafunguye.",
    fieldAction: "Igikorwa",
    fieldProvider: "Umuyoboro",
    fieldTarget: "Intego",
    targetPlaceholder: "nimero y'ubwishyu / ihererekanya",
    fieldCorridor: "Inzira",
    fieldAmount: "Amafaranga",
    fieldCurrency: "Ifaranga",
    fieldReason: "Impamvu",
    btnSubmitCommand: "Tanga ibwiriza",
    dialogApprovalTitle: "Kwemeza",
    approvalPlaceholder: "Impamvu y'icyemezo cyawe…",
    btnReject: "Wange",
  },
};

function Settlements() {
  const t = useLangCopy(COPY);
  const me = useOperator();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["settlements"], queryFn: () => settlements.list() });
  const pilotList = useQuery({ queryKey: ["pilots"], queryFn: pilots.list });
  const [createOpen, setCreateOpen] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [approving, setApproving] = useState<SettlementCommand | null>(null);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["settlements"] });

  const run = useMutation({
    mutationFn: async ({
      kind,
      cmd,
    }: {
      kind: "preflight" | "execute" | "cancel";
      cmd: SettlementCommand;
    }) => {
      if (kind === "preflight") setPreflight(await settlements.preflight(cmd.id, false));
      else if (kind === "execute") await settlements.execute(cmd.id);
      else await settlements.cancel(cmd.id);
      return kind;
    },
    onSuccess: (kind) => {
      if (kind !== "preflight")
        toast.success(kind === "execute" ? "Execution recorded (dry run)" : "Command cancelled");
      refresh();
    },
    onError: (e) => toast.error("Action refused", { description: describeError(e) }),
  });

  const pilotAction = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "pause" | "resume" | "cancel" | "complete";
    }) => pilots.action(id, action),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["pilots"] }),
    onError: (e) => toast.error("Pilot action refused", { description: describeError(e) }),
  });

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <PlusCircle className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
            {t.newCommand}
          </Button>
        }
      />

      <QueryBoundary query={list}>
        {({ commands, policy }) => (
          <>
            {/* Executive Controlled Settlement Banner */}
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
                    <Send className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                      {t.bannerBadge}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {t.bannerTitle}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                    {t.bannerDesc(policy.RequiredApprovals)}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
                  {policy.ExecutionEnabled ? (
                    <ShieldAlert className="size-4 text-amber-400" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                      {t.executionMode}
                    </div>
                    <div className="font-bold text-white">
                      {policy.ExecutionEnabled ? t.liveEnabled : t.dryRunEnforced}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label={t.killSwitch}
                value={policy.GlobalKillSwitch ? "ACTIVE" : "off"}
                sub={t.deploymentConfig}
                accent={policy.GlobalKillSwitch ? "warn" : "lime"}
              />
              <Metric
                label={t.liveExecution}
                value={policy.ExecutionEnabled ? "enabled" : "disabled"}
                sub={t.dryRunDisabledSub}
              />
              <Metric
                label={t.approvalsRequired}
                value={policy.RequiredApprovals}
                sub={t.distinctApprovers}
              />
              <Metric
                label={t.perCommandCap}
                value={money(fromMinor(policy.MaxAmountMinor))}
                sub={t.dailySub(money(fromMinor(policy.DailyLimitMinor)))}
              />
            </div>

            {commands.length > 0 ? (
              <Panel
                title={t.commandsByStatus}
                subtitle={t.lifecycleDist}
              >
                <LazyDonutChart
                  ariaLabel="Settlement commands by status"
                  data={Object.entries(
                    commands.reduce<Record<string, number>>((acc, c) => {
                      acc[c.status] = (acc[c.status] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([label, value]) => ({ label, value }))}
                  center={{ value: String(commands.length), label: t.commandsLabel }}
                  format={(v) => String(v)}
                />
              </Panel>
            ) : null}

            <Panel
              title={t.settlementCommands}
              subtitle={t.settlementSubtitle}
              meta={<Chip tone="live">{t.commandsCount(commands.length)}</Chip>}
            >
              {commands.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t.noCommandsSubmitted}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-2.5 py-2.5">{t.colCommand}</th>
                        <th className="px-2.5 py-2.5">{t.colAction}</th>
                        <th className="px-2.5 py-2.5">{t.colTarget}</th>
                        <th className="px-2.5 py-2.5 text-right">{t.colAmount}</th>
                        <th className="px-2.5 py-2.5">{t.colRequested}</th>
                        <th className="px-2.5 py-2.5">{t.colApproval}</th>
                        <th className="px-2.5 py-2.5 text-right">{t.colStatus}</th>
                        <th className="px-2.5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {commands.map((c) => {
                        const closed = ["succeeded", "failed", "cancelled", "expired"].includes(
                          c.status,
                        );
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-2.5 py-3 font-mono text-xs font-semibold">
                              {shortId(c.id)}
                            </td>
                            <td className="px-2.5 py-3 font-mono text-xs uppercase">{c.action}</td>
                            <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                              {c.target}
                            </td>
                            <td className="px-2.5 py-3 text-right font-mono font-semibold tabular-nums">
                              {money(fromMinor(c.amount_minor), c.currency)}
                            </td>
                            <td className="px-2.5 py-3 font-mono text-[11px] text-muted-foreground">
                              {c.requested_by}
                              <br />
                              {when(c.created_at)}
                            </td>
                            <td className="px-2.5 py-3">
                              <Chip tone={tone(c.approval_state)}>{c.approval_state}</Chip>
                            </td>
                            <td className="px-2.5 py-3 text-right">
                              <Chip tone={tone(c.status)}>{c.status}</Chip>
                            </td>
                            <td className="px-2.5 py-3 text-right">
                              {!closed ? (
                                <div className="flex justify-end gap-1.5">
                                  <Mini onClick={() => run.mutate({ kind: "preflight", cmd: c })}>
                                    {t.btnPreflight}
                                  </Mini>
                                  {me.role === "arbiter" && c.approval_state === "pending" ? (
                                    <Mini onClick={() => setApproving(c)}>{t.btnApprove}</Mini>
                                  ) : null}
                                  {c.approval_state === "approved" ? (
                                    <Mini onClick={() => run.mutate({ kind: "execute", cmd: c })}>
                                      {t.btnExecute}
                                    </Mini>
                                  ) : null}
                                  <Mini onClick={() => run.mutate({ kind: "cancel", cmd: c })}>
                                    {t.btnCancel}
                                  </Mini>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {me.role !== "arbiter" ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {t.approvalsNote}
                </p>
              ) : null}
            </Panel>
          </>
        )}
      </QueryBoundary>

      <Panel
        title={t.supervisedPilots}
        subtitle={t.pilotsSubtitle}
        meta={<Chip>{pilotList.data?.observationOnly ? t.observationOnly : "—"}</Chip>}
      >
        <QueryBoundary
          query={pilotList}
          isEmpty={(d) => d.pilots.length === 0}
          empty={t.noPilots}
        >
          {({ pilots: rows }) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-2.5 py-2.5">{t.colPilot}</th>
                    <th className="px-2.5 py-2.5">{t.colCorridor}</th>
                    <th className="px-2.5 py-2.5">{t.colScope}</th>
                    <th className="px-2.5 py-2.5 text-right">{t.colLimits}</th>
                    <th className="px-2.5 py-2.5">{t.colWindow}</th>
                    <th className="px-2.5 py-2.5 text-right">{t.colStatus}</th>
                    <th className="px-2.5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-2.5 py-3 font-mono text-xs font-semibold">
                        {shortId(p.id)}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs">{p.corridor_id}</td>
                      <td className="px-2.5 py-3 text-xs text-muted-foreground">{p.scope}</td>
                      <td className="px-2.5 py-3 text-right font-mono text-xs tabular-nums">
                        {money(fromMinor(p.transaction_limit_minor))} /{" "}
                        {money(fromMinor(p.daily_limit_minor))}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-[11px] text-muted-foreground">
                        {when(p.start_at)} → {when(p.end_at)}
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <Chip tone={tone(p.status)}>{p.status}</Chip>
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {p.status === "active" ? (
                            <Mini onClick={() => pilotAction.mutate({ id: p.id, action: "pause" })}>
                              {t.btnPause}
                            </Mini>
                          ) : null}
                          {p.status === "paused" ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "resume" })}
                            >
                              {t.btnResume}
                            </Mini>
                          ) : null}
                          {p.status === "active" ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "complete" })}
                            >
                              {t.btnComplete}
                            </Mini>
                          ) : null}
                          {["draft", "planned", "approved", "active", "paused"].includes(
                            p.status,
                          ) ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "cancel" })}
                            >
                              {t.btnCancel}
                            </Mini>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
      </Panel>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onDone={refresh} />
      <ApproveDialog cmd={approving} onClose={() => setApproving(null)} onDone={refresh} />
      <Dialog open={preflight !== null} onOpenChange={(o) => !o && setPreflight(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          {preflight ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                  Preflight {shortId(preflight.command_id)}
                </DialogTitle>
                <DialogDescription>
                  {preflight.passed ? t.preflightPassed : t.preflightFailed}
                </DialogDescription>
              </DialogHeader>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {preflight.checks.map((c) => (
                  <li key={c.name} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                    <div>
                      <div className="font-mono text-xs font-semibold">
                        {c.name}
                        {c.required ? "" : t.advisory}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.explain}</p>
                    </div>
                    <Chip tone={c.passed ? "invert" : "warn"}>{c.passed ? "PASS" : "FAIL"}</Chip>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Mini({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 rounded-lg px-2.5 font-mono text-[10px] uppercase"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</Label>
      {children}
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const t = useLangCopy(COPY);
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridors.providers,
    enabled: open,
  });
  const [action, setAction] = useState("payout");
  const [target, setTarget] = useState("");
  const [provider, setProvider] = useState("");
  const [corridor, setCorridor] = useState("rw-rwf-ke-kes");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [reason, setReason] = useState("");
  // Key held for the life of the dialog so a double-click cannot submit twice.
  const [key] = useState(() => crypto.randomUUID());

  const create = useMutation({
    mutationFn: () =>
      settlements.submit(
        {
          action,
          target: target.trim(),
          provider_id: provider || providers.data?.[0]?.config.id || "",
          corridor_id: corridor.trim(),
          amount_minor: toMinor(Number(amount)),
          currency: currency.trim().toUpperCase(),
          reason: reason.trim(),
        },
        key,
      ),
    onSuccess: ({ command }) => {
      toast.success(`Command ${shortId(command.id)} submitted`, {
        description: "Dry-run only; awaiting approvals.",
      });
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error("Command refused", { description: describeError(e) }),
  });

  const ok =
    target.trim() &&
    Number(amount) > 0 &&
    reason.trim() &&
    corridor.trim() &&
    currency.trim().length === 3;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {t.dialogNewCommandTitle}
          </DialogTitle>
          <DialogDescription>
            {t.dialogNewCommandDesc}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.fieldAction}>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger aria-label={t.fieldAction} className="rounded-lg font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.fieldProvider}>
            <Select
              value={provider || providers.data?.[0]?.config.id || ""}
              onValueChange={setProvider}
            >
              <SelectTrigger aria-label={t.fieldProvider} className="rounded-lg font-mono text-xs">
                <SelectValue placeholder={t.fieldProvider} />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {(providers.data ?? []).map((p) => (
                  <SelectItem key={p.config.id} value={p.config.id}>
                    {p.config.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.fieldTarget}>
            <Input
              className="rounded-lg font-mono"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={t.targetPlaceholder}
            />
          </Field>
          <Field label={t.fieldCorridor}>
            <Input
              className="rounded-lg font-mono"
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
            />
          </Field>
          <Field label={t.fieldAmount}>
            <Input
              className="rounded-lg font-mono"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label={t.fieldCurrency}>
            <Input
              className="rounded-lg font-mono"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t.fieldReason}>
          <Textarea
            className="min-h-20 rounded-lg"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!ok || create.isPending}
            onClick={() => create.mutate()}
          >
            {t.btnSubmitCommand}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveDialog({
  cmd,
  onClose,
  onDone,
}: {
  cmd: SettlementCommand | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useLangCopy(COPY);
  const [reason, setReason] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      settlements.approve(cmd!.id, decision, reason.trim()),
    onSuccess: (_r, decision) => {
      toast.success(`Command ${decision}`);
      setReason("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error("Approval refused", { description: describeError(e) }),
  });
  return (
    <Dialog open={cmd !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {t.dialogApprovalTitle}
          </DialogTitle>
          <DialogDescription>
            {cmd
              ? `${cmd.action} ${money(fromMinor(cmd.amount_minor), cmd.currency)} → ${cmd.target}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-20 rounded-lg"
          placeholder={t.approvalPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-lg font-mono text-xs uppercase"
            disabled={!reason.trim() || decide.isPending}
            onClick={() => decide.mutate("rejected")}
          >
            {t.btnReject}
          </Button>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!reason.trim() || decide.isPending}
            onClick={() => decide.mutate("approved")}
          >
            {t.btnApprove}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
