import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CircleDollarSign,
  Copy,
  FileCheck2,
  PartyPopper,
  Send,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { workflows } from "@/lib/api/endpoints";
import type { Workflow, WorkflowState } from "@/lib/api/types";
import { money, shortId, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Happy-path order; FAILED / REQUIRES_REVIEW are off-path terminal-until-acted-on states. */
const PATH: WorkflowState[] = [
  "QUOTED",
  "COLLECTION_PENDING",
  "COLLECTED",
  "LEDGER_POSTED",
  "PAYOUT_PENDING",
  "COMPLETED",
];

const COPY = {
  en: {
    labels: {
      CREATED: "Created",
      QUOTED: "Quote Bound",
      COLLECTION_PENDING: "Collecting Mobile Money",
      COLLECTED: "Funds Collected",
      LEDGER_POSTED: "Ledger Posted",
      PAYOUT_PENDING: "Disbursing Payout",
      COMPLETED: "Settled",
      FAILED: "Failed",
      REQUIRES_REVIEW: "Requires Review",
    } as Record<string, string>,
    retryDidNotComplete: "Retry did not complete",
    retrySubmitted: "Retry submitted",
    retryRejected: "Retry rejected",
    loadingWorkflow: "Loading payment workflow",
    headerTitle: "Quote-Bound Cross-Border Workflow",
    copyId: "Copy workflow ID",
    corridor: "Corridor",
    paymentFailed: "Payment failed",
    payoutNeedsReview: "Payout needs review",
    stepSuffix: (step: string) => ` · ${step.toLowerCase()} step`,
    defaultFailureReason: "The provider did not confirm this step.",
    requiresReviewNotice:
      "Your funds were collected and posted to the ledger. The payout is not treated as successful until it is confirmed or retried.",
    recipientPhonePlaceholder: "Recipient mobile number",
    yourPhonePlaceholder: "Your mobile number",
    retrying: "Retrying…",
    retryBtn: (step?: string) => `Retry ${step?.toLowerCase() ?? ""}`,
    ledgerTransferId: "Ledger transfer ID",
    lockedFxRate: "Locked FX rate",
    collectionRail: "Collection rail",
    payoutRail: "Payout rail",
    auditTrail: (count: number | string) => `State Machine Audit Trail (${count} transitions)`,
  },
  fr: {
    labels: {
      CREATED: "Créé",
      QUOTED: "Cotation liée",
      COLLECTION_PENDING: "Collecte Mobile Money",
      COLLECTED: "Fonds collectés",
      LEDGER_POSTED: "Inscrit au registre",
      PAYOUT_PENDING: "Versement en cours",
      COMPLETED: "Réglé",
      FAILED: "Échoué",
      REQUIRES_REVIEW: "Examen requis",
    } as Record<string, string>,
    retryDidNotComplete: "La relance n'a pas abouti",
    retrySubmitted: "Relance envoyée",
    retryRejected: "Relance refusée",
    loadingWorkflow: "Chargement du flux de paiement",
    headerTitle: "Flux transfrontalier lié à une cotation",
    copyId: "Copier l'ID du flux",
    corridor: "Corridor",
    paymentFailed: "Échec du paiement",
    payoutNeedsReview: "Versement à vérifier",
    stepSuffix: (step: string) => ` · étape ${step.toLowerCase()}`,
    defaultFailureReason: "Le prestataire n'a pas confirmé cette étape.",
    requiresReviewNotice:
      "Vos fonds ont été collectés et inscrits au registre. Le versement n'est pas considéré comme réussi tant qu'il n'est pas confirmé ou relancé.",
    recipientPhonePlaceholder: "Numéro mobile du bénéficiaire",
    yourPhonePlaceholder: "Votre numéro de mobile",
    retrying: "Relance…",
    retryBtn: (step?: string) => `Relancer ${step?.toLowerCase() ?? ""}`,
    ledgerTransferId: "ID de transfert registre",
    lockedFxRate: "Taux de change verrouillé",
    collectionRail: "Canal de collecte",
    payoutRail: "Canal de versement",
    auditTrail: (count: number | string) => `Piste d'audit de l'automate (${count} transitions)`,
  },
  sw: {
    labels: {
      CREATED: "Imeundwa",
      QUOTED: "Nukuu Imefungwa",
      COLLECTION_PENDING: "Inakusanya Pesa za Simu",
      COLLECTED: "Fedha Zimekusanywa",
      LEDGER_POSTED: "Imeingizwa Kwenye Leja",
      PAYOUT_PENDING: "Inatoa Malipo",
      COMPLETED: "Imekamilika",
      FAILED: "Imeshindwa",
      REQUIRES_REVIEW: "Inahitaji Ukaguzi",
    } as Record<string, string>,
    retryDidNotComplete: "Jaribio la kurudia halikukamilika",
    retrySubmitted: "Jaribio la kurudia limetumwa",
    retryRejected: "Jaribio la kurudia limekataliwa",
    loadingWorkflow: "Inapakia mtiririko wa malipo",
    headerTitle: "Mtiririko wa Mipakani Uliofungwa na Nukuu",
    copyId: "Nakili kitambulisho cha mtiririko",
    corridor: "Njia",
    paymentFailed: "Malipo yameshindwa",
    payoutNeedsReview: "Malipo ya mwisho yanahitaji ukaguzi",
    stepSuffix: (step: string) => ` · hatua ya ${step.toLowerCase()}`,
    defaultFailureReason: "Mtoa huduma hakuthibitisha hatua hii.",
    requiresReviewNotice:
      "Fedha zako zilikusanywa na kuingizwa kwenye leja. Malipo hayachukuliwi kuwa yamefaulu hadi yathibitishwe au kurudiwa.",
    recipientPhonePlaceholder: "Namba ya simu ya mpokeaji",
    yourPhonePlaceholder: "Namba yako ya simu",
    retrying: "Inajaribu tena…",
    retryBtn: (step?: string) => `Jaribu tena ${step?.toLowerCase() ?? ""}`,
    ledgerTransferId: "ID ya uhamisho wa leja",
    lockedFxRate: "Kiwango cha FX kilichofungwa",
    collectionRail: "Njia ya ukusanyaji",
    payoutRail: "Njia ya utoaji malipo",
    auditTrail: (count: number | string) => `Kumbukumbu ya Ukaguzi wa Hatua (mpito ${count})`,
  },
  pt: {
    labels: {
      CREATED: "Criado",
      QUOTED: "Cotação Vinculada",
      COLLECTION_PENDING: "A Cobrar Mobile Money",
      COLLECTED: "Fundos Cobrados",
      LEDGER_POSTED: "Lançado no Razão",
      PAYOUT_PENDING: "A Desembolsar Pagamento",
      COMPLETED: "Liquidado",
      FAILED: "Falhou",
      REQUIRES_REVIEW: "Requer Revisão",
    } as Record<string, string>,
    retryDidNotComplete: "A nova tentativa não foi concluída",
    retrySubmitted: "Nova tentativa submetida",
    retryRejected: "Nova tentativa rejeitada",
    loadingWorkflow: "A carregar fluxo de pagamento",
    headerTitle: "Fluxo Transfronteiriço Vinculado a Cotação",
    copyId: "Copiar ID do fluxo",
    corridor: "Corredor",
    paymentFailed: "Pagamento falhou",
    payoutNeedsReview: "Desembolso requer revisão",
    stepSuffix: (step: string) => ` · etapa ${step.toLowerCase()}`,
    defaultFailureReason: "O operador não confirmou esta etapa.",
    requiresReviewNotice:
      "Os seus fundos foram cobrados e lançados no razão. O desembolso não é tratado como concluído até ser confirmado ou repetido.",
    recipientPhonePlaceholder: "Número de telemóvel do destinatário",
    yourPhonePlaceholder: "O seu número de telemóvel",
    retrying: "A tentar novamente…",
    retryBtn: (step?: string) => `Repetir ${step?.toLowerCase() ?? ""}`,
    ledgerTransferId: "ID de transferência no razão",
    lockedFxRate: "Taxa de câmbio fixa",
    collectionRail: "Canal de cobrança",
    payoutRail: "Canal de desembolso",
    auditTrail: (count: number | string) => `Pista de Auditoria de Estados (${count} transições)`,
  },
  rw: {
    labels: {
      CREATED: "Byaremwe",
      QUOTED: "Igiciro Cyemejwe",
      COLLECTION_PENDING: "Kwakira Mobile Money",
      COLLECTED: "Amafaranga Yakiriwe",
      LEDGER_POSTED: "Byanditswe mu Gitabo",
      PAYOUT_PENDING: "Kohereza Ubwishyu",
      COMPLETED: "Byarangiye",
      FAILED: "Byanze",
      REQUIRES_REVIEW: "Bisaba Igenzura",
    } as Record<string, string>,
    retryDidNotComplete: "Kongera kugerageza ntibyarangiye",
    retrySubmitted: "Kongera kugerageza byoherejwe",
    retryRejected: "Kongera kugerageza byanzwe",
    loadingWorkflow: "Birimo gupakira inzira y'ubwishyu",
    headerTitle: "Inzira y'Ubwishyu Mpuzamahanga Yemejwe n'Igiciro",
    copyId: "Koporora ID y'inzira",
    corridor: "Inzira",
    paymentFailed: "Ubwishyu bwanze",
    payoutNeedsReview: "Ubwishyu busaba igenzura",
    stepSuffix: (step: string) => ` · intambwe ya ${step.toLowerCase()}`,
    defaultFailureReason: "Umufatanyabikorwa ntiyemeje iyi ntambwe.",
    requiresReviewNotice:
      "Amafaranga yawe yakiriwe kandi yandikwa mu gitabo. Ubwishyu ntibufatwa nk'aho bwarangiye kugeza bwemejwe cyangwa busubiwemo.",
    recipientPhonePlaceholder: "Nimero ya telefone y'uwakira",
    yourPhonePlaceholder: "Nimero yawe ya telefone",
    retrying: "Birimo kongera…",
    retryBtn: (step?: string) => `Ongera ugerageze ${step?.toLowerCase() ?? ""}`,
    ledgerTransferId: "ID y'ihererekanya mu gitabo",
    lockedFxRate: "Igipimo cy'ivunjisha cyafunzwe",
    collectionRail: "Umuyoboro wo kwakira",
    payoutRail: "Umuyoboro wo kohereza",
    auditTrail: (count: number | string) => `Inzira y'Igenzura ry'Intambwe (impinduka ${count})`,
  },
} as const;

export const isSettled = (s?: string) =>
  s === "COMPLETED" || s === "FAILED" || s === "REQUIRES_REVIEW";

export function stateTone(s: string) {
  if (s === "COMPLETED") return "live" as const;
  if (s === "FAILED" || s === "REQUIRES_REVIEW") return "warn" as const;
  return "invert" as const;
}

const STEP_ICON: Partial<Record<WorkflowState, LucideIcon>> = {
  QUOTED: FileCheck2,
  COLLECTION_PENDING: Wallet,
  COLLECTED: CircleDollarSign,
  LEDGER_POSTED: BookOpenCheck,
  PAYOUT_PENDING: Send,
  COMPLETED: PartyPopper,
};

/**
 * Live, connected stepper for one payment's journey — the rail fills as the engine actually
 * advances the workflow (polled, not simulated), with the in-flight step pulsing and a failed
 * step called out in place rather than just going dark.
 */
function PaymentStepper({ idx, failedNodeIndex }: { idx: number; failedNodeIndex: number | null }) {
  const copy = useLangCopy(COPY);
  const pct = idx <= 0 ? 0 : (idx / (PATH.length - 1)) * 100;
  return (
    <div className="relative rounded-2xl border border-border/80 bg-muted/20 p-5">
      <div
        aria-hidden="true"
        className="absolute left-10 right-10 top-10 hidden h-1 overflow-hidden rounded-full bg-border sm:block"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-700 ease-out",
            failedNodeIndex !== null
              ? "bg-destructive"
              : "bg-gradient-to-r from-[#79b200] to-[#c2f74d]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-6 sm:gap-y-0">
        {PATH.map((s, i) => {
          const Icon = STEP_ICON[s] ?? FileCheck2;
          const isFailedNode = i === failedNodeIndex;
          const reached = i <= idx && !isFailedNode;
          const current = i === idx && failedNodeIndex === null;
          return (
            <li key={s} className="flex flex-col items-center gap-2.5 text-center">
              <span
                className={cn(
                  "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 bg-background transition-all duration-500",
                  reached && "border-[#151515] bg-[#151515] text-[#c2f74d] shadow-md",
                  !reached && !isFailedNode && "border-border text-muted-foreground",
                  isFailedNode && "border-destructive bg-destructive text-destructive-foreground",
                  current && "motion-safe:animate-pulse ring-4 ring-[#c2f74d]/40",
                )}
              >
                {isFailedNode ? (
                  <AlertTriangle className="size-4.5" aria-hidden="true" />
                ) : i < idx ? (
                  <Check className="size-4.5" aria-hidden="true" />
                ) : (
                  <Icon className="size-4.5" aria-hidden="true" />
                )}
              </span>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground">0{i + 1}</div>
                <span
                  className={cn(
                    "font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.06em]",
                    reached || isFailedNode ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {copy.labels[s]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Live view of one quote-bound provider workflow. Polls while the workflow is in flight and offers
 * the engine's only two legal recoveries: retry a failed collection, or retry a payout that needs review.
 */
export function WorkflowTracker({ id, defaultPhone = "" }: { id: string; defaultPhone?: string }) {
  const qc = useQueryClient();
  const copy = useLangCopy(COPY);
  const [copied, setCopied] = useState(false);
  const wf = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => workflows.get(id),
    refetchInterval: (q) => (isSettled(q.state.data?.state) ? false : 2000),
  });
  const events = useQuery({
    queryKey: ["workflow-events", id, wf.data?.state],
    queryFn: () => workflows.events(id),
    enabled: wf.isSuccess,
  });
  const [phone, setPhone] = useState(defaultPhone);

  const retry = useMutation({
    mutationFn: () => workflows.retry(id, phone.trim()),
    onSuccess: (res) => {
      const err = "error" in res ? res.error : undefined;
      if (err) toast.warning(copy.retryDidNotComplete, { description: err });
      else toast.success(copy.retrySubmitted);
    },
    onError: (e) => toast.error(copy.retryRejected, { description: describeError(e) }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["workflow", id] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });

  if (wf.isPending) return <Loading label={copy.loadingWorkflow} />;
  if (wf.isError) return <ErrorState error={wf.error} onRetry={() => void wf.refetch()} />;

  const w: Workflow = wf.data;
  const pathIdx = PATH.indexOf(w.state);
  const offPath = w.state === "FAILED" || w.state === "REQUIRES_REVIEW";
  const failedNodeIndex = !offPath
    ? null
    : w.failed_step === "PAYOUT"
      ? PATH.indexOf("PAYOUT_PENDING")
      : w.failed_step === "COLLECTION"
        ? PATH.indexOf("COLLECTION_PENDING")
        : null;
  const idx = pathIdx >= 0 ? pathIdx : (failedNodeIndex ?? -1) - 1;
  const canRetry =
    (w.state === "FAILED" && w.failed_step === "COLLECTION") ||
    (w.state === "REQUIRES_REVIEW" && w.failed_step === "PAYOUT");

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#151515] bg-[#151515] p-5 text-white">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c2f74d]">
            <ShieldCheck className="size-3.5" /> {copy.headerTitle}
          </div>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-sm font-bold">
            <span>{w.id}</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(w.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-white/60 hover:text-[#c2f74d]"
              aria-label={copy.copyId}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <div className="mt-1 font-mono text-xs text-white/70">
            {money(w.amount, w.currency_from)} → {w.currency_to} · {copy.corridor}{" "}
            <span className="text-[#c2f74d]">{w.corridor_id}</span>
          </div>
        </div>
        <Chip tone={stateTone(w.state)}>{copy.labels[w.state] ?? w.state}</Chip>
      </div>

      <PaymentStepper idx={idx} failedNodeIndex={failedNodeIndex} />

      {w.state === "FAILED" || w.state === "REQUIRES_REVIEW" ? (
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-4 text-xs">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
            {w.state === "FAILED" ? copy.paymentFailed : copy.payoutNeedsReview}
            {w.failed_step ? copy.stepSuffix(w.failed_step) : ""}
          </div>
          <p className="mt-1 text-muted-foreground">
            {w.failure_reason ?? copy.defaultFailureReason}
          </p>
          {w.state === "REQUIRES_REVIEW" ? (
            <p className="mt-1 text-muted-foreground">
              {copy.requiresReviewNotice}
            </p>
          ) : null}
          {canRetry ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={
                  w.failed_step === "PAYOUT" ? copy.recipientPhonePlaceholder : copy.yourPhonePlaceholder
                }
                className="h-9 w-60 rounded-xl font-mono text-xs"
              />
              <Button
                size="sm"
                className="h-9 rounded-xl font-mono text-[10px] uppercase"
                disabled={retry.isPending || !phone.trim()}
                onClick={() => retry.mutate()}
              >
                {retry.isPending ? copy.retrying : copy.retryBtn(w.failed_step)}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {w.state === "COMPLETED" ? (
        <dl className="grid gap-2.5 rounded-2xl border border-[#79b200]/40 bg-[#f6fce8] p-4 font-mono text-xs text-[#151515] sm:grid-cols-2 dark:bg-[#1b2410] dark:text-foreground">
          <Row k={copy.ledgerTransferId} v={shortId(w.ledger_transfer_id, 14)} />
          <Row k={copy.lockedFxRate} v={String(w.rate)} />
          <Row k={copy.collectionRail} v={w.collection_provider} />
          <Row k={copy.payoutRail} v={w.payout_provider} />
        </dl>
      ) : null}

      <details className="rounded-2xl border border-border bg-card">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {copy.auditTrail(events.data?.length ?? "…")}
        </summary>
        <ul className="divide-y divide-border/60 border-t border-border/60 px-4">
          {(events.data ?? []).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 font-mono text-[11px]"
            >
              <span>
                <span className="text-muted-foreground">#{e.sequence}</span>{" "}
                {e.from_state || "INIT"} →{" "}
                <span className="font-semibold text-foreground">{e.to_state}</span>
                {e.step ? ` · ${e.step.toLowerCase()}` : ""}
              </span>
              <span className="text-muted-foreground">{when(e.created_at)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
