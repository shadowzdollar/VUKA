import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Upload,
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
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { platform } from "@/lib/api/endpoints";
import type { KycLimits, Standing } from "@/lib/api/types";
import { when } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { evidenceReferenceSchema, sha256File } from "@/lib/schemas";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification & Limits — VUKA" },
      {
        name: "description",
        content: "Your verification level, transaction limits and evidence submissions.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <Verification />
    </Shell>
  ),
});

const COPY = {
  en: {
    eyebrow: "Zero-Document Compliance Engine",
    title: "Verification & Limits",
    description:
      "Higher verification unlocks larger payments. VUKA never stores your documents: you keep them, and only a cryptographic fingerprint (or a reference from a verification provider) is filed.",
    bannerPill: "Client-Side WebCrypto SHA-256 Attestation",
    bannerTitle: "Prove Compliance Without Surrendering Raw Files",
    bannerDesc1: "When you select a PDF or ID scan below, your browser computes an immutable",
    bannerDesc2: "digest locally via WebCrypto. Only that 64-character hex digest or a registry URI (e.g.",
    bannerDesc3: ") is transmitted to the VUKA engine.",
    zeroStorage: "Zero Cloud File Storage",
    uriCompatible: "Provider & Registry URI Compatible",
    postureTitle: "Active Compliance Posture",
    loadingCaps: "LOADING",
    singleCap: "Single payment cap",
    remaining24h: "24h remaining",
    submissionsOnFile: "Submissions on file",
    recordsCount: (n: number) => `${n} records`,
    noLimitsConfigured: "Transaction limits are not configured on this engine.",
    standingTitle: "Your standing",
    standingSub: "Live transaction velocity caps and 3-tier verification roadmap",
    disabledAlert: (status: string) =>
      `Payments are currently disabled for this account (${status}). Contact support to resolve your verification.`,
    perPayment: "Per payment",
    perPaymentSub: "Single transfer ceiling",
    perDay: "Per day",
    perDaySub: "Rolling 24-hour allowance",
    perMonth: "Per month",
    perMonthSub: "Rolling 30-day allowance",
    used24h: "Used in the last 24 hours",
    used30d: "Used in the last 30 days",
    utilizedPct: (pct: string) => `${pct}% utilized`,
    availableAmt: (amt: string) => `${amt} available`,
    levelsAria: "Verification levels",
    youAreHere: "You are here",
    tierCapLine: (perTxn: string, perDay: string) => `${perTxn} per payment · ${perDay} / day`,
    tiers: [
      {
        status: "PENDING",
        name: "Unverified",
        needs: "Phone number only. Small everyday payments.",
      },
      {
        status: "VERIFIED",
        name: "Verified",
        needs: "Identity verified by the compliance team.",
      },
      {
        status: "BUSINESS_VERIFIED",
        name: "Business verified",
        needs: "Identity and business registration verified. Trade-sized limits.",
      },
    ],
    types: [
      { value: "identity", label: "Identity (national ID / passport)" },
      { value: "business", label: "Business registration" },
      { value: "address", label: "Proof of address" },
      { value: "ownership", label: "Beneficial ownership" },
    ],
    submitPanelTitle: "Submit evidence",
    submitPanelSub: "Fingerprint a local document or submit an external registry reference",
    whatVerifying: "What are you verifying?",
    howToFile: "How do you want to file it?",
    modeFile: "Fingerprint a document on this device",
    modeReference: "I have a provider / registry reference",
    documentLabel: "Document",
    selectFilePrompt: "Select PDF or image (max 25 MB)",
    computingHash: "Computing fingerprint…",
    hashComputed: (h: string) => `SHA-256 ${h}… computed locally. The file is not uploaded.`,
    neverLeaves: "The file never leaves your device.",
    referenceLabel: "Reference",
    referencePlaceholder: "provider://smile-id/job/…  or  registry://rdb/…",
    submittingBtn: "Submitting…",
    submitBtn: "Submit for review",
    errMax25Mb: "Choose a file under 25 MB.",
    errReadFailed: "Could not read that file.",
    errInvalidRef: "Invalid reference",
    toastSubmitted: "Evidence submitted",
    toastSubmittedDesc: "The compliance team will review it.",
    submissionsTitle: "Your submissions",
    submissionsSub: "Immutable audit trail of cryptographic evidence and compliance reviews",
    filedChip: (n: number) => `${n} filed`,
    tableCaption: "Verification submissions",
    emptySubmissions: "Nothing submitted yet.",
    colType: "Type",
    colReference: "Reference",
    colSubmitted: "Submitted",
    colStatus: "Status",
  },
  fr: {
    eyebrow: "Moteur de conformité sans stockage de documents",
    title: "Vérification et plafonds",
    description:
      "Un niveau de vérification supérieur débloque des paiements plus élevés. VUKA ne stocke jamais vos documents : vous les conservez, et seule une empreinte cryptographique (ou une référence d'un prestataire) est enregistrée.",
    bannerPill: "Attestation SHA-256 WebCrypto côté client",
    bannerTitle: "Prouvez votre conformité sans céder vos fichiers bruts",
    bannerDesc1:
      "Lorsque vous sélectionnez un PDF ou un scan de pièce d'identité ci-dessous, votre navigateur calcule localement une empreinte immuable",
    bannerDesc2:
      "via WebCrypto. Seule cette empreinte hexadécimale de 64 caractères ou un URI de registre (ex.",
    bannerDesc3: ") est transmis au moteur VUKA.",
    zeroStorage: "Zéro stockage cloud de fichiers",
    uriCompatible: "Compatible URI prestataire et registre",
    postureTitle: "Posture de conformité active",
    loadingCaps: "CHARGEMENT",
    singleCap: "Plafond par paiement",
    remaining24h: "Restant sur 24h",
    submissionsOnFile: "Soumissions enregistrées",
    recordsCount: (n: number) => `${n} dossiers`,
    noLimitsConfigured: "Les plafonds de transaction ne sont pas configurés sur ce moteur.",
    standingTitle: "Votre statut",
    standingSub: "Plafonds de vélocité en direct et feuille de route de vérification à 3 niveaux",
    disabledAlert: (status: string) =>
      `Les paiements sont actuellement désactivés pour ce compte (${status}). Contactez l'assistance pour régulariser votre vérification.`,
    perPayment: "Par paiement",
    perPaymentSub: "Plafond par transfert unique",
    perDay: "Par jour",
    perDaySub: "Plafond glissant sur 24 heures",
    perMonth: "Par mois",
    perMonthSub: "Plafond glissant sur 30 jours",
    used24h: "Utilisé au cours des dernières 24 heures",
    used30d: "Utilisé au cours des 30 derniers jours",
    utilizedPct: (pct: string) => `${pct} % utilisé`,
    availableAmt: (amt: string) => `${amt} disponible`,
    levelsAria: "Niveaux de vérification",
    youAreHere: "Vous êtes ici",
    tierCapLine: (perTxn: string, perDay: string) => `${perTxn} par paiement · ${perDay} / jour`,
    tiers: [
      {
        status: "PENDING",
        name: "Non vérifié",
        needs: "Numéro de téléphone uniquement. Petits paiements courants.",
      },
      {
        status: "VERIFIED",
        name: "Vérifié",
        needs: "Identité vérifiée par l'équipe conformité.",
      },
      {
        status: "BUSINESS_VERIFIED",
        name: "Entreprise vérifiée",
        needs: "Identité et immatriculation d'entreprise vérifiées. Plafonds commerciaux.",
      },
    ],
    types: [
      { value: "identity", label: "Identité (CNI / passeport)" },
      { value: "business", label: "Immatriculation d'entreprise" },
      { value: "address", label: "Justificatif de domicile" },
      { value: "ownership", label: "Bénéficiaire effectif" },
    ],
    submitPanelTitle: "Soumettre une preuve",
    submitPanelSub: "Calculez l'empreinte d'un document local ou soumettez une référence externe",
    whatVerifying: "Que vérifiez-vous ?",
    howToFile: "Comment souhaitez-vous l'enregistrer ?",
    modeFile: "Calculer l'empreinte d'un document sur cet appareil",
    modeReference: "J'ai une référence de prestataire / registre",
    documentLabel: "Document",
    selectFilePrompt: "Sélectionnez un PDF ou une image (max 25 Mo)",
    computingHash: "Calcul de l'empreinte…",
    hashComputed: (h: string) =>
      `SHA-256 ${h}… calculé localement. Le fichier n'est pas téléversé.`,
    neverLeaves: "Le fichier ne quitte jamais votre appareil.",
    referenceLabel: "Référence",
    referencePlaceholder: "provider://smile-id/job/…  ou  registry://rdb/…",
    submittingBtn: "Envoi…",
    submitBtn: "Soumettre pour examen",
    errMax25Mb: "Choisissez un fichier de moins de 25 Mo.",
    errReadFailed: "Impossible de lire ce fichier.",
    errInvalidRef: "Référence invalide",
    toastSubmitted: "Preuve soumise",
    toastSubmittedDesc: "L'équipe conformité va l'examiner.",
    submissionsTitle: "Vos soumissions",
    submissionsSub: "Piste d'audit immuable des preuves cryptographiques et examens de conformité",
    filedChip: (n: number) => `${n} enregistrées`,
    tableCaption: "Soumissions de vérification",
    emptySubmissions: "Aucune soumission pour le moment.",
    colType: "Type",
    colReference: "Référence",
    colSubmitted: "Soumis le",
    colStatus: "Statut",
  },
  sw: {
    eyebrow: "Injini ya Utii Bila Kuhifadhi Hati",
    title: "Uthibitisho na Vikomo",
    description:
      "Uthibitisho wa juu hufungua malipo makubwa zaidi. VUKA haihifadhi hati zako kamwe: unazihifadhi mwenyewe, na alama ya kisimbaji (au kumbukumbu kutoka kwa mtoa huduma wa uthibitisho) pekee ndiyo inayowasilishwa.",
    bannerPill: "Uthibitisho wa SHA-256 WebCrypto Kwenye Kifaa",
    bannerTitle: "Thibitisha Utii Bila Kutoa Faili Halisi",
    bannerDesc1: "Unapochagua PDF au picha ya kitambulisho hapa chini, kivinjari chako kinakokotoa",
    bannerDesc2:
      "kwenye kifaa chako kupitia WebCrypto. Alama hiyo ya herufi 64 pekee au URI ya sajili (mf.",
    bannerDesc3: ") ndiyo inayotumwa kwenye injini ya VUKA.",
    zeroStorage: "Hakuna Kuhifadhi Faili Mtandaoni",
    uriCompatible: "Inakubali URI za Watoa Huduma na Sajili",
    postureTitle: "Hali ya Utii ya Sasa",
    loadingCaps: "INAPAKIA",
    singleCap: "Kikomo cha malipo mmoja",
    remaining24h: "Imebaki saa 24",
    submissionsOnFile: "Mawasilisho yaliyopo",
    recordsCount: (n: number) => `rekodi ${n}`,
    noLimitsConfigured: "Vikomo vya miamala havijawekwa kwenye injini hii.",
    standingTitle: "Hadhi yako",
    standingSub: "Vikomo vya miamala mubashara na mpango wa ngazi 3 za uthibitisho",
    disabledAlert: (status: string) =>
      `Malipo yamezimwa kwa sasa kwa akaunti hii (${status}). Wasiliana na msaada kutatua uthibitisho wako.`,
    perPayment: "Kwa malipo",
    perPaymentSub: "Kikomo cha uhamisho mmoja",
    perDay: "Kwa siku",
    perDaySub: "Ruhusa ya saa 24 zinazozunguka",
    perMonth: "Kwa mwezi",
    perMonthSub: "Ruhusa ya siku 30 zinazozunguka",
    used24h: "Imetumika katika saa 24 zilizopita",
    used30d: "Imetumika katika siku 30 zilizopita",
    utilizedPct: (pct: string) => `${pct}% imetumika`,
    availableAmt: (amt: string) => `${amt} inapatikana`,
    levelsAria: "Ngazi za uthibitisho",
    youAreHere: "Uko hapa",
    tierCapLine: (perTxn: string, perDay: string) => `${perTxn} kwa malipo · ${perDay} / siku`,
    tiers: [
      {
        status: "PENDING",
        name: "Haijathibitishwa",
        needs: "Nambari ya simu pekee. Malipo madogo ya kila siku.",
      },
      {
        status: "VERIFIED",
        name: "Imethibitishwa",
        needs: "Utambulisho umethibitishwa na timu ya utii.",
      },
      {
        status: "BUSINESS_VERIFIED",
        name: "Biashara imethibitishwa",
        needs: "Utambulisho na usajili wa biashara vimethibitishwa. Vikomo vya kibiashara.",
      },
    ],
    types: [
      { value: "identity", label: "Utambulisho (Kitambulisho cha Taifa / Pasipoti)" },
      { value: "business", label: "Usajili wa biashara" },
      { value: "address", label: "Uthibitisho wa anwani" },
      { value: "ownership", label: "Umiliki wa manufaa" },
    ],
    submitPanelTitle: "Wasilisha ushahidi",
    submitPanelSub: "Kokotoa alama ya hati kwenye kifaa au wasilisha kumbukumbu ya sajili",
    whatVerifying: "Unathibitisha nini?",
    howToFile: "Unataka kuiwasilisha vipi?",
    modeFile: "Kokotoa alama ya hati kwenye kifaa hiki",
    modeReference: "Nina kumbukumbu ya mtoa huduma / sajili",
    documentLabel: "Hati",
    selectFilePrompt: "Chagua PDF au picha (upeo MB 25)",
    computingHash: "Inakokotoa alama…",
    hashComputed: (h: string) =>
      `SHA-256 ${h}… imekokotolewa kwenye kifaa. Faili haijapakiwa mtandaoni.`,
    neverLeaves: "Faili haitoki kamwe kwenye kifaa chako.",
    referenceLabel: "Kumbukumbu",
    referencePlaceholder: "provider://smile-id/job/…  au  registry://rdb/…",
    submittingBtn: "Inawasilisha…",
    submitBtn: "Wasilisha kwa ukaguzi",
    errMax25Mb: "Chagua faili iliyo chini ya MB 25.",
    errReadFailed: "Imeshindwa kusoma faili hiyo.",
    errInvalidRef: "Kumbukumbu si sahihi",
    toastSubmitted: "Ushahidi umewasilishwa",
    toastSubmittedDesc: "Timu ya utii itaukagua.",
    submissionsTitle: "Mawasilisho yako",
    submissionsSub: "Kumbukumbu isiyobadilika ya ushahidi wa kisimbaji na ukaguzi wa utii",
    filedChip: (n: number) => `${n} zimewasilishwa`,
    tableCaption: "Mawasilisho ya uthibitisho",
    emptySubmissions: "Hakuna kilichowasilishwa bado.",
    colType: "Aina",
    colReference: "Kumbukumbu",
    colSubmitted: "Imewasilishwa",
    colStatus: "Hali",
  },
  pt: {
    eyebrow: "Motor de Conformidade Sem Armazenamento de Documentos",
    title: "Verificação e Limites",
    description:
      "Um nível de verificação superior desbloqueia pagamentos maiores. A VUKA nunca armazena os seus documentos: ficam consigo e apenas uma impressão digital criptográfica (ou referência de um fornecedor de verificação) é registada.",
    bannerPill: "Atestação SHA-256 WebCrypto no Dispositivo",
    bannerTitle: "Comprove a Conformidade Sem Entregar Ficheiros Brutos",
    bannerDesc1:
      "Quando seleciona um PDF ou digitalização de identificação abaixo, o seu navegador calcula localmente um resumo imutável",
    bannerDesc2:
      "via WebCrypto. Apenas esse resumo hexadecimal de 64 caracteres ou um URI de registo (ex.",
    bannerDesc3: ") é transmitido ao motor VUKA.",
    zeroStorage: "Zero Armazenamento de Ficheiros na Cloud",
    uriCompatible: "Compatível com URI de Fornecedor e Registo",
    postureTitle: "Postura de Conformidade Ativa",
    loadingCaps: "A CARREGAR",
    singleCap: "Limite por pagamento",
    remaining24h: "Restante 24h",
    submissionsOnFile: "Submissões registadas",
    recordsCount: (n: number) => `${n} registos`,
    noLimitsConfigured: "Os limites de transação não estão configurados neste motor.",
    standingTitle: "O seu estado",
    standingSub: "Limites de velocidade de transação em direto e roteiro de 3 níveis",
    disabledAlert: (status: string) =>
      `Os pagamentos estão atualmente desativados para esta conta (${status}). Contacte o apoio para regularizar a sua verificação.`,
    perPayment: "Por pagamento",
    perPaymentSub: "Teto por transferência única",
    perDay: "Por dia",
    perDaySub: "Limite móvel de 24 horas",
    perMonth: "Por mês",
    perMonthSub: "Limite móvel de 30 dias",
    used24h: "Utilizado nas últimas 24 horas",
    used30d: "Utilizado nos últimos 30 dias",
    utilizedPct: (pct: string) => `${pct}% utilizado`,
    availableAmt: (amt: string) => `${amt} disponível`,
    levelsAria: "Níveis de verificação",
    youAreHere: "Está aqui",
    tierCapLine: (perTxn: string, perDay: string) => `${perTxn} por pagamento · ${perDay} / dia`,
    tiers: [
      {
        status: "PENDING",
        name: "Não verificado",
        needs: "Apenas número de telefone. Pequenos pagamentos diários.",
      },
      {
        status: "VERIFIED",
        name: "Verificado",
        needs: "Identidade verificada pela equipa de conformidade.",
      },
      {
        status: "BUSINESS_VERIFIED",
        name: "Empresa verificada",
        needs: "Identidade e registo comercial verificados. Limites empresariais.",
      },
    ],
    types: [
      { value: "identity", label: "Identidade (BI / Passaporte)" },
      { value: "business", label: "Registo comercial" },
      { value: "address", label: "Comprovativo de morada" },
      { value: "ownership", label: "Beneficiário efetivo" },
    ],
    submitPanelTitle: "Submeter comprovativo",
    submitPanelSub: "Gere a impressão digital de um documento local ou submeta uma referência externa",
    whatVerifying: "O que está a verificar?",
    howToFile: "Como pretende submeter?",
    modeFile: "Gerar impressão digital de um documento neste dispositivo",
    modeReference: "Tenho uma referência de fornecedor / registo",
    documentLabel: "Documento",
    selectFilePrompt: "Selecione PDF ou imagem (máx. 25 MB)",
    computingHash: "A calcular impressão digital…",
    hashComputed: (h: string) =>
      `SHA-256 ${h}… calculado localmente. O ficheiro não é carregado.`,
    neverLeaves: "O ficheiro nunca sai do seu dispositivo.",
    referenceLabel: "Referência",
    referencePlaceholder: "provider://smile-id/job/…  ou  registry://rdb/…",
    submittingBtn: "A submeter…",
    submitBtn: "Submeter para revisão",
    errMax25Mb: "Escolha um ficheiro com menos de 25 MB.",
    errReadFailed: "Não foi possível ler esse ficheiro.",
    errInvalidRef: "Referência inválida",
    toastSubmitted: "Comprovativo submetido",
    toastSubmittedDesc: "A equipa de conformidade irá analisá-lo.",
    submissionsTitle: "As suas submissões",
    submissionsSub: "Registo de auditoria imutável de provas criptográficas e revisões de conformidade",
    filedChip: (n: number) => `${n} submetidas`,
    tableCaption: "Submissões de verificação",
    emptySubmissions: "Ainda nada submetido.",
    colType: "Tipo",
    colReference: "Referência",
    colSubmitted: "Submetido",
    colStatus: "Estado",
  },
  rw: {
    eyebrow: "Sisitemu y'Iyubahirizamabwiriza Itabika Inyandiko",
    title: "Igenzura n'Imbibi",
    description:
      "Igenzura ryo ku rwego rwo hejuru rifungura ubwishyu bunini. VUKA ntiyigera ibika inyandiko zawe: urazigumana, hakoherezwa gusa ikimenyetso cy'umutekano (cyangwa indango ivuye ku kigo kigenzura).",
    bannerPill: "Ikimenyetso cya SHA-256 WebCrypto Gikorerwa kuri Mudasobwa/Telefone",
    bannerTitle: "Garagaza ko Wujuje Amabwiriza Udatanze Dosiye Zawe",
    bannerDesc1: "Iyo uhisemo PDF cyangwa ifoto y'irangamuntu hasi aha, mushakisha yawe ibara",
    bannerDesc2:
      "ako kanya binyuze muri WebCrypto. Icyo kimenyetso cy'inyuguti 64 gusa cyangwa URI y'igitabo (urugero:",
    bannerDesc3: ") nibyo byoherezwa muri sisitemu ya VUKA.",
    zeroStorage: "Nta Dosiye Zibikwa kuri Cloud",
    uriCompatible: "Byemera Indango z'Ibigo Bigenzura",
    postureTitle: "Urwego rw'Iyubahirizamabwiriza Ubu",
    loadingCaps: "BIRIMO GUPAKIRA",
    singleCap: "Imbibi ku bwishyu bumwe",
    remaining24h: "Asigaye mu masaha 24",
    submissionsOnFile: "Ibyatanzwe",
    recordsCount: (n: number) => `inyandiko ${n}`,
    noLimitsConfigured: "Imbibi z'ubwishyu ntabwo zashyizweho kuri iyi sisitemu.",
    standingTitle: "Urwego rwawe",
    standingSub: "Imbibi z'ubwishyu ako kanya n'inzira y'ibyiciro 3 by'igenzura",
    disabledAlert: (status: string) =>
      `Ubwishyu bwahagaritswe kuri iyi konti (${status}). Vugana n'ubufasha kugira ngo ikibazo cy'igenzura ryawe gikemuke.`,
    perPayment: "Ku bwishyu bumwe",
    perPaymentSub: "Imbibi ntarengwa z'ihererekanya rimwe",
    perDay: "Ku munsi",
    perDaySub: "Imbibi z'amasaha 24",
    perMonth: "Ku kwezi",
    perMonthSub: "Imbibi z'iminsi 30",
    used24h: "Ayakoreshejwe mu masaha 24 ashize",
    used30d: "Ayakoreshejwe mu minsi 30 ishize",
    utilizedPct: (pct: string) => `${pct}% yakoreshejwe`,
    availableAmt: (amt: string) => `${amt} arahari`,
    levelsAria: "Ibyiciro by'igenzura",
    youAreHere: "Uri hano",
    tierCapLine: (perTxn: string, perDay: string) => `${perTxn} ku bwishyu · ${perDay} / umunsi`,
    tiers: [
      {
        status: "PENDING",
        name: "Ntiwagenzuwe",
        needs: "Nimero ya telefone gusa. Ubwishyu buto bwa buri munsi.",
      },
      {
        status: "VERIFIED",
        name: "Wagenzuwe",
        needs: "Umwirondoro wemejwe n'ikipe ishinzwe amabwiriza.",
      },
      {
        status: "BUSINESS_VERIFIED",
        name: "Ubucuruzi bwagenzuwe",
        needs: "Umwirondoro n'iyandikwa ry'ubucuruzi byemejwe. Imbibi z'ubucuruzi bunini.",
      },
    ],
    types: [
      { value: "identity", label: "Umwirondoro (Irangamuntu / Pasiporo)" },
      { value: "business", label: "Iyandikwa ry'ubucuruzi" },
      { value: "address", label: "Icyemezo cy'aho ubarizwa" },
      { value: "ownership", label: "Ba nyir'ubucuruzi nyakuri" },
    ],
    submitPanelTitle: "Tanga ibimenyetso",
    submitPanelSub: "Fata ikimenyetso cy'inyandiko iri ku gikoresho cyawe cyangwa utange indango yo hanze",
    whatVerifying: "Ni iki urimo kugenzuza?",
    howToFile: "Urifuza kubitanga ute?",
    modeFile: "Fata ikimenyetso cy'inyandiko iri kuri iki gikoresho",
    modeReference: "Mfite indango y'ikigo kigenzura / urwandiko",
    documentLabel: "Inyandiko",
    selectFilePrompt: "Hitamo PDF cyangwa ifoto (ntirenze MB 25)",
    computingHash: "Birimo kubara ikimenyetso…",
    hashComputed: (h: string) =>
      `SHA-256 ${h}… yabarwe kuri iki gikoresho. Dosiye ntabwo yoherejwe.`,
    neverLeaves: "Dosiye ntiyigera iva ku gikoresho cyawe.",
    referenceLabel: "Indango",
    referencePlaceholder: "provider://smile-id/job/…  cyangwa  registry://rdb/…",
    submittingBtn: "Birimo koherezwa…",
    submitBtn: "Ohereza ngo bisuzumwe",
    errMax25Mb: "Hitamo dosiye itarengeje MB 25.",
    errReadFailed: "Ntibyashobotse gusoma iyo dosiye.",
    errInvalidRef: "Indango ntiyemewe",
    toastSubmitted: "Ibimenyetso byatanzwe",
    toastSubmittedDesc: "Ikipe ishinzwe iyubahirizamabwiriza izabisuzuma.",
    submissionsTitle: "Ibyo watanze",
    submissionsSub: "Urutonde rudahinduka rw'ibimenyetso n'amasuzuma y'amabwiriza",
    filedChip: (n: number) => `${n} byatanzwe`,
    tableCaption: "Ibyatanzwe mu igenzura",
    emptySubmissions: "Nta kintu kiratangwa.",
    colType: "Ubwoko",
    colReference: "Indango",
    colSubmitted: "Byatanzwe",
    colStatus: "Imiterere",
  },
} as const;

const usd = (n: number) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function Meter({
  label,
  used,
  cap,
  c,
}: {
  label: string;
  used: number;
  cap: number;
  c: (typeof COPY)[keyof typeof COPY];
}) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const remaining = Math.max(0, cap - used);
  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 p-3.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular font-mono font-semibold">
          {usd(used)} / {usd(cap)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={Math.round(used)}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#151515] to-[#79b200] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>{c.utilizedPct(pct.toFixed(1))}</span>
        <span>{c.availableAmt(usd(remaining))}</span>
      </div>
    </div>
  );
}

function StandingCard({
  standing,
  tiers,
  c,
}: {
  standing: Standing;
  tiers: Record<string, KycLimits> | null;
  c: (typeof COPY)[keyof typeof COPY];
}) {
  const blocked = standing.limits.per_txn_usd <= 0;
  return (
    <Panel
      title={c.standingTitle}
      subtitle={c.standingSub}
      meta={<Chip tone={blocked ? "warn" : "invert"}>{standing.kyc_status.replace("_", " ")}</Chip>}
    >
      {blocked ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>{c.disabledAlert(standing.kyc_status)}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label={c.perPayment}
              value={usd(standing.limits.per_txn_usd)}
              sub={c.perPaymentSub}
              accent="lime"
            />
            <Metric
              label={c.perDay}
              value={usd(standing.limits.daily_usd)}
              sub={c.perDaySub}
            />
            <Metric
              label={c.perMonth}
              value={usd(standing.limits.monthly_usd)}
              sub={c.perMonthSub}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Meter
              label={c.used24h}
              used={standing.used_day_usd}
              cap={standing.limits.daily_usd}
              c={c}
            />
            <Meter
              label={c.used30d}
              used={standing.used_month_usd}
              cap={standing.limits.monthly_usd}
              c={c}
            />
          </div>
        </div>
      )}

      <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label={c.levelsAria}>
        {c.tiers.map((tier, idx) => {
          const lim = tiers?.[tier.status];
          const current = tier.status === standing.kyc_status;
          return (
            <li
              key={tier.status}
              className={
                current
                  ? "relative overflow-hidden rounded-xl border-2 border-[#151515] bg-[#151515] p-4 text-white shadow-md"
                  : "rounded-xl border border-border/80 bg-card p-4"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      current
                        ? "flex size-5 items-center justify-center rounded bg-[#c2f74d] font-mono text-[10px] font-bold text-[#151515]"
                        : "flex size-5 items-center justify-center rounded bg-muted font-mono text-[10px] font-bold text-muted-foreground"
                    }
                  >
                    0{idx + 1}
                  </span>
                  <span className="text-sm font-semibold">{tier.name}</span>
                </div>
                {current ? <Chip tone="lime">{c.youAreHere}</Chip> : null}
              </div>
              <p
                className={
                  current
                    ? "mt-2 text-xs leading-relaxed text-white/70"
                    : "mt-2 text-xs leading-relaxed text-muted-foreground"
                }
              >
                {tier.needs}
              </p>
              {lim ? (
                <p
                  className={
                    current
                      ? "mt-3 border-t border-white/10 pt-2.5 font-mono text-[11px] text-[#c2f74d]"
                      : "mt-3 border-t border-border/60 pt-2.5 font-mono text-[11px] text-foreground"
                  }
                >
                  {c.tierCapLine(usd(lim.per_txn_usd), usd(lim.daily_usd))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function Verification() {
  const c = useLangCopy(COPY);
  const qc = useQueryClient();
  const kyc = useQuery({ queryKey: ["kyc"], queryFn: platform.kyc });
  const config = useQuery({
    queryKey: ["public-config"],
    queryFn: platform.config,
    staleTime: 300_000,
  });

  const [type, setType] = useState("identity");
  const [mode, setMode] = useState<"file" | "reference">("file");
  const [file, setFile] = useState<File | null>(null);
  const [digest, setDigest] = useState("");
  const [reference, setReference] = useState("");
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(f: File | null) {
    setFile(f);
    setDigest("");
    setError(null);
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      setError(c.errMax25Mb);
      return;
    }
    setHashing(true);
    try {
      setDigest(await sha256File(f));
    } catch {
      setError(c.errReadFailed);
    } finally {
      setHashing(false);
    }
  }

  const evidenceRef = mode === "file" ? (digest ? `hash:sha256:${digest}` : "") : reference.trim();

  const submit = useMutation({
    mutationFn: () => {
      const parsed = evidenceReferenceSchema.safeParse(evidenceRef);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? c.errInvalidRef);
      const label = mode === "file" && file ? `${file.name} (hash only)` : undefined;
      return platform.submitKyc({
        verification_type: type,
        reference: parsed.data,
        ...(label ? { evidence_label: label.slice(0, 160) } : {}),
      });
    },
    onSuccess: () => {
      toast.success(c.toastSubmitted, { description: c.toastSubmittedDesc });
      setFile(null);
      setDigest("");
      setReference("");
      void qc.invalidateQueries({ queryKey: ["kyc"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => setError(describeError(e)),
  });

  const standing = kyc.data?.standing;

  return (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
      />

      {/* Executive Zero-Document Privacy Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/3 size-72 rounded-full bg-[#c2f74d]/10 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Fingerprint className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerPill}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {c.bannerTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc1}{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#c2f74d]">
                hash:sha256:…
              </code>{" "}
              {c.bannerDesc2}{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                registry://rdb/…
              </code>
              {c.bannerDesc3}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <Lock className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                {c.zeroStorage}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                <KeyRound className="size-3.5 text-emerald-400" aria-hidden="true" />
                {c.uriCompatible}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                {c.postureTitle}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c2f74d]">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                {standing ? standing.kyc_status.replace("_", " ") : c.loadingCaps}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-white/50">{c.singleCap}</dt>
                <dd className="font-bold text-white">
                  {standing ? usd(standing.limits.per_txn_usd) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">{c.remaining24h}</dt>
                <dd className="text-[#c2f74d]">
                  {standing
                    ? usd(Math.max(0, standing.limits.daily_usd - standing.used_day_usd))
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">{c.submissionsOnFile}</dt>
                <dd className="text-white">{c.recordsCount(kyc.data?.verifications.length ?? 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <QueryBoundary query={kyc}>
        {(data) =>
          data.standing ? (
            <StandingCard standing={data.standing} tiers={config.data?.kyc_limits ?? null} c={c} />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {c.noLimitsConfigured}
            </p>
          )
        }
      </QueryBoundary>

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <Panel
          title={c.submitPanelTitle}
          subtitle={c.submitPanelSub}
          meta={<ShieldCheck className="size-4 text-[#79b200]" aria-hidden="true" />}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              submit.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="kyc-type"
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
              >
                {c.whatVerifying}
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="kyc-type" className="rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {c.types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2">
              <legend className="font-mono text-[10px] uppercase tracking-[0.16em]">
                {c.howToFile}
              </legend>
              {(
                [
                  ["file", c.modeFile],
                  ["reference", c.modeReference],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={
                    mode === value
                      ? "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#151515] bg-muted/30 p-3 text-xs font-medium transition-colors"
                      : "flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-xs transition-colors hover:bg-muted/20"
                  }
                >
                  <input
                    type="radio"
                    name="kyc-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => {
                      setMode(value);
                      setError(null);
                    }}
                    className="size-4 accent-foreground"
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            {mode === "file" ? (
              <div className="space-y-2">
                <Label
                  htmlFor="kyc-file"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  {c.documentLabel}
                </Label>
                <div className="rounded-xl border border-dashed border-border bg-muted/15 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="size-3.5 text-foreground" aria-hidden="true" />
                    <span>{c.selectFilePrompt}</span>
                  </div>
                  <Input
                    id="kyc-file"
                    type="file"
                    accept="image/*,.pdf"
                    className="rounded-lg text-xs"
                    onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <p
                  className="rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground"
                  aria-live="polite"
                >
                  {hashing
                    ? c.computingHash
                    : digest
                      ? c.hashComputed(digest.slice(0, 16))
                      : c.neverLeaves}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label
                  htmlFor="kyc-ref"
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                >
                  {c.referenceLabel}
                </Label>
                <Input
                  id="kyc-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={c.referencePlaceholder}
                  className="rounded-lg font-mono text-xs"
                  autoComplete="off"
                />
              </div>
            )}

            {error ? (
              <p
                role="alert"
                className="rounded-lg border-2 border-foreground bg-amber-500/10 p-3 text-xs font-medium"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full gap-2 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!evidenceRef || hashing || submit.isPending}
            >
              <FileCheck2 className="size-4 text-[#c2f74d]" aria-hidden="true" />
              {submit.isPending ? c.submittingBtn : c.submitBtn}
            </Button>
          </form>
        </Panel>

        <Panel
          title={c.submissionsTitle}
          subtitle={c.submissionsSub}
          meta={<Chip>{c.filedChip(kyc.data?.verifications.length ?? 0)}</Chip>}
        >
          <QueryBoundary query={kyc}>
            {(data) => (
              <DataTable
                caption={c.tableCaption}
                rows={data.verifications}
                rowKey={(v) => v.id}
                searchable={false}
                empty={c.emptySubmissions}
                initialSort={{ key: "when", dir: "desc" }}
                columns={[
                  {
                    key: "type",
                    header: c.colType,
                    sort: (v) => v.verification_type,
                    cell: (v) => (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-0.5 font-mono text-xs capitalize">
                        {v.verification_type}
                      </span>
                    ),
                  },
                  {
                    key: "ref",
                    header: c.colReference,
                    text: (v) => v.reference,
                    cell: (v) => (
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {v.reference.slice(0, 28)}…
                        </span>
                        {v.evidence_label ? (
                          <div className="text-[11px] text-muted-foreground/80">
                            {v.evidence_label}
                          </div>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: "when",
                    header: c.colSubmitted,
                    sort: (v) => v.created_at,
                    cell: (v) => (
                      <span className="tabular font-mono text-xs">{when(v.created_at)}</span>
                    ),
                  },
                  {
                    key: "status",
                    header: c.colStatus,
                    align: "right",
                    sort: (v) => v.status,
                    cell: (v) => (
                      <Chip
                        tone={
                          v.status === "verified"
                            ? "invert"
                            : v.status === "pending"
                              ? "live"
                              : "warn"
                        }
                      >
                        {v.status}
                      </Chip>
                    ),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
