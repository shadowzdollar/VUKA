import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  FileText,
  Globe2,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { PeriodPicker, usd0, usdCompact, type Period } from "@/components/vuka/analytics-parts";
import { LazyDonutChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel, type MetricTrend } from "@/components/vuka/shell";
import { RankedBars, Sparkline } from "@/components/vuka/viz/simple";
import { TradeSimulatorModal } from "@/components/vuka/trade-simulator";
import { describeError } from "@/lib/api/client";
import { invoices, platform, support } from "@/lib/api/endpoints";
import { money, shortId, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { useTrader } from "@/lib/session";
import { directionFor, useNotifications, useTransfers, useWallet } from "@/lib/trader-data";

const HOME_COPY = {
  en: {
    eyebrow: "Corporate Trade Treasury",
    welcome: (name: string) => `Welcome back, ${name}`,
    heroLead:
      "Your business and personal liquidity, strictly segregated on the ledger. Lock invoice-backed escrows, settle across 10 African corridors, and build verifiable trade credit.",
    sendCrossBorder: "Send Cross-Border Payment",
    invoicesEscrow: "Invoices & Escrow",
    fundStatements: "Fund / Statements",
    trustPassport: "Trust Passport",
    scaleFallback: "300–850 scale",
    settledCycles: (n: number) => `${n} settled cycles`,
    ledgerDerived: "Ledger-derived",
    inspect: "Inspect →",
    dailyCorridorLimit: "Daily Corridor Limit",
    dailyCapRemaining: (cap: string) => `of ${cap} daily cap remaining`,
    tierStandingLimits: "Tier standing & KYC limits",
    tierPrefix: (tier: string) => `Tier: ${tier}`,
    manage: "Manage →",
    complianceStanding: (status: string) => `Compliance Standing · ${status}`,
    complianceBody:
      "Complete trader identity & business registry verification to unlock higher single-payment caps and institutional corridor settlement limits.",
    upgradeVerification: "Upgrade verification →",
    businessVault: "Business Trade Vault",
    personalWallet: "Personal Wallet",
    acctLedgerBalance: (id: string) => `Acct ${id} · Double-entry ledger balance`,
    topUpStatement: "Top up / Statement →",
    escrowPrimary: "Escrow Primary",
    activeInvoices: "Active Invoices",
    totalInvoicesLedger: (n: number) => `${n} total invoices on ledger`,
    unreadNotices: "Unread Notices",
    actionableAlerts: "Actionable settlement alerts",
    allNoticesRead: "All settlement notices read",
    cashflowVelocity: (p: number) => `Cashflow & Corridor Velocity (${p}d)`,
    fullAnalytics: "Full analytics →",
    outboundSent: "Outbound Sent",
    inboundReceived: "Inbound Received",
    settlementsCount: (n: number) => `${n} settlements`,
    avgTicket: "Avg Ticket",
    peakSub: (peak: string) => `Peak ${peak}`,
    crossBorder: "Cross-Border",
    fxConversions: "FX corridor conversions",
    moneyOutUsd: "Money out (USD eq.)",
    moneyInUsd: "Money in (USD eq.)",
    moneyInOutAria: "Money in and out per day, USD equivalent",
    settlementReliability: "Settlement Reliability",
    settlementOutcomesAria: "Settlement outcomes",
    succeeded: "Succeeded",
    failed: "Failed",
    reversed: "Reversed",
    successRate: "Success rate",
    settled: "Settled",
    topCounterparties: "Top Counterparties",
    volumeChip: "Volume",
    topCounterpartiesAria: "Top counterparties by volume",
    topCounterpartiesEmpty: "Complete your first cross-border payment to rank counterparties.",
    settledPaymentsNote: (n: number) => `${n} settled payment${n === 1 ? "" : "s"}`,
    recentTransfers: "Recent Ledger Transfers",
    allTransfers: "All transfers →",
    transfersEmpty: "No transfers yet. Top up your business wallet to get started.",
    outboundSettlement: "Outbound Settlement",
    inboundReceipt: "Inbound Receipt",
    internalBookTransfer: "Internal Book Transfer",
    feedTitle: "Settlement & Support Feed",
    unreadChip: (n: number) => `${n} unread`,
    nothingToReport: "Nothing to report.",
    readBtn: "Read",
  },
  fr: {
    eyebrow: "Trésorerie commerciale d'entreprise",
    welcome: (name: string) => `Bon retour, ${name}`,
    heroLead:
      "Vos liquidités professionnelles et personnelles, strictement séparées sur le registre. Verrouillez des séquestres adossés à des factures, réglez sur 10 corridors africains et développez un crédit commercial vérifiable.",
    sendCrossBorder: "Envoyer un paiement transfrontalier",
    invoicesEscrow: "Factures et séquestre",
    fundStatements: "Approvisionner / Relevés",
    trustPassport: "Passeport de confiance",
    scaleFallback: "Échelle 300–850",
    settledCycles: (n: number) => `${n} cycles réglés`,
    ledgerDerived: "Issu du registre",
    inspect: "Examiner →",
    dailyCorridorLimit: "Plafond journalier corridor",
    dailyCapRemaining: (cap: string) => `sur ${cap} de plafond journalier restant`,
    tierStandingLimits: "Niveau et plafonds KYC",
    tierPrefix: (tier: string) => `Niveau : ${tier}`,
    manage: "Gérer →",
    complianceStanding: (status: string) => `Statut de conformité · ${status}`,
    complianceBody:
      "Complétez la vérification d'identité du commerçant et du registre du commerce pour débloquer des plafonds par opération plus élevés et des limites institutionnelles.",
    upgradeVerification: "Améliorer la vérification →",
    businessVault: "Coffre commercial professionnel",
    personalWallet: "Portefeuille personnel",
    acctLedgerBalance: (id: string) => `Cpte ${id} · Solde du registre à double entrée`,
    topUpStatement: "Recharger / Relevé →",
    escrowPrimary: "Séquestre principal",
    activeInvoices: "Factures actives",
    totalInvoicesLedger: (n: number) => `${n} factures au total sur le registre`,
    unreadNotices: "Notifications non lues",
    actionableAlerts: "Alertes de règlement à traiter",
    allNoticesRead: "Toutes les notifications sont lues",
    cashflowVelocity: (p: number) => `Flux de trésorerie et vélocité (${p}j)`,
    fullAnalytics: "Analyses complètes →",
    outboundSent: "Sorties envoyées",
    inboundReceived: "Entrées reçues",
    settlementsCount: (n: number) => `${n} règlements`,
    avgTicket: "Ticket moyen",
    peakSub: (peak: string) => `Pic ${peak}`,
    crossBorder: "Transfrontalier",
    fxConversions: "Conversions FX corridors",
    moneyOutUsd: "Sorties (éq. USD)",
    moneyInUsd: "Entrées (éq. USD)",
    moneyInOutAria: "Entrées et sorties par jour, équivalent USD",
    settlementReliability: "Fiabilité des règlements",
    settlementOutcomesAria: "Résultats des règlements",
    succeeded: "Réussis",
    failed: "Échoués",
    reversed: "Annulés",
    successRate: "Taux de réussite",
    settled: "Réglés",
    topCounterparties: "Principales contreparties",
    volumeChip: "Volume",
    topCounterpartiesAria: "Principales contreparties par volume",
    topCounterpartiesEmpty:
      "Effectuez votre premier paiement transfrontalier pour classer vos contreparties.",
    settledPaymentsNote: (n: number) => `${n} paiement${n === 1 ? "" : "s"} réglé${n === 1 ? "" : "s"}`,
    recentTransfers: "Transferts récents du registre",
    allTransfers: "Tous les transferts →",
    transfersEmpty:
      "Aucun transfert pour le moment. Rechargez votre portefeuille professionnel pour commencer.",
    outboundSettlement: "Règlement sortant",
    inboundReceipt: "Réception entrante",
    internalBookTransfer: "Transfert interne",
    feedTitle: "Flux de règlement et d'assistance",
    unreadChip: (n: number) => `${n} non lue${n === 1 ? "" : "s"}`,
    nothingToReport: "Rien à signaler.",
    readBtn: "Lu",
  },
  sw: {
    eyebrow: "Hazina ya Biashara ya Kampuni",
    welcome: (name: string) => `Karibu tena, ${name}`,
    heroLead:
      "Ukwasi wako wa biashara na binafsi, ukiwa umetenganishwa kikamilifu kwenye leja. Funga escrow zinazoungwa mkono na ankara, lipa kupitia korido 10 za Kiafrika na ujenge mkopo wa biashara unaothibitishika.",
    sendCrossBorder: "Tuma Malipo ya Mipakani",
    invoicesEscrow: "Ankara na Escrow",
    fundStatements: "Weka Pesa / Taarifa",
    trustPassport: "Pasipoti ya Uaminifu",
    scaleFallback: "Kipimo cha 300–850",
    settledCycles: (n: number) => `mizunguko ${n} iliyokamilika`,
    ledgerDerived: "Inatokana na leja",
    inspect: "Kagua →",
    dailyCorridorLimit: "Kikomo cha Kila Siku cha Njia",
    dailyCapRemaining: (cap: string) => `kati ya kikomo cha siku cha ${cap} kilichosalia`,
    tierStandingLimits: "Ngazi na vikomo vya KYC",
    tierPrefix: (tier: string) => `Ngazi: ${tier}`,
    manage: "Simamia →",
    complianceStanding: (status: string) => `Hali ya Utii · ${status}`,
    complianceBody:
      "Kamilisha uthibitisho wa utambulisho wa mfanyabiashara na usajili wa biashara ili kufungua vikomo vya juu vya malipo na malipo ya kitaasisi.",
    upgradeVerification: "Boresha uthibitisho →",
    businessVault: "Hazina ya Biashara",
    personalWallet: "Pochi Binafsi",
    acctLedgerBalance: (id: string) => `Akaunti ${id} · Salio la leja ya kuingiza mara mbili`,
    topUpStatement: "Jaza salio / Taarifa →",
    escrowPrimary: "Msingi wa Escrow",
    activeInvoices: "Ankara Zinazoendelea",
    totalInvoicesLedger: (n: number) => `jumla ya ankara ${n} kwenye leja`,
    unreadNotices: "Arifa Zisizosomwa",
    actionableAlerts: "Arifa za malipo zinazohitaji hatua",
    allNoticesRead: "Arifa zote za malipo zimesomwa",
    cashflowVelocity: (p: number) => `Mtiririko wa Pesa na Kasi ya Korido (siku ${p})`,
    fullAnalytics: "Uchambuzi kamili →",
    outboundSent: "Zilizotumwa Nje",
    inboundReceived: "Zilizopokelewa Ndani",
    settlementsCount: (n: number) => `malipo ${n}`,
    avgTicket: "Wastani wa Malipo",
    peakSub: (peak: string) => `Kilele ${peak}`,
    crossBorder: "Kuvuka Mipaka",
    fxConversions: "Ubadilishaji wa FX",
    moneyOutUsd: "Pesa zinazotoka (USD)",
    moneyInUsd: "Pesa zinazoingia (USD)",
    moneyInOutAria: "Pesa zinazoingia na kutoka kwa siku, sawa na USD",
    settlementReliability: "Uaminifu wa Malipo",
    settlementOutcomesAria: "Matokeo ya malipo",
    succeeded: "Yamefaulu",
    failed: "Yameshindwa",
    reversed: "Yamerudishwa",
    successRate: "Kiwango cha ufaulu",
    settled: "Yamekamilika",
    topCounterparties: "Washirika Wakuu wa Biashara",
    volumeChip: "Kiasi",
    topCounterpartiesAria: "Washirika wakuu kwa kiasi",
    topCounterpartiesEmpty:
      "Kamilisha malipo yako ya kwanza ya mipakani ili kuorodhesha washirika.",
    settledPaymentsNote: (n: number) => `malipo ${n} yaliyokamilika`,
    recentTransfers: "Uhamisho wa Hivi Karibuni wa Leja",
    allTransfers: "Uhamisho wote →",
    transfersEmpty: "Bado hakuna uhamisho. Jaza salio kwenye pochi yako ya biashara ili kuanza.",
    outboundSettlement: "Malipo Yanayotoka",
    inboundReceipt: "Mapokezi Yanayoingia",
    internalBookTransfer: "Uhamisho wa Ndani wa Kitabu",
    feedTitle: "Mlisho wa Malipo na Msaada",
    unreadChip: (n: number) => `${n} hazijasomwa`,
    nothingToReport: "Hakuna cha kuripoti.",
    readBtn: "Soma",
  },
  pt: {
    eyebrow: "Tesouraria Comercial Corporativa",
    welcome: (name: string) => `Bem-vindo de volta, ${name}`,
    heroLead:
      "A sua liquidez empresarial e pessoal, estritamente segregada no razão. Bloqueie cauções associadas a faturas, liquide em 10 corredores africanos e construa crédito comercial verificável.",
    sendCrossBorder: "Enviar Pagamento Transfronteiriço",
    invoicesEscrow: "Faturas e Caução",
    fundStatements: "Carregar / Extratos",
    trustPassport: "Passaporte de Confiança",
    scaleFallback: "Escala 300–850",
    settledCycles: (n: number) => `${n} ciclos liquidados`,
    ledgerDerived: "Derivado do razão",
    inspect: "Inspecionar →",
    dailyCorridorLimit: "Limite Diário do Corredor",
    dailyCapRemaining: (cap: string) => `de ${cap} do limite diário restante`,
    tierStandingLimits: "Nível e limites KYC",
    tierPrefix: (tier: string) => `Nível: ${tier}`,
    manage: "Gerir →",
    complianceStanding: (status: string) => `Estado de Conformidade · ${status}`,
    complianceBody:
      "Conclua a verificação de identidade do comerciante e registo comercial para desbloquear limites superiores por pagamento e liquidação institucional.",
    upgradeVerification: "Atualizar verificação →",
    businessVault: "Cofre Comercial Empresarial",
    personalWallet: "Carteira Pessoal",
    acctLedgerBalance: (id: string) => `Conta ${id} · Saldo do razão de partida dobrada`,
    topUpStatement: "Carregar / Extrato →",
    escrowPrimary: "Caução Principal",
    activeInvoices: "Faturas Ativas",
    totalInvoicesLedger: (n: number) => `${n} faturas totais no razão`,
    unreadNotices: "Avisos Não Lidos",
    actionableAlerts: "Alertas de liquidação acionáveis",
    allNoticesRead: "Todos os avisos de liquidação lidos",
    cashflowVelocity: (p: number) => `Fluxo de Caixa e Velocidade (${p}d)`,
    fullAnalytics: "Análises completas →",
    outboundSent: "Enviado (Saída)",
    inboundReceived: "Recebido (Entrada)",
    settlementsCount: (n: number) => `${n} liquidações`,
    avgTicket: "Ticket Médio",
    peakSub: (peak: string) => `Pico ${peak}`,
    crossBorder: "Transfronteiriço",
    fxConversions: "Conversões cambiais FX",
    moneyOutUsd: "Saídas (eq. USD)",
    moneyInUsd: "Entradas (eq. USD)",
    moneyInOutAria: "Entradas e saídas por dia, equivalente em USD",
    settlementReliability: "Fiabilidade de Liquidação",
    settlementOutcomesAria: "Resultados de liquidação",
    succeeded: "Concluídos",
    failed: "Falhados",
    reversed: "Revertidos",
    successRate: "Taxa de sucesso",
    settled: "Liquidados",
    topCounterparties: "Principais Contrapartes",
    volumeChip: "Volume",
    topCounterpartiesAria: "Principais contrapartes por volume",
    topCounterpartiesEmpty:
      "Conclua o seu primeiro pagamento transfronteiriço para classificar contrapartes.",
    settledPaymentsNote: (n: number) => `${n} pagamento${n === 1 ? "" : "s"} liquidado${n === 1 ? "" : "s"}`,
    recentTransfers: "Transferências Recentes do Razão",
    allTransfers: "Todas as transferências →",
    transfersEmpty:
      "Ainda sem transferências. Carregue a sua carteira empresarial para começar.",
    outboundSettlement: "Liquidação de Saída",
    inboundReceipt: "Recebimento de Entrada",
    internalBookTransfer: "Transferência Interna",
    feedTitle: "Feed de Liquidação e Apoio",
    unreadChip: (n: number) => `${n} por ler`,
    nothingToReport: "Nada a reportar.",
    readBtn: "Lido",
  },
  rw: {
    eyebrow: "Isanduku y'Ubucuruzi bw'Ikigo",
    welcome: (name: string) => `Ikaze nanone, ${name}`,
    heroLead:
      "Amafaranga yawe y'ubucuruzi n'ay'umuntu ku giti cye, atandukanyijwe neza mu gitabo. Funga escrow zishingiye ku nyemezabuguzi, wishyure mu nzira 10 za Afurika kandi wubake icyizere cy'inguzanyo y'ubucuruzi.",
    sendCrossBorder: "Ohereza Ubwishyu Mpuzamahanga",
    invoicesEscrow: "Inyemezabuguzi na Escrow",
    fundStatements: "ongeramo Amafaranga / Inyandiko",
    trustPassport: "Pasiporo y'Icyizere",
    scaleFallback: "Igipimo 300–850",
    settledCycles: (n: number) => `inshuro ${n} zarangiye`,
    ledgerDerived: "Biva mu gitabo",
    inspect: "igenzura →",
    dailyCorridorLimit: "Imbibi y'Umunsi y'Inzira",
    dailyCapRemaining: (cap: string) => `kuri ${cap} by'imbibi y'umunsi bisigaye`,
    tierStandingLimits: "Urwego n'imbibi za KYC",
    tierPrefix: (tier: string) => `Urwego: ${tier}`,
    manage: "Cunga →",
    complianceStanding: (status: string) => `Urwego rw'Iyubahirizategeko · ${status}`,
    complianceBody:
      "uzuza igenzura ry'umwirondoro w'umucuruzi n'iyandikishwa ry'ubucuruzi kugira ngo ufungure imbibi nini z'ubwishyu.",
    upgradeVerification: "Zamora urwego rw'igenzura →",
    businessVault: "Isanduku y'Ubucuruzi",
    personalWallet: "Ikofi Bwite",
    acctLedgerBalance: (id: string) => `Konti ${id} · Asigaye mu gitabo`,
    topUpStatement: "Ongeramo / Inyandiko →",
    escrowPrimary: "Escrow y'Ibanze",
    activeInvoices: "Inyemezabuguzi Zikora",
    totalInvoicesLedger: (n: number) => `inyemezabuguzi ${n} zose mu gitabo`,
    unreadNotices: "Ubutumwa Budasomye",
    actionableAlerts: "Imenyesha ry'ubwishyu risaba igikorwa",
    allNoticesRead: "Imenyesha ryose ry'ubwishyu ryasomwe",
    cashflowVelocity: (p: number) => `Uko Amafaranga Agenda n'Umuvuduko (iminsi ${p})`,
    fullAnalytics: "Isesengura ryuzuye →",
    outboundSent: "Ayoherejwe Hanze",
    inboundReceived: "Ayakiriwe",
    settlementsCount: (n: number) => `ubwishyu ${n}`,
    avgTicket: "Impuzandengo",
    peakSub: (peak: string) => `Agasongero ${peak}`,
    crossBorder: "Mpuzamahanga",
    fxConversions: "Ivunjisha ry'amafaranga FX",
    moneyOutUsd: "Asohoka (USD)",
    moneyInUsd: "Ayinjira (USD)",
    moneyInOutAria: "Amafaranga yinjira n'asohoka ku munsi, mu gaciro ka USD",
    settlementReliability: "Uko Ubwishyu Bwizewe",
    settlementOutcomesAria: "Ibyavuye mu bwishyu",
    succeeded: "Byatunganye",
    failed: "Byanze",
    reversed: "Byasubijwe",
    successRate: "Igipimo cyo gutungana",
    settled: "Byarangiye",
    topCounterparties: "Abafatanyabikorwa B'imbere",
    volumeChip: "Ingano",
    topCounterpartiesAria: "Abafatanyabikorwa b'imbere ukurikije ingano",
    topCounterpartiesEmpty:
      "Rangiza ubwishyu bwawe bwa mbere mpuzamahanga kugira ngo utondeke abafatanyabikorwa.",
    settledPaymentsNote: (n: number) => `ubwishyu ${n} bwarangiye`,
    recentTransfers: "Ihererekanya rya Vuba mu Gitabo",
    allTransfers: "Ihererekanya ryose →",
    transfersEmpty: "Nta hererekanya rirakorwa. Ongeramo amafaranga mu ikofi y'ubucuruzi utangire.",
    outboundSettlement: "Ubwishyu Bwoherejwe",
    inboundReceipt: "Ubwishyu Bwakiriwe",
    internalBookTransfer: "Ihererekanya ry'Imbere",
    feedTitle: "Amakuru y'Ubwishyu n'Ubufasha",
    unreadChip: (n: number) => `${n} bidasomye`,
    nothingToReport: "Nta makuru mashya.",
    readBtn: "Soma",
  },
} as const;

/** This-week-vs-last-week change from a daily series — a real computed figure, never fabricated. */
function weekOverWeek(daily: { value: number }[]): MetricTrend | undefined {
  if (daily.length < 14) return undefined;
  const last = daily.slice(-7).reduce((s, d) => s + d.value, 0);
  const prior = daily.slice(-14, -7).reduce((s, d) => s + d.value, 0);
  if (prior === 0) return undefined;
  const percent = Math.round(((last - prior) / prior) * 100);
  if (percent === 0) return { direction: "flat", percent: 0 };
  return { direction: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}

export function TraderHome() {
  const trader = useTrader();
  const copy = useLangCopy(HOME_COPY);
  const qc = useQueryClient();
  const wallet = useWallet();
  const transfers = useTransfers();
  const notifications = useNotifications();
  const [period, setPeriod] = useState<Period>(30);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );
  const unread = (notifications.data ?? []).filter((n) => !n.read_at);

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, trader.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(describeError(e)),
  });

  const analytics = useQuery({
    queryKey: ["analytics", "trader", period],
    queryFn: () => platform.analytics(period),
    staleTime: 60_000,
  });

  const trust = useQuery({
    queryKey: ["trust-score"],
    queryFn: platform.trust,
    staleTime: 120_000,
    retry: false,
  });

  const standing = useQuery({
    queryKey: ["standing"],
    queryFn: platform.standing,
    staleTime: 120_000,
    retry: false,
  });

  const invoiceList = useQuery({
    queryKey: ["invoices", trader.id],
    queryFn: () => invoices.list(trader.id),
    staleTime: 60_000,
    retry: false,
  });

  const verified =
    trader.kyc_status === "VERIFIED" ||
    trader.kyc_status === "APPROVED" ||
    trader.kyc_status === "BUSINESS_VERIFIED";

  const openInvoices = useMemo(
    () => (invoiceList.data ?? []).filter((inv) => inv.status !== "PAID"),
    [invoiceList.data],
  );

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
        />
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 hidden w-[340px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                {copy.eyebrow}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                {trader.phone_number}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  verified
                    ? "bg-[#c2f74d] text-[#151515]"
                    : "border border-white/20 bg-white/10 text-white/80"
                }`}
              >
                {trader.kyc_status}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {copy.welcome(trader.full_name)}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              {copy.heroLead}
            </p>

            {/* Primary Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
              >
                <Link to="/send">
                  <Send className="mr-1.5 size-3.5" /> {copy.sendCrossBorder}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/escrow">
                  <FileText className="mr-1.5 size-3.5" /> {copy.invoicesEscrow}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/wallets">
                  <Wallet className="mr-1.5 size-3.5" /> {copy.fundStatements}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSimulatorOpen(true)}
                className="h-10 rounded-xl border-[#c2f74d]/50 bg-[#c2f74d]/10 px-4 font-mono text-xs uppercase text-[#c2f74d] hover:bg-[#c2f74d]/20"
              >
                <Sparkles className="mr-1.5 size-3.5" /> 1-Click Simulator
              </Button>
            </div>
          </div>

          {/* Right Live Trade-Credit & Limit Telemetry Card */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/trust-score"
              className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition hover:border-[#c2f74d]/60 hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  {copy.trustPassport}
                </span>
                <Sparkles className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="font-mono text-3xl font-bold tabular-nums text-white">
                  {trust.data ? trust.data.score : "—"}
                </span>
                <span className="rounded-full bg-[#c2f74d]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#c2f74d]">
                  {trust.data ? trust.data.band : copy.scaleFallback}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10px] text-white/60">
                <span>
                  {trust.data ? copy.settledCycles(trust.data.cycles_scored) : copy.ledgerDerived}
                </span>
                <span className="text-[#c2f74d] group-hover:underline">{copy.inspect}</span>
              </div>
            </Link>

            <Link
              to="/verification"
              className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition hover:border-[#c2f74d]/60 hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  {copy.dailyCorridorLimit}
                </span>
                <ShieldCheck className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-3">
                <div className="font-mono text-xl font-bold tabular-nums text-white">
                  {standing.data
                    ? usd0(Math.max(0, standing.data.limits.daily_usd - standing.data.used_day_usd))
                    : trader.kyc_status}
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-white/55">
                  {standing.data
                    ? copy.dailyCapRemaining(usd0(standing.data.limits.daily_usd))
                    : copy.tierStandingLimits}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10px] text-white/60">
                <span>{copy.tierPrefix(standing.data?.kyc_status ?? trader.kyc_status)}</span>
                <span className="text-[#c2f74d] group-hover:underline">{copy.manage}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Callout if not yet verified */}
      {!verified ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#79b200]/40 bg-[#f5fbe6] px-5 py-4 text-[#151515]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4d7500]">
                {copy.complianceStanding(trader.kyc_status)}
              </div>
              <p className="mt-0.5 max-w-2xl text-xs text-[#33362e]">
                {copy.complianceBody}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-[#151515] font-mono text-[10px] uppercase text-[#c2f74d] hover:bg-[#151515]/90"
          >
            <Link to="/verification">{copy.upgradeVerification}</Link>
          </Button>
        </div>
      ) : null}

      {/* Segregated Corporate Treasury Wallets + Live Counterparty Metrics */}
      <QueryBoundary query={wallet}>
        {(w) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a, i) => {
              const isBiz = a.type === "BUSINESS";
              const bal = w.balances[a.id]?.amount ?? 0;
              return (
                <div
                  key={a.id}
                  style={{ "--dash-delay": `${i * 60}ms` } as React.CSSProperties}
                  className={`dash-in relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                    isBiz
                      ? "border-[#79b200]/50 bg-gradient-to-br from-[#f8fde9] via-white to-white text-[#151515] shadow-[0_16px_38px_-18px_rgba(121,178,0,0.22)] dark:from-[#1b2210] dark:via-card dark:to-card dark:text-foreground"
                      : "border-border bg-card text-foreground shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span
                        className={`flex size-7 items-center justify-center rounded-lg ${
                          isBiz
                            ? "bg-[#151515] text-[#c2f74d]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isBiz ? (
                          <Briefcase className="size-3.5" />
                        ) : (
                          <UserRound className="size-3.5" />
                        )}
                      </span>
                      {isBiz ? copy.businessVault : copy.personalWallet}
                    </span>
                    <span className="rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] font-semibold">
                      {a.currency}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-mono text-2xl font-bold tabular-nums tracking-tight sm:text-[28px]">
                      {money(bal, a.currency)}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {copy.acctLedgerBalance(shortId(a.id))}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                    <Link
                      to="/wallets"
                      className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground hover:underline"
                    >
                      {copy.topUpStatement}
                    </Link>
                    {isBiz ? (
                      <span className="rounded-full bg-[#c2f74d]/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-foreground">
                        {copy.escrowPrimary}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <Metric
              icon={FileText}
              tone="primary"
              label={copy.activeInvoices}
              value={openInvoices.length}
              sub={copy.totalInvoicesLedger((invoiceList.data ?? []).length)}
              delay={w.accounts.length * 60}
            />

            <Metric
              icon={Bell}
              tone={unread.length > 0 ? "destructive" : "success"}
              label={copy.unreadNotices}
              value={unread.length}
              sub={unread.length > 0 ? copy.actionableAlerts : copy.allNoticesRead}
              delay={(w.accounts.length + 1) * 60}
            />
          </div>
        )}
      </QueryBoundary>

      {/* Main Analytics & Cashflow Telemetry Workbench */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={copy.cashflowVelocity(period)}
          className="lg:col-span-2"
          delay={200}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <PeriodPicker value={period} onChange={setPeriod} />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 rounded-lg font-mono text-[10px] uppercase"
              >
                <Link to="/analytics">{copy.fullAnalytics}</Link>
              </Button>
            </div>
          }
        >
          <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
            {(r) => (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric
                    label={copy.outboundSent}
                    value={usd0(r.totals.sent_usd)}
                    sub={copy.settlementsCount(r.totals.payments_out)}
                    trend={
                      weekOverWeek(r.daily.map((d) => ({ value: d.out_usd }))) ?? (
                        <Sparkline values={r.daily.map((d) => d.out_usd)} />
                      )
                    }
                  />
                  <Metric
                    label={copy.inboundReceived}
                    value={usd0(r.totals.received_usd)}
                    sub={copy.settlementsCount(r.totals.payments_in)}
                    tone="success"
                    trend={
                      weekOverWeek(r.daily.map((d) => ({ value: d.in_usd }))) ?? (
                        <Sparkline values={r.daily.map((d) => d.in_usd)} />
                      )
                    }
                  />
                  <Metric
                    label={copy.avgTicket}
                    value={usd0(r.totals.avg_payment_usd)}
                    sub={copy.peakSub(usd0(r.totals.largest_payment_usd))}
                    tone="muted"
                  />
                  <Metric
                    icon={Globe2}
                    label={copy.crossBorder}
                    value={r.totals.cross_currency_payments}
                    sub={copy.fxConversions}
                    tone="primary"
                  />
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
                  <LazyTrendChart
                    data={r.daily.map((d) => ({
                      label: d.date.slice(5),
                      a: d.out_usd,
                      b: d.in_usd,
                    }))}
                    aName={copy.moneyOutUsd}
                    bName={copy.moneyInUsd}
                    ariaLabel={copy.moneyInOutAria}
                    format={usd0}
                  />
                </div>
              </div>
            )}
          </QueryBoundary>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title={copy.settlementReliability} delay={260}>
            <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
              {(r) => (
                <div className="space-y-4">
                  <LazyDonutChart
                    ariaLabel={copy.settlementOutcomesAria}
                    data={[
                      { label: copy.succeeded, value: r.totals.succeeded },
                      { label: copy.failed, value: r.totals.failed },
                      { label: copy.reversed, value: r.totals.reversed },
                    ]}
                    center={{
                      value: `${Math.round(r.totals.success_rate * 100)}%`,
                      label: copy.successRate,
                    }}
                    format={(v) => String(v)}
                  />
                  <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center font-mono text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">{copy.settled}</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.succeeded}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">{copy.failed}</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.failed}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">{copy.reversed}</div>
                      <div className="mt-0.5 font-bold text-foreground">{r.totals.reversed}</div>
                    </div>
                  </div>
                </div>
              )}
            </QueryBoundary>
          </Panel>

          <Panel
            title={copy.topCounterparties}
            delay={300}
            meta={
              <Chip tone="live">
                <TrendingUp className="size-3" /> {copy.volumeChip}
              </Chip>
            }
          >
            <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
              {(r) => (
                <RankedBars
                  ariaLabel={copy.topCounterpartiesAria}
                  empty={copy.topCounterpartiesEmpty}
                  items={(r.counterparties ?? []).slice(0, 4).map((c) => ({
                    label: c.name,
                    value: c.volume_usd,
                    display: usdCompact(c.volume_usd),
                    note: copy.settledPaymentsNote(c.count),
                  }))}
                />
              )}
            </QueryBoundary>
          </Panel>
        </div>
      </div>

      {/* Bottom Row: Recent Ledger Activity + Active Invoices + Notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          delay={340}
          title={copy.recentTransfers}
          className="lg:col-span-2"
          meta={
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
            >
              <Link to="/wallets">{copy.allTransfers}</Link>
            </Button>
          }
        >
          <QueryBoundary
            query={transfers}
            isEmpty={(d) => d.length === 0}
            empty={copy.transfersEmpty}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((t) => {
                  const dir = directionFor(t, ownIds);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            dir === "out"
                              ? "bg-muted text-foreground"
                              : dir === "in"
                                ? "bg-[#c2f74d]/35 text-foreground"
                                : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {dir === "out" ? (
                            <ArrowUpRight className="size-4" />
                          ) : dir === "in" ? (
                            <ArrowDownLeft className="size-4 text-[#4d7500]" />
                          ) : (
                            <ArrowRight className="size-4" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <span>
                              {dir === "out"
                                ? copy.outboundSettlement
                                : dir === "in"
                                  ? copy.inboundReceipt
                                  : copy.internalBookTransfer}
                            </span>
                            <span className="text-muted-foreground">· {shortId(t.id)}</span>
                            {t.invoice_number ? (
                              <span className="rounded bg-[#c2f74d]/30 px-1.5 py-0.5 text-[10px] text-foreground">
                                {t.invoice_number}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {when(t.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {dir === "out" ? "−" : dir === "in" ? "+" : ""}
                          {money(t.amount, t.currency)}
                        </span>
                        <Chip
                          tone={
                            t.status === "SUCCESS"
                              ? "live"
                              : t.status === "FAILED" || t.status === "REVERSED"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {t.status}
                        </Chip>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </QueryBoundary>
        </Panel>

        <Panel
          delay={400}
          title={copy.feedTitle}
          meta={<Chip tone={unread.length > 0 ? "live" : "neutral"}>{copy.unreadChip(unread.length)}</Chip>}
        >
          <QueryBoundary
            query={notifications}
            isEmpty={(d) => d.length === 0}
            empty={copy.nothingToReport}
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div
                          className={
                            n.read_at
                              ? "text-sm text-muted-foreground"
                              : "flex items-center gap-1.5 text-sm font-semibold text-foreground"
                          }
                        >
                          {!n.read_at ? (
                            <span className="size-1.5 rounded-full bg-[#79b200]" />
                          ) : null}
                          {n.title}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {n.body}
                        </p>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {when(n.created_at)}
                        </div>
                      </div>
                      {!n.read_at ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 shrink-0 rounded-lg px-2 font-mono text-[10px] uppercase"
                          disabled={markRead.isPending}
                          onClick={() => markRead.mutate(n.id)}
                        >
                          {copy.readBtn}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>
      </div>

      <TradeSimulatorModal
        open={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
}
