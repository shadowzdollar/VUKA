import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { compliance } from "@/lib/api/endpoints";
import type { Organization } from "@/lib/api/types";
import { shortId, when } from "@/lib/format";
import { useLangCopy, type Lang } from "@/lib/i18n";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    submitEvidenceBtn: string;
    newOrgBtn: string;
    bannerBadge: string;
    bannerTitle: string;
    bannerDesc: string;
    orgsMetric: string;
    approvedSub: (n: number) => string;
    pendingVerifMetric: string;
    pendingVerifSub: string;
    openReviewsMetric: string;
    openReviewsSub: string;
    verifChartTitle: string;
    verifChartSubtitle: string;
    itemsLabel: string;
    orgChartTitle: string;
    orgChartSubtitle: string;
    orgsLabel: string;
    registerTitle: string;
    registerSubtitle: string;
    tabOrgs: string;
    tabVerifications: string;
    tabReviews: string;
    emptyOrgs: string;
    colOrg: string;
    colCountry: string;
    colType: string;
    colReg: string;
    colStatus: string;
    emptyVerifs: string;
    colSubject: string;
    colReference: string;
    colSubmitted: string;
    traderPrefix: (id: string) => string;
    decideBtn: string;
    emptyReviews: string;
    colReason: string;
    colOpened: string;
    chooseOptionAria: string;
    orgCreatedToast: (name: string) => string;
    newOrgTitle: string;
    newOrgDesc: string;
    legalNameLabel: string;
    tradingNameLabel: string;
    countryIsoLabel: string;
    typeLabel: string;
    regNumLabel: string;
    createBtn: string;
    flagRaisedToast: string;
    openComplianceReviewBtn: string;
    riskFlagsHeading: string;
    noRiskFlags: string;
    resolveBtn: string;
    flagCodePlaceholder: string;
    describeConcernPlaceholder: string;
    raiseFlagBtn: string;
    decisionRecordedToast: string;
    decisionRefusedToast: string;
    recordDecisionTitle: string;
    recordDecisionDesc: string;
    outcomeLabel: string;
    rationaleLabel: string;
    recordBtn: string;
    evidenceRecordedToast: string;
    submitEvidenceTitle: string;
    submitEvidenceDesc: string;
    createOrgFirst: string;
    certRefPlaceholder: string;
    labelOptional: string;
    submitBtn: string;
    reviewOpenedToast: string;
    openReviewDesc: string;
    openReviewBtn: string;
  }
> = {
  en: {
    eyebrow: "Regulatory gateway",
    title: "Compliance & KYC",
    description:
      "Verification is proportionate to exposure. Every decision records who made it, from which state to which, and why — the log is append-only.",
    submitEvidenceBtn: "Submit evidence",
    newOrgBtn: "New organization",
    bannerBadge: "Proportionate KYB & Cryptographic Evidence Desk",
    bannerTitle: "Explainable Compliance & Risk Flag Registry",
    bannerDesc:
      "Review SHA-256 document fingerprints, national business registry references, and entity risk flags. Every verification decision requires a permanent written rationale.",
    orgsMetric: "Organizations",
    approvedSub: (n) => `${n} approved`,
    pendingVerifMetric: "Pending verifications",
    pendingVerifSub: "Evidence awaiting a decision",
    openReviewsMetric: "Open reviews",
    openReviewsSub: "Compliance cases in flight",
    verifChartTitle: "Verification evidence · by status",
    verifChartSubtitle: "Breakdown of submitted cryptographic fingerprints and registry references",
    itemsLabel: "items",
    orgChartTitle: "Organizations · by verification status",
    orgChartSubtitle: "KYB standing across registered legal entities",
    orgsLabel: "organizations",
    registerTitle: "Register",
    registerSubtitle:
      "Inspect organizations, adjudicate verification evidence, or manage compliance reviews",
    tabOrgs: "organizations",
    tabVerifications: "verifications",
    tabReviews: "reviews",
    emptyOrgs: "No organizations yet. Create one to start a review.",
    colOrg: "Organization",
    colCountry: "Country",
    colType: "Type",
    colReg: "Registration",
    colStatus: "Status",
    emptyVerifs: "No verification evidence submitted.",
    colSubject: "Subject",
    colReference: "Reference",
    colSubmitted: "Submitted",
    traderPrefix: (id) => `trader ${id}`,
    decideBtn: "Decide",
    emptyReviews: "No compliance reviews opened.",
    colReason: "Reason",
    colOpened: "Opened",
    chooseOptionAria: "Choose an option",
    orgCreatedToast: (name) => `${name} created`,
    newOrgTitle: "New organization",
    newOrgDesc: "Legal entity subject to verification.",
    legalNameLabel: "Legal name",
    tradingNameLabel: "Trading name (optional)",
    countryIsoLabel: "Country (ISO-2)",
    typeLabel: "Type",
    regNumLabel: "Registration number (optional)",
    createBtn: "Create",
    flagRaisedToast: "Risk flag raised",
    openComplianceReviewBtn: "Open compliance review",
    riskFlagsHeading: "Risk flags",
    noRiskFlags: "No risk flags.",
    resolveBtn: "Resolve",
    flagCodePlaceholder: "Flag code e.g. VOLUME_SPIKE",
    describeConcernPlaceholder: "Describe the concern…",
    raiseFlagBtn: "Raise flag",
    decisionRecordedToast: "Decision recorded",
    decisionRefusedToast: "Decision refused",
    recordDecisionTitle: "Record decision",
    recordDecisionDesc: "The rationale is stored with the state change and cannot be edited.",
    outcomeLabel: "Outcome",
    rationaleLabel: "Rationale",
    recordBtn: "Record",
    evidenceRecordedToast: "Evidence recorded",
    submitEvidenceTitle: "Submit evidence",
    submitEvidenceDesc:
      "Record a reference to evidence held elsewhere. Document contents are never uploaded here.",
    createOrgFirst: "Create an organization first.",
    certRefPlaceholder: "Certificate / document reference",
    labelOptional: "Label (optional)",
    submitBtn: "Submit",
    reviewOpenedToast: "Review opened",
    openReviewDesc: "Describe why this organization needs review.",
    openReviewBtn: "Open review",
  },
  fr: {
    eyebrow: "Passerelle réglementaire",
    title: "Conformité et KYC",
    description:
      "La vérification est proportionnée à l'exposition. Chaque décision consigne qui l'a prise, de quel état vers quel état, et pourquoi — le journal est en ajout seul.",
    submitEvidenceBtn: "Soumettre une preuve",
    newOrgBtn: "Nouvelle organisation",
    bannerBadge: "Bureau KYB proportionné et preuves cryptographiques",
    bannerTitle: "Registre explicable de conformité et d'alertes de risque",
    bannerDesc:
      "Examinez les empreintes SHA-256 de documents, les références des registres nationaux du commerce et les indicateurs de risque. Chaque décision de vérification exige un motif écrit permanent.",
    orgsMetric: "Organisations",
    approvedSub: (n) => `${n} approuvées`,
    pendingVerifMetric: "Vérifications en attente",
    pendingVerifSub: "Preuves en attente de décision",
    openReviewsMetric: "Examens ouverts",
    openReviewsSub: "Dossiers de conformité en cours",
    verifChartTitle: "Preuves de vérification · par statut",
    verifChartSubtitle: "Répartition des empreintes cryptographiques et références soumises",
    itemsLabel: "éléments",
    orgChartTitle: "Organisations · par statut de vérification",
    orgChartSubtitle: "Statut KYB des entités juridiques enregistrées",
    orgsLabel: "organisations",
    registerTitle: "Registre",
    registerSubtitle:
      "Inspectez les organisations, statuez sur les preuves de vérification ou gérez les examens de conformité",
    tabOrgs: "organisations",
    tabVerifications: "vérifications",
    tabReviews: "examens",
    emptyOrgs: "Aucune organisation pour l'instant. Créez-en une pour démarrer un examen.",
    colOrg: "Organisation",
    colCountry: "Pays",
    colType: "Type",
    colReg: "Immatriculation",
    colStatus: "Statut",
    emptyVerifs: "Aucune preuve de vérification soumise.",
    colSubject: "Sujet",
    colReference: "Référence",
    colSubmitted: "Soumis le",
    traderPrefix: (id) => `commerçant ${id}`,
    decideBtn: "Statuer",
    emptyReviews: "Aucun examen de conformité ouvert.",
    colReason: "Motif",
    colOpened: "Ouvert le",
    chooseOptionAria: "Choisir une option",
    orgCreatedToast: (name) => `${name} créée`,
    newOrgTitle: "Nouvelle organisation",
    newOrgDesc: "Entité juridique soumise à vérification.",
    legalNameLabel: "Raison sociale",
    tradingNameLabel: "Nom commercial (facultatif)",
    countryIsoLabel: "Pays (ISO-2)",
    typeLabel: "Type",
    regNumLabel: "Numéro d'immatriculation (facultatif)",
    createBtn: "Créer",
    flagRaisedToast: "Alerte de risque levée",
    openComplianceReviewBtn: "Ouvrir un examen de conformité",
    riskFlagsHeading: "Indicateurs de risque",
    noRiskFlags: "Aucun indicateur de risque.",
    resolveBtn: "Résoudre",
    flagCodePlaceholder: "Code d'alerte ex. VOLUME_SPIKE",
    describeConcernPlaceholder: "Décrivez le problème…",
    raiseFlagBtn: "Lever l'alerte",
    decisionRecordedToast: "Décision enregistrée",
    decisionRefusedToast: "Décision refusée",
    recordDecisionTitle: "Enregistrer la décision",
    recordDecisionDesc:
      "Le motif est stocké avec le changement d'état et ne peut pas être modifié.",
    outcomeLabel: "Résultat",
    rationaleLabel: "Motif",
    recordBtn: "Enregistrer",
    evidenceRecordedToast: "Preuve enregistrée",
    submitEvidenceTitle: "Soumettre une preuve",
    submitEvidenceDesc:
      "Enregistrez une référence vers une preuve conservée ailleurs. Le contenu des documents n'est jamais téléversé ici.",
    createOrgFirst: "Créez d'abord une organisation.",
    certRefPlaceholder: "Référence du certificat / document",
    labelOptional: "Libellé (facultatif)",
    submitBtn: "Soumettre",
    reviewOpenedToast: "Examen ouvert",
    openReviewDesc: "Décrivez pourquoi cette organisation nécessite un examen.",
    openReviewBtn: "Ouvrir l'examen",
  },
  sw: {
    eyebrow: "Lango la udhibiti",
    title: "Utii na KYC",
    description:
      "Uthibitisho unalingana na kiwango cha hatari. Kila uamuzi unarekodi nani aliufanya, kutoka hali gani hadi ipi, na kwa nini — kumbukumbu haifutiki.",
    submitEvidenceBtn: "Wasilisha ushahidi",
    newOrgBtn: "Shirika jipya",
    bannerBadge: "Dawati la KYB Inayowiana na Ushahidi wa Kriptografia",
    bannerTitle: "Rejista Inayoelezeka ya Utii na Viashiria vya Hatari",
    bannerDesc:
      "Kagua alama za SHA-256 za hati, marejeleo ya sajili za kitaifa za biashara, na viashiria vya hatari vya mashirika. Kila uamuzi wa uthibitisho unahitaji sababu ya kudumu ya maandishi.",
    orgsMetric: "Mashirika",
    approvedSub: (n) => `${n} yameidhinishwa`,
    pendingVerifMetric: "Uthibitisho unaosubiri",
    pendingVerifSub: "Ushahidi unaosubiri uamuzi",
    openReviewsMetric: "Mapitio yaliyo wazi",
    openReviewsSub: "Kesi za utii zinazoendelea",
    verifChartTitle: "Ushahidi wa uthibitisho · kwa hali",
    verifChartSubtitle: "Mgawanyo wa alama za kriptografia na marejeleo ya sajili yaliyowasilishwa",
    itemsLabel: "vipengele",
    orgChartTitle: "Mashirika · kwa hali ya uthibitisho",
    orgChartSubtitle: "Hali ya KYB katika mashirika ya kisheria yaliyosajiliwa",
    orgsLabel: "mashirika",
    registerTitle: "Rejista",
    registerSubtitle:
      "Kagua mashirika, amua kuhusu ushahidi wa uthibitisho, au simamia mapitio ya utii",
    tabOrgs: "mashirika",
    tabVerifications: "uthibitisho",
    tabReviews: "mapitio",
    emptyOrgs: "Bado hakuna mashirika. Unda moja ili kuanza mapitio.",
    colOrg: "Shirika",
    colCountry: "Nchi",
    colType: "Aina",
    colReg: "Usajili",
    colStatus: "Hali",
    emptyVerifs: "Hakuna ushahidi wa uthibitisho uliowasilishwa.",
    colSubject: "Mhusika",
    colReference: "Kumbukumbu",
    colSubmitted: " Iliwasilishwa",
    traderPrefix: (id) => `mfanyabiashara ${id}`,
    decideBtn: "Amua",
    emptyReviews: "Hakuna mapitio ya utii yaliyofunguliwa.",
    colReason: "Sababu",
    colOpened: "Ilifunguliwa",
    chooseOptionAria: "Chagua chaguo",
    orgCreatedToast: (name) => `${name} imeundwa`,
    newOrgTitle: "Shirika jipya",
    newOrgDesc: "Chombo cha kisheria kinachopaswa kuthibitishwa.",
    legalNameLabel: "Jina la kisheria",
    tradingNameLabel: "Jina la biashara (si lazima)",
    countryIsoLabel: "Nchi (ISO-2)",
    typeLabel: "Aina",
    regNumLabel: "Namba ya usajili (si lazima)",
    createBtn: "Unda",
    flagRaisedToast: "Kiashiria cha hatari kimewekwa",
    openComplianceReviewBtn: "Fungua mapitio ya utii",
    riskFlagsHeading: "Viashiria vya hatari",
    noRiskFlags: "Hakuna viashiria vya hatari.",
    resolveBtn: "Tatua",
    flagCodePlaceholder: "Msimbo wa kiashiria mf. VOLUME_SPIKE",
    describeConcernPlaceholder: "Eleza wasiwasi…",
    raiseFlagBtn: "Weka kiashiria",
    decisionRecordedToast: "Uamuzi umerekodiwa",
    decisionRefusedToast: "Uamuzi umekataliwa",
    recordDecisionTitle: "Rekodi uamuzi",
    recordDecisionDesc:
      "Sababu inahifadhiwa pamoja na mabadiliko ya hali na haiwezi kuhaririwa.",
    outcomeLabel: "Matokeo",
    rationaleLabel: "Sababu",
    recordBtn: "Rekodi",
    evidenceRecordedToast: "Ushahidi umerekodiwa",
    submitEvidenceTitle: "Wasilisha ushahidi",
    submitEvidenceDesc:
      "Rekodi kumbukumbu ya ushahidi unaohifadhiwa kwingineko. Maudhui ya hati hayapakiwi hapa kamwe.",
    createOrgFirst: "Unda shirika kwanza.",
    certRefPlaceholder: "Kumbukumbu ya cheti / hati",
    labelOptional: "Lebo (si lazima)",
    submitBtn: "Wasilisha",
    reviewOpenedToast: "Mapitio yamefunguliwa",
    openReviewDesc: "Eleza kwa nini shirika hili linahitaji mapitio.",
    openReviewBtn: "Fungua mapitio",
  },
  pt: {
    eyebrow: "Portal regulatório",
    title: "Conformidade e KYC",
    description:
      "A verificação é proporcional à exposição. Cada decisão regista quem a tomou, de que estado para qual, e porquê — o registo é apenas de adição.",
    submitEvidenceBtn: "Submeter comprovativo",
    newOrgBtn: "Nova organização",
    bannerBadge: "Mesa de KYB Proporcional e Provas Criptográficas",
    bannerTitle: "Registo Explicável de Conformidade e Alertas de Risco",
    bannerDesc:
      "Reveja impressões digitais SHA-256 de documentos, referências de registos comerciais nacionais e alertas de risco de entidades. Cada decisão de verificação requer fundamentação escrita permanente.",
    orgsMetric: "Organizações",
    approvedSub: (n) => `${n} aprovadas`,
    pendingVerifMetric: "Verificações pendentes",
    pendingVerifSub: "Comprovativos a aguardar decisão",
    openReviewsMetric: "Revisões abertas",
    openReviewsSub: "Processos de conformidade em curso",
    verifChartTitle: "Comprovativos de verificação · por estado",
    verifChartSubtitle: "Distribuição de impressões criptográficas e referências submetidas",
    itemsLabel: "itens",
    orgChartTitle: "Organizações · por estado de verificação",
    orgChartSubtitle: "Situação KYB entre entidades jurídicas registadas",
    orgsLabel: "organizações",
    registerTitle: "Registo",
    registerSubtitle:
      "Inspecione organizações, decida sobre comprovativos de verificação ou gira revisões de conformidade",
    tabOrgs: "organizações",
    tabVerifications: "verificações",
    tabReviews: "revisões",
    emptyOrgs: "Ainda sem organizações. Crie uma para iniciar uma revisão.",
    colOrg: "Organização",
    colCountry: "País",
    colType: "Tipo",
    colReg: "Registo",
    colStatus: "Estado",
    emptyVerifs: "Nenhum comprovativo de verificação submetido.",
    colSubject: "Sujeito",
    colReference: "Referência",
    colSubmitted: "Submetido",
    traderPrefix: (id) => `comerciante ${id}`,
    decideBtn: "Decidir",
    emptyReviews: "Nenhuma revisão de conformidade aberta.",
    colReason: "Motivo",
    colOpened: "Aberta em",
    chooseOptionAria: "Escolher uma opção",
    orgCreatedToast: (name) => `${name} criada`,
    newOrgTitle: "Nova organização",
    newOrgDesc: "Entidade jurídica sujeita a verificação.",
    legalNameLabel: "Denominação social",
    tradingNameLabel: "Nome comercial (opcional)",
    countryIsoLabel: "País (ISO-2)",
    typeLabel: "Tipo",
    regNumLabel: "Número de registo (opcional)",
    createBtn: "Criar",
    flagRaisedToast: "Alerta de risco emitido",
    openComplianceReviewBtn: "Abrir revisão de conformidade",
    riskFlagsHeading: "Alertas de risco",
    noRiskFlags: "Sem alertas de risco.",
    resolveBtn: "Resolver",
    flagCodePlaceholder: "Código do alerta ex. VOLUME_SPIKE",
    describeConcernPlaceholder: "Descreva a preocupação…",
    raiseFlagBtn: "Emitir alerta",
    decisionRecordedToast: "Decisão registada",
    decisionRefusedToast: "Decisão recusada",
    recordDecisionTitle: "Registar decisão",
    recordDecisionDesc:
      "A fundamentação é guardada com a mudança de estado e não pode ser editada.",
    outcomeLabel: "Resultado",
    rationaleLabel: "Fundamentação",
    recordBtn: "Registar",
    evidenceRecordedToast: "Comprovativo registado",
    submitEvidenceTitle: "Submeter comprovativo",
    submitEvidenceDesc:
      "Registe uma referência a um comprovativo guardado noutro local. O conteúdo dos documentos nunca é carregado aqui.",
    createOrgFirst: "Crie primeiro uma organização.",
    certRefPlaceholder: "Referência do certificado / documento",
    labelOptional: "Etiqueta (opcional)",
    submitBtn: "Submeter",
    reviewOpenedToast: "Revisão aberta",
    openReviewDesc: "Descreva porque é que esta organização precisa de revisão.",
    openReviewBtn: "Abrir revisão",
  },
  rw: {
    eyebrow: "Irembo ry'amategeko",
    title: "Kubahiriza Amategeko & KYC",
    description:
      "Igenzura rikorwa hakurikijwe ingano y'ibikorwa. Buri mwanzuro wandika uwawufashe, imiterere ivuyeho n'igiyeho, n'impamvu — igitabo ntigisibwa.",
    submitEvidenceBtn: "Tanga ibimenyetso",
    newOrgBtn: "Ikigo gishya",
    bannerBadge: "Biro ya KYB n'Ibimenyetso bya Cryptographie",
    bannerTitle: "Igitabo cy'Iyubahirizamategeko n'Ibimenyetso by'Ingaruka",
    bannerDesc:
      "Suzuma ibimenyetso bya SHA-256 by'inyandiko, nimero z'iyandikwa ry'ubucuruzi, n'ibimenyetso by'ingaruka ku bigo. Buri mwanzuro w'igenzura usaba impamvu yanditse ihame.",
    orgsMetric: "Ibigo",
    approvedSub: (n) => `${n} byemejwe`,
    pendingVerifMetric: "Amagenzura ategereje",
    pendingVerifSub: "Ibimenyetso bitegereje umwanzuro",
    openReviewsMetric: "Amasuzuma afunguye",
    openReviewsSub: "Imanza z'iyubahirizamategeko zirimo gukorwa",
    verifChartTitle: "Ibimenyetso by'igenzura · ukurikije imiterere",
    verifChartSubtitle: "Ikigero cy'ibimenyetso na nimero z'iyandikwa byatanzwe",
    itemsLabel: "ibintu",
    orgChartTitle: "Ibigo · ukurikije uko byagenzuwe",
    orgChartSubtitle: "Imiterere ya KYB mu bigo byemewe n'amategeko",
    orgsLabel: "ibigo",
    registerTitle: "Igitabo",
    registerSubtitle:
      "Suzuma ibigo, fata imyanzuro ku bimenyetso by'igenzura, cyangwa ucunge amasuzuma y'iyubahirizamategeko",
    tabOrgs: "ibigo",
    tabVerifications: "amagenzura",
    tabReviews: "amasuzuma",
    emptyOrgs: "Nta bigo biraboneka. Tangiza kimwe kugira ngo utangire isuzuma.",
    colOrg: "Ikigo",
    colCountry: "Igihugu",
    colType: "Ubwoko",
    colReg: "Iyandikwa",
    colStatus: "Imiterere",
    emptyVerifs: "Nta bimenyetso by'igenzura byatanzwe.",
    colSubject: "Uwagenzuwe",
    colReference: " Inyito",
    colSubmitted: "Byatanzwe",
    traderPrefix: (id) => `umucuruzi ${id}`,
    decideBtn: "Fata umwanzuro",
    emptyReviews: "Nta masuzuma y'iyubahirizamategeko afunguye.",
    colReason: "Impamvu",
    colOpened: "Ryafunguwe",
    chooseOptionAria: "Hitamo",
    orgCreatedToast: (name) => `${name} cyaremwe`,
    newOrgTitle: "Ikigo gishya",
    newOrgDesc: "Ikigo cyemewe n'amategeko kigomba kugenzurwa.",
    legalNameLabel: "Izina ryemewe n'amategeko",
    tradingNameLabel: "Izina ry'ubucuruzi (si ngombwa)",
    countryIsoLabel: "Igihugu (ISO-2)",
    typeLabel: "Ubwoko",
    regNumLabel: "Nimero y'iyandikwa (si ngombwa)",
    createBtn: "Rema",
    flagRaisedToast: "Ikimenyetso cy'ingaruka cyashyizweho",
    openComplianceReviewBtn: "Fungura isuzuma ry'iyubahirizamategeko",
    riskFlagsHeading: "Ibimenyetso by'ingaruka",
    noRiskFlags: "Nta bimenyetso by'ingaruka.",
    resolveBtn: "Kemura",
    flagCodePlaceholder: "Kode y'ikimenyetso urugero VOLUME_SPIKE",
    describeConcernPlaceholder: "Sobanura ikibazo…",
    raiseFlagBtn: "Shyiraho ikimenyetso",
    decisionRecordedToast: "Umwanzuro wanditswe",
    decisionRefusedToast: "Umwanzuro wanze",
    recordDecisionTitle: "Andika umwanzuro",
    recordDecisionDesc:
      "Impamvu ibikwa hamwe n'impinduka y'imiterere kandi ntishobora guhindurwa.",
    outcomeLabel: "Umwanzuro",
    rationaleLabel: "Impamvu",
    recordBtn: "Andika",
    evidenceRecordedToast: "Ikimenyetso cyanditswe",
    submitEvidenceTitle: "Tanga ibimenyetso",
    submitEvidenceDesc:
      "Andika inomero y'ikimenyetso kibitswe ahandi. Ibirimo mu nyandiko ntibyoherezwa hano.",
    createOrgFirst: "Banza ureme ikigo.",
    certRefPlaceholder: "Inomero y'icyemezo / inyandiko",
    labelOptional: "Inyito (si ngombwa)",
    submitBtn: "Tanga",
    reviewOpenedToast: "Isuzuma ryafunguwe",
    openReviewDesc: "Sobanura impamvu iki kigo gikeneye isuzuma.",
    openReviewBtn: "Fungura isuzuma",
  },
};

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & KYC — VUKA" },
      {
        name: "description",
        content:
          "Organizations, verification evidence, compliance reviews and risk flags with an explainable decision trail.",
      },
    ],
  }),
  component: () => (
    <Shell role="operator">
      <Compliance />
    </Shell>
  ),
});

type Tab = "organizations" | "verifications" | "reviews";

const ORG_TYPES = ["company", "sole_trader", "partnership", "cooperative", "nonprofit"];
const VERIFICATION_TYPES = ["identity", "business", "address", "ownership"];
const REVIEW_STATUSES = ["approved", "rejected", "suspended", "needs_information"];
const VERIFICATION_DECISIONS = ["verified", "rejected", "expired"];
const SEVERITIES = ["low", "medium", "high", "critical"];

function tally(values: string[]) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return Array.from(m, ([label, value]) => ({ label, value }));
}

const statusTone = (s: string) =>
  ["approved", "verified", "resolved"].includes(s)
    ? ("invert" as const)
    : ["rejected", "suspended", "expired", "critical", "high"].includes(s)
      ? ("warn" as const)
      : ("live" as const);

function Compliance() {
  const qc = useQueryClient();
  const c = useLangCopy(COPY);
  const [tab, setTab] = useState<Tab>("organizations");
  const orgs = useQuery({ queryKey: ["orgs"], queryFn: compliance.organizations });
  const verifications = useQuery({
    queryKey: ["verifications"],
    queryFn: compliance.verifications,
  });
  const reviews = useQuery({ queryKey: ["reviews"], queryFn: compliance.reviews });

  const [orgOpen, setOrgOpen] = useState(false);
  const [openOrg, setOpenOrg] = useState<Organization | null>(null);
  const [decide, setDecide] = useState<{ kind: "verification" | "review"; id: string } | null>(
    null,
  );
  const [newVerification, setNewVerification] = useState(false);
  const [newReviewFor, setNewReviewFor] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["orgs"] });
    void qc.invalidateQueries({ queryKey: ["verifications"] });
    void qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  const orgName = (id?: string) => orgs.data?.find((o) => o.id === id)?.legal_name ?? shortId(id);

  const tabLabels: Record<Tab, string> = {
    organizations: c.tabOrgs,
    verifications: c.tabVerifications,
    reviews: c.tabReviews,
  };

  return (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setNewVerification(true)}
              className="gap-1.5 rounded-lg font-mono text-xs uppercase"
            >
              <FileCheck2 className="size-3.5 text-[#79b200]" aria-hidden="true" />
              {c.submitEvidenceBtn}
            </Button>
            <Button
              onClick={() => setOrgOpen(true)}
              className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            >
              <Building2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              {c.newOrgBtn}
            </Button>
          </>
        }
      />

      {/* Executive Compliance & KYB Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <ShieldCheck className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                {c.bannerBadge}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {c.bannerTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              {c.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Metric
          label={c.orgsMetric}
          value={orgs.data?.length ?? "—"}
          sub={c.approvedSub(
            orgs.data?.filter((o) => o.verification_status === "approved").length ?? 0,
          )}
          accent="lime"
        />
        <Metric
          label={c.pendingVerifMetric}
          value={verifications.data?.filter((v) => v.status === "pending").length ?? "—"}
          sub={c.pendingVerifSub}
        />
        <Metric
          label={c.openReviewsMetric}
          value={reviews.data?.filter((r) => r.status === "pending").length ?? "—"}
          sub={c.openReviewsSub}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={c.verifChartTitle} subtitle={c.verifChartSubtitle}>
          <LazyDonutChart
            data={tally((verifications.data ?? []).map((v) => v.status))}
            ariaLabel={c.verifChartTitle}
            center={{ value: String(verifications.data?.length ?? 0), label: c.itemsLabel }}
            format={(v) => String(v)}
          />
        </Panel>
        <Panel title={c.orgChartTitle} subtitle={c.orgChartSubtitle}>
          <LazyDonutChart
            data={tally((orgs.data ?? []).map((o) => o.verification_status))}
            ariaLabel={c.orgChartTitle}
            center={{ value: String(orgs.data?.length ?? 0), label: c.orgsLabel }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel
        title={c.registerTitle}
        subtitle={c.registerSubtitle}
        meta={
          <div className="flex gap-1.5">
            {(["organizations", "verifications", "reviews"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="cursor-pointer">
                <Chip tone={tab === t ? "invert" : "neutral"}>{tabLabels[t]}</Chip>
              </button>
            ))}
          </div>
        }
      >
        {tab === "organizations" ? (
          <QueryBoundary
            query={orgs}
            isEmpty={(d) => d.length === 0}
            empty={c.emptyOrgs}
          >
            {(rows) => (
              <Table head={[c.colOrg, c.colCountry, c.colType, c.colReg, c.colStatus]}>
                {rows.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOpenOrg(o)}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-2.5 py-3 font-medium">{o.legal_name}</td>
                    <td className="px-2.5 py-3 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag code={o.country_code} className="h-3 w-4 rounded-[1px]" />
                        {o.country_code}
                      </span>
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs">{o.organization_type}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {o.registration_number ?? "—"}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(o.verification_status)}>{o.verification_status}</Chip>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        ) : tab === "verifications" ? (
          <QueryBoundary
            query={verifications}
            isEmpty={(d) => d.length === 0}
            empty={c.emptyVerifs}
          >
            {(rows) => (
              <Table
                head={[c.colSubject, c.colType, c.colReference, c.colSubmitted, c.colStatus, ""]}
              >
                {rows.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-2.5 py-3 text-xs font-medium">
                      {v.organization_id
                        ? orgName(v.organization_id)
                        : c.traderPrefix(shortId(v.user_id))}
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs">{v.verification_type}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {v.reference}
                    </td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {when(v.created_at)} · {v.submitted_by}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(v.status)}>{v.status}</Chip>
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      {v.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg font-mono text-[10px] uppercase"
                          onClick={() => setDecide({ kind: "verification", id: v.id })}
                        >
                          {c.decideBtn}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        ) : (
          <QueryBoundary
            query={reviews}
            isEmpty={(d) => d.length === 0}
            empty={c.emptyReviews}
          >
            {(rows) => (
              <Table head={[c.colOrg, c.colReason, c.colOpened, c.colStatus, ""]}>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-2.5 py-3 text-xs font-medium">
                      {orgName(r.organization_id)}
                    </td>
                    <td className="max-w-xs truncate px-2.5 py-3 text-xs">{r.reason}</td>
                    <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                      {when(r.created_at)} · {r.opened_by}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg font-mono text-[10px] uppercase"
                        onClick={() => setDecide({ kind: "review", id: r.id })}
                      >
                        {c.decideBtn}
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </QueryBoundary>
        )}
      </Panel>

      <OrgDialog open={orgOpen} onOpenChange={setOrgOpen} onDone={refresh} />
      <OrgDetail
        org={openOrg}
        onClose={() => setOpenOrg(null)}
        onOpenReview={(id) => setNewReviewFor(id)}
      />
      <DecisionDialog target={decide} onClose={() => setDecide(null)} onDone={refresh} />
      <VerificationDialog
        open={newVerification}
        onOpenChange={setNewVerification}
        orgs={orgs.data ?? []}
        onDone={refresh}
      />
      <ReviewDialog orgId={newReviewFor} onClose={() => setNewReviewFor(null)} onDone={refresh} />
    </>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-2.5 py-2.5 ${i >= head.length - 2 ? "text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</Label>
      {children}
    </div>
  );
}

function Pick({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const c = useLangCopy(COPY);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={c.chooseOptionAria} className="rounded-lg font-mono text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrgDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const c = useLangCopy(COPY);
  const [f, setF] = useState({
    legal_name: "",
    trading_name: "",
    country_code: "RW",
    organization_type: "company",
    registration_number: "",
  });
  const create = useMutation({
    mutationFn: () =>
      compliance.createOrganization({
        legal_name: f.legal_name.trim(),
        country_code: f.country_code.trim().toUpperCase(),
        organization_type: f.organization_type,
        ...(f.trading_name.trim() ? { trading_name: f.trading_name.trim() } : {}),
        ...(f.registration_number.trim()
          ? { registration_number: f.registration_number.trim() }
          : {}),
      }),
    onSuccess: (o) => {
      toast.success(c.orgCreatedToast(o.legal_name));
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {c.newOrgTitle}
          </DialogTitle>
          <DialogDescription>{c.newOrgDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={c.legalNameLabel}>
            <Input
              className="rounded-lg"
              value={f.legal_name}
              onChange={(e) => setF({ ...f, legal_name: e.target.value })}
            />
          </Field>
          <Field label={c.tradingNameLabel}>
            <Input
              className="rounded-lg"
              value={f.trading_name}
              onChange={(e) => setF({ ...f, trading_name: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={c.countryIsoLabel}>
              <Input
                maxLength={2}
                className="rounded-lg font-mono"
                value={f.country_code}
                onChange={(e) => setF({ ...f, country_code: e.target.value })}
              />
            </Field>
            <Field label={c.typeLabel}>
              <Pick
                value={f.organization_type}
                onChange={(v) => setF({ ...f, organization_type: v })}
                options={ORG_TYPES}
              />
            </Field>
          </div>
          <Field label={c.regNumLabel}>
            <Input
              className="rounded-lg font-mono"
              value={f.registration_number}
              onChange={(e) => setF({ ...f, registration_number: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!f.legal_name.trim() || f.country_code.length !== 2 || create.isPending}
            onClick={() => create.mutate()}
          >
            {c.createBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrgDetail({
  org,
  onClose,
  onOpenReview,
}: {
  org: Organization | null;
  onClose: () => void;
  onOpenReview: (id: string) => void;
}) {
  const c = useLangCopy(COPY);
  const qc = useQueryClient();
  const flags = useQuery({
    queryKey: ["flags", org?.id],
    queryFn: () => compliance.riskFlags(org!.id),
    enabled: !!org,
  });
  const [code, setCode] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [desc, setDesc] = useState("");
  const add = useMutation({
    mutationFn: () =>
      compliance.addRiskFlag(org!.id, {
        code: code.trim().toUpperCase(),
        severity,
        description: desc.trim(),
      }),
    onSuccess: () => {
      toast.success(c.flagRaisedToast);
      setCode("");
      setDesc("");
      void qc.invalidateQueries({ queryKey: ["flags", org?.id] });
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const resolve = useMutation({
    mutationFn: (flagId: string) =>
      compliance.resolveRiskFlag(org!.id, flagId, "Resolved by operator review"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["flags", org?.id] }),
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={org !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        {org ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                {org.legal_name}
              </DialogTitle>
              <DialogDescription>
                {org.country_code} · {org.organization_type} · {org.verification_status}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-mono text-[10px] uppercase"
                onClick={() => onOpenReview(org.id)}
              >
                {c.openComplianceReviewBtn}
              </Button>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {c.riskFlagsHeading}
            </div>
            <QueryBoundary query={flags} isEmpty={(d) => d.length === 0} empty={c.noRiskFlags}>
              {(rows) => (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {rows.map((fl) => (
                    <li
                      key={fl.id}
                      className="flex items-start justify-between gap-3 px-3.5 py-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{fl.code}</span>
                          <Chip tone={statusTone(fl.severity)}>{fl.severity}</Chip>
                          <Chip tone={statusTone(fl.status)}>{fl.status}</Chip>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{fl.description}</p>
                      </div>
                      {fl.status === "open" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg font-mono text-[10px] uppercase"
                          disabled={resolve.isPending}
                          onClick={() => resolve.mutate(fl.id)}
                        >
                          {c.resolveBtn}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </QueryBoundary>
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <Input
                className="rounded-lg font-mono"
                placeholder={c.flagCodePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Pick value={severity} onChange={setSeverity} options={SEVERITIES} />
            </div>
            <Textarea
              className="min-h-16 rounded-lg"
              placeholder={c.describeConcernPlaceholder}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <Button
              className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
              disabled={!code.trim() || !desc.trim() || add.isPending}
              onClick={() => add.mutate()}
            >
              {c.raiseFlagBtn}
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialog({
  target,
  onClose,
  onDone,
}: {
  target: { kind: "verification" | "review"; id: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const c = useLangCopy(COPY);
  const options = target?.kind === "verification" ? VERIFICATION_DECISIONS : REVIEW_STATUSES;
  const [status, setStatus] = useState("");
  const [rationale, setRationale] = useState("");
  const chosen = status || options[0] || "";
  const decide = useMutation({
    mutationFn: async () => {
      if (target!.kind === "verification")
        await compliance.decideVerification(target!.id, chosen, rationale.trim());
      else await compliance.decideReview(target!.id, chosen, rationale.trim());
    },
    onSuccess: () => {
      toast.success(c.decisionRecordedToast);
      setRationale("");
      setStatus("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error(c.decisionRefusedToast, { description: describeError(e) }),
  });
  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {c.recordDecisionTitle}
          </DialogTitle>
          <DialogDescription>{c.recordDecisionDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={c.outcomeLabel}>
            <Pick value={chosen} onChange={setStatus} options={options} />
          </Field>
          <Field label={c.rationaleLabel}>
            <Textarea
              className="min-h-24 rounded-lg"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!rationale.trim() || decide.isPending}
            onClick={() => decide.mutate()}
          >
            {c.recordBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerificationDialog({
  open,
  onOpenChange,
  orgs,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgs: Organization[];
  onDone: () => void;
}) {
  const c = useLangCopy(COPY);
  const [orgId, setOrgId] = useState("");
  const [type, setType] = useState("identity");
  const [reference, setReference] = useState("");
  const [label, setLabel] = useState("");
  const create = useMutation({
    mutationFn: () =>
      compliance.createVerification({
        organization_id: orgId || orgs[0]!.id,
        verification_type: type,
        reference: reference.trim(),
        ...(label.trim() ? { evidence_label: label.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success(c.evidenceRecordedToast);
      setReference("");
      setLabel("");
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {c.submitEvidenceTitle}
          </DialogTitle>
          <DialogDescription>{c.submitEvidenceDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={c.colOrg}>
            {orgs.length === 0 ? (
              <p className="text-xs text-muted-foreground">{c.createOrgFirst}</p>
            ) : (
              <Select value={orgId || orgs[0]!.id} onValueChange={setOrgId}>
                <SelectTrigger aria-label={c.colOrg} className="rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label={c.typeLabel}>
            <Pick value={type} onChange={setType} options={VERIFICATION_TYPES} />
          </Field>
          <Field label={c.colReference}>
            <Input
              className="rounded-lg font-mono"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={c.certRefPlaceholder}
            />
          </Field>
          <Field label={c.labelOptional}>
            <Input
              className="rounded-lg"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={orgs.length === 0 || !reference.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {c.submitBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  orgId,
  onClose,
  onDone,
}: {
  orgId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const c = useLangCopy(COPY);
  const [reason, setReason] = useState("");
  const create = useMutation({
    mutationFn: () => compliance.createReview(orgId!, reason.trim()),
    onSuccess: () => {
      toast.success(c.reviewOpenedToast);
      setReason("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  return (
    <Dialog open={orgId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            {c.openComplianceReviewBtn}
          </DialogTitle>
          <DialogDescription>{c.openReviewDesc}</DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-24 rounded-lg"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!reason.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {c.openReviewBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
