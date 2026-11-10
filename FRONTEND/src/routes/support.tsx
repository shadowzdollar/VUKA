import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Globe2,
  Headphones,
  LifeBuoy,
  MessageSquarePlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
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
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { support } from "@/lib/api/endpoints";
import type { TicketStatus } from "@/lib/api/types";
import { shortId, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — VUKA" }] }),
  component: () => (
    <Shell role="trader">
      <Support />
    </Shell>
  ),
});

const PRIORITIES = ["low", "normal", "high"] as const;
const NEXT: Record<TicketStatus, TicketStatus> = {
  open: "pending",
  pending: "closed",
  closed: "open",
};

const COPY = {
  en: {
    eyebrow: "Trade Resolution & Operations Desk",
    title: "Support",
    description:
      "Raise an issue with a payment, invoice or verification. Include the payment reference from Send Payment so the team can trace it.",
    bannerPill: "Ledger-Linked Resolution Desk",
    bannerTitle: "Direct Corridor & Settlement Traceability",
    bannerDesc:
      "Every support ticket is protected by an idempotency key so duplicate network clicks never open duplicate cases. Attach your transfer ID, invoice number, or SHA-256 verification digest for direct engine inspection.",
    deskLanguages: "Desk Languages: EN · FR · SW · PT · RW",
    replayProtection: "Idempotent Ticket Replay Protection",
    resolutionQueue: "Resolution Queue",
    activeDesk: "ACTIVE DESK",
    activeOpenCases: "Active open cases",
    awaitingReview: "Awaiting review",
    resolvedClosed: "Resolved & closed",
    metricOpen: "Open tickets",
    metricOpenSub: "Not yet closed",
    metricPending: "Pending review",
    metricPendingSub: "In operator queue",
    metricResolved: "Resolved",
    metricResolvedSub: "Closed cases",
    metricTotal: "Total tickets",
    metricTotalSub: "All time",
    newTicketTitle: "New ticket",
    newTicketSub: "Use a quick template or describe your settlement inquiry",
    quickTemplatesLabel: "Quick Issue Templates",
    subjectLabel: "Subject",
    subjectPlaceholder: "Payout to Nairobi supplier still pending",
    priorityLabel: "Priority",
    detailsLabel: "Details",
    detailsPlaceholder: "Include transfer ID, invoice number, or telecom receipt reference…",
    sendingBtn: "Sending…",
    openTicketBtn: "Open ticket",
    yourTicketsTitle: "Your tickets",
    yourTicketsSub: "Track resolution progress or update ticket status",
    emptyTickets: "No tickets yet.",
    emptyFilter: (f: string) => `No tickets match the "${f}" filter.`,
    openedAt: (d: string) => `opened ${d}`,
    toastOpened: "Ticket opened",
    toastRef: (ref: string) => `Reference ${ref}`,
    toastNotCreated: "Ticket not created",
    toastUpdateFailed: "Could not update ticket",
    priorities: {
      low: "low",
      normal: "normal",
      high: "high",
    } as Record<(typeof PRIORITIES)[number], string>,
    statuses: {
      all: "all",
      open: "open",
      pending: "pending",
      closed: "closed",
    } as Record<"all" | TicketStatus, string>,
    nextLabel: {
      open: "Mark pending",
      pending: "Close",
      closed: "Reopen",
    } as Record<TicketStatus, string>,
    templates: [
      {
        label: "Corridor Payout Delay",
        subject: "Payout to supplier still pending on destination rail",
        priority: "high" as const,
        body: "Transfer ID: \nCorridor: \nRecipient phone: \nObserved state: Collection succeeded, awaiting telecom payout confirmation.",
      },
      {
        label: "Invoice Settlement",
        subject: "Commercial invoice settlement reconciliation",
        priority: "normal" as const,
        body: "Invoice Number: \nTransfer Reference: \nDetails: Please verify ledger link between invoice and transfer.",
      },
      {
        label: "KYC Limit Upgrade",
        subject: "Business verification evidence review request",
        priority: "normal" as const,
        body: "Verification Type: business\nSHA-256 / Registry Reference: \nRequested Tier: BUSINESS_VERIFIED",
      },
      {
        label: "Mobile Money Callback",
        subject: "Mobile money debit reference inquiry",
        priority: "low" as const,
        body: "Provider (MTN / M-Pesa / Airtel): \nExternal Telecom Receipt: \nAmount & Currency: ",
      },
    ],
  },
  fr: {
    eyebrow: "Bureau de résolution commerciale et d'opérations",
    title: "Assistance",
    description:
      "Signalez un problème lié à un paiement, une facture ou une vérification. Indiquez la référence du paiement issue d'Envoyer un paiement afin que l'équipe puisse le tracer.",
    bannerPill: "Bureau de résolution lié au registre",
    bannerTitle: "Traçabilité directe des corridors et des règlements",
    bannerDesc:
      "Chaque ticket d'assistance est protégé par une clé d'idempotence afin que les clics réseau multiples n'ouvrent jamais de dossiers en double. Joignez votre identifiant de transfert, numéro de facture ou empreinte SHA-256 pour une inspection directe.",
    deskLanguages: "Langues du bureau : EN · FR · SW · PT · RW",
    replayProtection: "Protection idempotente contre les doublons",
    resolutionQueue: "File de résolution",
    activeDesk: "BUREAU ACTIF",
    activeOpenCases: "Dossiers ouverts actifs",
    awaitingReview: "En attente d'examen",
    resolvedClosed: "Résolus et clôturés",
    metricOpen: "Tickets ouverts",
    metricOpenSub: "Non encore clôturés",
    metricPending: "En attente d'examen",
    metricPendingSub: "Dans la file opérateur",
    metricResolved: "Résolus",
    metricResolvedSub: "Dossiers clôturés",
    metricTotal: "Total des tickets",
    metricTotalSub: "Depuis le début",
    newTicketTitle: "Nouveau ticket",
    newTicketSub: "Utilisez un modèle rapide ou décrivez votre demande de règlement",
    quickTemplatesLabel: "Modèles rapides de demandes",
    subjectLabel: "Objet",
    subjectPlaceholder: "Paiement au fournisseur de Nairobi toujours en attente",
    priorityLabel: "Priorité",
    detailsLabel: "Détails",
    detailsPlaceholder:
      "Indiquez l'identifiant du transfert, le numéro de facture ou le reçu télécom…",
    sendingBtn: "Envoi…",
    openTicketBtn: "Ouvrir un ticket",
    yourTicketsTitle: "Vos tickets",
    yourTicketsSub: "Suivez l'avancement de la résolution ou mettez à jour le statut",
    emptyTickets: "Aucun ticket pour le moment.",
    emptyFilter: (f: string) => `Aucun ticket ne correspond au filtre « ${f} ».`,
    openedAt: (d: string) => `ouvert le ${d}`,
    toastOpened: "Ticket ouvert",
    toastRef: (ref: string) => `Référence ${ref}`,
    toastNotCreated: "Ticket non créé",
    toastUpdateFailed: "Impossible de mettre à jour le ticket",
    priorities: {
      low: "basse",
      normal: "normale",
      high: "haute",
    },
    statuses: {
      all: "tous",
      open: "ouvert",
      pending: "en attente",
      closed: "fermé",
    },
    nextLabel: {
      open: "Marquer en attente",
      pending: "Clôturer",
      closed: "Rouvrir",
    },
    templates: [
      {
        label: "Retard de paiement corridor",
        subject: "Paiement au fournisseur toujours en attente sur le réseau de destination",
        priority: "high" as const,
        body: "ID de transfert : \nCorridor : \nTéléphone du bénéficiaire : \nÉtat observé : Collecte réussie, en attente de confirmation télécom.",
      },
      {
        label: "Règlement de facture",
        subject: "Rapprochement du règlement d'une facture commerciale",
        priority: "normal" as const,
        body: "Numéro de facture : \nRéférence de transfert : \nDétails : Veuillez vérifier le lien au registre entre la facture et le transfert.",
      },
      {
        label: "Hausse de plafond KYC",
        subject: "Demande d'examen de preuve de vérification d'entreprise",
        priority: "normal" as const,
        body: "Type de vérification : business\nRéférence SHA-256 / Registre : \nNiveau demandé : BUSINESS_VERIFIED",
      },
      {
        label: "Confirmation Mobile Money",
        subject: "Vérification de référence de débit mobile money",
        priority: "low" as const,
        body: "Opérateur (MTN / M-Pesa / Airtel) : \nReçu télécom externe : \nMontant et devise : ",
      },
    ],
  },
  sw: {
    eyebrow: "Dawati la Utatuzi wa Biashara na Uendeshaji",
    title: "Msaada",
    description:
      "Wasilisha tatizo kuhusu malipo, ankara au uthibitisho. Jumuisha kumbukumbu ya malipo kutoka Tuma Malipo ili timu iweze kuifuatilia.",
    bannerPill: "Dawati la Utatuzi Lililounganishwa na Leja",
    bannerTitle: "Ufuatiliaji wa Moja kwa Moja wa Njia na Malipo",
    bannerDesc:
      "Kila tiketi ya msaada inalindwa na ufunguo wa idempotency ili kubofya mara mbili kusifungue kesi mbili. Ambatanisha kitambulisho chako cha uhamisho, nambari ya ankara, au alama ya SHA-256 kwa ukaguzi wa moja kwa moja.",
    deskLanguages: "Lugha za Dawati: EN · FR · SW · PT · RW",
    replayProtection: "Ulinzi Dhidi ya Kurudia Tiketi",
    resolutionQueue: "Foleni ya Utatuzi",
    activeDesk: "DAWATI LIKO WAZI",
    activeOpenCases: "Kesi zilizo wazi",
    awaitingReview: "Zinasubiri ukaguzi",
    resolvedClosed: "Zilizotatuliwa na kufungwa",
    metricOpen: "Tiketi zilizo wazi",
    metricOpenSub: "Bado hazijafungwa",
    metricPending: "Zinasubiri ukaguzi",
    metricPendingSub: "Kwenye foleni ya mwendeshaji",
    metricResolved: "Zilizotatuliwa",
    metricResolvedSub: "Kesi zilizofungwa",
    metricTotal: "Jumla ya tiketi",
    metricTotalSub: "Wakati wote",
    newTicketTitle: "Tiketi mpya",
    newTicketSub: "Tumia kiolezo cha haraka au eleza swali lako la malipo",
    quickTemplatesLabel: "Violezo vya Haraka vya Matatizo",
    subjectLabel: "Kichwa cha habari",
    subjectPlaceholder: "Malipo kwa msambazaji wa Nairobi bado yanasubiri",
    priorityLabel: "Kipaumbele",
    detailsLabel: "Maelezo",
    detailsPlaceholder:
      "Jumuisha kitambulisho cha uhamisho, nambari ya ankara, au risiti ya simu…",
    sendingBtn: "Inatuma…",
    openTicketBtn: "Fungua tiketi",
    yourTicketsTitle: "Tiketi zako",
    yourTicketsSub: "Fuatilia hatua za utatuzi au badilisha hali ya tiketi",
    emptyTickets: "Hakuna tiketi bado.",
    emptyFilter: (f: string) => `Hakuna tiketi zinazolingana na kichujio cha "${f}".`,
    openedAt: (d: string) => `ilifunguliwa ${d}`,
    toastOpened: "Tiketi imefunguliwa",
    toastRef: (ref: string) => `Kumbukumbu ${ref}`,
    toastNotCreated: "Tiketi haikuundwa",
    toastUpdateFailed: "Imeshindwa kusasisha tiketi",
    priorities: {
      low: "chini",
      normal: "kawaida",
      high: "juu",
    },
    statuses: {
      all: "zote",
      open: "wazi",
      pending: "inasubiri",
      closed: "imefungwa",
    },
    nextLabel: {
      open: "Weka inasubiri",
      pending: "Funga",
      closed: "Fungua tena",
    },
    templates: [
      {
        label: "Ucheleweshaji wa Malipo ya Njia",
        subject: "Malipo kwa msambazaji bado yanasubiri kwenye mtandao wa mwisho",
        priority: "high" as const,
        body: "Kitambulisho cha Uhamisho: \nNjia ya Malipo: \nSimu ya Mpokeaji: \nHali iliyoonekana: Makusanyo yamefanikiwa, inasubiri uthibitisho wa malipo ya simu.",
      },
      {
        label: "Usuluhishi wa Ankara",
        subject: "Usuluhishi wa malipo ya ankara ya biashara",
        priority: "normal" as const,
        body: "Nambari ya Ankara: \nKumbukumbu ya Uhamisho: \nMaelezo: Tafadhali thibitisha muunganisho wa leja kati ya ankara na uhamisho.",
      },
      {
        label: "Kuongeza Kikomo cha KYC",
        subject: "Ombi la ukaguzi wa ushahidi wa uthibitisho wa biashara",
        priority: "normal" as const,
        body: "Aina ya Uthibitisho: business\nKumbukumbu ya SHA-256 / Sajili: \nDaraja Linaloombwa: BUSINESS_VERIFIED",
      },
      {
        label: "Uthibitisho wa Mobile Money",
        subject: "Uchunguzi wa kumbukumbu ya makato ya pesa za simu",
        priority: "low" as const,
        body: "Mtoa Huduma (MTN / M-Pesa / Airtel): \nRisiti ya Mtandao wa Simu: \nKiasi na Sarafu: ",
      },
    ],
  },
  pt: {
    eyebrow: "Balcão de Resolução Comercial e Operações",
    title: "Apoio",
    description:
      "Comunique um problema com um pagamento, fatura ou verificação. Inclua a referência do pagamento de Enviar Pagamento para que a equipa o possa rastrear.",
    bannerPill: "Balcão de Resolução Ligado ao Razão",
    bannerTitle: "Rastreabilidade Direta de Corredores e Liquidações",
    bannerDesc:
      "Cada pedido de apoio é protegido por uma chave de idempotência para que cliques duplicados nunca abram processos repetidos. Anexe o ID da transferência, número da fatura ou resumo SHA-256 para inspeção direta.",
    deskLanguages: "Idiomas do Balcão: EN · FR · SW · PT · RW",
    replayProtection: "Proteção Idempotente Contra Duplicados",
    resolutionQueue: "Fila de Resolução",
    activeDesk: "BALCÃO ATIVO",
    activeOpenCases: "Casos abertos ativos",
    awaitingReview: "A aguardar revisão",
    resolvedClosed: "Resolvidos e encerrados",
    metricOpen: "Pedidos abertos",
    metricOpenSub: "Ainda não encerrados",
    metricPending: "A aguardar revisão",
    metricPendingSub: "Na fila do operador",
    metricResolved: "Resolvidos",
    metricResolvedSub: "Casos encerrados",
    metricTotal: "Total de pedidos",
    metricTotalSub: "Desde sempre",
    newTicketTitle: "Novo pedido",
    newTicketSub: "Utilize um modelo rápido ou descreva a sua questão de liquidação",
    quickTemplatesLabel: "Modelos Rápidos de Ocorrências",
    subjectLabel: "Assunto",
    subjectPlaceholder: "Pagamento ao fornecedor de Nairobi ainda pendente",
    priorityLabel: "Prioridade",
    detailsLabel: "Detalhes",
    detailsPlaceholder:
      "Inclua o ID da transferência, número da fatura ou referência do recibo telecom…",
    sendingBtn: "A enviar…",
    openTicketBtn: "Abrir pedido",
    yourTicketsTitle: "Os seus pedidos",
    yourTicketsSub: "Acompanhe o progresso da resolução ou atualize o estado do pedido",
    emptyTickets: "Ainda sem pedidos.",
    emptyFilter: (f: string) => `Nenhum pedido corresponde ao filtro "${f}".`,
    openedAt: (d: string) => `aberto em ${d}`,
    toastOpened: "Pedido aberto",
    toastRef: (ref: string) => `Referência ${ref}`,
    toastNotCreated: "Pedido não criado",
    toastUpdateFailed: "Não foi possível atualizar o pedido",
    priorities: {
      low: "baixa",
      normal: "normal",
      high: "alta",
    },
    statuses: {
      all: "todos",
      open: "aberto",
      pending: "pendente",
      closed: "fechado",
    },
    nextLabel: {
      open: "Marcar pendente",
      pending: "Fechar",
      closed: "Reabrir",
    },
    templates: [
      {
        label: "Atraso no Pagamento do Corredor",
        subject: "Pagamento ao fornecedor ainda pendente na rede de destino",
        priority: "high" as const,
        body: "ID da Transferência: \nCorredor: \nTelefone do Destinatário: \nEstado observado: Cobrança concluída, a aguardar confirmação de pagamento telecom.",
      },
      {
        label: "Liquidação de Fatura",
        subject: "Reconciliação de liquidação de fatura comercial",
        priority: "normal" as const,
        body: "Número da Fatura: \nReferência da Transferência: \nDetalhes: Por favor verifique a ligação no razão entre a fatura e a transferência.",
      },
      {
        label: "Aumento de Limite KYC",
        subject: "Pedido de revisão de comprovativo de verificação empresarial",
        priority: "normal" as const,
        body: "Tipo de Verificação: business\nReferência SHA-256 / Registo: \nNível Solicitado: BUSINESS_VERIFIED",
      },
      {
        label: "Confirmação Mobile Money",
        subject: "Consulta de referência de débito mobile money",
        priority: "low" as const,
        body: "Operador (MTN / M-Pesa / Airtel): \nRecibo Telecom Externo: \nMontante e Moeda: ",
      },
    ],
  },
  rw: {
    eyebrow: "Ibiro by'Ubufasha noukemura Ibibazo by'Ubucuruzi",
    title: "Ubufasha",
    description:
      "Menyesha ikibazo kijyanye n'ubwishyu, inyemezabuguzi cyangwa igenzura. Shyiramo nimero ndanga y'ubwishyu ivuye muri Ohereza Amafaranga kugira ngo ikipe ibikurikirane.",
    bannerPill: "Ibiro by'Ubufasha Buhujwe n'Igitabo cy'Imari",
    bannerTitle: "Gukurikirana mu Buryo Butaziguye Inzira n'Ubwishyu",
    bannerDesc:
      "Buri tike y'ubufasha irinzwe n'urufunguzo rw'idempotency kugira ngo gukanda kabiri bitazigera bifungura dosiye ebyiri. Shyiraho nimero y'ihererekanya, nimero y'inyemezabuguzi, cyangwa ikimenyetso cya SHA-256 kugira ngo bisuzumwe ako kanya.",
    deskLanguages: "Indimi zikoreshwa: EN · FR · SW · PT · RW",
    replayProtection: "Uburinzi bwo Kudafungura Tike Ebyiri",
    resolutionQueue: "Urutonde rw'Ibikemurwa",
    activeDesk: "IBIRO BIRAKORA",
    activeOpenCases: "Dosiye zifunguye ubu",
    awaitingReview: "Bitegereje gusuzumwa",
    resolvedClosed: "Byakemuwe & byafunzwe",
    metricOpen: "Tike zifunguye",
    metricOpenSub: "Ntabwo zirafungwa",
    metricPending: "Bitegereje isuzuma",
    metricPendingSub: "Ku rutonde rw'abakozi",
    metricResolved: "Byakemuwe",
    metricResolvedSub: "Dosiye zafunzwe",
    metricTotal: "Tike zose",
    metricTotalSub: "Igihe cyose",
    newTicketTitle: "Tike nshya",
    newTicketSub: "Koresha urugero rwihuse cyangwa usobanure ikibazo cyawe cy'ubwishyu",
    quickTemplatesLabel: "Ingero Zihuse z'Ibibazo",
    subjectLabel: "Umutwe w'ikibazo",
    subjectPlaceholder: "Ubwishyu bw'ugemura i Nairobi buracyategereje",
    priorityLabel: "Uburemere",
    detailsLabel: "Ibisobanuro",
    detailsPlaceholder:
      "Shyiramo nimero y'ihererekanya, nimero y'inyemezabuguzi, cyangwa inyemezabwishyu ya telefone…",
    sendingBtn: "Birimo koherezwa…",
    openTicketBtn: "Fungura tike",
    yourTicketsTitle: "Tike zawe",
    yourTicketsSub: "Kurikirana aho gukemura ikibazo bigeze cyangwa uhindure imiterere ya tike",
    emptyTickets: "Nta tike iraboneka.",
    emptyFilter: (f: string) => `Nta tike ijyanye n'akayunguruzo ka "${f}".`,
    openedAt: (d: string) => `yafunguwe ${d}`,
    toastOpened: "Tike yafunguwe",
    toastRef: (ref: string) => `Indango ${ref}`,
    toastNotCreated: "Tike ntiyashoboye gufungurwa",
    toastUpdateFailed: "Ntibyashobotse kuvugurura tike",
    priorities: {
      low: "gito",
      normal: "gisanzwe",
      high: "gihanitse",
    },
    statuses: {
      all: "zose",
      open: "ifunguye",
      pending: "itegereje",
      closed: "ifunze",
    },
    nextLabel: {
      open: "Shyira mu bitegereje",
      pending: "Funga",
      closed: "Ongera ufungure",
    },
    templates: [
      {
        label: "Gutinda k'Ubwishyu mu Nzira",
        subject: "Ubwishyu bw'ugemura buracyategereje ku muyoboro wo kwakira",
        priority: "high" as const,
        body: "Nimero y'Ihererekanya: \nInzira: \nTelefone y'Uwakira: \n uko bimeze: Kwakira amafaranga byagenze neza, hategerejwe kwemezwa na sosiyete y'itumanaho.",
      },
      {
        label: "Ubwishyu bw'Inyemezabuguzi",
        subject: "Kuringaniza ubwishyu bw'inyemezabuguzi y'ubucuruzi",
        priority: "normal" as const,
        body: "Nimero y'Inyemezabuguzi: \nIndango y'Ihererekanya: \nIbisobanuro: Nyamuneka genzura ihuriro ry'igitabo hagati y'inyemezabuguzi n'ihererekanya.",
      },
      {
        label: "Kongera Imbibi za KYC",
        subject: "Gusaba isuzuma ry'ibimenyetso by'igenzura ry'ubucuruzi",
        priority: "normal" as const,
        body: "Ubwoko bw'Igenzura: business\nIndango ya SHA-256 / Urwandiko: \nUrwego Rusabwa: BUSINESS_VERIFIED",
      },
      {
        label: " Kwemeza Mobile Money",
        subject: "Gukurikirana indango yo gukuraho amafaranga kuri mobile money",
        priority: "low" as const,
        body: "Umuyoboro (MTN / M-Pesa / Airtel): \nInyemezabwishyu y'Itumanaho: \nUmubare n'Ifaranga: ",
      },
    ],
  },
} as const;

function Support() {
  const c = useLangCopy(COPY);
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => support.tickets() });
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  // Stable per draft: a double-submit returns the same ticket (engine replays by key).
  const keyRef = useRef(newIdempotencyKey());

  const create = useMutation({
    mutationFn: () =>
      support.createTicket(
        { subject: subject.trim(), description: description.trim(), priority },
        keyRef.current,
      ),
    onSuccess: ({ ticket }) => {
      toast.success(c.toastOpened, { description: c.toastRef(shortId(ticket.id, 12)) });
      setSubject("");
      setDescription("");
      keyRef.current = newIdempotencyKey();
      void qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e) => toast.error(c.toastNotCreated, { description: describeError(e) }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      support.setStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tickets"] }),
    onError: (e) => toast.error(c.toastUpdateFailed, { description: describeError(e) }),
  });

  const allTickets = tickets.data ?? [];
  const open = allTickets.filter((t) => t.status !== "closed").length;
  const pendingCount = allTickets.filter((t) => t.status === "pending").length;
  const closedCount = allTickets.filter((t) => t.status === "closed").length;

  return (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
      />

      {/* Executive Multilingual Trade Support Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/4 size-72 rounded-full bg-[#c2f74d]/10 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Headphones className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerPill}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {c.bannerTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <Globe2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                {c.deskLanguages}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                {c.replayProtection}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                {c.resolutionQueue}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c2f74d]">
                <LifeBuoy className="size-3" aria-hidden="true" />
                {c.activeDesk}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-white/50">{c.activeOpenCases}</dt>
                <dd className="font-bold text-white">{open}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">{c.awaitingReview}</dt>
                <dd className="text-[#c2f74d]">{pendingCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">{c.resolvedClosed}</dt>
                <dd className="text-white">{closedCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={c.metricOpen} value={open} sub={c.metricOpenSub} accent="lime" />
        <Metric label={c.metricPending} value={pendingCount} sub={c.metricPendingSub} />
        <Metric label={c.metricResolved} value={closedCount} sub={c.metricResolvedSub} />
        <Metric label={c.metricTotal} value={tickets.data?.length ?? "—"} sub={c.metricTotalSub} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <Panel
          title={c.newTicketTitle}
          subtitle={c.newTicketSub}
          meta={<MessageSquarePlus className="size-4 text-[#79b200]" aria-hidden="true" />}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles className="size-3 text-[#79b200]" aria-hidden="true" />
                {c.quickTemplatesLabel}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setSubject(tpl.subject);
                      setPriority(tpl.priority);
                      setDescription(tpl.body);
                    }}
                    className="rounded-md border border-border bg-muted/25 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50 hover:text-foreground"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ticket-subject"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                {c.subjectLabel}
              </Label>
              <Input
                id="ticket-subject"
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-lg"
                placeholder={c.subjectPlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{c.priorityLabel}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger aria-label={c.priorityLabel} className="rounded-lg font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {c.priorities[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ticket-details"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                {c.detailsLabel}
              </Label>
              <Textarea
                id="ticket-details"
                value={description}
                maxLength={10000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={c.detailsPlaceholder}
                className="min-h-32 rounded-lg text-xs"
              />
            </div>

            <Button
              className="w-full rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!subject.trim() || !description.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? c.sendingBtn : c.openTicketBtn}
            </Button>
          </div>
        </Panel>

        <Panel
          title={c.yourTicketsTitle}
          subtitle={c.yourTicketsSub}
          meta={
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
              {(["all", "open", "pending", "closed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={
                    filter === tab
                      ? "rounded-md bg-[#151515] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#c2f74d]"
                      : "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground"
                  }
                >
                  {c.statuses[tab]}
                </button>
              ))}
            </div>
          }
        >
          <QueryBoundary
            query={tickets}
            isEmpty={(d) => d.length === 0}
            empty={c.emptyTickets}
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => {
              const filtered =
                filter === "all" ? rows : rows.filter((t) => t.status === filter);
              return filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  {c.emptyFilter(c.statuses[filter])}
                </p>
              ) : (
                <ul className="space-y-3">
                  {filtered.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-border/80 bg-muted/15 p-4 transition-colors hover:border-foreground/25"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {t.subject}
                            </span>
                            <span
                              className={
                                t.priority === "high"
                                  ? "rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-800"
                                  : "rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                              }
                            >
                              {c.priorities[t.priority as (typeof PRIORITIES)[number]] ?? t.priority}
                            </span>
                          </div>
                          <p className="mt-1.5 whitespace-pre-line line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {t.description}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground">
                              {shortId(t.id, 12)}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden="true" />
                              {c.openedAt(when(t.created_at))}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            tone={
                              t.status === "closed"
                                ? "invert"
                                : t.status === "pending"
                                  ? "live"
                                  : "warn"
                            }
                          >
                            {t.status === "closed" ? (
                              <CheckCircle2 className="mr-1 inline size-3" aria-hidden="true" />
                            ) : null}
                            {c.statuses[t.status] ?? t.status}
                          </Chip>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md font-mono text-[10px] uppercase"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: t.id, status: NEXT[t.status] })}
                          >
                            {c.nextLabel[t.status]}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            }}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
