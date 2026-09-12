export type Language = "en" | "sw" | "fr" | "rw";

export interface Translations {
  brandSub: string;
  workspaceTitle: string;
  workspaceDesc: string;
  overview: string;
  sendMoney: string;
  activity: string;
  invoices: string;
  recipients: string;
  reports: string;
  support: string;
  settings: string;
  refresh: string;
  signOut: string;
  goodToSeeYou: string;
  accountOverview: string;
  keepBusinessMoving: string;
  transferVolume: string;
  transferOutcomes: string;
  issueInvoice: string;
  invoiceNumber: string;
  counterparty: string;
  dueDate: string;
  unitPrice: string;
  lineItem: string;
  submitInvoice: string;
  shareWhatsApp: string;
  shareSMS: string;
  escrowProtected: string;
  statusLocked: string;
  statusReleased: string;
  statusDisputed: string;
  selectLanguage: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandSub: "TRADE TRUST",
    workspaceTitle: "Trade with clarity.",
    workspaceDesc: "Simple tools for moving cross-border trade forward, with every step visible and trust enforced.",
    overview: "Overview",
    sendMoney: "Send money",
    activity: "Activity",
    invoices: "Invoices",
    recipients: "Recipients",
    reports: "Reports",
    support: "Support",
    settings: "Settings",
    refresh: "Refresh",
    signOut: "Sign out",
    goodToSeeYou: "Good to see you",
    accountOverview: "ACCOUNT OVERVIEW",
    keepBusinessMoving: "Keep business moving.",
    transferVolume: "Transfer volume",
    transferOutcomes: "Transfer outcomes",
    issueInvoice: "Issue an invoice",
    invoiceNumber: "Invoice number",
    counterparty: "Counterparty Phone / ID",
    dueDate: "Due date",
    unitPrice: "Amount / Price",
    lineItem: "Item description",
    submitInvoice: "Issue invoice",
    shareWhatsApp: "Share via WhatsApp",
    shareSMS: "Share via SMS",
    escrowProtected: "Protected by Escrow Contract",
    statusLocked: "LOCKED (Escrow Held)",
    statusReleased: "RELEASED (Paid)",
    statusDisputed: "DISPUTED (In Review)",
    selectLanguage: "Language"
  },
  sw: {
    brandSub: "IMANI YA BIASHARA",
    workspaceTitle: "Fanya biashara kwa uwazi.",
    workspaceDesc: "Zana rahisi za kusogeza biashara ya mipakani mbele, huku kila hatua ikionekana na kulindwa.",
    overview: "Muhtasari",
    sendMoney: "Tuma fedha",
    activity: "Shughuli",
    invoices: "Inkara (Invoices)",
    recipients: "Wapokeaji",
    reports: "Ripoti",
    support: "Msaada",
    settings: "Mipangilio",
    refresh: "Anzisha tena",
    signOut: "Ondoka",
    goodToSeeYou: "Hujambo",
    accountOverview: "MUHTASARI WA AKAUNTI",
    keepBusinessMoving: "Endeleza biashara mbele.",
    transferVolume: "Kiwango cha malipo",
    transferOutcomes: "Matokeo ya malipo",
    issueInvoice: "Tengeneza Inkara",
    invoiceNumber: "Nambari ya Inkara",
    counterparty: "Nambari ya Mshirika",
    dueDate: "Tarehe ya mwisho",
    unitPrice: "Kiasi cha Pesa",
    lineItem: "Maelezo ya bidhaa",
    submitInvoice: "Tuma Inkara",
    shareWhatsApp: "Tuma kwa WhatsApp",
    shareSMS: "Tuma kwa SMS",
    escrowProtected: "Imelindwa na Mkataba wa Escrow",
    statusLocked: "IMEWEKWA (Escrow)",
    statusReleased: "IMELIPWA (Imetolewa)",
    statusDisputed: "IMEPINGWA (Inagombewa)",
    selectLanguage: "Lugha"
  },
  fr: {
    brandSub: "CONFIANCE COMMERCIALE",
    workspaceTitle: "Commercez en toute clarté.",
    workspaceDesc: "Des outils simples pour accélérer le commerce transfrontalier, avec chaque étape vérifiable.",
    overview: "Aperçu",
    sendMoney: "Envoyer de l'argent",
    activity: "Activité",
    invoices: "Factures",
    recipients: "Destinataires",
    reports: "Rapports",
    support: "Support",
    settings: "Paramètres",
    refresh: "Actualiser",
    signOut: "Déconnexion",
    goodToSeeYou: "Ravi de vous revoir",
    accountOverview: "APERÇU DU COMPTE",
    keepBusinessMoving: "Faites avancer vos affaires.",
    transferVolume: "Volume des transferts",
    transferOutcomes: "Résultats des transactions",
    issueInvoice: "Émettre une facture",
    invoiceNumber: "Numéro de facture",
    counterparty: "Téléphone / ID contrepartie",
    dueDate: "Date d'échéance",
    unitPrice: "Montant / Prix",
    lineItem: "Description du bien",
    submitInvoice: "Émettre la facture",
    shareWhatsApp: "Partager via WhatsApp",
    shareSMS: "Partager par SMS",
    escrowProtected: "Protégé par Escrow Blockchain",
    statusLocked: "BLOQUÉ (Escrow)",
    statusReleased: "LIBÉRÉ (Payé)",
    statusDisputed: "EN LITIGE (Arbitrage)",
    selectLanguage: "Langue"
  },
  rw: {
    brandSub: "ICYEREKEZO CY'UBUCURUZI",
    workspaceTitle: "Kora ubucuruzi mu mucyo.",
    workspaceDesc: "Ibyuma byoroshye kwimura ubucuruzi bwambukiranya Imbibi, buri ntambwe igaragara kandi irinzwe.",
    overview: "Incamake",
    sendMoney: "Ohereza Amafaranga",
    activity: "Ibikorwa",
    invoices: "Inyemezabwishyu",
    recipients: "Abahabwa",
    reports: "Raporu",
    support: "Ubufasha",
    settings: "Igenamiterere",
    refresh: "Kavugurura",
    signOut: "Sohoka",
    goodToSeeYou: "Muraho",
    accountOverview: "INCAMAKE Y'KONTU",
    keepBusinessMoving: "Komeza uteze imbere ubucuruzi.",
    transferVolume: "Ubwiyongere bw'yohereza",
    transferOutcomes: "Ibisubizo by'iyohereza",
    issueInvoice: "Tanga Inyemezabwishyu",
    invoiceNumber: "Numero y'inyemezabwishyu",
    counterparty: "Telefoni y'uwo mukorana",
    dueDate: "Itariki ntarengwa",
    unitPrice: "Igiciro / Amafaranga",
    lineItem: "Ibisobanuro by'ibicuruzwa",
    submitInvoice: "Emeza Inyemezabwishyu",
    shareWhatsApp: "Sangiza kuri WhatsApp",
    shareSMS: "Sangiza kuri SMS",
    escrowProtected: "Birinzwe na Kontarato ya Escrow",
    statusLocked: "BYAFUNZWE (Escrow)",
    statusReleased: "BYAREKUWE (Kwishyurwa)",
    statusDisputed: "BIRAKIRIKANWA (Mu bugororazi)",
    selectLanguage: "Ururimi"
  }
};
