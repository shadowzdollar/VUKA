import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Gavel,
  Lock,
  Radio,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Split,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { PeriodPicker, usd0, usdCompact, type Period } from "@/components/vuka/analytics-parts";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { Gauge, Sparkline } from "@/components/vuka/viz/simple";
import { describeError } from "@/lib/api/client";
import { corridors, operator, pilots, settlements } from "@/lib/api/endpoints";
import type { ReconciliationStatus } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { money, tokenUnits, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { useOperator } from "@/lib/session";

const COPY: Record<
  Lang,
  {
    alertAck: string;
    alertAckErr: string;
    nocBadge: string;
    nocTitle: string;
    nocDesc: string;
    btnDisputes: string;
    btnEscrow: string;
    btnCompliance: string;
    btnTreasury: string;
    tvlLabel: string;
    chainLabel: (id: number) => string;
    unscoped: string;
    indexedContracts: (n: number) => string;
    locked: string;
    released: string;
    refunded: string;
    disputed: string;
    escrowLocked: string;
    escrowLockedSub: string;
    releasedSub: string;
    refundedSub: string;
    disputedFrozen: string;
    disputedFrozenSub: string;
    splitRulings: string;
    splitRulingsSub: string;
    pulseTitle: (d: number) => string;
    netIntelLink: string;
    settledVolume: string;
    settledPaymentsSub: (n: number) => string;
    netReliability: string;
    failedReversedSub: (f: number, r: number) => string;
    activeTraders: string;
    tradersSub: (newT: number, totalT: number) => string;
    walletCashIn: string;
    walletCashInSub: string;
    settlementSla: string;
    slaSub: (ok: number, fail: number) => string;
    settledVolAxis: string;
    settledVolAria: string;
    currencyMix: string;
    settledByCurrAria: string;
    usdEq: string;
    railHealthTitle: string;
    corridorsRailsLink: string;
    halted: string;
    online: string;
    degraded: string;
    adapterReady: string;
    offline: string;
    indexerTitle: string;
    enterContractRecon: string;
    blockFinalitySync: (cur: string, fin: string) => string;
    cursorLabel: string;
    latestBlockLabel: string;
    finalizedBlockLabel: string;
    blockLagLabel: string;
    blockLagVal: (lag: number, warn: number, crit: number) => string;
    workerPollsLabel: string;
    eventsAppliedLabel: string;
    workerErrorsLabel: string;
    alertHeading: (lvl: string) => string;
    alertWorkerErrs: (errs: number) => string;
    alertLagBlocks: (lag: number) => string;
    acknowledgedBy: (by: string, at: string) => string;
    acknowledgeBtn: string;
    safetyPolicyTitle: string;
    enforced: string;
    globalKillSwitch: string;
    active: string;
    off: string;
    liveExecution: string;
    enabled: string;
    disabled: string;
    approvalsRequired: string;
    operatorsCount: (n: number) => string;
    perCommandCap: string;
    pendingCommands: string;
    killSwitchNote: string;
    pilotsTitle: string;
    providersHealthy: string;
    providersHalted: string;
    activePilots: string;
    observationOnly: string;
    yes: string;
    no: string;
  }
> = {
  en: {
    alertAck: "Alert acknowledged",
    alertAckErr: "Could not acknowledge",
    nocBadge: "Executive Operations · NOC",
    nocTitle: "Settlement & Risk Cockpit",
    nocDesc:
      "Real-time Polygon USDC escrow exposure, block-indexer finality, African mobile-money rail telemetry, and dual-approval settlement governance in one unified command center.",
    btnDisputes: "Dispute Tribunal",
    btnEscrow: "Escrow Register",
    btnCompliance: "Compliance & KYC",
    btnTreasury: "Treasury Policy",
    tvlLabel: "On-Chain Escrow Contract TVL",
    chainLabel: (id) => `Chain #${id}`,
    unscoped: "Unscoped",
    indexedContracts: (n) => `${n} indexed contracts`,
    locked: "Locked",
    released: "Released",
    refunded: "Refunded",
    disputed: "Disputed",
    escrowLocked: "Escrow Locked",
    escrowLockedSub: "Active buyer commitments",
    releasedSub: "Settled to suppliers",
    refundedSub: "Returned to buyers",
    disputedFrozen: "Disputed / Frozen",
    disputedFrozenSub: "Under arbiter hold",
    splitRulings: "Split Rulings",
    splitRulingsSub: "Pro-rata arbitration",
    pulseTitle: (d) => `Network Pulse & Corridor Throughput (${d}d)`,
    netIntelLink: "Network intelligence →",
    settledVolume: "Settled Volume",
    settledPaymentsSub: (n) => `${n} settled payments`,
    netReliability: "Network Reliability",
    failedReversedSub: (f, r) => `${f} failed · ${r} reversed`,
    activeTraders: "Active Traders",
    tradersSub: (newT, totalT) => `${newT} new · ${totalT} registered`,
    walletCashIn: "Wallet Cash-In",
    walletCashInSub: "Mobile-money collection volume",
    settlementSla: "Settlement SLA",
    slaSub: (ok, fail) => `${ok} ok · ${fail} failed`,
    settledVolAxis: "Settled volume (USD eq.)",
    settledVolAria: "Settled volume per day, USD equivalent",
    currencyMix: "Currency Mix",
    settledByCurrAria: "Settled volume by currency",
    usdEq: "USD eq.",
    railHealthTitle: "African Payment Rail Health & Adapter Telemetry",
    corridorsRailsLink: "Corridors & rails →",
    halted: "HALTED",
    online: "ONLINE",
    degraded: "DEGRADED",
    adapterReady: "Adapter Ready",
    offline: "Offline",
    indexerTitle: "Chain Indexer & Finality Reconciliation",
    enterContractRecon: "Enter the escrow contract above to see reconciliation status.",
    blockFinalitySync: (cur, fin) => `Block Finality Sync (${cur} / ${fin})`,
    cursorLabel: "Cursor (indexed to)",
    latestBlockLabel: "Latest head block",
    finalizedBlockLabel: "Finalized block",
    blockLagLabel: "Block lag",
    blockLagVal: (lag, warn, crit) => `${lag} (warn ${warn} / crit ${crit})`,
    workerPollsLabel: "Worker polls",
    eventsAppliedLabel: "Events applied",
    workerErrorsLabel: "Worker errors",
    alertHeading: (lvl) => `${lvl} alert`,
    alertWorkerErrs: (errs) => `The worker has reported ${errs} error${errs === 1 ? "" : "s"}.`,
    alertLagBlocks: (lag) => `Indexing is behind by ${lag} finalized blocks.`,
    acknowledgedBy: (by, at) => `Acknowledged by ${by} · ${at}`,
    acknowledgeBtn: "Acknowledge",
    safetyPolicyTitle: "Settlement Safety Policy",
    enforced: "Enforced",
    globalKillSwitch: "Global kill switch",
    active: "ACTIVE",
    off: "off",
    liveExecution: "Live execution",
    enabled: "enabled",
    disabled: "disabled",
    approvalsRequired: "Approvals required",
    operatorsCount: (n) => `${n} operators`,
    perCommandCap: "Per-command cap",
    pendingCommands: "Pending commands",
    killSwitchNote:
      "The global kill switch is deployment configuration (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) and cannot be overridden from the browser.",
    pilotsTitle: "Corridor Pilots & Readiness",
    providersHealthy: "Providers healthy",
    providersHalted: "Providers halted",
    activePilots: "Active pilots",
    observationOnly: "Observation only",
    yes: "yes",
    no: "no",
  },
  fr: {
    alertAck: "Alerte acquittée",
    alertAckErr: "Impossible d'acquitter l'alerte",
    nocBadge: "Opérations exécutives · NOC",
    nocTitle: "Poste de règlement et de risque",
    nocDesc:
      "Exposition séquestre USDC Polygon en temps réel, finalité de l'indexeur de blocs, télémétrie des rails mobile-money africains et gouvernance de règlement à double approbation dans un centre de commande unifié.",
    btnDisputes: "Tribunal des litiges",
    btnEscrow: "Registre des séquestres",
    btnCompliance: "Conformité et KYC",
    btnTreasury: "Politique de trésorerie",
    tvlLabel: "TVL du contrat de séquestre sur chaîne",
    chainLabel: (id) => `Chaîne #${id}`,
    unscoped: "Non défini",
    indexedContracts: (n) => `${n} contrats indexés`,
    locked: "Verrouillé",
    released: "Libéré",
    refunded: "Remboursé",
    disputed: "En litige",
    escrowLocked: "Séquestre verrouillé",
    escrowLockedSub: "Engagements acheteurs actifs",
    releasedSub: "Réglé aux fournisseurs",
    refundedSub: "Retourné aux acheteurs",
    disputedFrozen: "En litige / Gelé",
    disputedFrozenSub: "Sous blocage d'arbitre",
    splitRulings: "Décisions partagées",
    splitRulingsSub: "Arbitrage au prorata",
    pulseTitle: (d) => `Impulsion réseau et débit des corridors (${d}j)`,
    netIntelLink: "Intelligence réseau →",
    settledVolume: "Volume réglé",
    settledPaymentsSub: (n) => `${n} paiements réglés`,
    netReliability: "Fiabilité du réseau",
    failedReversedSub: (f, r) => `${f} échoués · ${r} annulés`,
    activeTraders: "Commerçants actifs",
    tradersSub: (newT, totalT) => `${newT} nouveaux · ${totalT} inscrits`,
    walletCashIn: "Encaissement portefeuille",
    walletCashInSub: "Volume de collecte mobile-money",
    settlementSla: "SLA de règlement",
    slaSub: (ok, fail) => `${ok} ok · ${fail} échoués`,
    settledVolAxis: "Volume réglé (éq. USD)",
    settledVolAria: "Volume réglé par jour, équivalent USD",
    currencyMix: "Répartition des devises",
    settledByCurrAria: "Volume réglé par devise",
    usdEq: "éq. USD",
    railHealthTitle: "Santé des rails de paiement africains et télémétrie des adaptateurs",
    corridorsRailsLink: "Corridors et rails →",
    halted: "ARRÊTÉ",
    online: "EN LIGNE",
    degraded: "DÉGRADÉ",
    adapterReady: "Adaptateur prêt",
    offline: "Hors ligne",
    indexerTitle: "Indexeur de chaîne et rapprochement de finalité",
    enterContractRecon: "Saisissez le contrat de séquestre ci-dessus pour voir l'état de rapprochement.",
    blockFinalitySync: (cur, fin) => `Synchro de finalité des blocs (${cur} / ${fin})`,
    cursorLabel: "Curseur (indexé jusqu'à)",
    latestBlockLabel: "Dernier bloc de tête",
    finalizedBlockLabel: "Bloc finalisé",
    blockLagLabel: "Retard de blocs",
    blockLagVal: (lag, warn, crit) => `${lag} (avert. ${warn} / crit. ${crit})`,
    workerPollsLabel: "Sondages du worker",
    eventsAppliedLabel: "Événements appliqués",
    workerErrorsLabel: "Erreurs du worker",
    alertHeading: (lvl) => `Alerte ${lvl}`,
    alertWorkerErrs: (errs) => `Le worker a signalé ${errs} erreur${errs === 1 ? "" : "s"}.`,
    alertLagBlocks: (lag) => `L'indexation accuse un retard de ${lag} blocs finalisés.`,
    acknowledgedBy: (by, at) => `Acquittée par ${by} · ${at}`,
    acknowledgeBtn: "Acquitter",
    safetyPolicyTitle: "Politique de sécurité des règlements",
    enforced: "Appliquée",
    globalKillSwitch: "Coupe-circuit global",
    active: "ACTIF",
    off: "désactivé",
    liveExecution: "Exécution en direct",
    enabled: "activée",
    disabled: "désactivée",
    approvalsRequired: "Approbations requises",
    operatorsCount: (n) => `${n} opérateurs`,
    perCommandCap: "Plafond par commande",
    pendingCommands: "Commandes en attente",
    killSwitchNote:
      "Le coupe-circuit global est une configuration de déploiement (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) et ne peut pas être contourné depuis le navigateur.",
    pilotsTitle: "Pilotes de corridors et disponibilité",
    providersHealthy: "Opérateurs sains",
    providersHalted: "Opérateurs arrêtés",
    activePilots: "Pilotes actifs",
    observationOnly: "Observation uniquement",
    yes: "oui",
    no: "non",
  },
  sw: {
    alertAck: "Arifa imethibitishwa",
    alertAckErr: "Imeshindwa kuthibitisha arifa",
    nocBadge: "Uendeshaji Mkuu · NOC",
    nocTitle: "Kituo cha Malipo na Hatari",
    nocDesc:
      "Mfiduo wa escrow ya Polygon USDC kwa wakati halisi, ukomo wa vihifadhi-bloku, telemetri ya mitandao ya pesa kwa simu Afrika, na usimamizi wa malipo ya idhini mbili katika kituo kimoja.",
    btnDisputes: "Baraza la Migogoro",
    btnEscrow: "Rejista ya Escrow",
    btnCompliance: "Utii na KYC",
    btnTreasury: "Sera ya Hazina",
    tvlLabel: "TVL ya Mkataba wa Escrow kwenye Mnyororo",
    chainLabel: (id) => `Mnyororo #${id}`,
    unscoped: "Bila Wigo",
    indexedContracts: (n) => `mikataba ${n} iliyoorodheshwa`,
    locked: "Imefungwa",
    released: "Imetolewa",
    refunded: "Imerudishwa",
    disputed: "Inabishaniwa",
    escrowLocked: "Escrow Iliyofungwa",
    escrowLockedSub: "Ahadi hai za wanunuzi",
    releasedSub: "Imelipwa kwa wasambazaji",
    refundedSub: "Imerudishwa kwa wanunuzi",
    disputedFrozen: "Inabishaniwa / Imesimamishwa",
    disputedFrozenSub: "Chini ya zuio la msuluhishi",
    splitRulings: "Maamuzi ya Mgawanyo",
    splitRulingsSub: "Usuluhishi wa uwiano",
    pulseTitle: (d) => `Mdundo wa Mtandao na Upitishaji wa Njia (${d}d)`,
    netIntelLink: "Akili ya mtandao →",
    settledVolume: "Kiasi Kilicholipwa",
    settledPaymentsSub: (n) => `malipo ${n} yaliyokamilika`,
    netReliability: "Uaminifu wa Mtandao",
    failedReversedSub: (f, r) => `${f} yameshindwa · ${r} yamerudishwa`,
    activeTraders: "Wafanyabiashara Hai",
    tradersSub: (newT, totalT) => `${newT} wapya · ${totalT} waliosajiliwa`,
    walletCashIn: "Uwekaji Pesa kwenye Pochi",
    walletCashInSub: "Kiasi cha makusanyo ya pesa kwa simu",
    settlementSla: "SLA ya Malipo",
    slaSub: (ok, fail) => `${ok} sawa · ${fail} yameshindwa`,
    settledVolAxis: "Kiasi kilicholipwa (sawa na USD)",
    settledVolAria: "Kiasi kilicholipwa kwa siku, sawa na USD",
    currencyMix: "Mchanganyiko wa Sarafu",
    settledByCurrAria: "Kiasi kilicholipwa kwa sarafu",
    usdEq: "sawa na USD",
    railHealthTitle: "Afya ya Njia za Malipo Afrika na Telemetri ya Adapta",
    corridorsRailsLink: "Njia na mitandao →",
    halted: "IMESIMAMISHWA",
    online: "MTANDAONI",
    degraded: "IMEZOROTA",
    adapterReady: "Adapta Iko Tayari",
    offline: "Nje ya Mtandao",
    indexerTitle: "Kiorodheshi cha Mnyororo na Upatanisho wa Ukomo",
    enterContractRecon: "Weka anwani ya mkataba wa escrow hapo juu ili kuona hali ya upatanisho.",
    blockFinalitySync: (cur, fin) => `Usawazishaji wa Ukomo wa Bloku (${cur} / ${fin})`,
    cursorLabel: "Kielekezi (imeorodheshwa hadi)",
    latestBlockLabel: "Bloku ya hivi punde",
    finalizedBlockLabel: "Bloku iliyokamilika",
    blockLagLabel: "Ucheleweshaji wa bloku",
    blockLagVal: (lag, warn, crit) => `${lag} (onyo ${warn} / hatari ${crit})`,
    workerPollsLabel: "Ukaguzi wa mfanyakazi",
    eventsAppliedLabel: "Matukio yaliyotumika",
    workerErrorsLabel: "Hitilafu za mfanyakazi",
    alertHeading: (lvl) => `Arifa ya ${lvl}`,
    alertWorkerErrs: (errs) => `Mfanyakazi ameripoti hitilafu ${errs}.`,
    alertLagBlocks: (lag) => `Uorodheshaji uko nyuma kwa bloku ${lag} zilizokamilika.`,
    acknowledgedBy: (by, at) => `Imethibitishwa na ${by} · ${at}`,
    acknowledgeBtn: "Thibitisha",
    safetyPolicyTitle: "Sera ya Usalama wa Malipo",
    enforced: "Inatekelezwa",
    globalKillSwitch: "Swichi kuu ya kuzima",
    active: "INAfANYA KAZI",
    off: "imezimwa",
    liveExecution: "Utekelezaji wa moja kwa moja",
    enabled: "imewashwa",
    disabled: "imezimwa",
    approvalsRequired: "Idhini zinazohitajika",
    operatorsCount: (n) => `waendeshaji ${n}`,
    perCommandCap: "Kikomo kwa amri",
    pendingCommands: "Amri zinazosubiri",
    killSwitchNote:
      "Swichi kuu ya kuzima ni usanidi wa usambazaji (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) na haiwezi kubadilishwa kutoka kwenye kivinjari.",
    pilotsTitle: "Majaribio ya Njia na Utayari",
    providersHealthy: "Watoa huduma wazima",
    providersHalted: "Watoa huduma waliosimamishwa",
    activePilots: "Majaribio hai",
    observationOnly: "Uchunguzi pekee",
    yes: "ndiyo",
    no: "hapana",
  },
  pt: {
    alertAck: "Alerta reconhecido",
    alertAckErr: "Não foi possível reconhecer",
    nocBadge: "Operações Executivas · NOC",
    nocTitle: "Centro de Liquidação e Risco",
    nocDesc:
      "Exposição de caução USDC na Polygon em tempo real, finalidade do indexador de blocos, telemetria de redes mobile-money africanas e governação de liquidação com dupla aprovação num centro de comando unificado.",
    btnDisputes: "Tribunal de Litígios",
    btnEscrow: "Registo de Caução",
    btnCompliance: "Conformidade e KYC",
    btnTreasury: "Política de Tesouraria",
    tvlLabel: "TVL do Contrato de Caução On-Chain",
    chainLabel: (id) => `Rede #${id}`,
    unscoped: "Sem escopo",
    indexedContracts: (n) => `${n} contratos indexados`,
    locked: "Bloqueado",
    released: "Libertado",
    refunded: "Reembolsado",
    disputed: "Em litígio",
    escrowLocked: "Caução Bloqueada",
    escrowLockedSub: "Compromissos ativos de compradores",
    releasedSub: "Liquidado a fornecedores",
    refundedSub: "Devolvido a compradores",
    disputedFrozen: "Em Litígio / Congelado",
    disputedFrozenSub: "Sob retenção de árbitro",
    splitRulings: "Decisões Partilhadas",
    splitRulingsSub: "Arbitragem pro-rata",
    pulseTitle: (d) => `Pulso da Rede e Capacidade dos Corredores (${d}d)`,
    netIntelLink: "Inteligência de rede →",
    settledVolume: "Volume Liquidado",
    settledPaymentsSub: (n) => `${n} pagamentos liquidados`,
    netReliability: "Fiabilidade da Rede",
    failedReversedSub: (f, r) => `${f} falhados · ${r} revertidos`,
    activeTraders: "Comerciantes Ativos",
    tradersSub: (newT, totalT) => `${newT} novos · ${totalT} registados`,
    walletCashIn: "Depósitos em Carteira",
    walletCashInSub: "Volume de recolha mobile-money",
    settlementSla: "SLA de Liquidação",
    slaSub: (ok, fail) => `${ok} ok · ${fail} falhados`,
    settledVolAxis: "Volume liquidado (eq. USD)",
    settledVolAria: "Volume liquidado por dia, equivalente em USD",
    currencyMix: "Mix de Moedas",
    settledByCurrAria: "Volume liquidado por moeda",
    usdEq: "eq. USD",
    railHealthTitle: "Saúde dos Canais de Pagamento Africanos e Telemetria de Adaptadores",
    corridorsRailsLink: "Corredores e canais →",
    halted: "PARADO",
    online: "ONLINE",
    degraded: "DEGRADADO",
    adapterReady: "Adaptador Pronto",
    offline: "Offline",
    indexerTitle: "Indexador de Rede e Reconciliação de Finalidade",
    enterContractRecon: "Introduza o contrato de caução acima para ver o estado de reconciliação.",
    blockFinalitySync: (cur, fin) => `Sincronização de Finalidade de Blocos (${cur} / ${fin})`,
    cursorLabel: "Cursor (indexado até)",
    latestBlockLabel: "Último bloco de topo",
    finalizedBlockLabel: "Bloco finalizado",
    blockLagLabel: "Atraso de blocos",
    blockLagVal: (lag, warn, crit) => `${lag} (aviso ${warn} / crít. ${crit})`,
    workerPollsLabel: "Consultas do worker",
    eventsAppliedLabel: "Eventos aplicados",
    workerErrorsLabel: "Erros do worker",
    alertHeading: (lvl) => `Alerta ${lvl}`,
    alertWorkerErrs: (errs) => `O worker reportou ${errs} erro${errs === 1 ? "" : "s"}.`,
    alertLagBlocks: (lag) => `A indexação está atrasada em ${lag} blocos finalizados.`,
    acknowledgedBy: (by, at) => `Reconhecido por ${by} · ${at}`,
    acknowledgeBtn: "Reconhecer",
    safetyPolicyTitle: "Política de Segurança de Liquidação",
    enforced: "Aplicada",
    globalKillSwitch: "Interruptor de corte global",
    active: "ATIVO",
    off: "desligado",
    liveExecution: "Execução real",
    enabled: "ativada",
    disabled: "desativada",
    approvalsRequired: "Aprovações necessárias",
    operatorsCount: (n) => `${n} operadores`,
    perCommandCap: "Limite por comando",
    pendingCommands: "Comandos pendentes",
    killSwitchNote:
      "O interruptor de corte global é uma configuração de implementação (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) e não pode ser alterado a partir do navegador.",
    pilotsTitle: "Pilotos de Corredores e Prontidão",
    providersHealthy: "Operadores saudáveis",
    providersHalted: "Operadores parados",
    activePilots: "Pilotos ativos",
    observationOnly: "Apenas observação",
    yes: "sim",
    no: "não",
  },
  rw: {
    alertAck: "Impuruza yemejwe",
    alertAckErr: "Ntibyashobotse kwemeza impuruza",
    nocBadge: "Ibikorwa Bikuru · NOC",
    nocTitle: "Ikigo cy'Ubwishyu n'Ingaruka",
    nocDesc:
      "Umutekano wa escrow ya Polygon USDC mu gihe nyacyo, iherezo rya bloku, imikorere y'imiyoboro ya mobile-money muri Afurika, n'imiyoborere y'ubwishyu isaba kwemezwa kabiri mu kigo kimwe.",
    btnDisputes: "Urukiko rw'Impaka",
    btnEscrow: "Igitabo cya Escrow",
    btnCompliance: "Kubahiriza Amategeko & KYC",
    btnTreasury: "Politiki y'Umutungo",
    tvlLabel: "TVL y'Amasezerano ya Escrow kuri Chain",
    chainLabel: (id) => `Chain #${id}`,
    unscoped: "Nta gipimo",
    indexedContracts: (n) => `amasezerano ${n} yanditswe`,
    locked: "Yafunzwe",
    released: "Yarekuwe",
    refunded: "Yasubijwe",
    disputed: "iri mu mpaka",
    escrowLocked: "Escrow Yafunzwe",
    escrowLockedSub: "Amafaranga abaguzi bemeje",
    releasedSub: "Yishyuwe abagurisha",
    refundedSub: "Yasubijwe abaguzi",
    disputedFrozen: "Impaka / Yafatiriwe",
    disputedFrozenSub: "Yahagaritswe n'umukemurampaka",
    splitRulings: "Imyanzuro Igabanyije",
    splitRulingsSub: "Ubukemurampaka bugabanyije",
    pulseTitle: (d) => `Imikorere y'Urusobe n'Umuvuduko w'Imiyoboro (iminsi ${d})`,
    netIntelLink: "Ubwenge bw'urusobe →",
    settledVolume: " ingano Yishyuwe",
    settledPaymentsSub: (n) => `ubwishyu ${n} bwarangiye`,
    netReliability: "Kwizerwa k'Urusobe",
    failedReversedSub: (f, r) => `${f} byanze · ${r} byasubijwe inyuma`,
    activeTraders: "Abacuruzi Bakora",
    tradersSub: (newT, totalT) => `${newT} bashya · ${totalT} banditse`,
    walletCashIn: "Amafaranga Yinjiye muri Konti",
    walletCashInSub: "Amafaranga yakusanyijwe kuri mobile-money",
    settlementSla: "SLA y'Ubwishyu",
    slaSub: (ok, fail) => `${ok} byakunze · ${fail} byanze`,
    settledVolAxis: "Ingano yishyuwe (ihwanye na USD)",
    settledVolAria: "Ingano yishyuwe ku munsi, ihwanye na USD",
    currencyMix: "Imvange y'Amafaranga",
    settledByCurrAria: "Ingano yishyuwe ukurikije ifaranga",
    usdEq: "ihwanye na USD",
    railHealthTitle: "Ubuzima bw'Imiyoboro y'Ubwishyu muri Afurika na Adapter",
    corridorsRailsLink: "Imiyoboro na rails →",
    halted: "YAHAGARITSWE",
    online: "KU MURONGO",
    degraded: "YACITSE INTEGE",
    adapterReady: "Adapter Iri Tayari",
    offline: "Ntabwo iri ku murongo",
    indexerTitle: "Kwandika Chain n'Isuzuma ry'Iherezo",
    enterContractRecon: "Shyiramo aderesi y'amasezerano ya escrow haruguru kugira ngo urebe uko bimeze.",
    blockFinalitySync: (cur, fin) => `Ihuza ry'Iherezo rya Bloku (${cur} / ${fin})`,
    cursorLabel: " Aho bigeze (byanditswe kugeza)",
    latestBlockLabel: "Bloku ya nyuma",
    finalizedBlockLabel: "Bloku yemejwe burundu",
    blockLagLabel: "Ikererwa rya bloku",
    blockLagVal: (lag, warn, crit) => `${lag} (gasopo ${warn} / bikomeye ${crit})`,
    workerPollsLabel: " Inshuro za worker",
    eventsAppliedLabel: "Ibyabaye byashyizwe mu bikorwa",
    workerErrorsLabel: "Amakosa ya worker",
    alertHeading: (lvl) => `Impuruza (${lvl})`,
    alertWorkerErrs: (errs) => `Worker yatanze amakosa ${errs}.`,
    alertLagBlocks: (lag) => `Kwandika bikereweho bloku ${lag} zemejwe burundu.`,
    acknowledgedBy: (by, at) => `Byemejwe na ${by} · ${at}`,
    acknowledgeBtn: "Emeza",
    safetyPolicyTitle: "Politiki y'Umutekano w'Ubwishyu",
    enforced: "Yubahirijwe",
    globalKillSwitch: " ihagarika rusange",
    active: "IRAKORA",
    off: "irafunze",
    liveExecution: "Gushyira mu bikorwa nyako",
    enabled: "irafunguye",
    disabled: "irafunze",
    approvalsRequired: "Kwemezwa gusabwa",
    operatorsCount: (n) => `abakozi ${n}`,
    perCommandCap: "Igipimo ntarengwa ku itegeko",
    pendingCommands: "Amategeko ategereje",
    killSwitchNote:
      "Ihagarika rusange rigenwa mu igenamiterere rya sisitemu (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH) kandi ntirishobora guhindurwa muri mushakisha.",
    pilotsTitle: "Igerageza ry'Imiyoboro n'Ukwitegura",
    providersHealthy: "Abatanga serivisi bazima",
    providersHalted: "Abatanga serivisi bahagaritswe",
    activePilots: "Igerageza rikora",
    observationOnly: "Kugenzura gusa",
    yes: "yego",
    no: "oya",
  },
};

/** Must match the wording the engine computes in handleAcknowledgeReconciliationAlert. */
function alertMessage(s: ReconciliationStatus): string {
  const errs = s.metrics.Errors;
  return errs > 0
    ? `The worker has reported ${errs} error${errs === 1 ? "" : "s"}.`
    : `Indexing is behind by ${s.lag_blocks} finalized blocks.`;
}

export function OperatorCockpit() {
  const me = useOperator();
  const qc = useQueryClient();
  const c = useLangCopy(COPY);
  const [scope, setScope] = useChainScope();
  const [period, setPeriod] = useState<Period>(30);
  const ready = scopeReady(scope);

  const status = useQuery({
    queryKey: ["recon-status", scope],
    queryFn: () => operator.reconciliationStatus(scope),
    enabled: ready,
    refetchInterval: 15_000,
    retry: false,
  });
  const escrows = useQuery({
    queryKey: ["escrows", scope],
    queryFn: () => operator.escrows(scope),
    enabled: ready,
    refetchInterval: 30_000,
    retry: false,
  });
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridors.providers,
    refetchInterval: 30_000,
  });
  const policy = useQuery({ queryKey: ["settlements"], queryFn: () => settlements.list() });
  const pilotList = useQuery({ queryKey: ["pilots"], queryFn: pilots.list });

  const platformStats = useQuery({
    queryKey: ["analytics", "platform", period],
    queryFn: () => operator.analytics(period),
    staleTime: 60_000,
    retry: false,
  });

  const ack = useMutation({
    mutationFn: (s: ReconciliationStatus) =>
      operator.ackAlert(scope, s.alert_level as "warning" | "critical", alertMessage(s)),
    onSuccess: () => {
      toast.success(c.alertAck);
      void qc.invalidateQueries({ queryKey: ["recon-status"] });
    },
    onError: (e) => toast.error(c.alertAckErr, { description: describeError(e) }),
  });

  const sums = { locked: 0, released: 0, refunded: 0, disputed: 0, split: 0 };
  for (const e of escrows.data ?? []) {
    const v = tokenUnits(e.amount);
    if (e.state === "LOCKED" || e.state === "CREATED") sums.locked += v;
    else if (e.state === "RELEASED") sums.released += v;
    else if (e.state === "REFUNDED") sums.refunded += v;
    else if (e.state === "SPLIT") sums.split += v;
    else sums.disputed += v;
  }
  const totalEscrowVol =
    sums.locked + sums.released + sums.refunded + sums.disputed + sums.split;

  return (
    <div className="space-y-6">
      {/* Executive Network Operations Center (NOC) Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.48)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
        />
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-16 hidden w-[330px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                {c.nocBadge}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80">
                {me.email}
              </span>
              <span className="rounded-full bg-[#c2f74d] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#151515]">
                {me.role}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {c.nocTitle}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{c.nocDesc}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
              >
                <Link to="/disputes">
                  <Gavel className="mr-1.5 size-3.5" /> {c.btnDisputes}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/escrow">
                  <Lock className="mr-1.5 size-3.5" /> {c.btnEscrow}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/compliance">
                  <ShieldCheck className="mr-1.5 size-3.5" /> {c.btnCompliance}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/settlements">
                  <Scale className="mr-1.5 size-3.5" /> {c.btnTreasury}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Live System & Contract Telemetry */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                {c.tvlLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#c2f74d]">
                <Radio className="size-3" />{" "}
                {ready ? c.chainLabel(scope.chain_id ?? 137) : c.unscoped}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold tabular-nums text-white">
                {ready ? money(totalEscrowVol) : "—"}
              </span>
              <span className="font-mono text-xs text-white/60">
                {c.indexedContracts((escrows.data ?? []).length)}
              </span>
            </div>

            {/* Segmented Escrow State Bar */}
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              {totalEscrowVol > 0 ? (
                <>
                  <div
                    style={{ width: `${(sums.locked / totalEscrowVol) * 100}%` }}
                    className="bg-[#c2f74d]"
                    title={`${c.locked}: ${money(sums.locked)}`}
                  />
                  <div
                    style={{ width: `${(sums.released / totalEscrowVol) * 100}%` }}
                    className="bg-[#79b200]"
                    title={`${c.released}: ${money(sums.released)}`}
                  />
                  <div
                    style={{ width: `${(sums.refunded / totalEscrowVol) * 100}%` }}
                    className="bg-white/50"
                    title={`${c.refunded}: ${money(sums.refunded)}`}
                  />
                  <div
                    style={{ width: `${(sums.disputed / totalEscrowVol) * 100}%` }}
                    className="bg-destructive"
                    title={`${c.disputed}: ${money(sums.disputed)}`}
                  />
                </>
              ) : (
                <div className="w-full bg-[#c2f74d]/30" />
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-white/65">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-[#c2f74d]" /> {c.locked} {money(sums.locked)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-[#79b200]" /> {c.released}{" "}
                {money(sums.released)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-xs bg-destructive" /> {c.disputed}{" "}
                {money(sums.disputed)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {/* 5-Column Escrow State Exposure Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          icon={Lock}
          tone="primary"
          label={c.escrowLocked}
          value={ready ? money(sums.locked) : "—"}
          sub={c.escrowLockedSub}
        />
        <Metric
          icon={CheckCircle2}
          tone="success"
          label={c.released}
          value={ready ? money(sums.released) : "—"}
          sub={c.releasedSub}
          delay={50}
        />
        <Metric
          icon={RotateCcw}
          tone="muted"
          label={c.refunded}
          value={ready ? money(sums.refunded) : "—"}
          sub={c.refundedSub}
          delay={100}
        />
        <Metric
          icon={Gavel}
          tone="destructive"
          label={c.disputedFrozen}
          value={ready ? money(sums.disputed) : "—"}
          sub={c.disputedFrozenSub}
          delay={150}
        />
        <Metric
          icon={Split}
          tone="muted"
          label={c.splitRulings}
          value={ready ? money(sums.split) : "—"}
          sub={c.splitRulingsSub}
          delay={200}
        />
      </div>

      {/* Network Pulse & Multi-Series Throughput Workbench */}
      <Panel
        title={c.pulseTitle(period)}
        delay={240}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={period} onChange={setPeriod} />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-lg font-mono text-[10px] uppercase"
            >
              <Link to="/analytics">{c.netIntelLink}</Link>
            </Button>
          </div>
        }
      >
        <QueryBoundary query={platformStats} disabledCodes={["analytics_unavailable"]}>
          {(r) => (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  icon={Activity}
                  label={c.settledVolume}
                  value={usd0(r.totals.volume_usd)}
                  sub={c.settledPaymentsSub(r.totals.succeeded)}
                  trend={<Sparkline values={r.daily.map((d) => d.out_usd)} />}
                />
                <Metric
                  icon={CheckCircle2}
                  tone="success"
                  label={c.netReliability}
                  value={`${Math.round(r.totals.success_rate * 100)}%`}
                  sub={c.failedReversedSub(r.totals.failed, r.totals.reversed)}
                />
                <Metric
                  icon={Users}
                  tone="primary"
                  label={c.activeTraders}
                  value={r.totals.active_traders ?? 0}
                  sub={c.tradersSub(r.totals.new_traders ?? 0, r.totals.total_traders ?? 0)}
                />
                <Metric
                  label={c.walletCashIn}
                  value={usd0(r.totals.cash_in_usd)}
                  sub={c.walletCashInSub}
                  tone="muted"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[240px_1fr_280px] lg:items-center">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <Gauge
                    value={r.totals.success_rate}
                    label={c.settlementSla}
                    sub={c.slaSub(r.totals.succeeded, r.totals.failed)}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/15 p-3">
                  <LazyTrendChart
                    data={r.daily.map((d) => ({ label: d.date.slice(5), a: d.out_usd }))}
                    aName={c.settledVolAxis}
                    ariaLabel={c.settledVolAria}
                    format={usd0}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {c.currencyMix}
                  </div>
                  <LazyDonutChart
                    data={r.currencies.map((curr) => ({ label: curr.label, value: curr.value_usd }))}
                    ariaLabel={c.settledByCurrAria}
                    center={{ value: usdCompact(r.totals.volume_usd), label: c.usdEq }}
                    format={usd0}
                  />
                </div>
              </div>
            </div>
          )}
        </QueryBoundary>
      </Panel>

      {/* Live African Provider Rail Matrix */}
      <Panel
        title={c.railHealthTitle}
        delay={280}
        meta={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-lg font-mono text-[10px] uppercase"
          >
            <Link to="/corridors">{c.corridorsRailsLink}</Link>
          </Button>
        }
      >
        <QueryBoundary query={providers}>
          {(rows) => (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {rows.map((p) => {
                const country = p.config.supported_countries[0] ?? "RW";
                const currency = p.config.supported_currencies[0] ?? "";
                return (
                  <div
                    key={p.config.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/90 bg-muted/15 p-4 transition-all hover:border-[#79b200]/50 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Flag code={country} className="w-6 rounded-[2px] shadow-2xs" />
                          <span className="font-mono text-xs font-bold">{country}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            · {currency}
                          </span>
                        </div>
                        <Chip tone={p.config.kill_switch ? "warn" : p.healthy ? "live" : "warn"}>
                          {p.config.kill_switch ? c.halted : p.healthy ? c.online : c.degraded}
                        </Chip>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        {p.config.display_name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {p.config.id} · {p.config.contract_version}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 font-mono text-[10px] text-muted-foreground">
                      <span className="uppercase">{p.config.environment}</span>
                      <span>{p.adapter_ready ? c.adapterReady : c.offline}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </QueryBoundary>
      </Panel>

      {/* Chain Reconciliation & Settlement Safety Governance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={c.indexerTitle}
          className="lg:col-span-2"
          delay={320}
          meta={
            status.data ? (
              <Chip tone={status.data.alert_level === "ok" ? "live" : "warn"}>
                <Cpu className="size-3" /> {status.data.alert_level}
              </Chip>
            ) : null
          }
        >
          {!ready ? (
            <EmptyState>{c.enterContractRecon}</EmptyState>
          ) : (
            <QueryBoundary query={status} disabledCodes={["reconciliation_disabled"]}>
              {(s) => {
                const syncPct =
                  s.finalized_block > 0
                    ? Math.min(100, Math.round((s.cursor / s.finalized_block) * 100))
                    : 100;
                const localizedAlertMsg =
                  s.metrics.Errors > 0
                    ? c.alertWorkerErrs(s.metrics.Errors)
                    : c.alertLagBlocks(s.lag_blocks);
                return (
                  <div className="space-y-4">
                    {/* Block Sync Progress Bar */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-muted-foreground">
                          {c.blockFinalitySync(
                            s.cursor.toLocaleString(),
                            s.finalized_block.toLocaleString(),
                          )}
                        </span>
                        <span className="font-bold text-foreground">{syncPct}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#79b200] to-[#c2f74d]"
                          style={{ width: `${syncPct}%` }}
                        />
                      </div>
                    </div>

                    <dl className="grid gap-2.5 font-mono text-xs sm:grid-cols-2">
                      <Row k={c.cursorLabel} v={s.cursor.toLocaleString()} />
                      <Row k={c.latestBlockLabel} v={s.latest_block.toLocaleString()} />
                      <Row k={c.finalizedBlockLabel} v={s.finalized_block.toLocaleString()} />
                      <Row
                        k={c.blockLagLabel}
                        v={c.blockLagVal(
                          s.lag_blocks,
                          s.warning_lag_blocks,
                          s.critical_lag_blocks,
                        )}
                      />
                      <Row
                        k={c.workerPollsLabel}
                        v={`${s.metrics.SuccessfulPolls}/${s.metrics.Polls}`}
                      />
                      <Row k={c.eventsAppliedLabel} v={String(s.metrics.EventsApplied)} />
                      <Row k={c.workerErrorsLabel} v={String(s.metrics.Errors)} />
                    </dl>

                    {s.alert_level !== "ok" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4">
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
                            <ShieldAlert className="size-3.5" /> {c.alertHeading(s.alert_level)}
                          </div>
                          <p className="mt-1 text-muted-foreground">{localizedAlertMsg}</p>
                          {s.acknowledged_by ? (
                            <p className="mt-1 text-muted-foreground">
                              {c.acknowledgedBy(s.acknowledged_by, when(s.acknowledged_at))}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg font-mono text-[10px] uppercase"
                          disabled={ack.isPending}
                          onClick={() => ack.mutate(s)}
                        >
                          {c.acknowledgeBtn}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            </QueryBoundary>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            title={c.safetyPolicyTitle}
            delay={360}
            meta={<Chip tone="live">{c.enforced}</Chip>}
          >
            <QueryBoundary query={policy}>
              {(p) => (
                <dl className="space-y-2.5 font-mono text-xs">
                  <Row
                    k={c.globalKillSwitch}
                    v={p.policy.GlobalKillSwitch ? c.active : c.off}
                  />
                  <Row
                    k={c.liveExecution}
                    v={p.policy.ExecutionEnabled ? c.enabled : c.disabled}
                  />
                  <Row
                    k={c.approvalsRequired}
                    v={c.operatorsCount(p.policy.RequiredApprovals)}
                  />
                  <Row k={c.perCommandCap} v={money(p.policy.MaxAmountMinor / 100)} />
                  <Row
                    k={c.pendingCommands}
                    v={String(p.commands.filter((cmd) => cmd.status === "pending").length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {c.killSwitchNote}
            </p>
          </Panel>

          <Panel title={c.pilotsTitle} delay={400}>
            <QueryBoundary query={providers}>
              {(rows) => (
                <dl className="space-y-2.5 font-mono text-xs">
                  <Row
                    k={c.providersHealthy}
                    v={`${rows.filter((r) => r.healthy).length}/${rows.length}`}
                  />
                  <Row
                    k={c.providersHalted}
                    v={String(rows.filter((r) => r.config.kill_switch).length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <div className="mt-2.5 border-t border-border/60 pt-2.5">
              <QueryBoundary query={pilotList}>
                {(p) => (
                  <dl className="space-y-2.5 font-mono text-xs">
                    <Row
                      k={c.activePilots}
                      v={String(p.pilots.filter((x) => x.status === "active").length)}
                    />
                    <Row k={c.observationOnly} v={p.observationOnly ? c.yes : c.no} />
                  </dl>
                )}
              </QueryBoundary>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
