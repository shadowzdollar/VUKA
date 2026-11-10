import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Briefcase,
  Download,
  FileDown,
  Lock,
  PlusCircle,
  Send,
  UserRound,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { DataTable } from "@/components/vuka/data-table";
import { ErrorState, Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { describeError, newIdempotencyKey } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { Account, Transfer } from "@/lib/api/types";
import { downloadCsv, money, shortId, when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { directionFor, useTransfers, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/wallets/")({
  head: () => ({
    meta: [
      { title: "Wallets & Ledger — VUKA" },
      {
        name: "description",
        content:
          "Separate personal and business wallets with balances derived from an immutable double-entry ledger.",
      },
    ],
  }),
  component: Wallets,
});

const COPY = {
  en: {
    bannerPill1: "Double-Entry Ledger Engine",
    bannerPill2: "ISO 20022 camt.053 Statements",
    title: "Wallets & Immutable Ledger",
    description:
      "Trade capital sits in your Business Trade Vault, strictly separated from your Personal Wallet. No mutable balance column exists — every balance is derived in real time from balanced debit and credit postings.",
    topUpBtn: "Top Up Vault",
    sendPaymentBtn: "Send Payment",
    exportCsvBtn: "Export CSV",
    toastExported: "Transfers exported",
    toastRows: (n: number) => `${n} rows`,
    noAccounts: "No accounts found.",
    businessWallet: "Business wallet",
    personalWallet: "Personal wallet",
    cardAria: (lbl: string, bal: string) => `${lbl}, ${bal}. View statement and history.`,
    accountSub: (id: string) => `Account ${id} · Σ Ledger entries`,
    statementLink: "Statement & camt.053 →",
    primaryBadge: "Primary",
    metricOutbound: "Outbound Settlements",
    metricOutboundSub: "Sent from your vaults",
    metricInbound: "Inbound Receipts",
    metricInboundSub: (n: number) => `${n} total ledger transfers`,
    registerTitle: "Double-Entry Transfer Register",
    transfersCount: (n: number) => `${n} transfers`,
    tableCaption: "Transfer register",
    emptyTransfers:
      "No transfers match the selected filter. Top up a wallet or send a payment to see ledger postings.",
    filterByAccountAria: "Filter by account",
    allVaults: "All Vaults & Wallets",
    dirAll: "All",
    dirSent: "Sent",
    dirReceived: "Received",
    dirInternal: "Internal",
    colTransferId: "Transfer ID",
    colTimestamp: "Timestamp",
    colFlow: "Flow",
    colInvoice: "Invoice",
    colExtRef: "External Ref",
    colAmount: "Amount",
    colStatus: "Status",
    fundTitle: "Top Up Vault (Sandbox Cash-In)",
    fundDesc:
      "Credits your selected vault via a balanced external cash-in ledger entry. Protected by an idempotency key so retries never double-credit.",
    targetVaultLabel: "Target Vault / Wallet",
    walletAria: "Wallet",
    selectWalletPlaceholder: "Select wallet",
    topUpAmountLabel: (cur: string) => `Top-Up Amount ${cur ? `(${cur})` : ""}`,
    postingLedger: "Posting to Ledger…",
    confirmTopUp: "Confirm Cash-In Top-Up",
    toastToppedUp: "Wallet topped up",
    toastTopUpFailed: "Top-up failed",
    entriesTitle: (id: string) => `Ledger Transfer ${id}`,
    postingsHeading: "Double-Entry Ledger Postings",
    colEntryId: "Entry ID",
    colAccount: "Account",
    colDebit: "Debit (−)",
    colCredit: "Credit (+)",
    crossCurrencyNote:
      "Cross-currency transfer: postings are balanced per currency leg through the FX settlement accounts.",
    sumPostingsIn: (cur: string) => `Σ postings in ${cur}`,
    zeroSumBalanced: "Zero-Sum Balanced",
  },
  fr: {
    bannerPill1: "Moteur de registre à double entrée",
    bannerPill2: "Relevés ISO 20022 camt.053",
    title: "Portefeuilles et registre immuable",
    description:
      "Le capital commercial réside dans votre coffre professionnel, strictement séparé de votre portefeuille personnel. Il n'existe aucune colonne de solde modifiable : chaque solde est calculé en temps réel à partir d'écritures de débit et de crédit équilibrées.",
    topUpBtn: "Approvisionner le coffre",
    sendPaymentBtn: "Envoyer un paiement",
    exportCsvBtn: "Exporter en CSV",
    toastExported: "Transferts exportés",
    toastRows: (n: number) => `${n} lignes`,
    noAccounts: "Aucun compte trouvé.",
    businessWallet: "Portefeuille professionnel",
    personalWallet: "Portefeuille personnel",
    cardAria: (lbl: string, bal: string) => `${lbl}, ${bal}. Voir le relevé et l'historique.`,
    accountSub: (id: string) => `Compte ${id} · Σ Écritures du registre`,
    statementLink: "Relevé et camt.053 →",
    primaryBadge: "Principal",
    metricOutbound: "Règlements sortants",
    metricOutboundSub: "Envoyés depuis vos coffres",
    metricInbound: "Encaissements entrants",
    metricInboundSub: (n: number) => `${n} transferts au registre au total`,
    registerTitle: "Registre des transferts à double entrée",
    transfersCount: (n: number) => `${n} transferts`,
    tableCaption: "Registre des transferts",
    emptyTransfers:
      "Aucun transfert ne correspond au filtre sélectionné. Approvisionnez un portefeuille ou envoyez un paiement pour voir les écritures.",
    filterByAccountAria: "Filtrer par compte",
    allVaults: "Tous les coffres et portefeuilles",
    dirAll: "Tous",
    dirSent: "Envoyés",
    dirReceived: "Reçus",
    dirInternal: "Internes",
    colTransferId: "ID de transfert",
    colTimestamp: "Horodatage",
    colFlow: "Flux",
    colInvoice: "Facture",
    colExtRef: "Réf. externe",
    colAmount: "Montant",
    colStatus: "Statut",
    fundTitle: "Approvisionner le coffre (Dépôt Sandbox)",
    fundDesc:
      "Crédite le coffre sélectionné via une écriture d'apport externe équilibrée. Protégé par une clé d'idempotence pour éviter tout double crédit.",
    targetVaultLabel: "Coffre / Portefeuille cible",
    walletAria: "Portefeuille",
    selectWalletPlaceholder: "Sélectionner un portefeuille",
    topUpAmountLabel: (cur: string) => `Montant de l'approvisionnement ${cur ? `(${cur})` : ""}`,
    postingLedger: "Écriture au registre…",
    confirmTopUp: "Confirmer l'approvisionnement",
    toastToppedUp: "Portefeuille approvisionné",
    toastTopUpFailed: "Échec de l'approvisionnement",
    entriesTitle: (id: string) => `Transfert du registre ${id}`,
    postingsHeading: "Écritures du registre à double entrée",
    colEntryId: "ID d'écriture",
    colAccount: "Compte",
    colDebit: "Débit (−)",
    colCredit: "Crédit (+)",
    crossCurrencyNote:
      "Transfert inter-devises : les écritures sont équilibrées par devise via les comptes de règlement FX.",
    sumPostingsIn: (cur: string) => `Σ écritures en ${cur}`,
    zeroSumBalanced: "Équilibre à somme nulle",
  },
  sw: {
    bannerPill1: "Injini ya Leja ya Maingizo Mawili",
    bannerPill2: "Taarifa za ISO 20022 camt.053",
    title: "Pochi na Leja Isiyobadilika",
    description:
      "Mtaji wa biashara uko kwenye Hazina yako ya Biashara, ukitenganishwa kabisa na Pochi yako Binafsi. Hakuna safu ya salio inayohaririwa — kila salio linakokotolewa moja kwa moja kutokana na maingizo ya kutoa na kuweka yaliyosawazishwa.",
    topUpBtn: "Jaza Hazina",
    sendPaymentBtn: "Tuma Malipo",
    exportCsvBtn: "Hamisha CSV",
    toastExported: "Uhamisho umehamishwa",
    toastRows: (n: number) => `safu ${n}`,
    noAccounts: "Hakuna akaunti zilizopatikana.",
    businessWallet: "Pochi ya biashara",
    personalWallet: "Pochi binafsi",
    cardAria: (lbl: string, bal: string) => `${lbl}, ${bal}. Tazama taarifa na historia.`,
    accountSub: (id: string) => `Akaunti ${id} · Σ Maingizo ya leja`,
    statementLink: "Taarifa & camt.053 →",
    primaryBadge: "Kuu",
    metricOutbound: "Malipo Yanayotoka",
    metricOutboundSub: "Yaliyotumwa kutoka hazina zako",
    metricInbound: "Mapato Yanayoingia",
    metricInboundSub: (n: number) => `jumla ya uhamisho ${n} wa leja`,
    registerTitle: "Rejista ya Uhamisho wa Maingizo Mawili",
    transfersCount: (n: number) => `uhamisho ${n}`,
    tableCaption: "Rejista ya uhamisho",
    emptyTransfers:
      "Hakuna uhamisho unaolingana na kichujio kilichochaguliwa. Jaza pochi au tuma malipo ili kuona maingizo ya leja.",
    filterByAccountAria: "Chuja kwa akaunti",
    allVaults: "Hazina na Pochi Zote",
    dirAll: "Zote",
    dirSent: "Zilizotumwa",
    dirReceived: "Zilizopokelewa",
    dirInternal: "Za Ndani",
    colTransferId: "ID ya Uhamisho",
    colTimestamp: "Wakati",
    colFlow: "Mtiririko",
    colInvoice: "Ankara",
    colExtRef: "Kumb. ya Nje",
    colAmount: "Kiasi",
    colStatus: "Hali",
    fundTitle: "Jaza Hazina (Uwekaji wa Sandbox)",
    fundDesc:
      "Huongeza salio kwenye hazina iliyochaguliwa kupitia ingizo la leja lililosawazishwa. Inalindwa na ufunguo wa idempotency ili kuzuia kuweka mara mbili.",
    targetVaultLabel: "Hazina / Pochi Lengwa",
    walletAria: "Pochi",
    selectWalletPlaceholder: "Chagua pochi",
    topUpAmountLabel: (cur: string) => `Kiasi cha Kujaza ${cur ? `(${cur})` : ""}`,
    postingLedger: "Inarekodi kwenye Leja…",
    confirmTopUp: "Thibitisha Uwekaji Pesa",
    toastToppedUp: "Pochi imejazwa",
    toastTopUpFailed: "Uwekaji umeshindwa",
    entriesTitle: (id: string) => `Uhamisho wa Leja ${id}`,
    postingsHeading: "Maingizo ya Leja ya Pande Mbili",
    colEntryId: "ID ya Ingizo",
    colAccount: "Akaunti",
    colDebit: "Toa (−)",
    colCredit: "Weka (+)",
    crossCurrencyNote:
      "Uhamisho wa sarafu tofauti: maingizo yanasawazishwa kwa kila sarafu kupitia akaunti za FX.",
    sumPostingsIn: (cur: string) => `Σ maingizo katika ${cur}`,
    zeroSumBalanced: "Imesawazishwa Sifuri",
  },
  pt: {
    bannerPill1: "Motor de Razão de Partidas Dobradas",
    bannerPill2: "Extratos ISO 20022 camt.053",
    title: "Carteiras e Razão Imutável",
    description:
      "O capital comercial permanece no seu Cofre Empresarial, estritamente separado da sua Carteira Pessoal. Não existe coluna de saldo editável — cada saldo é derivado em tempo real de lançamentos equilibrados a débito e crédito.",
    topUpBtn: "Carregar Cofre",
    sendPaymentBtn: "Enviar Pagamento",
    exportCsvBtn: "Exportar CSV",
    toastExported: "Transferências exportadas",
    toastRows: (n: number) => `${n} linhas`,
    noAccounts: "Nenhuma conta encontrada.",
    businessWallet: "Carteira empresarial",
    personalWallet: "Carteira pessoal",
    cardAria: (lbl: string, bal: string) => `${lbl}, ${bal}. Ver extrato e histórico.`,
    accountSub: (id: string) => `Conta ${id} · Σ Lançamentos no razão`,
    statementLink: "Extrato e camt.053 →",
    primaryBadge: "Principal",
    metricOutbound: "Liquidações de Saída",
    metricOutboundSub: "Enviadas dos seus cofres",
    metricInbound: "Recebimentos de Entrada",
    metricInboundSub: (n: number) => `${n} transferências totais no razão`,
    registerTitle: "Registo de Transferências de Partidas Dobradas",
    transfersCount: (n: number) => `${n} transferências`,
    tableCaption: "Registo de transferências",
    emptyTransfers:
      "Nenhuma transferência corresponde ao filtro selecionado. Carregue uma carteira ou envie um pagamento para ver lançamentos no razão.",
    filterByAccountAria: "Filtrar por conta",
    allVaults: "Todos os Cofres e Carteiras",
    dirAll: "Todas",
    dirSent: "Enviadas",
    dirReceived: "Recebidas",
    dirInternal: "Internas",
    colTransferId: "ID de Transferência",
    colTimestamp: "Data/Hora",
    colFlow: "Fluxo",
    colInvoice: "Fatura",
    colExtRef: "Ref. Externa",
    colAmount: "Montante",
    colStatus: "Estado",
    fundTitle: "Carregar Cofre (Depósito Sandbox)",
    fundDesc:
      "Credita o cofre selecionado através de um lançamento externo equilibrado no razão. Protegido por chave de idempotência para evitar duplo crédito.",
    targetVaultLabel: "Cofre / Carteira de Destino",
    walletAria: "Carteira",
    selectWalletPlaceholder: "Selecionar carteira",
    topUpAmountLabel: (cur: string) => `Montante a Carregar ${cur ? `(${cur})` : ""}`,
    postingLedger: "A lançar no Razão…",
    confirmTopUp: "Confirmar Carregamento",
    toastToppedUp: "Carteira carregada",
    toastTopUpFailed: "Falha no carregamento",
    entriesTitle: (id: string) => `Transferência do Razão ${id}`,
    postingsHeading: "Lançamentos de Partidas Dobradas",
    colEntryId: "ID de Lançamento",
    colAccount: "Conta",
    colDebit: "Débito (−)",
    colCredit: "Crédito (+)",
    crossCurrencyNote:
      "Transferência entre moedas: os lançamentos são equilibrados por moeda através das contas de liquidação FX.",
    sumPostingsIn: (cur: string) => `Σ lançamentos em ${cur}`,
    zeroSumBalanced: "Soma Zero Equilibrada",
  },
  rw: {
    bannerPill1: "Sisitemu y'Igitabo cy'Impfuruka Ebyiri",
    bannerPill2: "Raporo za ISO 20022 camt.053",
    title: "Amashakoshi n'Igitabo Kidahinduka",
    description:
      "Igishoro cy'ubucuruzi kiba mu Ishakoshi yawe y'Ubucuruzi, gitandukanyijwe burundu n'Ishakoshi yawe Bwite. Nta mubare w'amafaranga uhindurwa ukuboko ubaho — buri mubare ubarwa ako kanya uhereye ku nyandiko zinjira n'izisohoka ziringaniye.",
    topUpBtn: "Ongera Amafaranga",
    sendPaymentBtn: "Ohereza Amafaranga",
    exportCsvBtn: "Manura CSV",
    toastExported: "Ihererekanya ryamanuwe",
    toastRows: (n: number) => `imirongo ${n}`,
    noAccounts: "Nta konti zabonetse.",
    businessWallet: "Ishakoshi y'ubucuruzi",
    personalWallet: "Ishakoshi bwite",
    cardAria: (lbl: string, bal: string) => `${lbl}, ${bal}. Reba raporo n'amateka.`,
    accountSub: (id: string) => `Konti ${id} · Σ Inyandiko z'igitabo`,
    statementLink: "Raporo & camt.053 →",
    primaryBadge: "Nyamukuru",
    metricOutbound: "Ubwishyu Bwoherejwe",
    metricOutboundSub: "Bwavuye mu mashakoshi yawe",
    metricInbound: "Amafaranga Yakiriwe",
    metricInboundSub: (n: number) => `ihererekanya ${n} ryose mu gitabo`,
    registerTitle: "Urutonde rw'Ihererekanya mu Gitabo cy'Imari",
    transfersCount: (n: number) => `ihererekanya ${n}`,
    tableCaption: "Urutonde rw'ihererekanya",
    emptyTransfers:
      "Nta hererekanya rijyanye n'akayunguruzo wahisemo. Ongera amafaranga mu ishakoshi cyangwa wohereze ubwishyu kugira ngo urebe inyandiko z'igitabo.",
    filterByAccountAria: "Shungura ukurikije konti",
    allVaults: "Amashakoshi na Konti Zose",
    dirAll: "Byose",
    dirSent: "Byoherejwe",
    dirReceived: "Byakiriwe",
    dirInternal: "Imbere",
    colTransferId: "ID y'Ihererekanya",
    colTimestamp: "Igihe",
    colFlow: "Icyerekezo",
    colInvoice: "Inyemezabuguzi",
    colExtRef: "Indango yo Hanze",
    colAmount: "Umubare",
    colStatus: "Imiterere",
    fundTitle: "Ongera Amafaranga (Sandbox Cash-In)",
    fundDesc:
      "Yongera amafaranga kuri konti wahisemo binyuze mu nyandiko iringaniye y'igitabo. Birinzwe n'urufunguzo rw'idempotency kugira ngo atabarwa kabiri.",
    targetVaultLabel: "Ishakoshi / Konti Ishyirwaho",
    walletAria: "Ishakoshi",
    selectWalletPlaceholder: "Hitamo ishakoshi",
    topUpAmountLabel: (cur: string) => `Umubare w'Amafaranga Yongerwaho ${cur ? `(${cur})` : ""}`,
    postingLedger: "Birimo kwandikwa mu Gitabo…",
    confirmTopUp: "Emeza Kongeraho Amafaranga",
    toastToppedUp: "Amafaranga yongewe mu ishakoshi",
    toastTopUpFailed: "Kongeraho amafaranga byanze",
    entriesTitle: (id: string) => `Ihererekanya ryo mu Gitabo ${id}`,
    postingsHeading: "Inyandiko z'Igitabo cy'Impfuruka Ebyiri",
    colEntryId: "ID y'Inyandiko",
    colAccount: "Konti",
    colDebit: "Ayasohotse (−)",
    colCredit: "Ayinjiye (+)",
    crossCurrencyNote:
      "Ihererekanya hagati y'amafaranga atandukanye: inyandiko ziringanizwa kuri buri faranga binyuze kuri konti za FX.",
    sumPostingsIn: (cur: string) => `Σ inyandiko muri ${cur}`,
    zeroSumBalanced: "Biringaniye ku busa (Zero-Sum)",
  },
} as const;

function statusTone(s: Transfer["status"]) {
  if (s === "SUCCESS") return "live" as const;
  if (s === "FAILED" || s === "REVERSED") return "warn" as const;
  return "invert" as const;
}

function localAccountLabel(a: Account, c: (typeof COPY)[keyof typeof COPY]) {
  return a.type === "BUSINESS" ? c.businessWallet : c.personalWallet;
}

function Wallets() {
  const c = useLangCopy(COPY);
  const wallet = useWallet();
  const transfers = useTransfers();
  const [fundOpen, setFundOpen] = useState(false);
  const [entriesFor, setEntriesFor] = useState<Transfer | null>(null);
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [dirFilter, setDirFilter] = useState<"ALL" | "out" | "in" | "internal">("ALL");

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );

  const rows = useMemo(
    () =>
      (transfers.data ?? []).filter((t) => {
        const matchAcct =
          accountFilter === "ALL" ||
          t.source_account_id === accountFilter ||
          t.destination_account_id === accountFilter;
        if (!matchAcct) return false;
        if (dirFilter === "ALL") return true;
        return directionFor(t, ownIds) === dirFilter;
      }),
    [transfers.data, accountFilter, dirFilter, ownIds],
  );

  const stats = useMemo(() => {
    const all = transfers.data ?? [];
    let outCount = 0;
    let inCount = 0;
    for (const t of all) {
      const d = directionFor(t, ownIds);
      if (d === "out") outCount += 1;
      else if (d === "in") inCount += 1;
    }
    return { total: all.length, outCount, inCount };
  }, [transfers.data, ownIds]);

  function exportCsv() {
    downloadCsv(
      "vuka-transfers.csv",
      [
        "transfer_id",
        "created_at",
        "direction",
        "status",
        "amount",
        "currency",
        "fx_rate",
        "invoice",
        "external_reference",
      ],
      rows.map((t) => [
        t.id,
        t.created_at,
        directionFor(t, ownIds),
        t.status,
        t.amount,
        t.currency,
        t.fx_rate ?? "",
        t.invoice_number ?? "",
        t.external_reference ?? "",
      ]),
    );
    toast.success(c.toastExported, { description: c.toastRows(rows.length) });
  }

  return (
    <div className="space-y-6">
      {/* Executive Double-Entry Treasury Banner */}
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

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2f74d]/40 bg-[#c2f74d]/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                <span className="size-1.5 rounded-full bg-[#c2f74d]" />
                {c.bannerPill1}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <Lock className="size-3 text-[#c2f74d]" /> {c.bannerPill2}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {c.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setFundOpen(true)}
              className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
            >
              <PlusCircle className="mr-1.5 size-3.5" /> {c.topUpBtn}
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/send">
                <Send className="mr-1.5 size-3.5" /> {c.sendPaymentBtn}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="h-10 rounded-xl border-white/20 bg-white/5 px-4 font-mono text-xs uppercase text-white hover:bg-white/15 hover:text-white"
            >
              <Download className="mr-1.5 size-3.5" /> {c.exportCsvBtn}
            </Button>
          </div>
        </div>
      </section>

      {/* Segregated Vault Cards + Ledger Velocity Metrics */}
      <QueryBoundary
        query={wallet}
        empty={c.noAccounts}
        isEmpty={(w) => w.accounts.length === 0}
      >
        {(w) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a, i) => {
              const isBiz = a.type === "BUSINESS";
              const bal = w.balances[a.id]?.amount ?? 0;
              const lbl = localAccountLabel(a, c);
              return (
                <Link
                  key={a.id}
                  to="/wallets/$id"
                  params={{ id: a.id }}
                  style={{ "--dash-delay": `${i * 60}ms` } as React.CSSProperties}
                  className={`dash-in group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                    isBiz
                      ? "border-[#79b200]/55 bg-gradient-to-br from-[#f6fce8] via-white to-white text-[#151515] shadow-[0_16px_38px_-18px_rgba(121,178,0,0.25)] dark:from-[#1b2410] dark:via-card dark:to-card dark:text-foreground"
                      : "border-border bg-card text-foreground shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] hover:border-[#79b200]/45"
                  }`}
                  aria-label={c.cardAria(lbl, money(bal, a.currency))}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span
                        className={`flex size-8 items-center justify-center rounded-xl ${
                          isBiz ? "bg-[#151515] text-[#c2f74d]" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isBiz ? (
                          <Briefcase className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}
                      </span>
                      {lbl}
                    </span>
                    <span className="rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] font-bold">
                      {a.currency}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-mono text-2xl font-bold tabular-nums tracking-tight sm:text-[28px]">
                      {money(bal, a.currency)}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {c.accountSub(shortId(a.id, 14))}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-foreground group-hover:underline">
                      <FileDown className="size-3" /> {c.statementLink}
                    </span>
                    {isBiz ? (
                      <span className="rounded-full bg-[#c2f74d]/45 px-2 py-0.5 text-[9px] font-bold uppercase">
                        {c.primaryBadge}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}

            <Metric
              icon={ArrowUpRight}
              tone="primary"
              label={c.metricOutbound}
              value={stats.outCount}
              sub={c.metricOutboundSub}
              delay={120}
            />
            <Metric
              icon={ArrowDownLeft}
              tone="success"
              label={c.metricInbound}
              value={stats.inCount}
              sub={c.metricInboundSub(stats.total)}
              delay={180}
            />
          </div>
        )}
      </QueryBoundary>

      {/* Double-Entry Transfer Register */}
      <Panel
        title={c.registerTitle}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="live">
              <BookOpenCheck className="size-3" /> {c.transfersCount(rows.length)}
            </Chip>
          </div>
        }
      >
        <QueryBoundary query={transfers}>
          {() => (
            <DataTable
              caption={c.tableCaption}
              exportName="vuka-transfers.csv"
              rows={rows}
              rowKey={(t) => t.id}
              onRowClick={setEntriesFor}
              initialSort={{ key: "time", dir: "desc" }}
              empty={c.emptyTransfers}
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger
                      className="h-9 w-56 rounded-xl font-mono text-xs"
                      aria-label={c.filterByAccountAria}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ALL">{c.allVaults}</SelectItem>
                      {(wallet.data?.accounts ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {localAccountLabel(a, c)} ({a.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                    {(
                      [
                        { id: "ALL", label: c.dirAll },
                        { id: "out", label: c.dirSent },
                        { id: "in", label: c.dirReceived },
                        { id: "internal", label: c.dirInternal },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDirFilter(d.id)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase transition ${
                          dirFilter === d.id
                            ? "bg-[#151515] text-[#c2f74d]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              }
              columns={[
                {
                  key: "id",
                  header: c.colTransferId,
                  sort: (t) => t.id,
                  cell: (t) => (
                    <span className="font-mono text-xs font-semibold">{shortId(t.id, 12)}</span>
                  ),
                },
                {
                  key: "time",
                  header: c.colTimestamp,
                  sort: (t) => t.created_at,
                  text: (t) => t.created_at,
                  cell: (t) => (
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {when(t.created_at)}
                    </span>
                  ),
                },
                {
                  key: "dir",
                  header: c.colFlow,
                  sort: (t) => directionFor(t, ownIds),
                  text: (t) => directionFor(t, ownIds),
                  cell: (t) => {
                    const d = directionFor(t, ownIds);
                    return (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase">
                        {d === "out" ? (
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        ) : d === "in" ? (
                          <ArrowDownLeft className="size-3.5 text-[#4d7500]" />
                        ) : (
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                        )}
                        {d === "out" ? c.dirSent : d === "in" ? c.dirReceived : c.dirInternal}
                      </span>
                    );
                  },
                },
                {
                  key: "invoice",
                  header: c.colInvoice,
                  text: (t) => t.invoice_number ?? "",
                  cell: (t) =>
                    t.invoice_number ? (
                      <span className="rounded bg-[#c2f74d]/30 px-2 py-0.5 font-mono text-xs font-semibold">
                        {t.invoice_number}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">—</span>
                    ),
                },
                {
                  key: "ref",
                  header: c.colExtRef,
                  text: (t) => t.external_reference ?? "",
                  cell: (t) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.external_reference ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "amount",
                  header: c.colAmount,
                  align: "right",
                  sort: (t) => t.amount,
                  text: (t) => `${t.amount} ${t.currency}`,
                  cell: (t) => {
                    const d = directionFor(t, ownIds);
                    return (
                      <span className="tabular font-mono font-bold">
                        {d === "out" ? "−" : d === "in" ? "+" : ""}
                        {money(t.amount, t.currency)}
                      </span>
                    );
                  },
                },
                {
                  key: "status",
                  header: c.colStatus,
                  align: "right",
                  sort: (t) => t.status,
                  cell: (t) => <Chip tone={statusTone(t.status)}>{t.status}</Chip>,
                },
              ]}
            />
          )}
        </QueryBoundary>
      </Panel>

      <FundDialog
        open={fundOpen}
        onOpenChange={setFundOpen}
        accounts={wallet.data?.accounts ?? []}
        c={c}
      />
      <EntriesDialog transfer={entriesFor} onClose={() => setEntriesFor(null)} c={c} />
    </div>
  );
}

function FundDialog({
  open,
  onOpenChange,
  accounts,
  c,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: Account[];
  c: (typeof COPY)[keyof typeof COPY];
}) {
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [key, setKey] = useState(newIdempotencyKey);

  const account = accounts.find(
    (a) => a.id === (accountId || accounts.find((x) => x.type === "BUSINESS")?.id),
  );
  const value = Number(amount);

  const fund = useMutation({
    mutationFn: () =>
      ledger.fund(
        account!.id,
        { amount: value, currency: account!.currency, reference: "trader-topup" },
        key,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success(c.toastToppedUp, { description: money(value, account!.currency) });
      setAmount("");
      setKey(newIdempotencyKey());
      onOpenChange(false);
    },
    onError: (e) => toast.error(c.toastTopUpFailed, { description: describeError(e) }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.18em]">
            <Wallet className="size-4 text-[#79b200]" /> {c.fundTitle}
          </DialogTitle>
          <DialogDescription>
            {c.fundDesc}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              {c.targetVaultLabel}
            </Label>
            <Select value={account?.id ?? ""} onValueChange={setAccountId}>
              <SelectTrigger aria-label={c.walletAria} className="h-11 rounded-xl font-mono text-xs">
                <SelectValue placeholder={c.selectWalletPlaceholder} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {localAccountLabel(a, c)} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              {c.topUpAmountLabel(account?.currency ?? "")}
            </Label>
            <Input
              inputMode="decimal"
              className="h-11 rounded-xl font-mono text-base font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[25_000, 100_000, 500_000, 1_000_000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition hover:border-[#79b200] hover:bg-[#c2f74d]/25 hover:text-foreground"
                >
                  +{preset.toLocaleString("en-US")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-11 w-full rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
            disabled={!account || !(value > 0) || fund.isPending}
            onClick={() => fund.mutate()}
          >
            {fund.isPending ? c.postingLedger : c.confirmTopUp}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntriesDialog({
  transfer,
  onClose,
  c,
}: {
  transfer: Transfer | null;
  onClose: () => void;
  c: (typeof COPY)[keyof typeof COPY];
}) {
  const entries = useQuery({
    queryKey: ["entries", transfer?.id],
    queryFn: () => ledger.entries(transfer!.id),
    enabled: transfer !== null,
  });
  const sum = (entries.data ?? []).reduce((s, e) => s + e.amount, 0);
  return (
    <Dialog open={transfer !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        {transfer ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {c.entriesTitle(shortId(transfer.id, 14))}
              </DialogTitle>
              <DialogDescription>
                {money(transfer.amount, transfer.currency)}
                {transfer.fx_rate ? ` · FX ${transfer.fx_rate}` : ""} · {when(transfer.created_at)}
              </DialogDescription>
            </DialogHeader>
            {transfer.failure_reason ? (
              <p className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-3 text-xs text-destructive">
                {transfer.failure_reason}
              </p>
            ) : null}
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {c.postingsHeading}
            </div>
            {entries.isPending ? (
              <Loading />
            ) : entries.isError ? (
              <ErrorState error={entries.error} onRetry={() => void entries.refetch()} />
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-3 py-2.5">{c.colEntryId}</th>
                        <th className="px-3 py-2.5">{c.colAccount}</th>
                        <th className="px-3 py-2.5 text-right">{c.colDebit}</th>
                        <th className="px-3 py-2.5 text-right">{c.colCredit}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.data.map((e) => (
                        <tr key={e.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2.5 font-mono text-xs">{shortId(e.id)}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{shortId(e.account_id)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                            {e.amount < 0 ? money(-e.amount) : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                            {e.amount > 0 ? money(e.amount) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transfer.fx_rate ? (
                  <p className="rounded-xl border border-border bg-muted/20 p-3 font-mono text-[11px] text-muted-foreground">
                    {c.crossCurrencyNote}
                  </p>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 font-mono text-xs">
                    <span className="text-muted-foreground">
                      {c.sumPostingsIn(transfer.currency)}
                    </span>
                    <Chip tone={Math.abs(sum) < 1e-6 ? "live" : "warn"}>
                      {Math.abs(sum) < 1e-6 ? c.zeroSumBalanced : `Δ ${sum}`}
                    </Chip>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
