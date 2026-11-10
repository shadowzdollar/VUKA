import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Lock,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Flag } from "@/components/vuka/landing/flags";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip, Panel, Shell } from "@/components/vuka/shell";
import { invoiceTotal } from "@/components/vuka/trader-invoices";
import { isSettled, stateTone, WorkflowTracker } from "@/components/vuka/workflow-tracker";
import { ApiError, describeError, isApiError, newIdempotencyKey } from "@/lib/api/client";
import { corridors as corridorApi, ledger, platform, workflows } from "@/lib/api/endpoints";
import type { Account, Recipient, Transfer, Workflow } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, truncMid, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { DIAL } from "@/lib/markets";
import { readRecentWorkflows, rememberWorkflow } from "@/lib/recent-workflows";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/send")({
  // /send?invoice=INV-… preselects the invoice being paid (linked from the Invoices page).
  validateSearch: (search: Record<string, unknown>): { invoice?: string } =>
    typeof search["invoice"] === "string" ? { invoice: search["invoice"] } : {},
  head: () => ({
    meta: [
      { title: "Send Payment — VUKA" },
      {
        name: "description",
        content:
          "Pay a supplier across borders with a live corridor quote and a tracked settlement.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <SendPayment />
    </Shell>
  ),
});

type Mode = "domestic" | "workflow";
type SendResult =
  | { kind: "domestic"; transfer: Transfer }
  | { kind: "workflow"; workflow?: Workflow; error?: string };

const COPY: Record<
  Lang,
  {
    step1Title: string;
    step1Sub: string;
    step2Title: string;
    step2Sub: string;
    step3Title: string;
    step3Sub: string;
    stepLabel: (n: number) => string;
    bannerBadge: string;
    replaySafe: string;
    bannerTitle: string;
    bannerDesc: string;
    sourceVault: string;
    availableLiquidity: string;
    topUp: string;
    settlementEngine: string;
    feeLabel: (bps: number) => string;
    liveFx: string;
    dispatchWorkbench: string;
    stepOf: (curr: number, tot: number) => string;
    marketsBar: string;
    msisdnLabel: string;
    msisdnHint: string;
    btnVerifying: string;
    btnVerifyTrader: string;
    verifiedCounterparty: string;
    vaultsCount: (n: number) => string;
    destVaultLabel: string;
    continueToQuote: string;
    sourceVaultSelect: string;
    amountLabel: (curr: string) => string;
    availLabel: (v: string) => string;
    linkInvoiceLabel: string;
    noLinkedInvoice: string;
    linkInvoiceHint: string;
    lockingRate: string;
    firmQuoteLocked: string;
    supplierReceives: string;
    domesticBookSettlement: string;
    domesticBookDesc: (curr: string) => string;
    btnBack: string;
    btnReviewTicket: string;
    principalAmount: string;
    linkedInvoice: string;
    collectionRail: string;
    vaultBalanceTitle: string;
    vaultBalanceDesc: string;
    momoRailTitle: string;
    momoRailDesc: string;
    payerPhoneLabel: string;
    authRefLabel: string;
    authRefPlaceholder: string;
    authRefDesc: string;
    btnDispatching: string;
    btnConfirmDispatch: string;
    liveTicket: string;
    originVault: string;
    targetVault: string;
    supplierReceivesNet: string;
    idempotencyKey: string;
    changeRecipient: string;
    telemetryTitle: string;
    realtimeStateMachine: string;
    paymentSettledMsg: string;
    paymentPausedMsg: string;
    btnSendAnother: string;
    domesticTitle: string;
    paymentSettledHeader: string;
    transferredTo: (amt: string, name: string) => string;
    totalSettled: string;
    ledgerTransferId: string;
    recentWorkflows: string;
    recentTracked: (n: number) => string;
    recentEmpty: string;
  }
> = {
  en: {
    step1Title: "Recipient & Corridor",
    step1Sub: "Verify supplier MSISDN & destination vault",
    step2Title: "Amount & Invoice",
    step2Sub: "Lock corridor FX rate & link trade invoice",
    step3Title: "Review & Dispatch",
    step3Sub: "Confirm collection rail & execute settlement",
    stepLabel: (n) => `Step 0${n}`,
    bannerBadge: "Cross-Border Settlement Desk",
    replaySafe: "Replay-Safe Idempotency",
    bannerTitle: "Send Supplier Payment",
    bannerDesc:
      "Lock a deterministic corridor FX quote and settle across borders in three atomic hops (Mobile Money Collection → Double-Entry Ledger → Supplier Rail Payout), or settle same-currency transfers instantly on the ledger.",
    sourceVault: "Source Business Vault",
    availableLiquidity: "Available Liquidity",
    topUp: "Top up →",
    settlementEngine: "Settlement Engine",
    feeLabel: (bps) => `Fee ${(bps / 100).toFixed(2)}% (${bps} bps)`,
    liveFx: "Live FX",
    dispatchWorkbench: "Cross-Border Payment Dispatch Workbench",
    stepOf: (curr, tot) => `Step 0${curr} of 0${tot}`,
    marketsBar: "10 Launch Markets · Click a country dial prefix to pre-fill",
    msisdnLabel: "Recipient Mobile Money Number (MSISDN)",
    msisdnHint:
      "Enter the supplier's registered VUKA phone number with international dialing code (e.g. +254 for Kenya, +250 for Rwanda).",
    btnVerifying: "Verifying…",
    btnVerifyTrader: "Verify Trader",
    verifiedCounterparty: "Verified Counterparty",
    vaultsCount: (n) => `${n} Business ${n === 1 ? "Vault" : "Vaults"}`,
    destVaultLabel: "Destination Supplier Vault",
    continueToQuote: "Continue to Amount & Quote",
    sourceVaultSelect: "Source Business Trade Vault",
    amountLabel: (curr) => `Amount ${curr ? `(${curr})` : ""}`,
    availLabel: (v) => `Avail: ${v}`,
    linkInvoiceLabel: "Link Trade Invoice (Optional)",
    noLinkedInvoice: "No linked invoice",
    linkInvoiceHint:
      "Linking an invoice marks it settled on the ledger and boosts your Invoice-Discipline trust factor.",
    lockingRate: "Locking live corridor exchange rate…",
    firmQuoteLocked: "Firm Corridor Quote Locked",
    supplierReceives: "Supplier receives",
    domesticBookSettlement: "Instant Domestic Book Settlement:",
    domesticBookDesc: (curr) =>
      `Both vaults are denominated in ${curr}. Zero FX conversion and zero protocol fee.`,
    btnBack: "Back",
    btnReviewTicket: "Review Settlement Ticket",
    principalAmount: "Principal Amount",
    linkedInvoice: "Linked Invoice",
    collectionRail: "Settlement Collection Rail",
    vaultBalanceTitle: "VUKA Business Vault Balance",
    vaultBalanceDesc: "Instant double-entry book settlement · zero FX spread, zero fee",
    momoRailTitle: "Mobile Money Collection → Ledger → Supplier Payout",
    momoRailDesc: "Authorized push collection from your registered mobile money account",
    payerPhoneLabel: "Your Mobile Money Number (Collection MSISDN)",
    authRefLabel: "Provider Authorization Reference",
    authRefPlaceholder: "Reference from your MTN / M-Pesa prompt",
    authRefDesc:
      "VUKA never collects or stores your mobile-money PIN. Complete the challenge with your provider, then paste the reference it gives you.",
    btnDispatching: "Dispatching Settlement…",
    btnConfirmDispatch: "Confirm & Dispatch Payment",
    liveTicket: "Live Settlement Ticket",
    originVault: "Origin Vault",
    targetVault: "Target Vault",
    supplierReceivesNet: "Supplier Receives Net",
    idempotencyKey: "Idempotency Key",
    changeRecipient: "Change",
    telemetryTitle: "Live Cross-Border Settlement Telemetry",
    realtimeStateMachine: "Real-Time State Machine",
    paymentSettledMsg:
      "This cross-border payment has settled on the double-entry ledger and supplier payout rail.",
    paymentPausedMsg:
      "This payment workflow has paused — inspect the step status above for recovery options.",
    btnSendAnother: "Send another payment",
    domesticTitle: "Instant Domestic Ledger Settlement",
    paymentSettledHeader: "Payment Settled on Ledger",
    transferredTo: (amt, name) => `${amt} transferred to ${name}.`,
    totalSettled: "Total Settled",
    ledgerTransferId: "Ledger Transfer ID",
    recentWorkflows: "Recent Cross-Border Workflows",
    recentTracked: (n) => `${n} tracked`,
    recentEmpty:
      "Cross-border workflows you dispatch from this browser appear here for instant live tracking.",
  },
  fr: {
    step1Title: "Destinataire & Corridor",
    step1Sub: "Vérifier le numéro MSISDN & le coffre cible",
    step2Title: "Montant & Facture",
    step2Sub: "Verrouiller le taux de change & lier une facture",
    step3Title: "Vérification & Envoi",
    step3Sub: "Confirmer le rail de collecte & exécuter le règlement",
    stepLabel: (n) => `Étape 0${n}`,
    bannerBadge: "Guichet de Règlement Transfrontalier",
    replaySafe: "Idempotence Sécurisée Anti-Rejeu",
    bannerTitle: "Payer un Fournisseur",
    bannerDesc:
      "Verrouillez un devis de change ferme et réglez au-delà des frontières en trois étapes atomiques (Collecte Mobile Money → Grand Livre en Partie Double → Versement Fournisseur).",
    sourceVault: "Coffre Entreprise Source",
    availableLiquidity: "Liquidité Disponible",
    topUp: "Recharger →",
    settlementEngine: "Moteur de Règlement",
    feeLabel: (bps) => `Frais ${(bps / 100).toFixed(2)}% (${bps} bps)`,
    liveFx: "Taux en Direct",
    dispatchWorkbench: "Poste d'Envoi des Règlements Transfrontaliers",
    stepOf: (curr, tot) => `Étape 0${curr} sur 0${tot}`,
    marketsBar: "10 Marchés Régionaux · Cliquez sur un indicatif pour pré-remplir",
    msisdnLabel: "Numéro Mobile Money du Destinataire (MSISDN)",
    msisdnHint:
      "Entrez le numéro VUKA enregistré du fournisseur avec l'indicatif international (+250 Rwanda, +254 Kenya, etc.).",
    btnVerifying: "Vérification…",
    btnVerifyTrader: "Vérifier le Commerçant",
    verifiedCounterparty: "Contrepartie Vérifiée",
    vaultsCount: (n) => `${n} Coffre${n > 1 ? "s" : ""} Entreprise`,
    destVaultLabel: "Coffre Fournisseur Cible",
    continueToQuote: "Continuer vers Montant & Devis",
    sourceVaultSelect: "Coffre Commercial Source",
    amountLabel: (curr) => `Montant ${curr ? `(${curr})` : ""}`,
    availLabel: (v) => `Dispo : ${v}`,
    linkInvoiceLabel: "Lier une Facture Commerciale (Optionnel)",
    noLinkedInvoice: "Aucune facture liée",
    linkInvoiceHint:
      "Lier une facture la marque comme réglée sur le grand livre et renforce votre score de confiance.",
    lockingRate: "Verrouillage du taux de change en direct…",
    firmQuoteLocked: "Devis Ferme de Corridor Verrouillé",
    supplierReceives: "Le fournisseur reçoit",
    domesticBookSettlement: "Règlement Interne Immédiat :",
    domesticBookDesc: (curr) =>
      `Les deux coffres sont libellés en ${curr}. Zéro conversion de change et zéro frais de protocole.`,
    btnBack: "Retour",
    btnReviewTicket: "Examiner le Billet de Règlement",
    principalAmount: "Montant Principal",
    linkedInvoice: "Facture Liée",
    collectionRail: "Rail de Collecte du Règlement",
    vaultBalanceTitle: "Solde du Coffre Commercial VUKA",
    vaultBalanceDesc: "Règlement comptable instantané · aucun écart de change, zéro frais",
    momoRailTitle: "Collecte Mobile Money → Grand Livre → Versement Fournisseur",
    momoRailDesc: "Collecte push autorisée depuis votre compte mobile money enregistré",
    payerPhoneLabel: "Votre Numéro Mobile Money (MSISDN Débit)",
    authRefLabel: "Référence d'Autorisation de l'Opérateur",
    authRefPlaceholder: "Référence de l'invite MTN / M-Pesa",
    authRefDesc:
      "VUKA ne collecte jamais votre code PIN. Validez l'invite sur votre téléphone, puis collez la référence.",
    btnDispatching: "Envoi du Règlement…",
    btnConfirmDispatch: "Confirmer & Envoyer le Paiement",
    liveTicket: "Billet de Règlement en Direct",
    originVault: "Coffre d'Origine",
    targetVault: "Coffre Cible",
    supplierReceivesNet: "Fournisseur Reçoit Net",
    idempotencyKey: "Clé d'Idempotence",
    changeRecipient: "Modifier",
    telemetryTitle: "Télémétrie en Direct du Règlement",
    realtimeStateMachine: "Machine à États Temps Réel",
    paymentSettledMsg:
      "Ce paiement transfrontalier a été réglé sur le grand livre et versé sur le rail du fournisseur.",
    paymentPausedMsg:
      "Ce workflow de paiement est en pause — examinez le statut de l'étape pour les options de reprise.",
    btnSendAnother: "Effectuer un autre paiement",
    domesticTitle: "Règlement Interne Immédiat",
    paymentSettledHeader: "Paiement Réglé sur le Grand Livre",
    transferredTo: (amt, name) => `${amt} transférés à ${name}.`,
    totalSettled: "Total Réglé",
    ledgerTransferId: "Identifiant du Virement",
    recentWorkflows: "Workflows Transfrontaliers Récents",
    recentTracked: (n) => `${n} suivis`,
    recentEmpty: "Les workflows de paiement envoyés depuis ce navigateur apparaissent ici.",
  },
  sw: {
    step1Title: "Mpokeaji & Njia ya Malipo",
    step1Sub: "Thibitisha nambari ya simu & pochi lengwa",
    step2Title: "Kiasi & Ankara",
    step2Sub: "Funga bei ya sarafu & unganisha ankara",
    step3Title: "Kagua & Tuma",
    step3Sub: "Thibitisha njia ya kukusanya & kamilisha malipo",
    stepLabel: (n) => `Hatua 0${n}`,
    bannerBadge: "Kitengo cha Malipo ya Mpakani",
    replaySafe: "Ulinzi Dhidi ya Malipo ya Marudio",
    bannerTitle: "Tuma Malipo kwa Mtoa Huduma",
    bannerDesc:
      "Funga bei thabiti ya sarafu na ulipe kuvuka mipaka kwa hatua tatu (Kukusanya Pesa kwa Simu → Leja ya Maingizo Maradufu → Malipo kwa Mtoa Huduma).",
    sourceVault: "Pochi ya Biashara ya Kutuma",
    availableLiquidity: "Pesa Zinazopatikana",
    topUp: "Weka fedha →",
    settlementEngine: "Mfumo wa Malipo",
    feeLabel: (bps) => `Ada ${(bps / 100).toFixed(2)}% (${bps} bps)`,
    liveFx: "Viwango vya Moja kwa Moja",
    dispatchWorkbench: "Dawati la Kutuma Malipo ya Mpakani",
    stepOf: (curr, tot) => `Hatua 0${curr} kati ya 0${tot}`,
    marketsBar: "Masoko 10 ya Kuanzia · Bofya kiambishi awali cha nchi kujaza",
    msisdnLabel: "Nambari ya Simu ya Mpokeaji (MSISDN)",
    msisdnHint:
      "Weka nambari ya simu ya VUKA ya msambazaji ikiwa na msimbo wa kimataifa (mf. +254 Kenya, +250 Rwanda).",
    btnVerifying: "Inathibitisha…",
    btnVerifyTrader: "Thibitisha Mfanyabiashara",
    verifiedCounterparty: "Mshirika Aliyethibitishwa",
    vaultsCount: (n) => `Pochi ${n} za Biashara`,
    destVaultLabel: "Pochi Lengwa ya Msambazaji",
    continueToQuote: "Endelea hadi Kiasi na Bei",
    sourceVaultSelect: "Pochi ya Biashara ya Kutoa Pesa",
    amountLabel: (curr) => `Kiasi ${curr ? `(${curr})` : ""}`,
    availLabel: (v) => `Zilizopo: ${v}`,
    linkInvoiceLabel: "Unganisha Ankara ya Biashara (Hiari)",
    noLinkedInvoice: "Hakuna ankara iliyounganishwa",
    linkInvoiceHint:
      "Kuunganisha ankara huifanya ionekane kuwa imelipwa na huongeza alama zako za uaminifu.",
    lockingRate: "Inafunga kiwango cha ubadilishaji wa sarafu…",
    firmQuoteLocked: "Bei Thabiti ya Njia Imefungwa",
    supplierReceives: "Msambazaji anapokea",
    domesticBookSettlement: "Malipo ya Papo Hapo ya Ndani:",
    domesticBookDesc: (curr) =>
      `Pochi zote mbili ziko katika ${curr}. Hakuna ada wala ubadilishaji wa sarafu.`,
    btnBack: "Rudi",
    btnReviewTicket: "Kagua Tiketi ya Malipo",
    principalAmount: "Kiasi Kikuu",
    linkedInvoice: "Ankara Iliyounganishwa",
    collectionRail: "Njia ya Kukusanya Malipo",
    vaultBalanceTitle: "Salio la Pochi ya Biashara ya VUKA",
    vaultBalanceDesc: "Ulipaji wa papo hapo kwenye leja · hakuna ada wala upotevu wa thamani",
    momoRailTitle: "Kukusanya Pesa kwa Simu → Leja → Malipo kwa Msambazaji",
    momoRailDesc: "Kukusanya fedha kutoka kwa pochi yako ya simu kwa idhini yako",
    payerPhoneLabel: "Nambari Yako ya Simu ya Kukatwa (MSISDN)",
    authRefLabel: "Nambari ya Uthibitisho wa Mtandao",
    authRefPlaceholder: "Rejeleo kutoka kwenye ujumbe wa MTN / M-Pesa",
    authRefDesc:
      "VUKA kamwe haikusanyi nambari yako ya siri ya PIN. Kamilisha uthibitisho kisha weka rejeleo hapa.",
    btnDispatching: "Inatuma Malipo…",
    btnConfirmDispatch: "Thibitisha & Tuma Malipo",
    liveTicket: "Tiketi ya Malipo ya Moja kwa Moja",
    originVault: "Pochi ya Kutoka",
    targetVault: "Pochi Lengwa",
    supplierReceivesNet: "Kiasi Halisi Anachopokea Msambazaji",
    idempotencyKey: "Ufunguo wa Usalama wa Muamala",
    changeRecipient: "Badilisha",
    telemetryTitle: "Ufuatiliaji wa Moja kwa Moja wa Malipo",
    realtimeStateMachine: "Hali ya Mfumo kwa Wakati Halisi",
    paymentSettledMsg:
      "Malipo haya yamekamilika kwenye leja na fedha zimetumwa kwa msambazaji.",
    paymentPausedMsg:
      "Mchakato wa malipo umesimama — kagua hatua zilizo hapo juu kwa chaguo la kuendelea.",
    btnSendAnother: "Tuma malipo mengine",
    domesticTitle: "Malipo ya Ndani ya Papo Hapo",
    paymentSettledHeader: "Malipo Yamekamilika kwenye Leja",
    transferredTo: (amt, name) => `${amt} zimetumwa kwa ${name}.`,
    totalSettled: "Jumla Iliyolipwa",
    ledgerTransferId: "Nambari ya Uhamisho wa Leja",
    recentWorkflows: "Miamala ya Hivi Karibuni ya Mpakani",
    recentTracked: (n) => `Miamala ${n}`,
    recentEmpty: "Miamala unayotuma kutoka kwa kivinjari hiki itaonekana hapa.",
  },
  pt: {
    step1Title: "Destinatário & Corredor",
    step1Sub: "Verificar MSISDN & cofre de destino",
    step2Title: "Montante & Fatura",
    step2Sub: "Fixar taxa de câmbio & associar fatura",
    step3Title: "Revisão & Envio",
    step3Sub: "Confirmar canal de cobrança & liquidar",
    stepLabel: (n) => `Passo 0${n}`,
    bannerBadge: "Mesa de Liquidação Transfronteiriça",
    replaySafe: "Idempotência com Proteção Anti-Repetição",
    bannerTitle: "Enviar Pagamento a Fornecedor",
    bannerDesc:
      "Fixe uma cotação cambial firme e liquide através das fronteiras em três etapas atómicas (Cobrança Mobile Money → Razão de Partida Dobrada → Pagamento ao Fornecedor).",
    sourceVault: "Cofre Comercial de Origem",
    availableLiquidity: "Liquidez Disponível",
    topUp: "Carregar →",
    settlementEngine: "Motor de Liquidação",
    feeLabel: (bps) => `Taxa ${(bps / 100).toFixed(2)}% (${bps} bps)`,
    liveFx: "Câmbio em Direto",
    dispatchWorkbench: "Bancada de Expedição de Pagamentos",
    stepOf: (curr, tot) => `Passo 0${curr} de 0${tot}`,
    marketsBar: "10 Mercados Regionais · Clique no indicativo para preencher",
    msisdnLabel: "Número Mobile Money do Destinatário (MSISDN)",
    msisdnHint:
      "Introduza o número VUKA do fornecedor com o indicativo internacional (+254 Quénia, +250 Ruanda, etc.).",
    btnVerifying: "A verificar…",
    btnVerifyTrader: "Verificar Comerciante",
    verifiedCounterparty: "Contraparte Verificada",
    vaultsCount: (n) => `${n} Cofre${n > 1 ? "s" : ""} Comercial${n > 1 ? "is" : ""}`,
    destVaultLabel: "Cofre Fornecedor de Destino",
    continueToQuote: "Continuar para Montante & Cotação",
    sourceVaultSelect: "Cofre Comercial de Origem",
    amountLabel: (curr) => `Montante ${curr ? `(${curr})` : ""}`,
    availLabel: (v) => `Disp: ${v}`,
    linkInvoiceLabel: "Associar Fatura Comercial (Opcional)",
    noLinkedInvoice: "Nenhuma fatura associada",
    linkInvoiceHint:
      "Vincular uma fatura marca-a como liquidada no razão e reforça o seu fator de confiança.",
    lockingRate: "A fixar taxa de câmbio em tempo real…",
    firmQuoteLocked: "Cotação Firme do Corredor Fixada",
    supplierReceives: "O fornecedor recebe",
    domesticBookSettlement: "Liquidação Interna Instantânea:",
    domesticBookDesc: (curr) =>
      `Ambos os cofres são denominados em ${curr}. Sem conversão cambial e sem comissões.`,
    btnBack: "Voltar",
    btnReviewTicket: "Rever Bilhete de Liquidação",
    principalAmount: "Montante Principal",
    linkedInvoice: "Fatura Associada",
    collectionRail: "Canal de Cobrança do Pagamento",
    vaultBalanceTitle: "Saldo do Cofre Comercial VUKA",
    vaultBalanceDesc: "Liquidação imediata no razão · sem spread cambial nem taxas",
    momoRailTitle: "Cobrança Mobile Money → Razão → Pagamento ao Fornecedor",
    momoRailDesc: "Cobrança autorizada na sua conta de dinheiro móvel registada",
    payerPhoneLabel: "O Seu Número Mobile Money (MSISDN de Débito)",
    authRefLabel: "Referência de Autorização do Fornecedor",
    authRefPlaceholder: "Referência da notificação MTN / M-Pesa",
    authRefDesc:
      "O VUKA nunca recolhe o seu código PIN. Aprove a notificação no seu telemóvel e introduza a referência recebida.",
    btnDispatching: "A enviar liquidação…",
    btnConfirmDispatch: "Confirmar & Enviar Pagamento",
    liveTicket: "Bilhete de Liquidação em Tempo Real",
    originVault: "Cofre de Origem",
    targetVault: "Cofre de Destino",
    supplierReceivesNet: "O Fornecedor Recebe Líquido",
    idempotencyKey: "Chave de Idempotência",
    changeRecipient: "Alterar",
    telemetryTitle: "Telemetria de Liquidação em Tempo Real",
    realtimeStateMachine: "Máquina de Estados em Tempo Real",
    paymentSettledMsg:
      "Este pagamento foi liquidado no razão de partida dobrada e no canal do fornecedor.",
    paymentPausedMsg:
      "O fluxo de pagamento foi pausado — verifique o estado do passo para opções de recuperação.",
    btnSendAnother: "Enviar outro pagamento",
    domesticTitle: "Liquidação Interna Instantânea",
    paymentSettledHeader: "Pagamento Liquidado no Razão",
    transferredTo: (amt, name) => `${amt} transferidos para ${name}.`,
    totalSettled: "Total Liquidado",
    ledgerTransferId: "ID da Transferência no Razão",
    recentWorkflows: "Fluxos Transfronteiriços Recentes",
    recentTracked: (n) => `${n} rastreados`,
    recentEmpty: "Os pagamentos que enviar a partir deste navegador aparecerão aqui.",
  },
  rw: {
    step1Title: "Uwohererezwa & Inzira",
    step1Sub: "Emeza nimero ya telefoni & konti yo kubikaho",
    step2Title: "Amafaranga & Fagitire",
    step2Sub: "Funga igipimo cy'ivunjisha & huza fagitire",
    step3Title: "Gusuzuma & Kohereza",
    step3Sub: "Emeza uburyo bwo gukata & kora ubwishyu",
    stepLabel: (n) => `Intambwe 0${n}`,
    bannerBadge: "Ibiro by'Ubwishyu bw'Imipaka",
    replaySafe: "Umutekano wo Kudasubiramo Ubwishyu",
    bannerTitle: "Kwishyura Umucuruzi / Umuterankunga",
    bannerDesc:
      "Funga igiciro gihamye cy'ivunjisha maze wishyure hakurya y'umupaka mu ntambwe eshatu z'ingenzi (Gukata kuri Mobile Money → Igitabo cy'Ihererekanya → Kwishyura Umucuruzi).",
    sourceVault: "Konti y'Ubucuruzi Yishyura",
    availableLiquidity: "Amafaranga Ahari",
    topUp: "Gushyiraho amafaranga →",
    settlementEngine: "Moteri y'Ubwishyu",
    feeLabel: (bps) => `Amafaranga ${(bps / 100).toFixed(2)}% (${bps} bps)`,
    liveFx: "Igipimo cy'ako kanya",
    dispatchWorkbench: "Aho Kohereza Ubwishyu bw'Imipaka",
    stepOf: (curr, tot) => `Intambwe 0${curr} kuri 0${tot}`,
    marketsBar: "Amasoko 10 yo gutangiriraho · Kanda ku kode y'igihugu",
    msisdnLabel: "Nimero ya Mobile Money y'Uwakira (MSISDN)",
    msisdnHint:
      "Shyiramo nimero ya telefoni ya VUKA y'uwoherezwa iriho kode y'igihugu (urugero: +254 Kenya, +250 u Rwanda).",
    btnVerifying: "Gusuzuma…",
    btnVerifyTrader: "Suzuma Umucuruzi",
    verifiedCounterparty: "Umucuruzi Wemejwe",
    vaultsCount: (n) => `Konti ${n} z'Ubucuruzi`,
    destVaultLabel: "Konti y'Ubucuruzi y'Uwakira",
    continueToQuote: "Komeza ku Mafaranga & Igiciro",
    sourceVaultSelect: "Konti y'Ubucuruzi yo Gukuraho Amafaranga",
    amountLabel: (curr) => `Amafaranga ${curr ? `(${curr})` : ""}`,
    availLabel: (v) => `Ahari: ${v}`,
    linkInvoiceLabel: "Huza na Fagitire y'Ubucuruzi (Bihitwamo)",
    noLinkedInvoice: "Nta fagitire ihuje",
    linkInvoiceHint:
      "Guhuza fagitire bituma yandikwa nk'iyishyuwe mu gitabo kandi bikongera icyizere cyawe mu bucuruzi.",
    lockingRate: "Gufunga igipimo cy'ivunjisha cy'ako kanya…",
    firmQuoteLocked: "Igiciro Gihamye cy'Inzira Cyafunzwe",
    supplierReceives: "Uwoherejwe azahabwa",
    domesticBookSettlement: "Kwishyura Ako Kanya Imbere mu Gihugu:",
    domesticBookDesc: (curr) =>
      `Konti zombi ziri mu ifaranga rya ${curr}. Nta vunjisha kandi nta kiguzi k'inyongera.`,
    btnBack: "Gusubira inyuma",
    btnReviewTicket: "Kureba Inyandiko y'Ubwishyu",
    principalAmount: "Amafaranga Nyayo",
    linkedInvoice: "Fagitire Ihujwe",
    collectionRail: "Umuyoboro wo Gukuraho Amafaranga",
    vaultBalanceTitle: "Konti y'Ubucuruzi muri VUKA",
    vaultBalanceDesc: "Kwishyurana ako kanya mu gitabo · nta kiguzi cyangwa igihombo mu ivunjisha",
    momoRailTitle: "Gukata kuri Mobile Money → Igitabo → Guha Umucuruzi",
    momoRailDesc: "Gukata amafaranga byemejwe kuri konti yawe ya telefoni igendanwa",
    payerPhoneLabel: "Nimero Yawe ya Mobile Money yo Gukataho (MSISDN)",
    authRefLabel: "Nimero y'Icyemezo cya Serivisi y'Itumanaho",
    authRefPlaceholder: "Nimero y'icyemezo ivuye kuri MTN / M-Pesa",
    authRefDesc:
      "VUKA ntabwo ibika cyangwa ngo isabe umubare wawe w'ibanga wa PIN. Emeza kuri telefoni yawe maze ushyiremo nimero y'icyemezo hano.",
    btnDispatching: "Kwohereza Ubwishyu…",
    btnConfirmDispatch: "Emeza & Ohereza Ubwishyu",
    liveTicket: "Inyandiko y'Ubwishyu bw'ako Kanya",
    originVault: "Konti Ivaho",
    targetVault: "Konti Yerekezaho",
    supplierReceivesNet: "Amafaranga Nyayo Uwakira Azafata",
    idempotencyKey: "Urufunguzo rw'Umutekano w'Ihererekanya",
    changeRecipient: "Guhindura",
    telemetryTitle: "Ubugenzuzi bw'Imigendekere y'Ubwishyu",
    realtimeStateMachine: "Uko Byifashe Ako Kanya",
    paymentSettledMsg:
      "Ubu bwishyu bwambukiranya imipaka bwamaze kwandikwa mu gitabo no koherezwa ku wakira.",
    paymentPausedMsg:
      "Iri hererekanya ryahagaze gato — reba amakuru y'intambwe haruguru kugira ngo ukemure ikibazo.",
    btnSendAnother: "Kora ubundi bwishyu",
    domesticTitle: "Kwishyura Ako Kanya Imbere mu Gihugu",
    paymentSettledHeader: "Ubwishyu Bwamaze Kwandikwa mu Gitabo",
    transferredTo: (amt, name) => `${amt} yoherejwe kuri ${name}.`,
    totalSettled: "Amafaranga Yose Yishyuwe",
    ledgerTransferId: "Nimero y'Ihererekanya mu Gitabo",
    recentWorkflows: "Ihererekanya ry'Imipaka riheruka",
    recentTracked: (n) => `Ibikorwa ${n}`,
    recentEmpty: "Ibikorwa byo kwishyura uheruka gukora muri iyi mudasobwa biraboneka hano.",
  },
};

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** A failed workflow start still returns the workflow (HTTP 202/422 with a string `error`). */
function workflowFromError(e: unknown): Workflow | undefined {
  if (!isApiError(e)) return undefined;
  const body = e.body as { workflow?: Workflow } | undefined;
  return body?.workflow?.id ? body.workflow : undefined;
}

function StepRail({
  step,
  onJump,
}: {
  step: number;
  onJump: (target: number) => void;
}) {
  const t = useLangCopy(COPY);
  const steps = [
    { title: t.step1Title, sub: t.step1Sub },
    { title: t.step2Title, sub: t.step2Sub },
    { title: t.step3Title, sub: t.step3Sub },
  ];

  return (
    <div className="mb-7 grid gap-3 sm:grid-cols-3">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <button
            key={s.title}
            type="button"
            disabled={!done}
            onClick={() => done && onJump(n)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all",
              current &&
                "border-[#151515] bg-[#151515] text-white shadow-[0_14px_30px_-14px_rgba(0,0,0,0.35)]",
              done &&
                "cursor-pointer border-[#79b200]/45 bg-[#f5fbe6] text-[#151515] hover:border-[#79b200] dark:bg-[#1b2410] dark:text-foreground",
              !current && !done && "border-border bg-muted/25 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold",
                current && "bg-[#c2f74d] text-[#151515]",
                done && "bg-[#151515] text-[#c2f74d]",
                !current && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : `0${n}`}
            </span>
            <div className="min-w-0">
              <div
                className={cn(
                  "font-mono text-[10px] font-bold uppercase tracking-[0.16em]",
                  current ? "text-[#c2f74d]" : done ? "text-[#4d7500]" : "text-muted-foreground",
                )}
              >
                {t.stepLabel(n)}
              </div>
              <div
                className={cn(
                  "mt-0.5 truncate text-xs font-semibold",
                  current ? "text-white" : "text-foreground",
                )}
              >
                {s.title}
              </div>
              <div
                className={cn(
                  "mt-0.5 line-clamp-1 text-[11px]",
                  current ? "text-white/65" : "text-muted-foreground",
                )}
              >
                {s.sub}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SendPayment() {
  const t = useLangCopy(COPY);
  const trader = useTrader();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { invoice: invoiceParam } = Route.useSearch();
  const wallet = useWallet();
  const corridors = useQuery({ queryKey: ["corridors"], queryFn: corridorApi.list });
  const received = useInvoices("received");
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
    retry: false,
  });

  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [destId, setDestId] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [payerPhone, setPayerPhone] = useState(trader.phone_number);
  const [authRef, setAuthRef] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const [activeWf, setActiveWf] = useState<string | null>(null);
  const [domesticResult, setDomesticResult] = useState<Transfer | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  // One key per intended payment: retrying after a network error can never double-charge.
  const keyRef = useRef(newIdempotencyKey());

  useEffect(() => setRecent(readRecentWorkflows(trader.id)), [trader.id, activeWf]);

  const businessAccounts = useMemo(
    () => (wallet.data?.accounts ?? []).filter((a) => a.type === "BUSINESS"),
    [wallet.data],
  );
  const source: Account | undefined =
    businessAccounts.find((a) => a.id === sourceId) ?? businessAccounts[0];
  const destOptions = (recipient?.accounts ?? []).filter((a) => a.type === "BUSINESS");
  const dest: Account | undefined = destOptions.find((a) => a.id === destId) ?? destOptions[0];
  const countryForCurrency = (currency: string) =>
    config.data?.countries.find((m) => m.currency === currency)?.code;

  const lookup = useMutation({
    mutationFn: () => ledger.recipient(phone.trim()),
    onSuccess: (r) => {
      setRecipient(r);
      setDestId("");
    },
    onError: (e) => {
      setRecipient(null);
      toast.error(
        isApiError(e) && e.status === 404 ? "No VUKA trader with that number" : describeError(e),
      );
    },
  });

  const value = Number(amount);
  const amountValid = Number.isFinite(value) && value > 0;
  const balance = source ? (wallet.data?.balances[source.id]?.amount ?? 0) : 0;

  const mode: Mode | null =
    !source || !dest ? null : source.currency === dest.currency ? "domestic" : "workflow";
  const corridor = useMemo(
    () =>
      source && dest && source.currency !== dest.currency
        ? corridors.data?.find(
            (c) => c.from_currency === source.currency && c.to_currency === dest.currency,
          )
        : undefined,
    [corridors.data, source, dest],
  );

  const debouncedMinor = useDebounced(amountValid ? toMinor(value) : 0);
  const quote = useQuery({
    queryKey: ["quote", corridor?.id, debouncedMinor],
    queryFn: () => corridorApi.quote(corridor!.id, debouncedMinor),
    enabled: !!corridor && debouncedMinor > 0,
    retry: false,
  });

  const unpaidInvoices = (received.data ?? []).filter((i) => i.status !== "PAID");

  // Apply the ?invoice= deep link once, when the received invoices have loaded.
  const appliedParam = useRef(false);
  useEffect(() => {
    if (appliedParam.current || !invoiceParam || !received.data) return;
    appliedParam.current = true;
    const inv = received.data.find((i) => i.number === invoiceParam && i.status !== "PAID");
    if (inv) {
      setInvoiceNumber(inv.number);
      setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
    }
  }, [invoiceParam, received.data]);

  function pickInvoice(number: string) {
    setInvoiceNumber(number === "none" ? "" : number);
    const inv = unpaidInvoices.find((i) => i.number === number);
    if (inv) setAmount(String(Math.round(invoiceTotal(inv) * 100) / 100));
  }

  const overBalance = amountValid && value > balance;
  const corridorLimit =
    corridor &&
    amountValid &&
    (toMinor(value) < corridor.min_amount_minor || toMinor(value) > corridor.max_amount_minor);

  const problem: string | null = !source
    ? "You have no business wallet yet."
    : !dest
      ? "Look up a recipient to choose a destination wallet."
      : !amountValid
        ? "Enter an amount."
        : overBalance
          ? `Amount exceeds your available balance (${money(balance, source.currency)}).`
          : source.currency !== dest.currency && corridors.isSuccess && !corridor
            ? `No corridor is available for ${source.currency} → ${dest.currency}.`
            : corridorLimit
              ? "Amount is outside this corridor's limits."
              : mode !== "domestic" && !quote.data
                ? quote.isError
                  ? describeError(quote.error)
                  : "Waiting for a quote…"
                : null;

  function resetWizard() {
    setStep(1);
    setPhone("");
    setRecipient(null);
    setDestId("");
    setAmount("");
    setInvoiceNumber("");
    setAuthRef("");
    setNeedsAuth(false);
    setActiveWf(null);
    setDomesticResult(null);
    keyRef.current = newIdempotencyKey();
  }

  const send = useMutation({
    mutationFn: async (): Promise<SendResult> => {
      const key = keyRef.current;
      if (mode === "domestic") {
        const input: Parameters<typeof ledger.createTransfer>[0] = {
          source_account_id: source!.id,
          destination_account_id: dest!.id,
          amount: value,
          currency: source!.currency,
        };
        if (invoiceNumber) input.invoice_number = invoiceNumber;
        const res = await ledger.createTransfer(input, key);
        return { kind: "domestic", transfer: res.transfer };
      }
      const res = await workflows.start(
        {
          source_account_id: source!.id,
          destination_account_id: dest!.id,
          collection_phone: payerPhone.trim(),
          payout_phone: recipient!.user.phone_number,
          corridor_id: corridor!.id,
          quote_id: quote.data!.quote.id,
          amount: value,
          currency_from: source!.currency,
          currency_to: dest!.currency,
          rate: quote.data!.quote.rate,
          ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
          ...(authRef.trim() ? { provider_authorization_ref: authRef.trim() } : {}),
        },
        key,
      );
      return {
        kind: "workflow",
        workflow: res.workflow,
        ...(res.error ? { error: res.error } : {}),
      };
    },
    onSuccess: (res) => {
      setNeedsAuth(false);
      if (res.kind === "domestic") {
        setDomesticResult(res.transfer);
        toast.success("Transfer completed", {
          description: `${money(value, source!.currency)} → ${recipient!.user.full_name}`,
        });
      } else {
        if (res.workflow) {
          rememberWorkflow(trader.id, res.workflow.id);
          setActiveWf(res.workflow.id);
          if (res.error)
            toast.warning("Payment started but needs attention", { description: res.error });
        }
        toast.success("Payment submitted", {
          description: `${money(value, source!.currency)} → ${recipient!.user.full_name}`,
        });
      }
      keyRef.current = newIdempotencyKey();
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => {
      const wf = workflowFromError(e);
      if (wf) {
        rememberWorkflow(trader.id, wf.id);
        setActiveWf(wf.id);
        keyRef.current = newIdempotencyKey();
      }
      if (e instanceof ApiError && e.code === "provider_authorization_required") {
        setNeedsAuth(true);
        toast.warning("Provider authorization needed", {
          description: "Approve the prompt on your mobile money app, then enter the reference.",
        });
        return;
      }
      if (e instanceof ApiError && e.code === "insufficient_funds") {
        const b = e.body as
          | { available?: number; required?: number; currency?: string }
          | undefined;
        toast.error("Insufficient funds", {
          description:
            b?.available !== undefined
              ? `Available ${money(b.available, b.currency)}, required ${money(b.required ?? 0, b.currency)}`
              : e.message,
        });
        return;
      }
      if (e instanceof ApiError && e.code.startsWith("kyc_")) {
        toast.error("Verification limit reached", {
          description: e.message,
          action: {
            label: "Verify account",
            onClick: () => void navigate({ to: "/verification" }),
          },
        });
        return;
      }
      toast.error("Payment not completed", { description: describeError(e) });
    },
  });

  const q = quote.data?.quote;
  const inFlight = !!activeWf || !!domesticResult;
  const sourceCountry = source ? countryForCurrency(source.currency) : undefined;
  const destCountry = dest ? countryForCurrency(dest.currency) : undefined;
  const markets = config.data?.countries ?? [];

  return (
    <div className="space-y-6">
      {/* Executive Settlement Desk Banner */}
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
          className="pointer-events-none absolute -right-12 -bottom-16 hidden w-[320px] opacity-20 select-none xl:block"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                {t.bannerBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <Lock className="size-3 text-[#c2f74d]" /> {t.replaySafe}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {t.bannerTitle}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              {t.bannerDesc}
            </p>
          </div>

          {/* Live Liquidity & Corridor Status Strip */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  {t.sourceVault}
                </span>
                {sourceCountry ? <Flag code={sourceCountry} className="w-4 rounded-[2px]" /> : null}
              </div>
              <div className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-white">
                {source ? money(balance, source.currency) : "—"}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] text-white/60">
                <span>{t.availableLiquidity}</span>
                <Link to="/wallets" className="text-[#c2f74d] hover:underline">
                  {t.topUp}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                  {t.settlementEngine}
                </span>
                <Globe2 className="size-4 text-[#c2f74d]" />
              </div>
              <div className="mt-2.5 font-mono text-xl font-bold text-white">
                {corridor
                  ? `${corridor.from_currency} → ${corridor.to_currency}`
                  : mode === "domestic"
                    ? `${source?.currency} Instant`
                    : `${config.data?.corridor_count ?? 90} Corridors`}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] text-white/60">
                <span>
                  {corridor
                    ? t.feeLabel(corridor.fees_bps)
                    : "0.80% Intra · 1.20% Cross"}
                </span>
                <span className="text-[#c2f74d]">{t.liveFx}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {inFlight ? (
        <div className="space-y-4">
          {activeWf ? (
            <ProcessingPanel id={activeWf} payerPhone={payerPhone} onReset={resetWizard} />
          ) : null}
          {domesticResult ? (
            <DomesticSuccessPanel
              transfer={domesticResult}
              recipientName={recipient?.user.full_name ?? "the recipient"}
              onReset={resetWizard}
            />
          ) : null}
          <RecentPayments ids={recent} onOpen={(id) => setActiveWf(id)} />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_430px] lg:items-start">
          {/* Left Column: 3-Step Interactive Dispatch Workbench */}
          <Panel
            title={t.dispatchWorkbench}
            meta={
              <Chip tone="live">
                <ShieldCheck className="size-3" /> {t.stepOf(step, 3)}
              </Chip>
            }
          >
            {wallet.isPending ? (
              <Loading />
            ) : wallet.isError ? (
              <ErrorState error={wallet.error} onRetry={() => void wallet.refetch()} />
            ) : (
              <div>
                <StepRail step={step} onJump={setStep} />

                {/* STEP 1: RECIPIENT & CORRIDOR */}
                {step === 1 ? (
                  <div className="space-y-5">
                    {/* Quick Country Dial-Code Prefix Bar */}
                    {markets.length > 0 ? (
                      <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {t.marketsBar}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {markets.map((m) => {
                            const dial = DIAL[m.code] ?? "";
                            const prefix = `+${dial}`;
                            const activePrefix = phone.startsWith(prefix);
                            return (
                              <button
                                key={m.code}
                                type="button"
                                onClick={() => {
                                  if (!phone.startsWith(prefix)) {
                                    setPhone(prefix);
                                    setRecipient(null);
                                  }
                                }}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all",
                                  activePrefix
                                    ? "border-[#151515] bg-[#151515] font-semibold text-[#c2f74d]"
                                    : "border-border bg-card text-foreground hover:border-[#79b200]",
                                )}
                              >
                                <Flag code={m.code} className="w-3.5 rounded-[2px]" />
                                <span>{m.code}</span>
                                <span className="opacity-70">{prefix}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        {t.msisdnLabel}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setRecipient(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && phone.trim()) {
                              e.preventDefault();
                              lookup.mutate();
                            }
                          }}
                          placeholder="+254700000000"
                          inputMode="tel"
                          className="h-11 rounded-xl font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl border-[#151515] bg-[#151515] px-5 font-mono text-xs font-semibold uppercase text-[#c2f74d] hover:bg-[#151515]/90 hover:text-[#c2f74d]"
                          disabled={!phone.trim() || lookup.isPending}
                          onClick={() => lookup.mutate()}
                        >
                          {lookup.isPending ? t.btnVerifying : t.btnVerifyTrader}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.msisdnHint}
                      </p>

                      {recipient ? (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#79b200]/50 bg-[#f5fbe6] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <div className="flex items-center gap-3.5">
                            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#151515] font-mono text-sm font-bold text-[#c2f74d]">
                              {recipient.user.full_name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">
                                  {recipient.user.full_name}
                                </span>
                                <Chip tone="live">{t.verifiedCounterparty}</Chip>
                              </div>
                              <div className="mt-0.5 font-mono text-xs opacity-75">
                                {recipient.user.phone_number} · {t.vaultsCount(destOptions.length)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {recipient && destOptions.length > 1 ? (
                      <div className="space-y-1.5">
                        <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                          {t.destVaultLabel}
                        </Label>
                        <Select value={dest?.id ?? ""} onValueChange={setDestId}>
                          <SelectTrigger
                            aria-label="Recipient wallet"
                            className="h-11 rounded-xl font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {destOptions.map((a) => {
                              const cc = countryForCurrency(a.currency);
                              return (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-2">
                                    {cc ? <Flag code={cc} className="w-4 rounded-[2px]" /> : null}
                                    Business Trade Vault · {a.currency}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    <Button
                      className="h-11 w-full rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                      disabled={!recipient || !dest}
                      onClick={() => setStep(2)}
                    >
                      {t.continueToQuote} <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                  </div>
                ) : null}

                {/* STEP 2: AMOUNT, INVOICE & QUOTE */}
                {step === 2 ? (
                  <div className="space-y-5">
                    <RecipientSummary
                      recipient={recipient}
                      dest={dest}
                      countryForCurrency={countryForCurrency}
                      onEdit={() => setStep(1)}
                    />

                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        {t.sourceVaultSelect}
                      </Label>
                      <Select value={source?.id ?? ""} onValueChange={setSourceId}>
                        <SelectTrigger
                          aria-label="Pay from"
                          className="h-11 rounded-xl font-mono text-xs"
                        >
                          <SelectValue placeholder="Business wallet" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {businessAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              Business Trade Vault ·{" "}
                              {money(wallet.data.balances[a.id]?.amount ?? 0, a.currency)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                            {t.amountLabel(source?.currency ?? "")}
                          </Label>
                          {source ? (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {t.availLabel(money(balance, source.currency))}
                            </span>
                          ) : null}
                        </div>
                        <Input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="h-11 rounded-xl font-mono text-base font-bold"
                        />
                        {/* Quick Balance Allocation Chips */}
                        {balance > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { label: "25%", frac: 0.25 },
                              { label: "50%", frac: 0.5 },
                              { label: "75%", frac: 0.75 },
                              { label: "Max", frac: 1 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  setAmount(String(Math.floor(balance * preset.frac)))
                                }
                                className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition hover:border-[#79b200] hover:bg-[#c2f74d]/25 hover:text-foreground"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                          {t.linkInvoiceLabel}
                        </Label>
                        <Select value={invoiceNumber || "none"} onValueChange={pickInvoice}>
                          <SelectTrigger
                            aria-label="Pay an invoice"
                            className="h-11 rounded-xl font-mono text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">{t.noLinkedInvoice}</SelectItem>
                            {unpaidInvoices.map((i) => (
                              <SelectItem key={i.id} value={i.number}>
                                {i.number} · {money(invoiceTotal(i), i.currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          {t.linkInvoiceHint}
                        </p>
                      </div>
                    </div>

                    {/* Live Conversion Preview Strip inside Step 2 */}
                    {mode === "workflow" && amountValid ? (
                      <div className="rounded-2xl border border-[#79b200]/40 bg-[#f6fce8] p-4 text-xs text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                        {quote.isFetching && !q ? (
                          <span className="font-mono text-muted-foreground">
                            {t.lockingRate}
                          </span>
                        ) : q ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4d7500]">
                                {t.firmQuoteLocked}
                              </div>
                              <div className="mt-1 text-sm font-bold">
                                {t.supplierReceives}{" "}
                                <span className="font-mono text-base underline decoration-[#79b200]">
                                  {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-[11px]">
                              <div>
                                1 {q.from_currency} = {q.inverse_rate.toPrecision(5)}{" "}
                                {q.to_currency}
                              </div>
                              <div className="text-muted-foreground">
                                Fee: {money(fromMinor(q.fee_minor), q.from_currency)} (
                                {(corridor!.fees_bps / 100).toFixed(2)}%)
                              </div>
                            </div>
                          </div>
                        ) : quote.isError ? (
                          <span className="text-destructive">{describeError(quote.error)}</span>
                        ) : null}
                      </div>
                    ) : mode === "domestic" && amountValid ? (
                      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs">
                        <span className="font-mono font-semibold text-foreground">
                          {t.domesticBookSettlement}{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {t.domesticBookDesc(source?.currency ?? "")}
                        </span>
                      </div>
                    ) : null}

                    {problem ? (
                      <div
                        role="status"
                        className="rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 font-mono text-xs text-destructive"
                      >
                        {problem}
                      </div>
                    ) : null}

                    <div className="flex gap-2.5">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-mono text-xs uppercase"
                        onClick={() => setStep(1)}
                      >
                        {t.btnBack}
                      </Button>
                      <Button
                        className="h-11 flex-1 rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                        disabled={!!problem}
                        onClick={() => setStep(3)}
                      >
                        {t.btnReviewTicket} <ArrowRight className="ml-1.5 size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* STEP 3: REVIEW & DISPATCH */}
                {step === 3 ? (
                  <div className="space-y-5">
                    <RecipientSummary
                      recipient={recipient}
                      dest={dest}
                      countryForCurrency={countryForCurrency}
                      onEdit={() => setStep(1)}
                    />

                    {/* Principal & Invoice Summary */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {t.principalAmount}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold">
                            {source ? money(value, source.currency) : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Edit amount"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {invoiceNumber ? (
                        <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            {t.linkedInvoice}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#c2f74d]/35 px-2 py-0.5 font-mono text-xs font-semibold">
                            <FileText className="size-3" /> {invoiceNumber}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Payment Collection Rail */}
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                        {t.collectionRail}
                      </Label>
                      {mode === "domestic" ? (
                        <div className="flex items-center gap-3.5 rounded-2xl border border-[#79b200]/50 bg-[#f6fce8] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
                            <Wallet className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold">{t.vaultBalanceTitle}</div>
                            <p className="text-xs text-muted-foreground">
                              {t.vaultBalanceDesc}
                            </p>
                          </div>
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#151515] text-[#c2f74d]">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#79b200]/50 bg-[#f6fce8] p-4 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
                          <div className="flex items-center gap-3.5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#151515] text-[#c2f74d]">
                              <Smartphone className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold">
                                {t.momoRailTitle}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t.momoRailDesc}
                              </p>
                            </div>
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#151515] text-[#c2f74d]">
                              <Check className="size-3" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="mt-4 space-y-1.5 border-t border-black/10 pt-3 dark:border-white/10">
                            <Label
                              htmlFor="payer-phone"
                              className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                            >
                              {t.payerPhoneLabel}
                            </Label>
                            <Input
                              id="payer-phone"
                              value={payerPhone}
                              onChange={(e) => setPayerPhone(e.target.value)}
                              inputMode="tel"
                              className="h-10 rounded-xl bg-white font-mono dark:bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {needsAuth ? (
                      <div className="space-y-2 rounded-2xl border-2 border-[#151515] bg-muted/30 p-4">
                        <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                          {t.authRefLabel}
                        </Label>
                        <Input
                          value={authRef}
                          onChange={(e) => setAuthRef(e.target.value)}
                          placeholder={t.authRefPlaceholder}
                          className="h-10 rounded-xl font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {t.authRefDesc}
                        </p>
                      </div>
                    ) : null}

                    {problem ? (
                      <p role="status" className="font-mono text-xs text-destructive">
                        {problem}
                      </p>
                    ) : null}

                    <div className="flex gap-2.5">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-mono text-xs uppercase"
                        onClick={() => setStep(2)}
                      >
                        {t.btnBack}
                      </Button>
                      <Button
                        className="h-11 flex-1 rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
                        disabled={
                          !!problem ||
                          send.isPending ||
                          (mode === "workflow" && !payerPhone.trim()) ||
                          (needsAuth && !authRef.trim())
                        }
                        onClick={() => send.mutate()}
                      >
                        <Send className="mr-1.5 size-3.5" />
                        {send.isPending ? t.btnDispatching : t.btnConfirmDispatch}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>

          {/* Right Column: Live Dark-Ink Settlement Ticket + Recent Workflows */}
          <div className="space-y-4">
            <section className="relative overflow-hidden rounded-3xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full opacity-20 blur-3xl"
                style={{ background: "radial-gradient(circle, #c2f74d 0%, transparent 70%)" }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#c2f74d]">
                      {t.liveTicket}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-white/70">
                      {corridor
                        ? `Corridor ${corridor.id}`
                        : mode === "domestic"
                          ? "Same-Currency Book Transfer"
                          : "Awaiting Route Selection"}
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-white">
                    {corridor ? `${(corridor.fees_bps / 100).toFixed(2)}% Fee` : "0.00% Fee"}
                  </span>
                </div>

                {/* 3-Node Visual Route Diagram */}
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                      {t.originVault}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-bold">
                      {sourceCountry ? (
                        <Flag code={sourceCountry} className="w-4 rounded-[2px]" />
                      ) : null}
                      <span>{source?.currency ?? "—"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/55">
                      {trader.full_name}
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <span className="rounded-full bg-[#c2f74d]/20 px-2 py-0.5 font-mono text-[9px] font-semibold text-[#c2f74d]">
                      {mode === "domestic" ? "LEDGER" : "3-HOP FX"}
                    </span>
                    <ArrowRight className="mt-1 size-4 text-[#c2f74d]" />
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                      {t.targetVault}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1.5 font-mono text-xs font-bold">
                      {destCountry ? (
                        <Flag code={destCountry} className="w-4 rounded-[2px]" />
                      ) : null}
                      <span>{dest?.currency ?? "Select"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/55">
                      {recipient?.user.full_name ?? "Unselected"}
                    </div>
                  </div>
                </div>

                {/* Live Quote Details */}
                <div className="mt-4">
                  {!corridor ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/70">
                      {source && dest ? (
                        <div className="space-y-2">
                          <TicketRow
                            k={t.principalAmount}
                            v={amountValid ? money(value, source.currency) : "0.00"}
                          />
                          <TicketRow k="Protocol Fee" v="0.00 (Same currency)" />
                          <div className="flex items-baseline justify-between border-t border-white/10 pt-2.5 text-sm">
                            <span className="text-white/70">{t.supplierReceives}</span>
                            <span className="font-bold text-[#c2f74d]">
                              {amountValid ? money(value, source.currency) : "—"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-white/60">
                          Verify a recipient in Step 01 and enter an amount in Step 02 to stream a
                          firm corridor quote from the settlement engine.
                        </p>
                      )}
                    </div>
                  ) : quote.isFetching && !q ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center font-mono text-xs text-[#c2f74d]">
                      Streaming live corridor quote…
                    </div>
                  ) : quote.isError ? (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
                      {describeError(quote.error)}
                    </div>
                  ) : q ? (
                    <dl className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs">
                      <TicketRow
                        k="You Send"
                        v={money(fromMinor(q.source_amount_minor), q.from_currency)}
                      />
                      <TicketRow
                        k={`Corridor Fee (${(corridor.fees_bps / 100).toFixed(2)}%)`}
                        v={`−${money(fromMinor(q.fee_minor), q.from_currency)}`}
                      />
                      <TicketRow
                        k="Locked FX Rate"
                        v={`1 ${q.from_currency} = ${q.inverse_rate.toPrecision(5)} ${q.to_currency}`}
                      />
                      {invoiceNumber ? <TicketRow k={t.linkedInvoice} v={invoiceNumber} /> : null}
                      <div className="flex items-baseline justify-between border-t border-white/15 pt-3 text-sm">
                        <dt className="font-sans text-xs font-semibold text-white/80">
                          {t.supplierReceivesNet}
                        </dt>
                        <dd className="font-mono text-lg font-bold tabular-nums text-[#c2f74d]">
                          {money(fromMinor(q.deliver_amount_minor), q.to_currency)}
                        </dd>
                      </div>
                      <p className="border-t border-white/10 pt-2.5 text-[10px] leading-relaxed text-white/50">
                        Quote {truncMid(q.id, 10, 8)} · Valid until{" "}
                        {new Date(q.expires_at).toLocaleTimeString()}
                        {quote.data?.execution === "local_synthetic"
                          ? " · Sandbox synthetic rail"
                          : ""}
                      </p>
                    </dl>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/60">
                      Enter a payment amount in {source?.currency} to calculate the live FX
                      conversion and corridor fee.
                    </div>
                  )}
                </div>

                {/* Idempotency & Security Footer */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-[10px] text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3 text-[#c2f74d]" /> {t.idempotencyKey}
                  </span>
                  <span>{truncMid(keyRef.current, 8, 6)}</span>
                </div>
              </div>
            </section>

            <RecentPayments ids={recent} onOpen={setActiveWf} />
          </div>
        </div>
      )}
    </div>
  );
}

function TicketRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/55">{k}</dt>
      <dd className="font-semibold tabular-nums text-white">{v}</dd>
    </div>
  );
}

function RecipientSummary({
  recipient,
  dest,
  countryForCurrency,
  onEdit,
}: {
  recipient: Recipient | null;
  dest: Account | undefined;
  countryForCurrency: (currency: string) => string | undefined;
  onEdit: () => void;
}) {
  const t = useLangCopy(COPY);
  if (!recipient) return null;
  const cc = dest ? countryForCurrency(dest.currency) : undefined;
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#79b200]/45 bg-[#f5fbe6] p-3.5 text-[#151515] dark:bg-[#1b2410] dark:text-foreground">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#151515] font-mono text-xs font-bold text-[#c2f74d]">
          {recipient.user.full_name.charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="text-sm font-bold">{recipient.user.full_name}</div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-75">
            {cc ? <Flag code={cc} className="w-3.5 rounded-[2px]" /> : null}
            {recipient.user.phone_number}
            {dest ? ` · ${dest.currency} Vault` : ""}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase hover:bg-white dark:border-white/15 dark:bg-black/30"
      >
        <Pencil className="size-3" aria-hidden="true" /> {t.changeRecipient}
      </button>
    </div>
  );
}

/** The processing step — the already-live PaymentStepper inside WorkflowTracker — plus a plain
 * "start another payment" exit once the workflow has settled, success or not. */
function ProcessingPanel({
  id,
  payerPhone,
  onReset,
}: {
  id: string;
  payerPhone: string;
  onReset: () => void;
}) {
  const t = useLangCopy(COPY);
  const wf = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => workflows.get(id),
    refetchInterval: (q) => (isSettled(q.state.data?.state) ? false : 2000),
  });
  const settled = isSettled(wf.data?.state);
  const completed = wf.data?.state === "COMPLETED";

  return (
    <>
      <Panel
        title={t.telemetryTitle}
        meta={
          <Chip tone="live">
            <Zap className="size-3" /> {t.realtimeStateMachine}
          </Chip>
        }
      >
        <WorkflowTracker id={id} defaultPhone={payerPhone} />
      </Panel>
      {settled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {completed ? t.paymentSettledMsg : t.paymentPausedMsg}
          </p>
          <Button
            className="rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
            onClick={onReset}
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" /> {t.btnSendAnother}
          </Button>
        </div>
      ) : null}
    </>
  );
}

/** Domestic transfers settle instantly and never produce a trackable Workflow, so they get their own
 * lightweight success screen instead of the multi-step tracker. */
function DomesticSuccessPanel({
  transfer,
  recipientName,
  onReset,
}: {
  transfer: Transfer;
  recipientName: string;
  onReset: () => void;
}) {
  const t = useLangCopy(COPY);
  const [copied, setCopied] = useState(false);
  return (
    <Panel title={t.domesticTitle} meta={<Chip tone="live">Settled</Chip>}>
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-[#151515] text-[#c2f74d] shadow-lg">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-bold">{t.paymentSettledHeader}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.transferredTo(money(transfer.amount, transfer.currency), recipientName)}
        </p>
        <dl className="mt-6 w-full max-w-md space-y-2.5 rounded-2xl border border-border bg-muted/20 p-5 text-left font-mono text-xs">
          <Line k="Amount" v={money(transfer.amount, transfer.currency)} />
          <Line k="Protocol Fee" v="0.00 (Same-currency book transfer)" />
          <div className="flex justify-between border-t border-border pt-2.5 text-sm font-bold">
            <dt>{t.totalSettled}</dt>
            <dd className="tabular-nums">{money(transfer.amount, transfer.currency)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <dt className="text-muted-foreground">{t.ledgerTransferId}</dt>
            <dd className="flex items-center gap-1.5 font-semibold">
              <span>{shortId(transfer.id, 14)}</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(transfer.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copy transaction ID"
              >
                {copied ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </dd>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">{when(transfer.created_at)}</p>
        </dl>
        <Button
          className="mt-6 h-11 rounded-xl bg-[#151515] px-6 font-mono text-xs font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
          onClick={onReset}
        >
          <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" /> {t.btnSendAnother}
        </Button>
      </div>
    </Panel>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function RecentPayments({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  const t = useLangCopy(COPY);
  const results = useQueries({
    queries: ids.slice(0, 6).map((id) => ({
      queryKey: ["workflow", id],
      queryFn: () => workflows.get(id),
    })),
  });
  return (
    <Panel title={t.recentWorkflows} meta={<Chip>{t.recentTracked(ids.length)}</Chip>}>
      {ids.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t.recentEmpty}
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {ids.slice(0, 6).map((id, i) => {
            const w = results[i]?.data;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onOpen(id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block font-mono text-xs font-semibold">
                      {shortId(id, 14)}
                    </span>
                    {w ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {money(w.amount, w.currency_from)} → {w.currency_to} ({w.corridor_id})
                      </span>
                    ) : null}
                  </span>
                  {w ? (
                    <Chip tone={stateTone(w.state)}>{w.state.replaceAll("_", " ")}</Chip>
                  ) : (
                    <Chip>…</Chip>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
