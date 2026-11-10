import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Copy,
  FileCode2,
  Globe2,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
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
import { DataTable } from "@/components/vuka/data-table";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { ErrorState, Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { corridors as corridorApi } from "@/lib/api/endpoints";
import type { Corridor } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, truncMid, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { buildPacs008, structuralCheck } from "@/lib/pacs008";
import { useSession, useTrader } from "@/lib/session";
import { useTransfers, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/corridors")({
  head: () => ({
    meta: [
      { title: "Corridors — VUKA" },
      {
        name: "description",
        content: "Corridor pricing, limits, provider health and ISO 20022 message rendering.",
      },
    ],
  }),
  component: CorridorsPage,
});

function CorridorsPage() {
  return (
    <Shell>
      <Switch />
    </Shell>
  );
}

function Switch() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorProviders /> : <TraderCorridors />;
}

const QUOTE_PRESETS = ["25000", "100000", "500000", "1000000"] as const;

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    sendOnCorridor: string;
    emptyCorridors: string;
    bannerBadge: string;
    bannerTitle: (count: number) => string;
    bannerDesc: string;
    selectedCorridor: string;
    indicativeFx: string;
    corridorFee: string;
    payoutAdapter: string;
    metricCorridors: string;
    metricCorridorsSub: string;
    metricEnabled: string;
    metricEnabledSub: string;
    metricHalted: string;
    metricHaltedSub: string;
    calculatorTitle: string;
    calculatorSubtitle: string;
    sendAmountLabel: (curr: string) => string;
    minMaxLabel: string;
    payoutRailLabel: string;
    enterAmountHint: string;
    fetchingQuote: string;
    firmQuoteTitle: string;
    rateLabel: string;
    ledgerRateLabel: string;
    feeLabel: string;
    beneficiaryReceives: string;
    quoteExpires: (id: string, exp: string) => string;
    destinationChartTitle: string;
    destinationChartSubtitle: string;
    corridorsLabel: string;
    rateCardTitle: string;
    rateCardSubtitle: string;
    liveFromEngine: string;
    colCorridor: string;
    colIndicativeRate: string;
    colFee: string;
    colMinMax: string;
    colPayoutRail: string;
    colState: string;
    pricingTitle: string;
    pricingSubtitle: string;
    pricingDesc: string;
    pricingStep1: string;
    pricingStep2: string;
    pricingStep3: string;
    feeTiersLabel: string;
    feeTierCorridors: (n: number, isRegional: boolean) => string;
    isoTitle: string;
    isoSubtitle: string;
    structureOk: string;
    problemsCount: (n: number) => string;
    copyXml: string;
    checkStructure: string;
    completePaymentHint: string;
    transferLabel: string;
    isoExplanation: string;
    opEyebrow: string;
    opTitle: string;
    opDesc: string;
    noProvidersRegistered: string;
    opBannerBadge: string;
    opBannerTitle: (healthy: number, total: number) => string;
    opBannerDesc: string;
    killSwitchGuard: string;
    allRailsArmed: string;
    railsHalted: (n: number) => string;
    metricProviders: string;
    metricProvidersSub: string;
    metricHealthy: string;
    metricHealthySub: string;
    metricKillSwitchSub: string;
    metricExternalCalls: string;
    metricExternalCallsSub: string;
    providerRegistry: string;
    providerRegistrySub: string;
    colProvider: string;
    colEnvironment: string;
    colCountries: string;
    colCurrencies: string;
    colChecked: string;
    colHealth: string;
    providersByReadiness: string;
    readinessSubtitle: string;
    providerRecon: string;
    providerReconSubtitle: string;
    noRecon: string;
    openReconItems: (open: number, whenStr: string) => string;
    webhookEvidence: string;
    webhookEvidenceSubtitle: string;
    noCallbacks: string;
  }
> = {
  en: {
    eyebrow: "Cross-Border FX & Settlement Mesh",
    title: "Corridors",
    description:
      "Live corridor pricing and limits from the engine, a firm quote calculator, and an ISO 20022 rendering of your own transfers.",
    sendOnCorridor: "Send on Corridor",
    emptyCorridors: "No corridors are configured.",
    bannerBadge: "Deterministic FX & Telecom Rail Routing",
    bannerTitle: (count) => `${count} Live Intra-African Settlement Corridors`,
    bannerDesc:
      "Click any corridor row in the rate card below to inspect live engine liquidity, lock a firm quote in minor units, or verify ISO 20022 pacs.008.001.08 settlement payloads.",
    selectedCorridor: "Selected Corridor",
    indicativeFx: "Indicative FX",
    corridorFee: "Corridor Fee",
    payoutAdapter: "Payout Adapter",
    metricCorridors: "Corridors",
    metricCorridorsSub: "Configured on this engine",
    metricEnabled: "Enabled",
    metricEnabledSub: "Accepting quotes",
    metricHalted: "Halted",
    metricHaltedSub: "Kill switch active",
    calculatorTitle: "Quote calculator",
    calculatorSubtitle: "Simulate a deterministic firm quote with live corridor fee and FX lock",
    sendAmountLabel: (c) => `Send amount (${c})`,
    minMaxLabel: "Corridor Min / Max",
    payoutRailLabel: "Payout Rail",
    enterAmountHint: "Enter an amount for a firm quote.",
    fetchingQuote: "Fetching quote",
    firmQuoteTitle: "Firm Engine Quote",
    rateLabel: "Rate",
    ledgerRateLabel: "Ledger rate",
    feeLabel: "Fee",
    beneficiaryReceives: "Beneficiary receives",
    quoteExpires: (id, exp) => `Quote ${id} · expires ${exp}`,
    destinationChartTitle: "Corridors by destination currency",
    destinationChartSubtitle:
      "Settlement endpoint distribution across supported regional currencies",
    corridorsLabel: "Corridors",
    rateCardTitle: "Corridor rate card",
    rateCardSubtitle: "Click any row to load its parameters into the live quote calculator",
    liveFromEngine: "Live from engine",
    colCorridor: "Corridor",
    colIndicativeRate: "Indicative rate",
    colFee: "Fee",
    colMinMax: "Min / max",
    colPayoutRail: "Payout rail",
    colState: "State",
    pricingTitle: "How pricing works",
    pricingSubtitle:
      "Deterministic fee tiers and atomic quote locking across African regional blocs",
    pricingDesc:
      "Every corridor is priced from a transparent fee tier plus the indicative FX rate. A firm quote locks the rate, fee and delivered amount for its validity window, so what you confirm is what settles.",
    pricingStep1:
      "Choose the corridor and amount — the quote shows fee, rate and the amount delivered.",
    pricingStep2:
      "Confirm — the quote id is bound to the payment; a changed market cannot alter it.",
    pricingStep3:
      "Collect and pay out — your mobile-money wallet is charged, the recipient is paid on their local rail.",
    feeTiersLabel: "Fee tiers",
    feeTierCorridors: (n, reg) =>
      `${n} corridors · ${reg ? "within a regional economic community" : "across regions"}`,
    isoTitle: "ISO 20022 pacs.008 message",
    isoSubtitle:
      "Standards-compliant FIToFICustomerCreditTransferV08 payload rendered from your settled ledger entries",
    structureOk: "Structure OK",
    problemsCount: (n) => `${n} problem(s)`,
    copyXml: "Copy XML",
    checkStructure: "Check structure",
    completePaymentHint:
      "Complete a payment to render it as a standards-based credit-transfer message.",
    transferLabel: "Transfer",
    isoExplanation:
      "Rendered in your browser from the ledger transfer. The check above confirms well-formedness and mandatory elements only; full schema validation is performed by the ISO 20022 gateway service.",
    opEyebrow: "Network operations",
    opTitle: "Corridors & Providers",
    opDesc:
      "Telecom provider readiness and kill switches, authenticated webhook evidence, and per-corridor provider reconciliation. Callbacks are evidence only and never mutate ledger entries.",
    noProvidersRegistered: "No providers registered.",
    opBannerBadge: "Telecom Adapter & Webhook NOC",
    opBannerTitle: (h, tot) => `${h} of ${tot} Payment Rail Adapters Healthy`,
    opBannerDesc:
      "Provider webhooks are cryptographically authenticated and recorded as append-only evidence. Ledger settlement mutations occur strictly inside serialized engine transactions.",
    killSwitchGuard: "Kill Switch Guard",
    allRailsArmed: "All Rails Armed",
    railsHalted: (n) => `${n} Rail(s) Halted`,
    metricProviders: "Providers",
    metricProvidersSub: "Registered adapters",
    metricHealthy: "Healthy",
    metricHealthySub: "Passing readiness checks",
    metricKillSwitchSub: "Providers halted",
    metricExternalCalls: "External calls",
    metricExternalCallsSub: "Live provider traffic",
    providerRegistry: "Provider registry",
    providerRegistrySub:
      "Adapter environment, supported country markets, and live readiness status",
    colProvider: "Provider",
    colEnvironment: "Environment",
    colCountries: "Countries",
    colCurrencies: "Currencies",
    colChecked: "Checked",
    colHealth: "Health",
    providersByReadiness: "Providers by readiness",
    readinessSubtitle: "Adapter health distribution across registered telecom rails",
    providerRecon: "Provider reconciliation",
    providerReconSubtitle: "Per-corridor settlement vs provider callback matching state",
    noRecon: "No reconciliation records yet.",
    openReconItems: (open, w) => `${open} open · last event ${w}`,
    webhookEvidence: "Webhook evidence",
    webhookEvidenceSubtitle:
      "Authenticated provider callbacks logged for audit and reconciliation",
    noCallbacks: "No provider callbacks received.",
  },
  fr: {
    eyebrow: "Réseau de Change & Règlement Transfrontalier",
    title: "Corridors",
    description:
      "Tarification et plafonds en temps réel du moteur, calculateur de devis ferme et rendu ISO 20022 de vos propres transferts.",
    sendOnCorridor: "Envoyer sur le Corridor",
    emptyCorridors: "Aucun corridor n'est configuré.",
    bannerBadge: "Routage FX Déterministe & Rails Télécom",
    bannerTitle: (count) => `${count} Corridors Actifs de Règlement Intra-Africain`,
    bannerDesc:
      "Cliquez sur une ligne du barème pour vérifier la liquidité en direct, verrouiller un devis ferme en unités mineures ou valider les messages de règlement ISO 20022 pacs.008.",
    selectedCorridor: "Corridor Sélectionné",
    indicativeFx: "Taux Indicatif",
    corridorFee: "Frais de Corridor",
    payoutAdapter: "Adaptateur de Versement",
    metricCorridors: "Corridors",
    metricCorridorsSub: "Configurés sur ce moteur",
    metricEnabled: "Actifs",
    metricEnabledSub: "Acceptent les devis",
    metricHalted: "Arrêtés",
    metricHaltedSub: "Arrêt d'urgence actif",
    calculatorTitle: "Calculateur de devis",
    calculatorSubtitle: "Simulez un devis ferme avec verrouillage des frais et du taux de change",
    sendAmountLabel: (c) => `Montant envoyé (${c})`,
    minMaxLabel: "Min / Max Corridor",
    payoutRailLabel: "Rail de versement",
    enterAmountHint: "Saisissez un montant pour obtenir un devis ferme.",
    fetchingQuote: "Récupération du devis",
    firmQuoteTitle: "Devis Ferme du Moteur",
    rateLabel: "Taux",
    ledgerRateLabel: "Taux du grand livre",
    feeLabel: "Frais",
    beneficiaryReceives: "Le bénéficiaire reçoit",
    quoteExpires: (id, exp) => `Devis ${id} · expire ${exp}`,
    destinationChartTitle: "Corridors par devise de destination",
    destinationChartSubtitle:
      "Distribution des points de règlement sur les devises régionales supportées",
    corridorsLabel: "Corridors",
    rateCardTitle: "Barème des corridors",
    rateCardSubtitle: "Cliquez sur une ligne pour charger ses paramètres dans le calculateur",
    liveFromEngine: "En direct du moteur",
    colCorridor: "Corridor",
    colIndicativeRate: "Taux indicatif",
    colFee: "Frais",
    colMinMax: "Min / max",
    colPayoutRail: "Rail de versement",
    colState: "État",
    pricingTitle: "Fonctionnement des tarifs",
    pricingSubtitle:
      "Paliers tarifaires déterministes et verrouillage de devis à travers les blocs régionaux",
    pricingDesc:
      "Chaque corridor est tarifé à partir d'un palier transparent majoré du taux indicatif. Un devis ferme verrouille le taux, les frais et le montant pendant sa validité.",
    pricingStep1:
      "Sélectionnez le corridor et le montant — le devis indique le taux, les frais et le montant livré.",
    pricingStep2:
      "Confirmez — l'identifiant du devis est lié au paiement ; les fluctuations du marché ne l'affectent plus.",
    pricingStep3:
      "Collecte et versement — votre compte mobile-money est débité, le destinataire est crédité sur son rail local.",
    feeTiersLabel: "Paliers tarifaires",
    feeTierCorridors: (n, reg) =>
      `${n} corridors · ${reg ? "au sein d'une communauté régionale" : "entre régions"}`,
    isoTitle: "Message ISO 20022 pacs.008",
    isoSubtitle:
      "Charge utile normalisée FIToFICustomerCreditTransferV08 générée depuis vos écritures du grand livre",
    structureOk: "Structure Valide",
    problemsCount: (n) => `${n} anomalie(s)`,
    copyXml: "Copier le XML",
    checkStructure: "Vérifier la structure",
    completePaymentHint:
      "Effectuez un paiement pour le restituer sous forme de message standard de virement.",
    transferLabel: "Transfert",
    isoExplanation:
      "Généré dans votre navigateur depuis le grand livre. Le contrôle ci-dessus confirme la syntaxe et les champs obligatoires ; la validation complète est assurée par la passerelle ISO 20022.",
    opEyebrow: "Opérations réseau",
    opTitle: "Corridors & Opérateurs",
    opDesc:
      "Disponibilité des opérateurs télécom, coupe-circuits, preuves webhook authentifiées et réconciliation. Les rappels sont de simples preuves et ne modifient jamais le grand livre.",
    noProvidersRegistered: "Aucun opérateur enregistré.",
    opBannerBadge: "NOC Adaptateurs Télécom & Webhooks",
    opBannerTitle: (h, tot) => `${h} sur ${tot} Adaptateurs Réseau Opérationnels`,
    opBannerDesc:
      "Les webhooks des opérateurs sont authentifiés par signature cryptographique et archivés comme preuves immuables.",
    killSwitchGuard: "Garde Coupe-Circuit",
    allRailsArmed: "Tous les Rails Armés",
    railsHalted: (n) => `${n} Rail(s) Arrêté(s)`,
    metricProviders: "Opérateurs",
    metricProvidersSub: "Adaptateurs enregistrés",
    metricHealthy: "Opérationnels",
    metricHealthySub: "Réussissent les contrôles",
    metricKillSwitchSub: "Opérateurs suspendus",
    metricExternalCalls: "Appels externes",
    metricExternalCallsSub: "Trafic opérateur réel",
    providerRegistry: "Registre des opérateurs",
    providerRegistrySub:
      "Environnement d'adaptateur, pays supportés et état de disponibilité en direct",
    colProvider: "Opérateur",
    colEnvironment: "Environnement",
    colCountries: "Pays",
    colCurrencies: "Devises",
    colChecked: "Vérifié",
    colHealth: "Santé",
    providersByReadiness: "Opérateurs par disponibilité",
    readinessSubtitle: "Distribution de l'état des rails télécom enregistrés",
    providerRecon: "Rapprochement des opérateurs",
    providerReconSubtitle: "État d'appariement des règlements de corridor et rappels opérateurs",
    noRecon: "Aucun enregistrement de rapprochement pour le moment.",
    openReconItems: (open, w) => `${open} en suspens · dernier événement ${w}`,
    webhookEvidence: "Preuves Webhook",
    webhookEvidenceSubtitle:
      "Rappels d'opérateurs authentifiés consignés pour audit et réconciliation",
    noCallbacks: "Aucun rappel d'opérateur reçu.",
  },
  sw: {
    eyebrow: "Mtandao wa Kubadilisha Sarafu na Malipo ya Mpakani",
    title: "Njia za Malipo (Corridors)",
    description:
      "Bei za moja kwa moja na mipaka kutoka kwa mfumo, kikokotoo cha bei halisi, na ujumbe wa ISO 20022 wa miamala yako.",
    sendOnCorridor: "Tuma Kupitia Njia Hii",
    emptyCorridors: "Hakuna njia zilizosanidiwa.",
    bannerBadge: "Uelekezaji wa Sarafu na Mitandao ya Simu",
    bannerTitle: (count) => `Njia ${count} za Malipo za Moja kwa Moja Barani Afrika`,
    bannerDesc:
      "Bofya njia yoyote kwenye jedwali lililo hapa chini ili kukagua ukwasi, kufunga bei halisi, au kuthibitisha ujumbe wa ISO 20022 pacs.008.",
    selectedCorridor: "Njia Iliyochaguliwa",
    indicativeFx: "Kiwango cha Sarafu",
    corridorFee: "Ada ya Njia",
    payoutAdapter: "Kifaa cha Kulipia",
    metricCorridors: "Njia",
    metricCorridorsSub: "Zilizowekwa kwenye mfumo",
    metricEnabled: "Zinazofanya kazi",
    metricEnabledSub: "Zinazopokea bei",
    metricHalted: "Zilizositishwa",
    metricHaltedSub: "Kitufe cha dharura kiko wazi",
    calculatorTitle: "Kikokotoo cha bei",
    calculatorSubtitle: "Piga hesabu ya bei thabiti na ada ya moja kwa moja",
    sendAmountLabel: (c) => `Kiasi cha kutuma (${c})`,
    minMaxLabel: "Kiwango cha Chini / Juu",
    payoutRailLabel: "Njia ya Malipo",
    enterAmountHint: "Weka kiasi ili kupata bei thabiti.",
    fetchingQuote: "Inaleta bei…",
    firmQuoteTitle: "Bei Thabiti ya Mfumo",
    rateLabel: "Kiwango",
    ledgerRateLabel: "Kiwango cha leja",
    feeLabel: "Ada",
    beneficiaryReceives: "Mpokeaji anapokea",
    quoteExpires: (id, exp) => `Nukuu ${id} · inakwisha ${exp}`,
    destinationChartTitle: "Njia kulingana na sarafu lengwa",
    destinationChartSubtitle: "Mgawanyo wa sarafu za kikanda zinazoungwa mkono",
    corridorsLabel: "Njia",
    rateCardTitle: "Orodha ya viwango vya njia",
    rateCardSubtitle: "Bofya safu yoyote kupakia vigezo vyake kwenye kikokotoo",
    liveFromEngine: "Moja kwa moja kutoka kwa mfumo",
    colCorridor: "Njia",
    colIndicativeRate: "Kiwango cha makadirio",
    colFee: "Ada",
    colMinMax: "Chini / Juu",
    colPayoutRail: "Njia ya malipo",
    colState: "Hali",
    pricingTitle: "Jinsi bei inavyofanya kazi",
    pricingSubtitle: "Viwango vya wazi vya ada na bei thabiti kote barani Afrika",
    pricingDesc:
      "Kila njia hupangiwa bei kwa viwango vilivyo wazi pamoja na kiwango cha ubadilishaji wa sarafu. Bei thabiti inakuhakikishia kile ulichoona ndicho kinacholipwa.",
    pricingStep1:
      "Chagua njia na kiasi — bei inaonyesha ada, kiwango cha sarafu na kiasi kitakachofika.",
    pricingStep2:
      "Thibitisha — nambari ya bei inafungwa kwenye malipo; mabadiliko ya soko hayataibadilisha.",
    pricingStep3:
      "Kusanya na kulipa — pochi yako ya pesa kwa simu inatozwa, mpokeaji analipwa kwenye mtandao wake wa ndani.",
    feeTiersLabel: "Ngazi za ada",
    feeTierCorridors: (n, reg) =>
      `Njia ${n} · ${reg ? "ndani ya jumuiya ya kiuchumi ya kikanda" : "kati ya kanda tofauti"}`,
    isoTitle: "Ujumbe wa ISO 20022 pacs.008",
    isoSubtitle:
      "Ujumbe rasmi wa FIToFICustomerCreditTransferV08 unaotolewa kutoka kwenye rekodi za leja yako",
    structureOk: "Muundo ni Sahihi",
    problemsCount: (n) => `Matatizo ${n}`,
    copyXml: "Nakili XML",
    checkStructure: "Kagua muundo",
    completePaymentHint:
      "Kamilisha malipo ili uweze kuyatoa kama ujumbe rasmi wa uhamisho wa fedha.",
    transferLabel: "Uhamisho",
    isoExplanation:
      "Imetengenezwa moja kwa moja kwenye kivinjari chako kutoka kwenye leja. Ukaguzi unathibitisha muundo na vipengele vya lazima pekee.",
    opEyebrow: "Uendeshaji wa mtandao",
    opTitle: "Njia na Watoa Huduma",
    opDesc:
      "Utayari wa watoa huduma wa simu na vitufe vya dharura, ushahidi wa webhook, na upatanisho wa njia. Taarifa hizi hazibadilishi rekodi za leja.",
    noProvidersRegistered: "Hakuna watoa huduma waliosajiliwa.",
    opBannerBadge: "Kituo cha Uendeshaji wa Mitandao na Webhook",
    opBannerTitle: (h, tot) => `Watoa Huduma ${h} kati ya ${tot} Wako Tayari`,
    opBannerDesc:
      "Webhook za watoa huduma zinathibitishwa kidijitali na kurekodiwa kama ushahidi wa kudumu.",
    killSwitchGuard: "Ulinzi wa Kitufe cha Dharura",
    allRailsArmed: "Mitandao Yote Iko Tayari",
    railsHalted: (n) => `Njia ${n} Zimesitishwa`,
    metricProviders: "Watoa Huduma",
    metricProvidersSub: "Waliounganishwa",
    metricHealthy: "Wazima",
    metricHealthySub: "Wanaofaulu ukaguzi",
    metricKillSwitchSub: "Watoa huduma waliositishwa",
    metricExternalCalls: "Miamala ya nje",
    metricExternalCallsSub: "Trafiki halisi ya watoa huduma",
    providerRegistry: "Orodha ya watoa huduma",
    providerRegistrySub: "Mazingira, nchi zinazoungwa mkono na hali ya utayari",
    colProvider: "Mtoa huduma",
    colEnvironment: "Mazingira",
    colCountries: "Nchi",
    colCurrencies: "Sarafu",
    colChecked: "Ilikaguliwa",
    colHealth: "Afya",
    providersByReadiness: "Watoa huduma kwa utayari",
    readinessSubtitle: "Mgawanyo wa afya ya mifumo ya mawasiliano ya simu",
    providerRecon: "Upatanisho wa watoa huduma",
    providerReconSubtitle: "Hali ya kulinganisha malipo na ripoti za watoa huduma",
    noRecon: "Bado hakuna rekodi za upatanisho.",
    openReconItems: (open, w) => `${open} wazi · tukio la mwisho ${w}`,
    webhookEvidence: "Ushahidi wa Webhook",
    webhookEvidenceSubtitle: "Taarifa zilizothibitishwa za watoa huduma zilizohifadhiwa kwa ukaguzi",
    noCallbacks: "Hakuna taarifa za watoa huduma zilizopokelewa.",
  },
  pt: {
    eyebrow: "Malha de Câmbio & Liquidação Transfronteiriça",
    title: "Corredores",
    description:
      "Preços e limites em tempo real do motor, calculadora de cotações firmes e representação ISO 20022 das suas transferências.",
    sendOnCorridor: "Enviar pelo Corredor",
    emptyCorridors: "Não há corredores configurados.",
    bannerBadge: "Roteamento Cambial Determinístico & Redes de Telecom",
    bannerTitle: (count) => `${count} Corredores Ativos de Liquidação Intra-Africana`,
    bannerDesc:
      "Clique em qualquer corredor na tabela abaixo para inspecionar a liquidez, fixar uma cotação firme ou verificar payloads ISO 20022 pacs.008.",
    selectedCorridor: "Corredor Selecionado",
    indicativeFx: "Câmbio Indicativo",
    corridorFee: "Taxa do Corredor",
    payoutAdapter: "Adaptador de Pagamento",
    metricCorridors: "Corredores",
    metricCorridorsSub: "Configurados no motor",
    metricEnabled: "Ativos",
    metricEnabledSub: "A aceitar cotações",
    metricHalted: "Interrompidos",
    metricHaltedSub: "Interruptor ativo",
    calculatorTitle: "Calculadora de cotações",
    calculatorSubtitle: "Simule uma cotação firme com taxa do corredor e bloqueio cambial",
    sendAmountLabel: (c) => `Montante de envio (${c})`,
    minMaxLabel: "Mín / Máx do Corredor",
    payoutRailLabel: "Canal de Pagamento",
    enterAmountHint: "Introduza um montante para obter uma cotação firme.",
    fetchingQuote: "A carregar cotação…",
    firmQuoteTitle: "Cotação Firme do Motor",
    rateLabel: "Taxa",
    ledgerRateLabel: "Taxa do razão",
    feeLabel: "Comissão",
    beneficiaryReceives: "O beneficiário recebe",
    quoteExpires: (id, exp) => `Cotação ${id} · expira ${exp}`,
    destinationChartTitle: "Corredores por moeda de destino",
    destinationChartSubtitle:
      "Distribuição dos pontos de liquidação pelas moedas regionais suportadas",
    corridorsLabel: "Corredores",
    rateCardTitle: "Tabela de taxas dos corredores",
    rateCardSubtitle: "Clique em qualquer linha para carregar os parâmetros na calculadora",
    liveFromEngine: "Direto do motor",
    colCorridor: "Corredor",
    colIndicativeRate: "Taxa indicativa",
    colFee: "Taxa",
    colMinMax: "Mín / máx",
    colPayoutRail: "Canal de pagamento",
    colState: "Estado",
    pricingTitle: "Como funcionam os preços",
    pricingSubtitle:
      "Níveis transparentes de comissões e bloqueio de cotação entre blocos regionais",
    pricingDesc:
      "Cada corredor é cotado com base em comissões transparentes e na taxa de câmbio indicativa. Uma cotação firme fixa o valor exato da liquidação.",
    pricingStep1:
      "Escolha o corredor e o valor — a cotação mostra a taxa, a comissão e o montante entregue.",
    pricingStep2:
      "Confirme — o id da cotação fica vinculado ao pagamento; alterações de mercado não o afetam.",
    pricingStep3:
      "Recolha e pague — a sua carteira móvel é debitada e o beneficiário recebe na rede local.",
    feeTiersLabel: "Níveis de taxas",
    feeTierCorridors: (n, reg) =>
      `${n} corredores · ${reg ? "dentro de uma comunidade económica regional" : "entre regiões"}`,
    isoTitle: "Mensagem ISO 20022 pacs.008",
    isoSubtitle:
      "Payload normalizado FIToFICustomerCreditTransferV08 gerado a partir dos seus registos no razão",
    structureOk: "Estrutura Correta",
    problemsCount: (n) => `${n} problema(s)`,
    copyXml: "Copiar XML",
    checkStructure: "Verificar estrutura",
    completePaymentHint:
      "Conclua um pagamento para o visualizar como mensagem normalizada de transferência a crédito.",
    transferLabel: "Transferência",
    isoExplanation:
      "Gerado no seu navegador a partir do razão. A verificação confirma apenas a sintaxe e elementos obrigatórios.",
    opEyebrow: "Operações de rede",
    opTitle: "Corredores & Fornecedores",
    opDesc:
      "Prontidão dos fornecedores de telecomunicações, interruptores gerais, registos de webhooks e reconciliação. Não alteram o razão diretamente.",
    noProvidersRegistered: "Nenhum fornecedor registado.",
    opBannerBadge: "NOC de Adaptadores e Webhooks",
    opBannerTitle: (h, tot) => `${h} de ${tot} Adaptadores de Pagamento Operacionais`,
    opBannerDesc:
      "Os webhooks de fornecedores são autenticados criptograficamente e arquivados como prova inviolável.",
    killSwitchGuard: "Guarda de Interrupção Geral",
    allRailsArmed: "Todas as Redes Armadas",
    railsHalted: (n) => `${n} Rede(s) Interrompida(s)`,
    metricProviders: "Fornecedores",
    metricProvidersSub: "Adaptadores registados",
    metricHealthy: "Saudáveis",
    metricHealthySub: "Aprovados nos testes",
    metricKillSwitchSub: "Fornecedores parados",
    metricExternalCalls: "Chamadas externas",
    metricExternalCallsSub: "Tráfego em tempo real",
    providerRegistry: "Registo de fornecedores",
    providerRegistrySub: "Ambiente, mercados suportados e estado de prontidão",
    colProvider: "Fornecedor",
    colEnvironment: "Ambiente",
    colCountries: "Países",
    colCurrencies: "Moedas",
    colChecked: "Verificado",
    colHealth: "Saúde",
    providersByReadiness: "Fornecedores por prontidão",
    readinessSubtitle: "Distribuição da saúde das redes de telecomunicações",
    providerRecon: "Reconciliação de fornecedores",
    providerReconSubtitle: "Estado de correspondência entre liquidações e respostas de fornecedores",
    noRecon: "Sem registos de reconciliação.",
    openReconItems: (open, w) => `${open} abertos · último evento ${w}`,
    webhookEvidence: "Provas de Webhook",
    webhookEvidenceSubtitle:
      "Notificações autenticadas registadas para auditoria e reconciliação",
    noCallbacks: "Nenhuma notificação recebida.",
  },
  rw: {
    eyebrow: "Urusobe rw'Ivunjisha n'Ubwishyu bw'Imipaka",
    title: "Amayira y'Ubwishyu (Corridors)",
    description:
      "Ibiciro n'imbibi by'ako kanya bivuye kuri moteri, imbonerahamwe yo gufunga ibiciro, n'ubutumwa bwa ISO 20022 bw'ibyo wishe.",
    sendOnCorridor: "Ohereza ku Muyoboro",
    emptyCorridors: "Nta mayira ateganyijwe.",
    bannerBadge: "Ivunjisha Rikora neza & Imiyoboro ya Telefoni",
    bannerTitle: (count) => `Amayira ${count} Akora yo Kwishyurana muri Afurika`,
    bannerDesc:
      "Kanda ku murongo wose w'ibiciro hano hasi kugira ngo urebe amafaranga ahari, ufate igiciro gihamye, cyangwa usuzume ubutumwa bwa ISO 20022 pacs.008.",
    selectedCorridor: "Inzira Yahiswemo",
    indicativeFx: "Igipimo cy'Ivunjisha",
    corridorFee: "Amafaranga y'Inzira",
    payoutAdapter: "Uburyo bwo Kwishyura",
    metricCorridors: "Amayira",
    metricCorridorsSub: "Yateganyijwe kuri moteri",
    metricEnabled: "Arakora",
    metricEnabledSub: "Yakira ibiciro",
    metricHalted: "Yarahagaritswe",
    metricHaltedSub: "Konti y'uburinzi irafunze",
    calculatorTitle: "Kubarira igiciro",
    calculatorSubtitle: "Gerageza igiciro gihamye n'amafaranga yo guhererekanya ako kanya",
    sendAmountLabel: (c) => `Amafaranga yo kohereza (${c})`,
    minMaxLabel: "Macye / Menshi ku Nzira",
    payoutRailLabel: "Umuyoboro wo Kwishyuriraho",
    enterAmountHint: "Shyiramo amafaranga kugira ngo ubone igiciro gihamye.",
    fetchingQuote: "Gushaka igiciro…",
    firmQuoteTitle: "Igiciro Gihamye cya Moteri",
    rateLabel: "Igipimo",
    ledgerRateLabel: "Igipimo cy'igitabo",
    feeLabel: "Amafaranga y'ishyuwe",
    beneficiaryReceives: "Uwakira azahabwa",
    quoteExpires: (id, exp) => `Igiciro ${id} · kizarangira ${exp}`,
    destinationChartTitle: "Amayira hakurikijwe ifaranga rigamijwe",
    destinationChartSubtitle: "Imigendekere y'ifaranga mu turere twa Afurika twemewe",
    corridorsLabel: "Amayira",
    rateCardTitle: "Ikarita y'ibiciro by'amayira",
    rateCardSubtitle: "Kanda ku murongo uwo ari wo wose kugira ngo ushire ibipimo byawo mu kubarira",
    liveFromEngine: "Bikuye ako kanya muri moteri",
    colCorridor: "Inzira",
    colIndicativeRate: "Igipimo cy'agateganyo",
    colFee: "Amafaranga",
    colMinMax: "Macye / Menshi",
    colPayoutRail: "Umuyoboro wo kwishyura",
    colState: "Uko bimeze",
    pricingTitle: "Uko ibiciro bikora",
    pricingSubtitle:
      "Ibiciro bisobanutse no gufunga igiciro gihamye mu bihugu byo mu turere twa Afurika",
    pricingDesc:
      "Buri nzira igenwa n'ikiguzi kiboneye hiyongereyeho igipimo cy'ivunjisha. Igiciro gihamye gifunga ibipimo byose kugira ngo ibyo wemeje aribyo byishyurwa.",
    pricingStep1:
      "Hitamo inzira n'amafaranga — igiciro cyerekana amafaranga acibwa n'azahabwa uwakira.",
    pricingStep2:
      "Emeza — nimero y'igiciro ifungirwa ku bwishyu; ihindagurika ry'isoko ntiriyihindura.",
    pricingStep3:
      "Kwishyura no koherereza — konti yawe ya mobile-money irakatwa, maze uwakira ahabwe amafaranga ku muyoboro we w'iwabo.",
    feeTiersLabel: "Ibyiciro by'amafaranga acibwa",
    feeTierCorridors: (n, reg) =>
      `Amayira ${n} · ${reg ? "mu karere kamwe k'ubukungu" : "hagati y'uturere dutandukanye"}`,
    isoTitle: "Ubutumwa bwa ISO 20022 pacs.008",
    isoSubtitle:
      "Inyandiko yujuje amategeko mpuzamahanga ya FIToFICustomerCreditTransferV08 ikorwa mu gitabo cyawe",
    structureOk: "Imiterere ni Nziza",
    problemsCount: (n) => `Ibibazo ${n}`,
    copyXml: "Koporora XML",
    checkStructure: "Suzuma imiterere",
    completePaymentHint:
      "Kora ubwishyu kugira ngo ubugaragaze nk'ubutumwa bwujuje amategeko yo guhererekanya amafaranga.",
    transferLabel: "Ihererekanya",
    isoExplanation:
      "Bikorerwa muri mudasobwa yawe bivuye mu gitabo cy'ubucuruzi. Iri genzura ryemeza ko imiterere ariyo gusa.",
    opEyebrow: "Ibikorwa by'urusobe",
    opTitle: "Amayira & Abatanga Serivisi",
    opDesc:
      "Ubwitegure bw'ibigo by'itumanaho, uburyo bwo guhagarika byihuse, gukurikirana webhook, no guhuza amadosiye. Ibi bimenyetso ntibihindura igitabo ubwabyo.",
    noProvidersRegistered: "Nta bitanga serivisi byanditswe.",
    opBannerBadge: "Ibiro Bikurikirana Itumanaho na Webhooks",
    opBannerTitle: (h, tot) => `Imiyoboro ${h} kuri ${tot} yo Kwishyura Irakora Neza`,
    opBannerDesc:
      "Ubutumwa bwa webhook businywa mu buryo bw'ibanga bugashyirwa mu nyandiko zidasibama.",
    killSwitchGuard: "Uburinzi bwo Guhagarika Byose",
    allRailsArmed: "Imiyoboro Yose Irakora",
    railsHalted: (n) => `Umuyoboro ${n} Warahagaritswe`,
    metricProviders: "Abatanga serivisi",
    metricProvidersSub: "Abashyizweho",
    metricHealthy: "Bazima",
    metricHealthySub: "Batsinze isuzuma",
    metricKillSwitchSub: "Abahagaritswe",
    metricExternalCalls: "Ibyakorewe hanze",
    metricExternalCallsSub: "Ihererekanya rya nyaryo",
    providerRegistry: "Igitabo cy'abatanga serivisi",
    providerRegistrySub: "Imiterere, ibihugu bikoreramo, n'uko bihagaze",
    colProvider: "Utanga serivisi",
    colEnvironment: "Aho bikorera",
    colCountries: "Ibihugu",
    colCurrencies: "Amafaranga",
    colChecked: "Byasuzumwe",
    colHealth: "Ubuzima",
    providersByReadiness: "Abatanga serivisi hakurikijwe ubwitegure",
    readinessSubtitle: "Imiterere y'ubuzima bw'imiyoboro yose y'itumanaho",
    providerRecon: "Guhuza amadosiye y'abatanga serivisi",
    providerReconSubtitle: "Igereranya ry'ubwishyu bwo ku mayira n'ibyavuye ku batanga serivisi",
    noRecon: "Nta nyandiko zo guhuza amadosiye zirahari.",
    openReconItems: (open, w) => `${open} bisigaye · igikorwa giheruka ${w}`,
    webhookEvidence: "Ibimenyetso bya Webhook",
    webhookEvidenceSubtitle: "Ubutumwa bwemejwe bw'abatanga serivisi bubikirwa igenzura",
    noCallbacks: "Nta butumwa bw'abatanga serivisi bwakiriwe.",
  },
};

// ---------------------------------------------------------------------------------------------
// Trader: rate card, live quote, ISO 20022 rendering of a real transfer
// ---------------------------------------------------------------------------------------------
function TraderCorridors() {
  const t = useLangCopy(COPY);
  const corridors = useQuery({ queryKey: ["corridors"], queryFn: corridorApi.list });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("100000");

  const selected: Corridor | undefined =
    corridors.data?.find((c) => c.id === selectedId) ?? corridors.data?.[0];
  const minor = Number(amount) > 0 ? toMinor(Number(amount)) : 0;

  const quote = useQuery({
    queryKey: ["quote", selected?.id, minor],
    queryFn: () => corridorApi.quote(selected!.id, minor),
    enabled: !!selected && minor > 0,
    retry: false,
  });

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <Button
            asChild
            className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <Link to="/send">
              {t.sendOnCorridor}
              <ArrowUpRight className="size-3.5 text-[#c2f74d]" />
            </Link>
          </Button>
        }
      />

      <QueryBoundary
        query={corridors}
        isEmpty={(d) => d.length === 0}
        empty={t.emptyCorridors}
      >
        {(rows) => {
          const liveCount = rows.filter((c) => c.enabled && !c.kill_switch).length;
          const haltedCount = rows.filter((c) => c.kill_switch).length;
          return (
            <>
              {/* Executive Corridor Mesh Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
                <img
                  src={escrowGlobe}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -bottom-16 w-[340px] opacity-[0.15] mix-blend-screen select-none"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-[#c2f74d]/10 blur-3xl"
                />

                <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                      <Globe2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                        {t.bannerBadge}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {t.bannerTitle(liveCount)}
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                      {t.bannerDesc}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {rows.slice(0, 6).map((c) => {
                        const active = selected?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedId(c.id)}
                            className={
                              active
                                ? "inline-flex items-center gap-1.5 rounded-lg border border-[#c2f74d] bg-[#c2f74d] px-2.5 py-1 font-mono text-[11px] font-bold text-[#151515] transition-all"
                                : "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] text-white/80 transition-all hover:border-white/30 hover:text-white"
                            }
                          >
                            <Flag code={c.from_country} className="h-3 w-4 rounded-[1px]" />
                            <span>{c.from_currency}</span>
                            <ArrowRight className="size-3 opacity-60" />
                            <Flag code={c.to_country} className="h-3 w-4 rounded-[1px]" />
                            <span>{c.to_currency}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selected ? (
                    <div className="rounded-xl border border-white/15 bg-black/45 p-4 font-mono text-xs backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                          {t.selectedCorridor}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c2f74d]">
                          <Flag code={selected.from_country} className="h-3 w-4 rounded-[1px]" />
                          {selected.id}
                          <Flag code={selected.to_country} className="h-3 w-4 rounded-[1px]" />
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <dt className="text-white/50">{t.indicativeFx}</dt>
                          <dd className="font-bold text-white">
                            1 {selected.from_currency} ={" "}
                            {selected.fx.inverse_rate.toPrecision(5)} {selected.to_currency}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-white/50">{t.corridorFee}</dt>
                          <dd className="text-[#c2f74d]">
                            {(selected.fees_bps / 100).toFixed(2)}% ({selected.fees_bps} bps)
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-white/50">{t.payoutAdapter}</dt>
                          <dd className="text-white">{selected.provider_id}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <Metric
                  label={t.metricCorridors}
                  value={rows.length}
                  sub={t.metricCorridorsSub}
                  accent="lime"
                />
                <Metric label={t.metricEnabled} value={liveCount} sub={t.metricEnabledSub} />
                <Metric
                  label={t.metricHalted}
                  value={haltedCount}
                  sub={t.metricHaltedSub}
                  accent={haltedCount > 0 ? "warn" : "default"}
                />
              </div>

              {/* Interactive Quote Calculator + Destination Currency Mix */}
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                {selected ? (
                  <Panel
                    title={t.calculatorTitle}
                    subtitle={t.calculatorSubtitle}
                    meta={<Chip tone="lime">{selected.id}</Chip>}
                  >
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="quote-amount"
                            className="font-mono text-[10px] uppercase tracking-[0.16em]"
                          >
                            {t.sendAmountLabel(selected.from_currency)}
                          </Label>
                          <Input
                            id="quote-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputMode="decimal"
                            className="rounded-lg font-mono text-sm"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {QUOTE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmount(preset)}
                              className={
                                amount === preset
                                  ? "rounded-md border border-[#151515] bg-[#151515] px-2.5 py-1 font-mono text-[10px] font-bold text-[#c2f74d]"
                                  : "rounded-md border border-border bg-muted/30 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                              }
                            >
                              {Number(preset).toLocaleString("en-US")} {selected.from_currency}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/15 p-3 font-mono text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>{t.minMaxLabel}</span>
                            <span className="font-semibold text-foreground">
                              {money(fromMinor(selected.min_amount_minor))} –{" "}
                              {money(fromMinor(selected.max_amount_minor))}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span>{t.payoutRailLabel}</span>
                            <span className="text-foreground">{selected.provider_id}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {minor === 0 ? (
                          <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                            {t.enterAmountHint}
                          </p>
                        ) : quote.isFetching && !quote.data ? (
                          <Loading label={t.fetchingQuote} />
                        ) : quote.isError ? (
                          <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
                        ) : quote.data ? (
                          <div className="rounded-xl border border-[#151515] bg-[#151515] p-4 text-white">
                            <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                              <span className="inline-flex items-center gap-1.5">
                                <Calculator className="size-3 text-[#c2f74d]" />
                                {t.firmQuoteTitle}
                              </span>
                              <span className="text-[#c2f74d]">{selected.id}</span>
                            </div>
                            <dl className="space-y-2 font-mono text-xs">
                              <Row
                                k={t.rateLabel}
                                v={`1 ${selected.from_currency} = ${quote.data.quote.inverse_rate.toPrecision(5)} ${selected.to_currency}`}
                              />
                              <Row
                                k={t.ledgerRateLabel}
                                v={`${quote.data.quote.rate.toPrecision(5)} ${selected.from_currency} per ${selected.to_currency}`}
                              />
                              <Row
                                k={t.feeLabel}
                                v={`−${money(fromMinor(quote.data.quote.fee_minor), selected.from_currency)}`}
                              />
                              <div className="flex justify-between border-t border-white/15 pt-2.5 text-sm font-bold text-[#c2f74d]">
                                <dt>{t.beneficiaryReceives}</dt>
                                <dd className="tabular-nums">
                                  {money(
                                    fromMinor(quote.data.quote.deliver_amount_minor),
                                    selected.to_currency,
                                  )}
                                </dd>
                              </div>
                            </dl>
                            <p className="mt-3 break-all border-t border-white/10 pt-2 font-mono text-[10px] text-white/55">
                              {t.quoteExpires(
                                truncMid(quote.data.quote.id, 10, 8),
                                when(quote.data.quote.expires_at),
                              )}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Panel>
                ) : null}

                {rows.length > 0 ? (
                  <Panel
                    title={t.destinationChartTitle}
                    subtitle={t.destinationChartSubtitle}
                  >
                    <LazyDonutChart
                      ariaLabel={t.destinationChartTitle}
                      data={Object.entries(
                        rows.reduce<Record<string, number>>((acc, c) => {
                          acc[c.to_currency] = (acc[c.to_currency] ?? 0) + 1;
                          return acc;
                        }, {}),
                      ).map(([label, value]) => ({ label, value }))}
                      center={{ value: String(rows.length), label: t.corridorsLabel }}
                      format={(v) => String(v)}
                    />
                  </Panel>
                ) : null}
              </div>

              <Panel
                title={t.rateCardTitle}
                subtitle={t.rateCardSubtitle}
                meta={<Chip tone="live">{t.liveFromEngine}</Chip>}
              >
                <DataTable
                  caption={t.rateCardTitle}
                  rows={rows}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => setSelectedId(c.id)}
                  pageSize={12}
                  exportName="vuka-corridors.csv"
                  initialSort={{ key: "pair", dir: "asc" }}
                  columns={[
                    {
                      key: "pair",
                      header: t.colCorridor,
                      sort: (c) => c.id,
                      text: (c) =>
                        `${c.id} ${c.from_country} ${c.to_country} ${c.from_currency} ${c.to_currency}`,
                      cell: (c) => (
                        <span
                          className={`inline-flex items-center gap-2 ${
                            selected?.id === c.id ? "font-semibold" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Flag code={c.from_country} className="h-3 w-4 rounded-[1px]" />
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <Flag code={c.to_country} className="h-3 w-4 rounded-[1px]" />
                          </span>
                          <span className="font-mono text-xs">
                            {c.from_currency} → {c.to_currency}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.from_country} → {c.to_country}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: "rate",
                      header: t.colIndicativeRate,
                      align: "right",
                      sort: (c) => c.fx.inverse_rate,
                      text: (c) => String(c.fx.inverse_rate),
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">
                          1 {c.from_currency} = {c.fx.inverse_rate.toPrecision(5)} {c.to_currency}
                        </span>
                      ),
                    },
                    {
                      key: "fee",
                      header: t.colFee,
                      align: "right",
                      sort: (c) => c.fees_bps,
                      text: (c) => `${c.fees_bps / 100}%`,
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">{c.fees_bps / 100}%</span>
                      ),
                    },
                    {
                      key: "limits",
                      header: t.colMinMax,
                      align: "right",
                      text: (c) => `${c.min_amount_minor}-${c.max_amount_minor}`,
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">
                          {money(fromMinor(c.min_amount_minor))} –{" "}
                          {money(fromMinor(c.max_amount_minor))}
                        </span>
                      ),
                    },
                    {
                      key: "provider",
                      header: t.colPayoutRail,
                      sort: (c) => c.provider_id,
                      cell: (c) => (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {c.provider_id}
                        </span>
                      ),
                    },
                    {
                      key: "state",
                      header: t.colState,
                      align: "right",
                      sort: (c) => (c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"),
                      cell: (c) => (
                        <Chip tone={c.kill_switch || !c.enabled ? "warn" : "invert"}>
                          {c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"}
                        </Chip>
                      ),
                    },
                  ]}
                />
              </Panel>

              <Panel
                title={t.pricingTitle}
                subtitle={t.pricingSubtitle}
              >
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t.pricingDesc}
                    </p>
                    <ol className="mt-4 space-y-2.5 text-sm">
                      {[t.pricingStep1, t.pricingStep2, t.pricingStep3].map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/15 p-3"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[#151515] font-mono text-[10px] font-bold text-[#c2f74d]">
                            0{i + 1}
                          </span>
                          <span className="text-xs leading-relaxed text-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t.feeTiersLabel}
                    </div>
                    <ul className="space-y-2.5">
                      {Array.from(new Set(rows.map((c) => c.fees_bps)))
                        .sort((a, b) => a - b)
                        .map((bps) => {
                          const n = rows.filter((c) => c.fees_bps === bps).length;
                          return (
                            <li
                              key={bps}
                              className="flex items-baseline justify-between rounded-xl border border-border/80 bg-muted/15 px-4 py-3"
                            >
                              <span className="tabular font-mono text-xl font-bold">
                                {(bps / 100).toFixed(2)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t.feeTierCorridors(n, bps <= 80)}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
              </Panel>
            </>
          );
        }}
      </QueryBoundary>

      <IsoViewer />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/55">{k}</dt>
      <dd className="tabular-nums text-white">{v}</dd>
    </div>
  );
}

function IsoViewer() {
  const t = useLangCopy(COPY);
  const trader = useTrader();
  const wallet = useWallet();
  const transfers = useTransfers();
  const [id, setId] = useState("");
  const [result, setResult] = useState<ReturnType<typeof structuralCheck> | null>(null);

  const usable = (transfers.data ?? []).filter((t) => t.status === "SUCCESS");
  const tr = usable.find((x) => x.id === id) ?? usable[0];
  const own = new Set(wallet.data?.accounts.map((a) => a.id) ?? []);
  const xml = tr
    ? buildPacs008(tr, {
        debtorName: own.has(tr.source_account_id)
          ? trader.full_name
          : `VUKA account ${shortId(tr.source_account_id)}`,
        creditorName: own.has(tr.destination_account_id)
          ? trader.full_name
          : `VUKA account ${shortId(tr.destination_account_id)}`,
      })
    : "";

  async function copyXml() {
    if (!xml) return;
    try {
      await navigator.clipboard.writeText(xml);
      toast.success("ISO 20022 pacs.008 XML copied");
    } catch {
      toast.error("Could not copy XML");
    }
  }

  return (
    <Panel
      title={t.isoTitle}
      subtitle={t.isoSubtitle}
      meta={
        <div className="flex flex-wrap items-center gap-2">
          {result ? (
            <Chip tone={result.ok ? "invert" : "warn"}>
              {result.ok ? t.structureOk : t.problemsCount(result.problems.length)}
            </Chip>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={!xml}
            className="h-7 gap-1.5 rounded-md font-mono text-[10px] uppercase"
            onClick={() => void copyXml()}
          >
            <Copy className="size-3" aria-hidden="true" />
            {t.copyXml}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!xml}
            className="h-7 gap-1.5 rounded-md font-mono text-[10px] uppercase"
            onClick={() => {
              const r = structuralCheck(xml);
              setResult(r);
              if (r.ok) toast.success("Well-formed, all mandatory elements present");
              else toast.error(r.problems[0] ?? "Invalid message");
            }}
          >
            <FileCode2 className="size-3" aria-hidden="true" />
            {t.checkStructure}
          </Button>
        </div>
      }
    >
      {transfers.isPending ? (
        <Loading />
      ) : usable.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t.completePaymentHint}
        </p>
      ) : (
        <>
          <div className="mb-3 max-w-md space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{t.transferLabel}</Label>
            <Select
              value={tr?.id ?? ""}
              onValueChange={(v) => {
                setId(v);
                setResult(null);
              }}
            >
              <SelectTrigger aria-label="Transfer" className="rounded-lg font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {usable.slice(0, 25).map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {shortId(x.id)} · {money(x.amount, x.currency)}
                    {x.invoice_number ? ` · ${x.invoice_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#151515] bg-[#151515] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[10px] text-white/55">
              <span>urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08</span>
              <span className="text-[#c2f74d]">{tr ? shortId(tr.id, 12) : ""}</span>
            </div>
            <pre className="max-h-[380px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#e5e7eb]">
              {xml}
            </pre>
          </div>
          {result && !result.ok ? (
            <ul className="mt-3 rounded-lg border-2 border-foreground p-3 text-xs">
              {result.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-[#79b200]" aria-hidden="true" />
            {t.isoExplanation}
          </p>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------
// Operator: provider health, webhook evidence, provider reconciliation
// ---------------------------------------------------------------------------------------------
function OperatorProviders() {
  const t = useLangCopy(COPY);
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridorApi.providers,
    refetchInterval: 30_000,
  });
  const events = useQuery({ queryKey: ["webhook-events"], queryFn: corridorApi.webhookEvents });
  const recon = useQuery({ queryKey: ["provider-recon"], queryFn: corridorApi.reconciliation });

  return (
    <>
      <PageHeader
        eyebrow={t.opEyebrow}
        title={t.opTitle}
        description={t.opDesc}
      />

      <QueryBoundary
        query={providers}
        isEmpty={(d) => d.length === 0}
        empty={t.noProvidersRegistered}
      >
        {(rows) => {
          const healthyCount = rows.filter((p) => p.healthy).length;
          const haltedCount = rows.filter((p) => p.config.kill_switch).length;
          return (
            <>
              {/* Operator Telecom NOC Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
                <img
                  src={escrowGlobe}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
                />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                      <Radio className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                        {t.opBannerBadge}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {t.opBannerTitle(healthyCount, rows.length)}
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                      {t.opBannerDesc}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
                    <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                        {t.killSwitchGuard}
                      </div>
                      <div className="font-bold text-white">
                        {haltedCount === 0 ? t.allRailsArmed : t.railsHalted(haltedCount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-4">
                <Metric
                  label={t.metricProviders}
                  value={rows.length}
                  sub={t.metricProvidersSub}
                  accent="lime"
                />
                <Metric label={t.metricHealthy} value={healthyCount} sub={t.metricHealthySub} />
                <Metric
                  label={t.metricHalted}
                  value={haltedCount}
                  sub={t.metricKillSwitchSub}
                  accent={haltedCount > 0 ? "warn" : "default"}
                />
                <Metric
                  label={t.metricExternalCalls}
                  value={rows.filter((p) => p.config.external_calls).length}
                  sub={t.metricExternalCallsSub}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <Panel
                  title={t.providerRegistry}
                  subtitle={t.providerRegistrySub}
                  meta={<Chip tone="live">Sandbox</Chip>}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          <th className="py-2.5">{t.colProvider}</th>
                          <th className="py-2.5">{t.colEnvironment}</th>
                          <th className="py-2.5">{t.colCountries}</th>
                          <th className="py-2.5">{t.colCurrencies}</th>
                          <th className="py-2.5">{t.colChecked}</th>
                          <th className="py-2.5 text-right">{t.colHealth}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => (
                          <tr
                            key={p.config.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                          >
                            <td className="py-3">
                              <div className="font-semibold text-foreground">
                                {p.config.display_name}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {p.config.id}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-xs">{p.config.environment}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                                {p.config.supported_countries.map((cc) => (
                                  <span
                                    key={cc}
                                    className="inline-flex items-center gap-1 rounded border border-border/80 bg-muted/25 px-1.5 py-0.5 text-[11px]"
                                  >
                                    <Flag code={cc} className="h-2.5 w-3.5 rounded-[1px]" />
                                    {cc}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-xs">
                              {p.config.supported_currencies.join(", ")}
                            </td>
                            <td className="py-3 font-mono text-xs text-muted-foreground">
                              {when(p.last_checked)}
                            </td>
                            <td className="py-3 text-right">
                              <Chip tone={p.config.kill_switch || !p.healthy ? "warn" : "invert"}>
                                {p.config.kill_switch
                                  ? "KILL SWITCH"
                                  : p.healthy
                                    ? "HEALTHY"
                                    : "DEGRADED"}
                              </Chip>
                              {p.reason ? (
                                <div className="mt-1 text-[10px] text-muted-foreground">
                                  {p.reason}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {rows.length > 0 ? (
                  <Panel
                    title={t.providersByReadiness}
                    subtitle={t.readinessSubtitle}
                  >
                    <LazyDonutChart
                      ariaLabel={t.providersByReadiness}
                      data={[
                        { label: "Healthy", value: healthyCount },
                        { label: "Unhealthy", value: rows.length - healthyCount },
                      ]}
                      center={{ value: String(rows.length), label: t.metricProviders }}
                      format={(v) => String(v)}
                    />
                  </Panel>
                ) : null}
              </div>
            </>
          );
        }}
      </QueryBoundary>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t.providerRecon}
          subtitle={t.providerReconSubtitle}
          meta={<Activity className="size-4 text-muted-foreground" aria-hidden="true" />}
        >
          <QueryBoundary
            query={recon}
            isEmpty={(d) => d.length === 0}
            empty={t.noRecon}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.map((r) => (
                  <li
                    key={`${r.provider_id}-${r.corridor_id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <div className="font-mono text-xs font-semibold">
                        {r.provider_id} · {r.corridor_id}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.openReconItems(r.open_items, when(r.last_event_at))}
                      </div>
                    </div>
                    <Chip tone={r.open_items > 0 ? "warn" : "invert"}>{r.state}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>

        <Panel
          title={t.webhookEvidence}
          subtitle={t.webhookEvidenceSubtitle}
          meta={<CheckCircle2 className="size-4 text-[#79b200]" aria-hidden="true" />}
        >
          <QueryBoundary
            query={events}
            isEmpty={(d) => d.length === 0}
            empty={t.noCallbacks}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="font-mono text-xs font-semibold">
                        {e.provider_id} · {e.event_type}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {when(e.received_at)} · {e.settlement_action}
                      </div>
                    </div>
                    <Chip tone={e.authenticated ? "invert" : "warn"}>
                      {e.authenticated ? "AUTHENTICATED" : "UNVERIFIED"}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
