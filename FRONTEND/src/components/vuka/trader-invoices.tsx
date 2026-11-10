import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CloudUpload,
  FilePlus2,
  FileText,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/vuka/data-table";
import { LazyHistogramChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { describeError, isApiError } from "@/lib/api/client";
import { invoices as invoiceApi, ledger } from "@/lib/api/endpoints";
import type { Invoice, Recipient } from "@/lib/api/types";
import { day, money } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import {
  deleteOfflineDraft,
  getOfflineDrafts,
  saveOfflineDraft,
  type OfflineDraftInvoice,
} from "@/lib/offline-store";
import { useTrader } from "@/lib/session";
import { useInvoices, useWallet } from "@/lib/trader-data";
import { cn } from "@/lib/utils";

export const invoiceSubtotal = (i: Invoice) =>
  i.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
export const invoiceTotal = (i: Invoice) => invoiceSubtotal(i) * (1 + i.vat_rate / 100);

type Tab = "issued" | "received" | "drafts";

const INVOICE_COPY = {
  en: {
    ageingBuckets: ["Not yet due", "1–30 days late", "31–60 days late", "60+ days late"] as const,
    eyebrow1: "Invoice-Linked Trade Ledger",
    eyebrow2: "Auto-Reconciled on Settlement",
    heroTitle: "Commercial Invoices & Receivables",
    heroBodyPre:
      "Every cross-border trade payment is bound to the commercial invoice it settles. Issue structured VAT invoices to buyers or settle payable invoices in one click — status automatically transitions to ",
    heroBodyPost: " when the ledger transfer clears.",
    issueNewBtn: "Issue New Invoice",
    kpiReceivable: "Accounts Receivable",
    kpiReceivableSub: "Issued to buyers · awaiting payment",
    kpiPayable: "Accounts Payable",
    kpiPayableSub: "Received from suppliers · unpaid",
    kpiSettled: "Settled on Ledger",
    kpiSettledSub: "Paid via linked transfers",
    kpiTotalDocs: "Total Trade Documents",
    kpiTotalDocsSub: "Issued + received contracts",
    receivablesAgeingTitle: "Receivables Ageing (Owed to You)",
    payablesAgeingTitle: "Payables Ageing (You Owe Suppliers)",
    openCount: (n: number) => `${n} open`,
    invoicesUnit: "invoices",
    receivablesAgeingAria: "Unpaid invoices you issued, by days past due",
    payablesAgeingAria: "Unpaid invoices you received, by days past due",
    registerTitle: "Commercial Invoice Register",
    tabReceived: (n: number) => `Received Payables (${n})`,
    tabIssued: (n: number) => `Issued Receivables (${n})`,
    emptyIssuedBoundary:
      "You have not issued any invoices yet. Click 'Issue New Invoice' above to bill a counterparty.",
    emptyReceivedBoundary: "No supplier invoices received yet.",
    captionIssued: "Issued invoices",
    captionReceived: "Received invoices",
    colNumber: "Invoice #",
    colBuyer: "Buyer Counterparty",
    colSupplier: "Supplier Issuer",
    colIssueDate: "Issue Date",
    colDueDate: "Due Date",
    colTotalVat: "Total (incl. VAT)",
    colStatusAction: "Status / Action",
    payBtn: "Pay",
    emptyIssuedTable: "You have not issued any invoices yet.",
    emptyReceivedTable: "No invoices received.",
    noTraderWithNumber: "No VUKA trader with that number",
    toastIssuedTitle: (num: string) => `Invoice ${num} issued`,
    toastIssuedDesc: (amt: string, name: string) => `${amt} to ${name}`,
    toastNotCreated: "Invoice not created",
    dlgTitle: "Issue Commercial Trade Invoice",
    dlgDesc:
      "The counterparty will receive this invoice in their Payables register and can settle it directly from the Send Payment desk.",
    buyerPhoneLabel: "Buyer Mobile Number (MSISDN)",
    verifyBuyerBtn: "Verify Buyer",
    billingBadge: (name: string, phone: string) => `Billing ${name} (${phone})`,
    fieldInvoiceNo: "Invoice no.",
    fieldCurrency: "Currency",
    fieldVat: "VAT %",
    fieldIssueDate: "Issue date",
    fieldDueDate: "Due date",
    lineItemsLabel: "Line Items",
    placeholderDesc: "Commodity / service description",
    placeholderQty: "Qty",
    placeholderUnitPrice: "Unit price",
    removeLineAria: "Remove line",
    addLineBtn: "+ Add Line Item",
    fieldTerms: "Delivery & Escrow Terms (Optional)",
    placeholderTerms: "FOB Mombasa / Inspection on arrival…",
    totalAmountLabel: (vatRate: number) => `Total Invoice Amount (incl. ${vatRate}% VAT)`,
    issuingBtn: "Issuing Invoice…",
    issueSubmitBtn: "Issue Commercial Invoice",
    tabDrafts: (n: number) => `Offline Drafts (${n})`,
    offlinePillOnline: "Border Relay Online",
    offlinePillOffline: "Border-Zone Offline Mode",
    offlineBannerDesc:
      "Network unreachable in border corridor. Invoices drafted now are stored safely in local browser storage and will be synchronized to the VUKA ledger once connection restores.",
    saveAsDraftBtn: "Save Offline Draft",
    savedDraftToast: "Draft saved locally",
    savedDraftDesc: "Invoice saved in offline border store",
    syncAllBtn: "Sync All Drafts",
    syncBtn: "Sync to Ledger",
    syncSuccessToast: "Draft synchronized to ledger",
    deleteBtn: "Delete",
    emptyDraftsTable: "No offline drafts pending.",
    colDraftId: "Draft ID",
    colDraftCustomer: "Buyer / Recipient",
    colDraftAmount: "Amount",
    colDraftStatus: "Status",
  },
  fr: {
    ageingBuckets: ["Non échues", "1–30 j de retard", "31–60 j de retard", "60+ j de retard"] as const,
    eyebrow1: "Registre commercial lié aux factures",
    eyebrow2: "Rapprochement auto au règlement",
    heroTitle: "Factures commerciales et créances",
    heroBodyPre:
      "Chaque paiement commercial transfrontalier est lié à la facture commerciale qu'il règle. Émettez des factures TVA structurées aux acheteurs ou réglez vos factures fournisseurs en un clic — le statut passe automatiquement à ",
    heroBodyPost: " lorsque le transfert du registre est compensé.",
    issueNewBtn: "Émettre une facture",
    kpiReceivable: "Comptes clients (À recevoir)",
    kpiReceivableSub: "Émises aux acheteurs · en attente",
    kpiPayable: "Comptes fournisseurs (À payer)",
    kpiPayableSub: "Reçues des fournisseurs · impayées",
    kpiSettled: "Réglées sur le registre",
    kpiSettledSub: "Payées via transferts liés",
    kpiTotalDocs: "Total des documents commerciaux",
    kpiTotalDocsSub: "Contrats émis + reçus",
    receivablesAgeingTitle: "Ancienneté des créances (Qui vous sont dues)",
    payablesAgeingTitle: "Ancienneté des dettes (Dues aux fournisseurs)",
    openCount: (n: number) => `${n} ouverte${n === 1 ? "" : "s"}`,
    invoicesUnit: "factures",
    receivablesAgeingAria: "Factures impayées émises, par jours de retard",
    payablesAgeingAria: "Factures impayées reçues, par jours de retard",
    registerTitle: "Registre des factures commerciales",
    tabReceived: (n: number) => `Dettes reçues (${n})`,
    tabIssued: (n: number) => `Créances émises (${n})`,
    emptyIssuedBoundary:
      "Vous n'avez encore émis aucune facture. Cliquez sur « Émettre une facture » ci-dessus pour facturer une contrepartie.",
    emptyReceivedBoundary: "Aucune facture fournisseur reçue pour le moment.",
    captionIssued: "Factures émises",
    captionReceived: "Factures reçues",
    colNumber: "Facture n°",
    colBuyer: "Acheteur (Contrepartie)",
    colSupplier: "Fournisseur (Émetteur)",
    colIssueDate: "Date d'émission",
    colDueDate: "Date d'échéance",
    colTotalVat: "Total (TTC)",
    colStatusAction: "Statut / Action",
    payBtn: "Payer",
    emptyIssuedTable: "Vous n'avez encore émis aucune facture.",
    emptyReceivedTable: "Aucune facture reçue.",
    noTraderWithNumber: "Aucun commerçant VUKA avec ce numéro",
    toastIssuedTitle: (num: string) => `Facture ${num} émise`,
    toastIssuedDesc: (amt: string, name: string) => `${amt} adressée à ${name}`,
    toastNotCreated: "Facture non créée",
    dlgTitle: "Émettre une facture commerciale",
    dlgDesc:
      "La contrepartie recevra cette facture dans son registre des comptes fournisseurs et pourra la régler directement depuis le guichet Envoyer un paiement.",
    buyerPhoneLabel: "Numéro de mobile de l'acheteur (MSISDN)",
    verifyBuyerBtn: "Vérifier l'acheteur",
    billingBadge: (name: string, phone: string) => `Facturation à ${name} (${phone})`,
    fieldInvoiceNo: "N° de facture",
    fieldCurrency: "Devise",
    fieldVat: "TVA %",
    fieldIssueDate: "Date d'émission",
    fieldDueDate: "Date d'échéance",
    lineItemsLabel: "Lignes de facturation",
    placeholderDesc: "Description de la marchandise / du service",
    placeholderQty: "Qté",
    placeholderUnitPrice: "Prix unitaire",
    removeLineAria: "Supprimer la ligne",
    addLineBtn: "+ Ajouter une ligne",
    fieldTerms: "Conditions de livraison et de séquestre (Optionnel)",
    placeholderTerms: "FOB Mombasa / Inspection à l'arrivée…",
    totalAmountLabel: (vatRate: number) => `Montant total de la facture (TVA ${vatRate}% incl.)`,
    issuingBtn: "Émission en cours…",
    issueSubmitBtn: "Émettre la facture commerciale",
    tabDrafts: (n: number) => `Brouillons hors-ligne (${n})`,
    offlinePillOnline: "Relais frontière en ligne",
    offlinePillOffline: "Mode frontalier hors-ligne",
    offlineBannerDesc:
      "Réseau indisponible dans le corridor frontalier. Les factures rédigées sont enregistrées localement et seront synchronisées sur le registre VUKA dès le retour du réseau.",
    saveAsDraftBtn: "Sauvegarder en brouillon",
    savedDraftToast: "Brouillon sauvegardé localement",
    savedDraftDesc: "Facture enregistrée dans le stockage hors-ligne",
    syncAllBtn: "Synchroniser tous les brouillons",
    syncBtn: "Synchroniser",
    syncSuccessToast: "Brouillon synchronisé sur le registre",
    deleteBtn: "Supprimer",
    emptyDraftsTable: "Aucun brouillon hors-ligne en attente.",
    colDraftId: "ID Brouillon",
    colDraftCustomer: "Acheteur / Bénéficiaire",
    colDraftAmount: "Montant",
    colDraftStatus: "Statut",
  },
  sw: {
    ageingBuckets: [
      "Bado hazijaiva",
      " zimechelewa siku 1–30",
      "Zimechelewa siku 31–60",
      "Zimechelewa siku 60+",
    ] as const,
    eyebrow1: "Leja ya Biashara Iliyounganishwa na Ankara",
    eyebrow2: "Inasawazishwa Otomatiki Wakati wa Malipo",
    heroTitle: "Ankara za Kibiashara na Madai",
    heroBodyPre:
      "Kila malipo ya biashara ya mipakani yanafungamanishwa na ankara ya kibiashara yanayoilipa. Toa ankara za VAT kwa wanunuzi au lipa ankara za wauzaji kwa kubofya mara moja — hali inabadilika otomatiki kuwa ",
    heroBodyPost: " uhamisho wa leja unapokamilika.",
    issueNewBtn: "Toa Ankara Mpya",
    kpiReceivable: "Madai Yanayodaiwa (Receivables)",
    kpiReceivableSub: "Zimetolewa kwa wanunuzi · zinasubiri malipo",
    kpiPayable: "Madeni ya Kulipwa (Payables)",
    kpiPayableSub: "Zimepokelewa kutoka kwa wauzaji · hazijalipwa",
    kpiSettled: "Zimelipwa Kwenye Leja",
    kpiSettledSub: "Zimelipwa kupitia uhamisho uliounganishwa",
    kpiTotalDocs: "Jumla ya Nyaraka za Biashara",
    kpiTotalDocsSub: "Mikataba iliyotolewa + iliyopokelewa",
    receivablesAgeingTitle: "Muda wa Madai (Unayodai)",
    payablesAgeingTitle: "Muda wa Madeni (Unayodaiwa na Wauzaji)",
    openCount: (n: number) => `${n} wazi`,
    invoicesUnit: "ankara",
    receivablesAgeingAria: "Ankara ambazo hazijalipwa ulizotoa, kwa siku zilizopita",
    payablesAgeingAria: "Ankara ambazo hazijalipwa ulizopokea, kwa siku zilizopita",
    registerTitle: "Rejista ya Ankara za Kibiashara",
    tabReceived: (n: number) => `Madeni Yaliyopokelewa (${n})`,
    tabIssued: (n: number) => `Madai Yaliyotolewa (${n})`,
    emptyIssuedBoundary:
      "Bado hujatoa ankara zozote. Bofya 'Toa Ankara Mpya' hapo juu ili kumtoza mshirika.",
    emptyReceivedBoundary: "Bado hakuna ankara za wauzaji zilizopokelewa.",
    captionIssued: "Ankara zilizotolewa",
    captionReceived: "Ankara zilizopokelewa",
    colNumber: "Ankara #",
    colBuyer: "Mnunuzi",
    colSupplier: "Muuzaji Aliyetoa",
    colIssueDate: "Tarehe ya Kutolewa",
    colDueDate: "Tarehe ya Kulipwa",
    colTotalVat: "Jumla (pamoja na VAT)",
    colStatusAction: "Hali / Hatua",
    payBtn: "Lipa",
    emptyIssuedTable: "Bado hujatoa ankara zozote.",
    emptyReceivedTable: "Hakuna ankara zilizopokelewa.",
    noTraderWithNumber: "Hakuna mfanyabiashara wa VUKA mwenye namba hiyo",
    toastIssuedTitle: (num: string) => `Ankara ${num} imetolewa`,
    toastIssuedDesc: (amt: string, name: string) => `${amt} kwa ${name}`,
    toastNotCreated: "Ankara haijaundwa",
    dlgTitle: "Toa Ankara ya Biashara",
    dlgDesc:
      "Mshirika atapokea ankara hii kwenye rejista yake ya Madeni ya Kulipwa na anaweza kuilipa moja kwa moja kutoka kwenye dawati la Tuma Malipo.",
    buyerPhoneLabel: "Namba ya Simu ya Mnunuzi (MSISDN)",
    verifyBuyerBtn: "Thibitisha Mnunuzi",
    billingBadge: (name: string, phone: string) => `Inatozwa kwa ${name} (${phone})`,
    fieldInvoiceNo: "Namba ya ankara",
    fieldCurrency: "Sarafu",
    fieldVat: "VAT %",
    fieldIssueDate: "Tarehe ya kutolewa",
    fieldDueDate: "Tarehe ya kulipwa",
    lineItemsLabel: "Bidhaa / Huduma",
    placeholderDesc: "Maelezo ya bidhaa / huduma",
    placeholderQty: "Idadi",
    placeholderUnitPrice: "Bei ya kipimo",
    removeLineAria: "Ondoa mstari",
    addLineBtn: "+ Ongeza Bidhaa",
    fieldTerms: "Masharti ya Uwasilishaji na Escrow (Hiari)",
    placeholderTerms: "FOB Mombasa / Ukaguzi wakati wa kuwasili…",
    totalAmountLabel: (vatRate: number) => `Jumla ya Kiasi cha Ankara (pamoja na ${vatRate}% VAT)`,
    issuingBtn: "Inatoa Ankara…",
    issueSubmitBtn: "Toa Ankara ya Kibiashara",
    tabDrafts: (n: number) => `Nyaraka za Nje ya Mtandao (${n})`,
    offlinePillOnline: "Mtandao wa Mpakani Upo Hewani",
    offlinePillOffline: "Hali ya Nje ya Mtandao Mpakanani",
    offlineBannerDesc:
      "Mtandao haupatikani katika eneo la mpaka. Ankara zinazoandikwa sasa zimehifadhiwa salama kwenye kifaa chako na zitasawazishwa kwenye leja ya VUKA mara mtandao utakaporejea.",
    saveAsDraftBtn: "Hifadhi Kama Rasimu",
    savedDraftToast: "Rasimu imehifadhiwa salama",
    savedDraftDesc: "Ankara imehifadhiwa kwenye kumbukumbu ya kifaa",
    syncAllBtn: "Sawazisha Rasimu Zote",
    syncBtn: "Sawazisha kwenye Leja",
    syncSuccessToast: "Rasimu imesawazishwa kwenye leja",
    deleteBtn: "Futa",
    emptyDraftsTable: "Hakuna rasimu za nje ya mtandao zinazosubiri.",
    colDraftId: "Namba ya Rasimu",
    colDraftCustomer: "Mnunuzi / Mpokeaji",
    colDraftAmount: "Kiasi",
    colDraftStatus: "Hali",
  },
  pt: {
    ageingBuckets: [
      "Ainda a vencer",
      "1–30 dias de atraso",
      "31–60 dias de atraso",
      "60+ dias de atraso",
    ] as const,
    eyebrow1: "Razão Comercial Vinculado a Faturas",
    eyebrow2: "Reconciliado Auto na Liquidação",
    heroTitle: "Faturas Comerciais e Contas a Receber",
    heroBodyPre:
      "Cada pagamento comercial transfronteiriço está vinculado à fatura comercial que liquida. Emita faturas estruturadas com IVA a compradores ou liquide faturas a pagar num clique — o estado transita automaticamente para ",
    heroBodyPost: " quando a transferência no razão é compensada.",
    issueNewBtn: "Emitir Nova Fatura",
    kpiReceivable: "Contas a Receber",
    kpiReceivableSub: "Emitidas a compradores · a aguardar pagamento",
    kpiPayable: "Contas a Pagar",
    kpiPayableSub: "Recebidas de fornecedores · por pagar",
    kpiSettled: "Liquidadas no Razão",
    kpiSettledSub: "Pagas via transferências vinculadas",
    kpiTotalDocs: "Total de Documentos Comerciais",
    kpiTotalDocsSub: "Contratos emitidos + recebidos",
    receivablesAgeingTitle: "Antiguidade de Recebíveis (Devidos a Si)",
    payablesAgeingTitle: "Antiguidade de Pagáveis (Devidos a Fornecedores)",
    openCount: (n: number) => `${n} em aberto`,
    invoicesUnit: "faturas",
    receivablesAgeingAria: "Faturas por pagar emitidas por si, por dias de atraso",
    payablesAgeingAria: "Faturas por pagar recebidas por si, por dias de atraso",
    registerTitle: "Registo de Faturas Comerciais",
    tabReceived: (n: number) => `Pagáveis Recebidas (${n})`,
    tabIssued: (n: number) => `Recebíveis Emitidas (${n})`,
    emptyIssuedBoundary:
      "Ainda não emitiu nenhuma fatura. Clique em 'Emitir Nova Fatura' acima para faturar uma contraparte.",
    emptyReceivedBoundary: "Ainda não foram recebidas faturas de fornecedores.",
    captionIssued: "Faturas emitidas",
    captionReceived: "Faturas recebidas",
    colNumber: "Fatura n.º",
    colBuyer: "Comprador (Contraparte)",
    colSupplier: "Fornecedor (Emissor)",
    colIssueDate: "Data de Emissão",
    colDueDate: "Data de Vencimento",
    colTotalVat: "Total (c/ IVA)",
    colStatusAction: "Estado / Ação",
    payBtn: "Pagar",
    emptyIssuedTable: "Ainda não emitiu nenhuma fatura.",
    emptyReceivedTable: "Nenhuma fatura recebida.",
    noTraderWithNumber: "Nenhum comerciante VUKA com esse número",
    toastIssuedTitle: (num: string) => `Fatura ${num} emitida`,
    toastIssuedDesc: (amt: string, name: string) => `${amt} para ${name}`,
    toastNotCreated: "Fatura não criada",
    dlgTitle: "Emitir Fatura Comercial",
    dlgDesc:
      "A contraparte receberá esta fatura no seu registo de Contas a Pagar e poderá liquidá-la diretamente no balcão Enviar Pagamento.",
    buyerPhoneLabel: "Número de Telemóvel do Comprador (MSISDN)",
    verifyBuyerBtn: "Verificar Comprador",
    billingBadge: (name: string, phone: string) => `A faturar ${name} (${phone})`,
    fieldInvoiceNo: "N.º da fatura",
    fieldCurrency: "Moeda",
    fieldVat: "IVA %",
    fieldIssueDate: "Data de emissão",
    fieldDueDate: "Data de vencimento",
    lineItemsLabel: "Itens da Fatura",
    placeholderDesc: "Descrição da mercadoria / serviço",
    placeholderQty: "Qtd.",
    placeholderUnitPrice: "Preço unitário",
    removeLineAria: "Remover linha",
    addLineBtn: "+ Adicionar Item",
    fieldTerms: "Condições de Entrega e Caução (Opcional)",
    placeholderTerms: "FOB Mombaça / Inspeção à chegada…",
    totalAmountLabel: (vatRate: number) => `Montante Total da Fatura (incl. ${vatRate}% IVA)`,
    issuingBtn: "A Emitir Fatura…",
    issueSubmitBtn: "Emitir Fatura Comercial",
    tabDrafts: (n: number) => `Rascunhos Offline (${n})`,
    offlinePillOnline: "Retransmissão Fronteiriça Online",
    offlinePillOffline: "Modo Fronteiriço Offline",
    offlineBannerDesc:
      "Rede inacessível no corredor fronteiriço. As faturas rascunhadas são armazenadas em segurança no armazenamento local e serão sincronizadas com o razão VUKA assim que a ligação regressar.",
    saveAsDraftBtn: "Guardar como Rascunho",
    savedDraftToast: "Rascunho guardado localmente",
    savedDraftDesc: "Fatura guardada no armazenamento offline",
    syncAllBtn: "Sincronizar Todos os Rascunhos",
    syncBtn: "Sincronizar",
    syncSuccessToast: "Rascunho sincronizado com o razão",
    deleteBtn: "Eliminar",
    emptyDraftsTable: "Nenhum rascunho offline pendente.",
    colDraftId: "ID do Rascunho",
    colDraftCustomer: "Comprador / Destinatário",
    colDraftAmount: "Montante",
    colDraftStatus: "Estado",
  },
  rw: {
    ageingBuckets: [
      "Ntikiragera",
      "Iminsi 1–30 yakererewe",
      "Iminsi 31–60 yakererewe",
      "Iminsi 60+ yakererewe",
    ] as const,
    eyebrow1: "Igitabo cy'Ubucuruzi Gihuza Inyemezabuguzi",
    eyebrow2: "Bihuzwa Ako Kanya Iyo Byishyuwe",
    heroTitle: "Inyemezabuguzi z'Ubucuruzi n'Imyenda Wishyuza",
    heroBodyPre:
      "Buri bwishyu bw'ubucuruzi mpuzamahanga buhuzwa n'inyemezabuguzi bwishyura. Ohereza inyemezabuguzi za TVA ku baguzi cyangwa wishyure inyemezabuguzi z'abagurisha ukanze rimwe — imiterere ihita ihinduka ",
    heroBodyPost: " iyo ihererekanya mu gitabo ryemejwe.",
    issueNewBtn: "Tanga Inyemezabuguzi Nshya",
    kpiReceivable: "Imyenda Wishyuza Abaguzi",
    kpiReceivableSub: "Zahawe abaguzi · zitegereje ubwishyu",
    kpiPayable: "Imyenda Ufitiye Abagurisha",
    kpiPayableSub: "Zakiriwe ku bagurisha · ntizirishyurwa",
    kpiSettled: "Zishyuwe mu Gitabo",
    kpiSettledSub: "Zishyuwe binyuze mu ihererekanya rihuye",
    kpiTotalDocs: "Inyandiko z'Ubucuruzi Zose",
    kpiTotalDocsSub: "Amasezerano yatanzwe + yakiriwe",
    receivablesAgeingTitle: "Ubukure bw'Imyenda Wishyuza",
    payablesAgeingTitle: "Ubukure bw'Imyenda Ufitiye Abagurisha",
    openCount: (n: number) => `${n} zifunguye`,
    invoicesUnit: "inyemezabuguzi",
    receivablesAgeingAria: "Inyemezabuguzi zitarishyurwa watanze, ukurikije iminsi zakererewe",
    payablesAgeingAria: "Inyemezabuguzi zitarishyurwa wakiriye, ukurikije iminsi zakererewe",
    registerTitle: "Igitabo cy'Inyemezabuguzi z'Ubucuruzi",
    tabReceived: (n: number) => `Izakiriwe zishyurwa (${n})`,
    tabIssued: (n: number) => `Izatanzwe zishyuzwa (${n})`,
    emptyIssuedBoundary:
      "Nta nyemezabuguzi uratanga. Kanda 'Tanga Inyemezabuguzi Nshya' haruguru kugira ngo wishyuze umufatanyabikorwa.",
    emptyReceivedBoundary: "Nta nyemezabuguzi z'abagurisha zirakirwa.",
    captionIssued: "Inyemezabuguzi zatanzwe",
    captionReceived: "Inyemezabuguzi zakiriwe",
    colNumber: "Inyemezabuguzi #",
    colBuyer: "Umuguzi",
    colSupplier: "Umugurisha Wayitanze",
    colIssueDate: "Itariki Yatanzweho",
    colDueDate: "Itariki Ntarengwa",
    colTotalVat: "Igiteranyo (harimo TVA)",
    colStatusAction: "Imiterere / Igikorwa",
    payBtn: "Ishyura",
    emptyIssuedTable: "Nta nyemezabuguzi uratanga.",
    emptyReceivedTable: "Nta nyemezabuguzi zakiriwe.",
    noTraderWithNumber: "Nta mucuruzi wa VUKA ufite iyo nimero",
    toastIssuedTitle: (num: string) => `Inyemezabuguzi ${num} yatanzwe`,
    toastIssuedDesc: (amt: string, name: string) => `${amt} kuri ${name}`,
    toastNotCreated: "Inyemezabuguzi ntiyakozwe",
    dlgTitle: "Tanga Inyemezabuguzi y'Ubucuruzi",
    dlgDesc:
      "Umufatanyabikorwa azabona iyi nyemezabuguzi mu gitabo cye cy'Imyenda Yishyurwa kandi ashobora kuyishyura ako kanya aho boherereza amafaranga.",
    buyerPhoneLabel: "Nimero ya Telefone y'Umuguzi (MSISDN)",
    verifyBuyerBtn: "Emeza Umuguzi",
    billingBadge: (name: string, phone: string) => `Kwishyuza ${name} (${phone})`,
    fieldInvoiceNo: "Nimero y'inyemezabuguzi",
    fieldCurrency: "Ifaranga",
    fieldVat: "TVA %",
    fieldIssueDate: "Itariki yatanzweho",
    fieldDueDate: "Itariki ntarengwa",
    lineItemsLabel: "Ibicuruzwa / Serivisi",
    placeholderDesc: "Ibisobanuro by'igicuruzwa / serivisi",
    placeholderQty: "Ingano",
    placeholderUnitPrice: "Igiciro kimwe",
    removeLineAria: "Kuraho umurongo",
    addLineBtn: "+ Ongeraho Igicuruzwa",
    fieldTerms: "Amabwiriza yoKugeza Ibicuruzwa na Escrow (Si itegeko)",
    placeholderTerms: "FOB Mombasa / Igenzura bigezeyo…",
    totalAmountLabel: (vatRate: number) => `Igiteranyo cy'Inyemezabuguzi (harimo ${vatRate}% TVA)`,
    issuingBtn: "Birimo Gutangwa…",
    issueSubmitBtn: "Tanga Inyemezabuguzi y'Ubucuruzi",
    tabDrafts: (n: number) => `Inyandiko zo hanze y'umurongo (${n})`,
    offlinePillOnline: "Umurongo w'Umupaka Urakora",
    offlinePillOffline: "Uburyo bwo Hanze y'Umurongo ku Mupaka",
    offlineBannerDesc:
      "Nta murongo uri mu gace k'umupaka. Inyemezabuguzi zanditswe zibitswe neza muri porogaramu yawe kandi zizoherezwa mu gitabo cya VUKA mu gihe umurongo wagarutse.",
    saveAsDraftBtn: "Bika nk'Inyandiko y'Ibanze",
    savedDraftToast: "Inyandiko y'ibanze yabitswe",
    savedDraftDesc: "Inyemezabuguzi yabitswe muri terefone",
    syncAllBtn: "Ohereza Inyandiko Zose mu Gitabo",
    syncBtn: "Ohereza mu Gitabo",
    syncSuccessToast: "Inyandiko yoherejwe neza mu gitabo",
    deleteBtn: "Siba",
    emptyDraftsTable: "Nta nyandiko zo hanze y'umurongo zitegereje.",
    colDraftId: "Nimero y'Inyandiko",
    colDraftCustomer: "Umuguzi / Uwakira",
    colDraftAmount: "Amafaranga",
    colDraftStatus: "Imiterere",
  },
} as const;

/** Buckets unpaid invoices by how far past their due date they are (counts, currency-neutral). */
function ageing(invoices: Invoice[], buckets: readonly string[] = INVOICE_COPY.en.ageingBuckets) {
  const counts = [0, 0, 0, 0];
  const today = Date.now();
  for (const i of invoices) {
    const late = Math.floor((today - new Date(i.due_date).getTime()) / 86_400_000);
    counts[late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : 3]! += 1;
  }
  return buckets.map((label, idx) => ({ label, count: counts[idx] ?? 0 }));
}

export function TraderInvoices() {
  const trader = useTrader();
  const copy = useLangCopy(INVOICE_COPY);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("received");
  const [createOpen, setCreateOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [drafts, setDrafts] = useState<OfflineDraftInvoice[]>([]);
  const [syncingDraftId, setSyncingDraftId] = useState<string | null>(null);

  const refreshDrafts = () => {
    void getOfflineDrafts().then(setDrafts);
  };

  useEffect(() => {
    refreshDrafts();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const list = useInvoices(tab === "drafts" ? "received" : tab);
  const all = useInvoices();

  const totals = useMemo(() => {
    const rows = all.data ?? [];
    const receivable = rows.filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID");
    const payable = rows.filter((i) => i.counterparty_user_id === trader.id && i.status !== "PAID");
    const paid = rows.filter((i) => i.status === "PAID");
    return {
      receivable: receivable.length,
      payable: payable.length,
      paid: paid.length,
      totalCount: rows.length,
    };
  }, [all.data, trader.id]);

  const handleSyncSingleDraft = async (d: OfflineDraftInvoice) => {
    setSyncingDraftId(d.id);
    try {
      let buyerId = "";
      if (d.customerPhone) {
        try {
          const recip = await ledger.recipient(d.customerPhone);
          buyerId = recip.user.id;
        } catch {
          // fallback to trader id if looking up offline recipient
          buyerId = trader.id;
        }
      } else {
        buyerId = trader.id;
      }
      await invoiceApi.create(trader.id, {
        number: `INV-OFF-${d.id.slice(-6).toUpperCase()}`,
        counterparty_user_id: buyerId,
        currency: d.currency,
        issue_date: d.createdAt.slice(0, 10),
        due_date: d.dueDate || inDays(14),
        vat_rate: 0,
        terms: `Offline draft synced from border device (${d.description})`,
        items: [
          {
            description: d.description || "General trade items",
            quantity: 1,
            unit_price: d.amount,
          },
        ],
      });
      await deleteOfflineDraft(d.id);
      toast.success(copy.syncSuccessToast);
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      refreshDrafts();
    } catch (e) {
      toast.error("Failed to sync draft", { description: describeError(e) });
    } finally {
      setSyncingDraftId(null);
    }
  };

  const handleSyncAllDrafts = async () => {
    for (const d of drafts) {
      await handleSyncSingleDraft(d);
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Border Warning Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <WifiOff className="size-5 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold uppercase tracking-wider">{copy.offlinePillOffline}: </span>
            {copy.offlineBannerDesc}
          </div>
        </div>
      )}

      {/* Executive Trade Documents & Invoice Escrow Banner */}
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
                {copy.eyebrow1}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                <ShieldCheck className="size-3 text-[#c2f74d]" /> {copy.eyebrow2}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  isOnline
                    ? "border-[#c2f74d]/40 bg-[#c2f74d]/10 text-[#c2f74d]"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-300",
                )}
              >
                {isOnline ? (
                  <>
                    <Wifi className="size-3 text-[#c2f74d]" /> {copy.offlinePillOnline}
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3 text-amber-400" /> {copy.offlinePillOffline}
                  </>
                )}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {copy.heroBodyPre}
              <span className="font-mono text-[#c2f74d]">PAID</span>
              {copy.heroBodyPost}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 rounded-xl bg-[#c2f74d] px-5 font-mono text-xs font-bold uppercase tracking-wider text-[#151515] hover:bg-[#b5eb3b]"
            >
              <FilePlus2 className="mr-1.5 size-4" /> {copy.issueNewBtn}
            </Button>
          </div>
        </div>
      </section>

      {/* 4-Column Invoice & Settlement KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ArrowDownLeft}
          tone="primary"
          label={copy.kpiReceivable}
          value={totals.receivable}
          sub={copy.kpiReceivableSub}
        />
        <Metric
          icon={ArrowUpRight}
          tone="destructive"
          label={copy.kpiPayable}
          value={totals.payable}
          sub={copy.kpiPayableSub}
          delay={60}
        />
        <Metric
          icon={CheckCircle2}
          tone="success"
          label={copy.kpiSettled}
          value={totals.paid}
          sub={copy.kpiSettledSub}
          delay={120}
        />
        <Metric
          icon={FileText}
          tone="muted"
          label={copy.kpiTotalDocs}
          value={totals.totalCount}
          sub={copy.kpiTotalDocsSub}
          delay={180}
        />
      </div>

      {/* Ageing Histograms */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={copy.receivablesAgeingTitle}
          meta={<Chip tone="live">{copy.openCount(totals.receivable)}</Chip>}
        >
          <LazyHistogramChart
            unit={copy.invoicesUnit}
            ariaLabel={copy.receivablesAgeingAria}
            data={ageing(
              (all.data ?? []).filter((i) => i.issuer_user_id === trader.id && i.status !== "PAID"),
              copy.ageingBuckets,
            )}
          />
        </Panel>
        <Panel
          title={copy.payablesAgeingTitle}
          meta={<Chip>{copy.openCount(totals.payable)}</Chip>}
        >
          <LazyHistogramChart
            unit={copy.invoicesUnit}
            ariaLabel={copy.payablesAgeingAria}
            data={ageing(
              (all.data ?? []).filter(
                (i) => i.counterparty_user_id === trader.id && i.status !== "PAID",
              ),
              copy.ageingBuckets,
            )}
          />
        </Panel>
      </div>

      {/* Interactive Invoice Register */}
      <Panel
        title={copy.registerTitle}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {tab === "drafts" && drafts.length > 0 && isOnline ? (
              <Button
                size="sm"
                className="h-7 rounded-lg bg-[#151515] px-2.5 font-mono text-[10px] font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
                onClick={handleSyncAllDrafts}
              >
                <CloudUpload className="mr-1 size-3" /> {copy.syncAllBtn}
              </Button>
            ) : null}
            <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
              {(
                [
                  { id: "received", label: copy.tabReceived(totals.payable) },
                  { id: "issued", label: copy.tabIssued(totals.receivable) },
                  { id: "drafts", label: copy.tabDrafts(drafts.length) },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-lg px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition",
                    tab === t.id
                      ? "bg-[#151515] text-[#c2f74d] shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {tab === "drafts" ? (
          <DataTable
            caption="Offline Draft Invoices"
            exportName="vuka-offline-drafts.csv"
            rows={drafts}
            rowKey={(d) => d.id}
            initialSort={{ key: "id", dir: "desc" }}
            columns={[
              {
                key: "id",
                header: copy.colDraftId,
                sort: (d) => d.id,
                cell: (d) => (
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {d.id.slice(-10)}
                  </span>
                ),
              },
              {
                key: "customer",
                header: copy.colDraftCustomer,
                sort: (d) => d.customerName || d.customerPhone,
                cell: (d) => (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{d.customerName || "Counterparty"}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {d.customerPhone}
                    </span>
                  </div>
                ),
              },
              {
                key: "description",
                header: copy.lineItemsLabel,
                cell: (d) => (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {d.description || "General Merchandise"}
                  </span>
                ),
              },
              {
                key: "amount",
                header: copy.colDraftAmount,
                align: "right",
                sort: (d) => d.amount,
                cell: (d) => (
                  <span className="tabular font-mono font-bold">
                    {money(d.amount, d.currency)}
                  </span>
                ),
              },
              {
                key: "status",
                header: copy.colDraftStatus,
                align: "right",
                cell: (d) => (
                  <div
                    className="inline-flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Chip tone="live">{d.status}</Chip>
                    <Button
                      size="sm"
                      disabled={!isOnline || syncingDraftId === d.id}
                      className="h-7 rounded-lg bg-[#151515] px-2.5 font-mono text-[10px] font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
                      onClick={() => void handleSyncSingleDraft(d)}
                    >
                      {syncingDraftId === d.id ? (
                        <RefreshCw className="mr-1 size-3 animate-spin" />
                      ) : (
                        <CloudUpload className="mr-1 size-3" />
                      )}
                      {copy.syncBtn}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg px-2 text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        await deleteOfflineDraft(d.id);
                        refreshDrafts();
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ),
              },
            ]}
            empty={copy.emptyDraftsTable}
          />
        ) : (
          <QueryBoundary
            query={list}
            isEmpty={(d) => d.length === 0}
            empty={tab === "issued" ? copy.emptyIssuedBoundary : copy.emptyReceivedBoundary}
          >
            {(rows) => (
              <DataTable
                caption={tab === "issued" ? copy.captionIssued : copy.captionReceived}
                exportName={`vuka-invoices-${tab}.csv`}
                rows={rows}
                rowKey={(i) => i.id}
                onRowClick={(i) => void navigate({ to: "/escrow/$id", params: { id: i.id } })}
                initialSort={{ key: "issued", dir: "desc" }}
                columns={[
                  {
                    key: "number",
                    header: copy.colNumber,
                    sort: (i) => i.number,
                    cell: (i) => <span className="font-mono text-xs font-bold">{i.number}</span>,
                  },
                  {
                    key: "party",
                    header: tab === "issued" ? copy.colBuyer : copy.colSupplier,
                    text: (i) => (tab === "issued" ? i.counterparty_name : i.issuer_name),
                    cell: (i) => (
                      <span className="text-xs font-medium">
                        {tab === "issued" ? i.counterparty_name : i.issuer_name}
                      </span>
                    ),
                  },
                  {
                    key: "issued",
                    header: copy.colIssueDate,
                    sort: (i) => i.issue_date,
                    cell: (i) => (
                      <span className="tabular font-mono text-xs text-muted-foreground">
                        {day(i.issue_date)}
                      </span>
                    ),
                  },
                  {
                    key: "due",
                    header: copy.colDueDate,
                    sort: (i) => i.due_date,
                    cell: (i) => (
                      <span className="tabular font-mono text-xs">{day(i.due_date)}</span>
                    ),
                  },
                  {
                    key: "total",
                    header: copy.colTotalVat,
                    align: "right",
                    sort: (i) => invoiceTotal(i),
                    text: (i) => `${invoiceTotal(i)} ${i.currency}`,
                    cell: (i) => (
                      <span className="tabular font-mono font-bold">
                        {money(invoiceTotal(i), i.currency)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: copy.colStatusAction,
                    align: "right",
                    sort: (i) => i.status,
                    cell: (i) => (
                      <div
                        className="inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Chip tone={i.status === "PAID" ? "live" : "invert"}>{i.status}</Chip>
                        {tab === "received" && i.status !== "PAID" ? (
                          <Button
                            size="sm"
                            className="h-7 rounded-lg bg-[#151515] px-2.5 font-mono text-[10px] font-bold uppercase text-[#c2f74d] hover:bg-[#151515]/90"
                            onClick={() =>
                              void navigate({ to: "/send", search: { invoice: i.number } })
                            }
                          >
                            <Send className="mr-1 size-3" /> {copy.payBtn}
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
                empty={tab === "issued" ? copy.emptyIssuedTable : copy.emptyReceivedTable}
              />
            )}
          </QueryBoundary>
        )}
      </Panel>

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isOnline={isOnline}
        onDraftSaved={refreshDrafts}
      />
    </div>
  );
}

interface Line {
  description: string;
  quantity: string;
  unit_price: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const suggestNumber = () =>
  `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

function CreateInvoiceDialog({
  open,
  onOpenChange,
  isOnline = true,
  onDraftSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isOnline?: boolean;
  onDraftSaved?: () => void;
}) {
  const trader = useTrader();
  const copy = useLangCopy(INVOICE_COPY);
  const qc = useQueryClient();
  const wallet = useWallet();
  const currency = wallet.data?.accounts.find((a) => a.type === "BUSINESS")?.currency ?? "RWF";

  const [phone, setPhone] = useState("");
  const [buyer, setBuyer] = useState<Recipient | null>(null);
  const [number, setNumber] = useState(suggestNumber);
  const [issue, setIssue] = useState(today);
  const [due, setDue] = useState(() => inDays(14));
  const [vat, setVat] = useState("18");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: "1", unit_price: "" }]);
  const [invoiceCurrency, setInvoiceCurrency] = useState("");
  const cur = invoiceCurrency || currency;

  const lookup = useMutation({
    mutationFn: () => ledger.recipient(phone.trim()),
    onSuccess: setBuyer,
    onError: (e) => {
      setBuyer(null);
      toast.error(
        isApiError(e) && e.status === 404 ? copy.noTraderWithNumber : describeError(e),
      );
    },
  });

  const parsed = lines.map((l) => ({
    description: l.description.trim(),
    quantity: Number(l.quantity),
    unit_price: Number(l.unit_price),
  }));
  const linesValid = parsed.every((l) => l.description && l.quantity > 0 && l.unit_price >= 0);
  const subtotal = parsed.reduce((s, l) => s + (l.quantity > 0 ? l.quantity * l.unit_price : 0), 0);
  const vatRate = Number(vat);
  const total = subtotal * (1 + (Number.isFinite(vatRate) ? vatRate : 0) / 100);

  const create = useMutation({
    mutationFn: () =>
      invoiceApi.create(trader.id, {
        number: number.trim(),
        counterparty_user_id: buyer!.user.id,
        currency: cur,
        issue_date: issue,
        due_date: due,
        vat_rate: vatRate,
        ...(terms.trim() ? { terms: terms.trim() } : {}),
        items: parsed,
      }),
    onSuccess: (inv) => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(copy.toastIssuedTitle(inv.number), {
        description: copy.toastIssuedDesc(money(total, cur), buyer!.user.full_name),
      });
      onOpenChange(false);
      setBuyer(null);
      setPhone("");
      setNumber(suggestNumber());
      setLines([{ description: "", quantity: "1", unit_price: "" }]);
    },
    onError: (e) => toast.error(copy.toastNotCreated, { description: describeError(e) }),
  });

  const handleSaveDraft = async () => {
    if (!linesValid) {
      toast.error("Please enter item description, quantity and price before saving.");
      return;
    }
    await saveOfflineDraft({
      traderId: trader.id,
      customerName: buyer ? buyer.user.full_name : phone.trim() || "Counterparty",
      customerPhone: phone.trim(),
      amount: total,
      currency: cur,
      description: lines.map((l) => l.description).filter(Boolean).join(", ") || "Border goods",
      dueDate: due,
    });
    toast.success(copy.savedDraftToast, {
      description: copy.savedDraftDesc,
    });
    onOpenChange(false);
    onDraftSaved?.();
  };

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const ready =
    !!buyer &&
    number.trim() &&
    linesValid &&
    due >= issue &&
    Number.isFinite(vatRate) &&
    vatRate >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {copy.dlgTitle}
          </DialogTitle>
          <DialogDescription>
            {copy.dlgDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              {copy.buyerPhoneLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setBuyer(null);
                }}
                placeholder="+250700000000"
                className="h-10 rounded-xl font-mono"
              />
              <Button
                variant="outline"
                className="h-10 rounded-xl font-mono text-xs uppercase"
                disabled={!phone.trim() || lookup.isPending || !isOnline}
                onClick={() => lookup.mutate()}
              >
                {copy.verifyBuyerBtn}
              </Button>
            </div>
            {buyer ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#79b200]/45 bg-[#f5fbe6] px-3 py-1.5 text-xs font-semibold text-[#151515]">
                <CheckCircle2 className="size-3.5 text-[#4d7500]" />{" "}
                {copy.billingBadge(buyer.user.full_name, buyer.user.phone_number)}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label={copy.fieldInvoiceNo} className="sm:col-span-2">
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label={copy.fieldCurrency}>
              <Input
                value={cur}
                onChange={(e) => setInvoiceCurrency(e.target.value.toUpperCase().slice(0, 3))}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label={copy.fieldVat}>
              <Input
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                inputMode="decimal"
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label={copy.fieldIssueDate} className="sm:col-span-2">
              <Input
                type="date"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
            <Field label={copy.fieldDueDate} className="sm:col-span-2">
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-xl font-mono"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              {copy.lineItemsLabel}
            </Label>
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_130px_36px]">
                <Input
                  placeholder={copy.placeholderDesc}
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder={copy.placeholderQty}
                  inputMode="decimal"
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  className="rounded-xl font-mono"
                />
                <Input
                  placeholder={copy.placeholderUnitPrice}
                  inputMode="decimal"
                  value={l.unit_price}
                  onChange={(e) => setLine(i, { unit_price: e.target.value })}
                  className="rounded-xl font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={copy.removeLineAria}
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="rounded-xl"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-mono text-[10px] uppercase"
              onClick={() =>
                setLines((ls) => [...ls, { description: "", quantity: "1", unit_price: "" }])
              }
            >
              {copy.addLineBtn}
            </Button>
          </div>

          <Field label={copy.fieldTerms}>
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder={copy.placeholderTerms}
              className="min-h-16 rounded-xl"
            />
          </Field>

          <div className="flex items-center justify-between rounded-2xl border border-[#151515] bg-[#151515] px-4 py-3 font-mono text-xs text-white">
            <span className="text-white/70">{copy.totalAmountLabel(vatRate || 0)}</span>
            <span className="text-base font-bold tabular-nums text-[#c2f74d]">
              {money(total, cur)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl border-dashed font-mono text-xs uppercase"
            onClick={() => void handleSaveDraft()}
          >
            <CloudUpload className="mr-1.5 size-4" /> {copy.saveAsDraftBtn}
          </Button>
          <Button
            className="h-11 flex-1 rounded-xl bg-[#151515] font-mono text-xs font-bold uppercase tracking-wider text-[#c2f74d] hover:bg-[#151515]/90"
            disabled={!ready || create.isPending || !isOnline}
            onClick={() => create.mutate()}
          >
            {create.isPending ? copy.issuingBtn : copy.issueSubmitBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
        {label}
      </Label>
      {children}
    </div>
  );
}
