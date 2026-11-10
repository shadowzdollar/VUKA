import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Download,
  FileCode2,
  Fingerprint,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { LazyRadarView } from "@/components/vuka/lazy-charts";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { platform } from "@/lib/api/endpoints";
import type { TrustFactor } from "@/lib/api/types";
import { day } from "@/lib/format";
import { useLangCopy } from "@/lib/i18n";
import { useTrader } from "@/lib/session";

export const Route = createFileRoute("/trust-score")({
  head: () => ({
    meta: [
      { title: "Trust & Credit Score — VUKA" },
      {
        name: "description",
        content: "A transparent score computed from your real settlement history in the ledger.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <TrustScore />
    </Shell>
  ),
});

const COPY = {
  en: {
    eyebrow: "Deterministic Credit Engine",
    title: "Trust & Credit Score",
    description:
      "The score is a deterministic function of your settlement history. Every point is attributable to a recorded ledger outcome — no opaque model, no identity proxies.",
    exportCertBtn: "Export credit certificate",
    toastExported: "Trade-credit certificate exported",
    compositeIndex: "Composite Index",
    unscored: "Unscored",
    pctSuffix: (n: number) => `${n}th pct`,
    floor300: "300 FLOOR",
    ceiling850: "850 CEILING",
    bannerPill: (band: string) => `Verified Ledger Credit Passport · Band ${band}`,
    bannerDesc1:
      "Computed directly from double-entry journal postings using the published linear formula",
    bannerDesc2:
      ". Export a SHA-256 signed certificate at any time for supplier or trade-finance underwriting.",
    cyclesScoredLabel: "Cycles Scored:",
    creditBandLabel: "Credit Band:",
    bandValue: (band: string) => `Band ${band}`,
    demographicLabel: "Demographic Inputs:",
    zeroExcluded: "0 (Excluded)",
    shaAttestation: "SHA-256 Attestation",
    deterministic: "Deterministic",
    compositeScore: "Composite score",
    standingTier: "Standing tier",
    noHistory: "No history",
    of850Band: (band: string) => `of 850 · band ${band}`,
    activeFactors: "Active factors",
    weightedVectors: (n: number) => `${n} weighted vectors`,
    downloadTxt: "Download Signed .TXT",
    metricExcluded: "Excluded inputs",
    metricExcludedSub: "No demographic or identity signals",
    metricScored: "Scored factors",
    metricScoredSub: "Each traceable to ledger rows",
    metricEvidence: "Evidence weighting",
    metricEvidenceVal: "On",
    metricEvidenceSub: "Thin history is pulled toward the floor",
    breakdownTitle: "Factor breakdown",
    breakdownSub: "Exact point contribution, raw factor performance, and ledger evidence depth",
    ptsChip: (earned: number, max: number) => `+${earned} / ${max} pts`,
    weightEvidenceLine: (w: number, val: number, ev: number) =>
      `weight ${w}% · ${val}/100 · evidence ${ev}%`,
    factorQuality: "Factor Quality",
    evidenceConfidence: "Evidence Confidence",
    shapeTitle: "Score shape",
    shapeSub: "Effective weighted footprint vs theoretical 850 ceiling",
    radarAria: "Trust factors: current effective value and potential",
    shapeNote:
      "The solid shape is each factor's value weighted by how much evidence backs it; the dashed outline is the ceiling.",
    pathTitle: "Path to a higher score",
    pathSub: "Highest-yield ledger actions ranked by exact point unlock",
    leversChip: (n: number) => `${n} levers`,
    atCeiling: "Every factor is at its ceiling.",
    ptsPossible: (n: number) => `+${n} pts possible`,
    formulaNote:
      "Point values come from the published formula: 300 + 550 × Σ(weight × value × evidence) ÷ 10 000.",
    escrowFootnote:
      "Mutual-release rate and arbitration record are not part of this score yet: the engine keys on-chain escrows to wallet addresses rather than to traders, so they cannot be attributed to you.",
    sendPaymentCta: "Send Payment",
    issueInvoiceCta: "Issue Invoice",
    factorLabels: {
      cycles: "Settlement completion",
      invoices: "Invoice discipline",
      reversals: "Reversal hygiene",
      volume: "Settlement consistency",
      diversity: "Counterparty breadth",
    } as Record<string, string>,
    actions: {
      cycles:
        "Complete more payments. Ten finished payments give this factor its full weight; failed payments lower the rate.",
      invoices: "Issue invoices and get them paid. Five invoices give this factor its full weight.",
      reversals: "Avoid reversals: agree amounts and recipients before sending.",
      volume:
        "Keep activity steady across consecutive 30-day windows (four settled payments across two windows).",
      diversity:
        "Trade with more distinct partners. Five different counterparties give this factor its full weight.",
    } as Record<string, string>,
  },
  fr: {
    eyebrow: "Moteur de crédit déterministe",
    title: "Score de confiance et de crédit",
    description:
      "Ce score est une fonction déterministe de votre historique de règlement. Chaque point est attribuable à un résultat inscrit au registre — aucun modèle opaque, aucun critère identitaire.",
    exportCertBtn: "Exporter le certificat de crédit",
    toastExported: "Certificat de crédit commercial exporté",
    compositeIndex: "Indice composite",
    unscored: "Non noté",
    pctSuffix: (n: number) => `${n}e centile`,
    floor300: "PLANCHER 300",
    ceiling850: "PLAFOND 850",
    bannerPill: (band: string) => `Passeport de crédit vérifié au registre · Tranche ${band}`,
    bannerDesc1:
      "Calculé directement à partir des écritures à double entrée selon la formule linéaire publiée",
    bannerDesc2:
      ". Exportez à tout moment un certificat signé SHA-256 pour vos fournisseurs ou partenaires financiers.",
    cyclesScoredLabel: "Cycles évalués :",
    creditBandLabel: "Tranche de crédit :",
    bandValue: (band: string) => `Tranche ${band}`,
    demographicLabel: "Données démographiques :",
    zeroExcluded: "0 (Exclues)",
    shaAttestation: "Attestation SHA-256",
    deterministic: "Déterministe",
    compositeScore: "Score composite",
    standingTier: "Niveau de statut",
    noHistory: "Aucun historique",
    of850Band: (band: string) => `sur 850 · tranche ${band}`,
    activeFactors: "Facteurs actifs",
    weightedVectors: (n: number) => `${n} vecteurs pondérés`,
    downloadTxt: "Télécharger .TXT signé",
    metricExcluded: "Données exclues",
    metricExcludedSub: "Aucun signal démographique ou identitaire",
    metricScored: "Facteurs évalués",
    metricScoredSub: "Chacun traçable aux lignes du registre",
    metricEvidence: "Pondération par preuve",
    metricEvidenceVal: "Active",
    metricEvidenceSub: "Un historique court est ramené vers le plancher",
    breakdownTitle: "Détail des facteurs",
    breakdownSub:
      "Contribution exacte en points, performance brute et profondeur de preuve au registre",
    ptsChip: (earned: number, max: number) => `+${earned} / ${max} pts`,
    weightEvidenceLine: (w: number, val: number, ev: number) =>
      `poids ${w} % · ${val}/100 · preuve ${ev} %`,
    factorQuality: "Qualité du facteur",
    evidenceConfidence: "Confiance de preuve",
    shapeTitle: "Profil du score",
    shapeSub: "Empreinte pondérée effective par rapport au plafond théorique de 850",
    radarAria: "Facteurs de confiance : valeur effective actuelle et potentiel",
    shapeNote:
      "La forme pleine représente la valeur de chaque facteur pondérée par le volume de preuves ; le contour pointillé indique le plafond.",
    pathTitle: "Progression vers un score supérieur",
    pathSub: "Actions à plus fort impact classées par gain exact de points",
    leversChip: (n: number) => `${n} leviers`,
    atCeiling: "Chaque facteur a atteint son plafond.",
    ptsPossible: (n: number) => `+${n} pts possibles`,
    formulaNote:
      "Les valeurs en points proviennent de la formule publiée : 300 + 550 × Σ(poids × valeur × preuve) ÷ 10 000.",
    escrowFootnote:
      "Le taux de libération mutuelle et l'historique d'arbitrage ne font pas encore partie de ce score : le moteur associe les séquestres on-chain aux adresses de portefeuille plutôt qu'aux commerçants.",
    sendPaymentCta: "Envoyer un paiement",
    issueInvoiceCta: "Émettre une facture",
    factorLabels: {
      cycles: "Achèvement des règlements",
      invoices: "Discipline de facturation",
      reversals: "Maîtrise des contre-passations",
      volume: "Régularité des règlements",
      diversity: "Diversité des contreparties",
    },
    actions: {
      cycles:
        "Complétez davantage de paiements. Dix paiements terminés donnent son poids maximal à ce facteur ; les échecs réduisent le taux.",
      invoices:
        "Émettez des factures et faites-les régler. Cinq factures donnent son poids maximal à ce facteur.",
      reversals:
        "Évitez les contre-passations : convenez des montants et des bénéficiaires avant d'envoyer.",
      volume:
        "Maintenez une activité régulière sur des fenêtres consécutives de 30 jours (quatre paiements réglés sur deux fenêtres).",
      diversity:
        "Commercez avec davantage de partenaires distincts. Cinq contreparties différentes donnent le poids maximal.",
    },
  },
  sw: {
    eyebrow: "Injini ya Mkopo Inayotabirika",
    title: "Alama ya Uaminifu na Mkopo",
    description:
      "Alama hii inatokana moja kwa moja na historia yako ya malipo. Kila pointi inahusishwa na matokeo yaliyorekodiwa kwenye leja — hakuna mfumo uliofichika wala makisio ya utambulisho.",
    exportCertBtn: "Hamisha cheti cha mkopo",
    toastExported: "Cheti cha mkopo wa biashara kimehamishwa",
    compositeIndex: "Kielezo cha Jumla",
    unscored: "Haijapimwa",
    pctSuffix: (n: number) => `Asilimia ya ${n}`,
    floor300: "KIWANGO CHA CHINI 300",
    ceiling850: "KIWANGO CHA JUU 850",
    bannerPill: (band: string) => `Pasipoti ya Mkopo wa Leja Iliyothibitishwa · Daraja ${band}`,
    bannerDesc1:
      "Imekokotolewa moja kwa moja kutoka kwa maingizo ya leja kwa kutumia kanuni iliyochapishwa",
    bannerDesc2:
      ". Pakua cheti kilichosainiwa kwa SHA-256 wakati wowote kwa ajili ya wasambazaji au ufadhili wa biashara.",
    cyclesScoredLabel: "Mzunguko Uliopimwa:",
    creditBandLabel: "Daraja la Mkopo:",
    bandValue: (band: string) => `Daraja ${band}`,
    demographicLabel: "Taarifa za Kijamii:",
    zeroExcluded: "0 (Zimeondolewa)",
    shaAttestation: "Uthibitisho wa SHA-256",
    deterministic: "Inayotabirika",
    compositeScore: "Alama ya jumla",
    standingTier: "Ngazi ya hadhi",
    noHistory: "Hakuna historia",
    of850Band: (band: string) => `kati ya 850 · daraja ${band}`,
    activeFactors: "Vigezo hai",
    weightedVectors: (n: number) => `vigezo ${n} vyenye uzito`,
    downloadTxt: "Pakua .TXT Iliyosainiwa",
    metricExcluded: "Vigezo vilivyoondolewa",
    metricExcludedSub: "Hakuna ishara za kijamii au utambulisho",
    metricScored: "Vigezo vilivyopimwa",
    metricScoredSub: "Kila kimoja kinaonekana kwenye leja",
    metricEvidence: "Uzito wa ushahidi",
    metricEvidenceVal: "Imewashwa",
    metricEvidenceSub: "Historia fupi inavutwa karibu na kiwango cha chini",
    breakdownTitle: "Mgawanyo wa vigezo",
    breakdownSub: "Mchango halisi wa pointi, utendaji wa kigezo na kina cha ushahidi kwenye leja",
    ptsChip: (earned: number, max: number) => `+${earned} / ${max} pt`,
    weightEvidenceLine: (w: number, val: number, ev: number) =>
      `uzito ${w}% · ${val}/100 · ushahidi ${ev}%`,
    factorQuality: "Ubora wa Kigezo",
    evidenceConfidence: "Uhakika wa Ushahidi",
    shapeTitle: "Muundo wa alama",
    shapeSub: "Alama halisi iliyopimwa dhidi ya ukomo wa juu wa 850",
    radarAria: "Vigezo vya uaminifu: thamani ya sasa na uwezo",
    shapeNote:
      "Umbo kamili ni thamani ya kila kigezo kulingana na ushahidi uliopo; mstari wa vitone ni ukomo wa juu.",
    pathTitle: "Njia ya kupata alama ya juu",
    pathSub: "Hatua za leja zenye faida kubwa zilizopangwa kwa pointi zinazopatikana",
    leversChip: (n: number) => `nyenzo ${n}`,
    atCeiling: "Kila kigezo kimefikia ukomo wake wa juu.",
    ptsPossible: (n: number) => `pointi +${n} zinawezekana`,
    formulaNote:
      "Thamani za pointi zinatokana na kanuni iliyochapishwa: 300 + 550 × Σ(uzito × thamani × ushahidi) ÷ 10 000.",
    escrowFootnote:
      "Kiwango cha makubaliano ya escrow na rekodi za usuluhishi bado si sehemu ya alama hii: injini huunganisha escrow za mtandaoni na anwani za pochi badala ya wafanyabiashara.",
    sendPaymentCta: "Tuma Malipo",
    issueInvoiceCta: "Toa Ankara",
    factorLabels: {
      cycles: "Ukamilishaji wa malipo",
      invoices: "Nidhamu ya ankara",
      reversals: "Kuepuka kurejesha miamala",
      volume: "Uthabiti wa malipo",
      diversity: "Wigo wa washirika wa biashara",
    },
    actions: {
      cycles:
        "Kamilisha malipo zaidi. Malipo kumi yaliyokamilika yanakipa kigezo hiki uzito kamili; malipo yaliyoshindwa yanapunguza kiwango.",
      invoices: "Toa ankara na zilipwe. Ankara tano zinakipa kigezo hiki uzito wake kamili.",
      reversals: "Epuka kurejesha miamala: kubaliana kiasi na mpokeaji kabla ya kutuma.",
      volume:
        "Dumisha shughuli thabiti katika vipindi viwili mfululizo vya siku 30 (malipo manne yaliyokamilika).",
      diversity:
        "Fanya biashara na washirika tofauti zaidi. Washirika watano tofauti wanakipa kigezo hiki uzito kamili.",
    },
  },
  pt: {
    eyebrow: "Motor de Crédito Determinístico",
    title: "Pontuação de Confiança e Crédito",
    description:
      "A pontuação é uma função determinística do seu histórico de liquidações. Cada ponto é atribuível a um resultado registado no razão — sem modelos opacos nem indicadores de identidade.",
    exportCertBtn: "Exportar certificado de crédito",
    toastExported: "Certificado de crédito comercial exportado",
    compositeIndex: "Índice Composto",
    unscored: "Sem pontuação",
    pctSuffix: (n: number) => `percentil ${n}`,
    floor300: "MÍNIMO 300",
    ceiling850: "MÁXIMO 850",
    bannerPill: (band: string) => `Passaporte de Crédito Verificado no Razão · Escalão ${band}`,
    bannerDesc1:
      "Calculado diretamente a partir dos lançamentos de partidas dobradas usando a fórmula linear publicada",
    bannerDesc2:
      ". Exporte a qualquer momento um certificado assinado SHA-256 para avaliação por fornecedores ou financiamento comercial.",
    cyclesScoredLabel: "Ciclos Avaliados:",
    creditBandLabel: "Escalão de Crédito:",
    bandValue: (band: string) => `Escalão ${band}`,
    demographicLabel: "Dados Demográficos:",
    zeroExcluded: "0 (Excluídos)",
    shaAttestation: "Atestação SHA-256",
    deterministic: "Determinístico",
    compositeScore: "Pontuação composta",
    standingTier: "Nível de estatuto",
    noHistory: "Sem histórico",
    of850Band: (band: string) => `de 850 · escalão ${band}`,
    activeFactors: "Fatores ativos",
    weightedVectors: (n: number) => `${n} vetores ponderados`,
    downloadTxt: "Transferir .TXT Assinado",
    metricExcluded: "Dados excluídos",
    metricExcludedSub: "Sem sinais demográficos ou de identidade",
    metricScored: "Fatores avaliados",
    metricScoredSub: "Cada um rastreável a linhas do razão",
    metricEvidence: "Ponderação de evidência",
    metricEvidenceVal: "Ativa",
    metricEvidenceSub: "Histórico curto é puxado para o mínimo",
    breakdownTitle: "Decomposição de fatores",
    breakdownSub:
      "Contribuição exata em pontos, desempenho bruto do fator e profundidade de prova no razão",
    ptsChip: (earned: number, max: number) => `+${earned} / ${max} pts`,
    weightEvidenceLine: (w: number, val: number, ev: number) =>
      `peso ${w}% · ${val}/100 · evidência ${ev}%`,
    factorQuality: "Qualidade do Fator",
    evidenceConfidence: "Confiança da Evidência",
    shapeTitle: "Perfil da pontuação",
    shapeSub: "Pegada ponderada efetiva vs teto teórico de 850",
    radarAria: "Fatores de confiança: valor efetivo atual e potencial",
    shapeNote:
      "A forma sólida é o valor de cada fator ponderado pela evidência que o suporta; o contorno tracejado é o limite máximo.",
    pathTitle: "Caminho para uma pontuação superior",
    pathSub: "Ações no razão de maior retorno ordenadas pelo ganho exato de pontos",
    leversChip: (n: number) => `${n} alavancas`,
    atCeiling: "Todos os fatores estão no limite máximo.",
    ptsPossible: (n: number) => `+${n} pts possíveis`,
    formulaNote:
      "Os valores em pontos resultam da fórmula publicada: 300 + 550 × Σ(peso × valor × evidência) ÷ 10 000.",
    escrowFootnote:
      "A taxa de libertação mútua e o registo de arbitragem ainda não fazem parte desta pontuação: o motor associa as cauções on-chain a endereços de carteira em vez de comerciantes.",
    sendPaymentCta: "Enviar Pagamento",
    issueInvoiceCta: "Emitir Fatura",
    factorLabels: {
      cycles: "Conclusão de liquidações",
      invoices: "Disciplina de faturação",
      reversals: "Controlo de estornos",
      volume: "Consistência de liquidações",
      diversity: "Diversidade de contrapartes",
    },
    actions: {
      cycles:
        "Conclua mais pagamentos. Dez pagamentos concluídos atribuem o peso máximo a este fator; pagamentos falhados reduzem a taxa.",
      invoices:
        "Emita faturas e receba o seu pagamento. Cinco faturas atribuem o peso máximo a este fator.",
      reversals: "Evite estornos: confirme montantes e destinatários antes de enviar.",
      volume:
        "Mantenha atividade regular em janelas consecutivas de 30 dias (quatro pagamentos liquidados em duas janelas).",
      diversity:
        "Comercie com mais parceiros distintos. Cinco contrapartes diferentes atribuem o peso máximo a este fator.",
    },
  },
  rw: {
    eyebrow: "Sisitemu y'Inguzanyo Ibara mu Buryo Bwizewe",
    title: "Amanota y'Icyizere n'Inguzanyo",
    description:
      "Aya manota abara hashingiwe ku mateka nyayo y'ubwishyu bwawe. Buri nota rikomoka ku gikorwa cyanditswe mu gitabo cy'imari — nta buryo buhishe cyangwa ngo harebwe imyirondoro.",
    exportCertBtn: "Manura icyemezo cy'inguzanyo",
    toastExported: "Icyemezo cy'icyizere cy'ubucuruzi cyamanuwe",
    compositeIndex: "Igipimo Rusange",
    unscored: "Ntikirabarwa",
    pctSuffix: (n: number) => `ku ijana ${n}`,
    floor300: "AHO BITANGIRIRA 300",
    ceiling850: "AHO BIGARUKIRA 850",
    bannerPill: (band: string) => `Pasiporo y'Inguzanyo Yemejwe mu Gitabo · Icyiciro ${band}`,
    bannerDesc1:
      "Yabarwe ako kanya bivuye mu nyandiko z'igitabo cy'imari hakoreshejwe inzira yatangajwe",
    bannerDesc2:
      ". Manura icyemezo cyashyizweho umukono wa SHA-256 igihe cyose kugira ngo ucyerekane abakugemurira cyangwa ibigo by'imari.",
    cyclesScoredLabel: "Inshuro Zabarwe:",
    creditBandLabel: "Icyiciro cy'Inguzanyo:",
    bandValue: (band: string) => `Icyiciro ${band}`,
    demographicLabel: "Imyirondoro y'Umuntu:",
    zeroExcluded: "0 (Ntikoreshwa)",
    shaAttestation: "Ikimenyetso cya SHA-256",
    deterministic: "Bidakuka",
    compositeScore: "Amanota rusange",
    standingTier: "Urwego ugezeho",
    noHistory: "Nta mateka",
    of850Band: (band: string) => `kuri 850 · icyiciro ${band}`,
    activeFactors: "Ingingo zibarwa",
    weightedVectors: (n: number) => `ingingo ${n} zifite uburemere`,
    downloadTxt: "Manura .TXT Yashyizweho Umukono",
    metricExcluded: "Ibitabarwa",
    metricExcludedSub: "Nta makuru y'imyirondoro akoreshwa",
    metricScored: "Ingingo zabarwe",
    metricScoredSub: "Buri yose ifite inkomoko mu gitabo",
    metricEvidence: "Uburemere bw'ibimenyetso",
    metricEvidenceVal: " Birakora",
    metricEvidenceSub: "Amateka make asubiza amanota hasi",
    breakdownTitle: "Isesengura ry'ingingo",
    breakdownSub:
      "Uruhare nyarwo rw'amanota, imikorere ya buri ngingo, n'ubwinshi bw'ibimenyetso mu gitabo",
    ptsChip: (earned: number, max: number) => `amanota +${earned} / ${max}`,
    weightEvidenceLine: (w: number, val: number, ev: number) =>
      `uburemere ${w}% · ${val}/100 · ibimenyetso ${ev}%`,
    factorQuality: "ireme ry'Ingingo",
    evidenceConfidence: "Icyizere cy'Ibimenyetso",
    shapeTitle: "Imiterere y'amanota",
    shapeSub: " uko amanota ahagaze ugereranyije n'imbibi za 850",
    radarAria: "Ingingo z'icyizere: agaciro ka none n'agashoboka",
    shapeNote:
      "Igishushanyo cyuzuye ni agaciro ka buri ngingo dukurikije ibimenyetso bihari; umurongo utaguye ni aho bigarukira.",
    pathTitle: "Inzira yo kuzamura amanota",
    pathSub: "Ibikorwa byo mu gitabo bitanga amanota menshi kurusha ibindi",
    leversChip: (n: number) => `uburyo ${n}`,
    atCeiling: "Buri ngingo igeze ku rwego rwo hejuru.",
    ptsPossible: (n: number) => `amanota +${n} ashoboka`,
    formulaNote:
      "Amanota ava mu mibare yatangajwe: 300 + 550 × Σ(uburemere × agaciro × ibimenyetso) ÷ 10 000.",
    escrowFootnote:
      "Ingano y'amafaranga arekurwa ku bwumvikane n'amateka y'ubukemurampaka ntibirajya muri aya manota: sisitemu ihuza za escrow na aderesi za wallet aho kuba abacuruzi.",
    sendPaymentCta: "Ohereza Amafaranga",
    issueInvoiceCta: "Tanga Inyemezabuguzi",
    factorLabels: {
      cycles: " kurangiza ubwishyu",
      invoices: "Imikorere ku nyemezabuguzi",
      reversals: "Kwirinda gusubiza inyuma ubwishyu",
      volume: "Guhozaho ubwishyu",
      diversity: "Ubwinshi bw'abo mukorana",
    },
    actions: {
      cycles:
        "Rangiza ubwishyu bwinshi. Ubwishyu icumi bwarangiye buha iyi ngingo uburemere bwayo bwose; ubwanze bugabanya igipimo.",
      invoices:
        "Tanga inyemezabuguzi kandi zishyurwe. Inyemezabuguzi eshanu ziha iyi ngingo uburemere bwose.",
      reversals:
        "Irinde gusubiza inyuma ubwishyu: bumvikana umubare n'uwakira mbere yo kohereza.",
      volume:
        "Komeza gukora udacogora mu bihe bikurikirana by'iminsi 30 (ubwishyu bune bwarangiye mu bihe bibiri).",
      diversity:
        "Korana n'abafatanyabikorwa batandukanye. Abafatanyabikorwa batanu batandukanye baha iyi ngingo uburemere bwose.",
    },
  },
} as const;

/** score = 300 + 550 × Σ(weight × value × confidence) / 10 000, so each lever has an exact point value. */
function opportunities(factors: TrustFactor[]) {
  return factors
    .map((f) => {
      const raiseValue = (550 * f.weight * (100 - f.value) * f.confidence) / 10_000;
      const addEvidence = (550 * f.weight * f.value * (1 - f.confidence)) / 10_000;
      const potential =
        raiseValue + addEvidence + (550 * f.weight * (100 - f.value) * (1 - f.confidence)) / 10_000;
      return {
        factor: f,
        points: Math.round(potential),
        lever: addEvidence >= raiseValue ? "evidence" : "quality",
      };
    })
    .filter((o) => o.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function ScoreSpeedometer({
  score,
  cyclesScored,
  c,
}: {
  score: number;
  cyclesScored: number;
  c: (typeof COPY)[keyof typeof COPY];
}) {
  const pct = cyclesScored === 0 ? 0 : Math.max(0, Math.min(1, (score - 300) / 550));
  const r = 74;
  const cx = 96;
  const cy = 96;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 250 / 360;
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength * (1 - pct);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 192 164" className="w-52 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="vuka-trust-gauge" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="45%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#c2f74d" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={13}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(145 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#vuka-trust-gauge)"
          strokeWidth={13}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(145 ${cx} ${cy})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
          {c.compositeIndex}
        </span>
        <span className="mt-0.5 font-mono text-4xl font-bold tabular-nums tracking-tighter text-white">
          {cyclesScored === 0 ? "—" : score}
        </span>
        <span className="mt-1 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/15 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2f74d]">
          {cyclesScored === 0 ? c.unscored : c.pctSuffix(Math.round(pct * 100))}
        </span>
      </div>
      <div className="-mt-2 flex w-44 justify-between font-mono text-[10px] text-white/45">
        <span>{c.floor300}</span>
        <span>{c.ceiling850}</span>
      </div>
    </div>
  );
}

function TrustScore() {
  const c = useLangCopy(COPY);
  const trader = useTrader();
  const trustQuery = useQuery({
    queryKey: ["trust", trader.id],
    queryFn: platform.trust,
    staleTime: 60_000,
  });
  const result = trustQuery.data
    ? { ...trustQuery.data, cyclesScored: trustQuery.data.cycles_scored }
    : null;
  const failure = trustQuery.isError ? trustQuery : undefined;

  const actionLinks: Record<string, { label: string; to: "/send" | "/escrow" }> = {
    cycles: { label: c.sendPaymentCta, to: "/send" },
    invoices: { label: c.issueInvoiceCta, to: "/escrow" },
    reversals: { label: c.sendPaymentCta, to: "/send" },
    volume: { label: c.sendPaymentCta, to: "/send" },
    diversity: { label: c.sendPaymentCta, to: "/send" },
  };

  async function exportCertificate() {
    if (!result) return;
    const issued = new Date().toISOString();
    const lines = [
      "VUKA TRADE-CREDIT CERTIFICATE",
      "=============================",
      `Trader: ${trader.full_name} (${trader.id})`,
      `Issued: ${issued}`,
      `Composite score: ${result.score} / 850 (band ${result.band})`,
      `Settlement cycles scored: ${result.cyclesScored}`,
      "",
      ...result.factors.map(
        (f) =>
          `${f.label.padEnd(32)} weight ${String(f.weight).padStart(2)}%  score ${Math.round(f.value)}/100  evidence ${Math.round(f.confidence * 100)}%  — ${f.detail}`,
      ),
      "",
      "Derived exclusively from on-platform ledger settlement outcomes.",
      "No demographic, identity or inferred behavioural inputs are used.",
      "Informational only; not a credit decision.",
    ];
    const body = lines.join("\n");
    const digest = await sha256Hex(body);
    const url = URL.createObjectURL(
      new Blob([`${body}\n\nSHA-256 of the text above: ${digest}\n`], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `vuka-trade-credit-certificate-${day(issued)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(c.toastExported, {
      description: `SHA-256 ${digest.slice(0, 12)}…`,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        actions={
          <Button
            onClick={() => void exportCertificate()}
            disabled={!result || result.cyclesScored === 0}
            className="gap-2 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <Download className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
            {c.exportCertBtn}
          </Button>
        }
      />

      {failure ? (
        <ErrorState error={failure.error} onRetry={() => void trustQuery.refetch()} />
      ) : !result ? (
        <Loading />
      ) : (
        <>
          {/* Executive Trade-Credit Passport Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
            <img
              src={escrowGlobe}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -bottom-16 w-[340px] opacity-[0.14] mix-blend-screen select-none"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-[#c2f74d]/10 blur-3xl"
            />

            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_240px_280px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                  <Award className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                    {c.bannerPill(result.band)}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {trader.full_name}
                </h2>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/65">
                  {c.bannerDesc1}{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#c2f74d]">
                    300 + 550 × Σ(weight × value × evidence) ÷ 10,000
                  </code>
                  {c.bannerDesc2}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <Layers className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                    <span>{c.cyclesScoredLabel}</span>
                    <strong className="text-white">{result.cyclesScored}</strong>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{c.creditBandLabel}</span>
                    <strong className="text-[#c2f74d]">
                      {result.cyclesScored === 0 ? c.unscored : c.bandValue(result.band)}
                    </strong>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80">
                    <Fingerprint className="size-3.5 text-sky-400" aria-hidden="true" />
                    <span>{c.demographicLabel}</span>
                    <strong className="text-white">{c.zeroExcluded}</strong>
                  </div>
                </div>
              </div>

              {/* Center: Speedometer Gauge */}
              <div className="flex justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <ScoreSpeedometer score={result.score} cyclesScored={result.cyclesScored} c={c} />
              </div>

              {/* Right: Certificate Preview Card */}
              <div className="flex flex-col justify-between rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      {c.shaAttestation}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#c2f74d]">
                      <FileCode2 className="size-3" aria-hidden="true" />
                      {c.deterministic}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-white/50">{c.compositeScore}</dt>
                      <dd className="font-bold text-white">
                        {result.cyclesScored === 0 ? "—" : `${result.score} / 850`}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">{c.standingTier}</dt>
                      <dd className="text-[#c2f74d]">
                        {result.cyclesScored === 0 ? c.noHistory : c.of850Band(result.band)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">{c.activeFactors}</dt>
                      <dd className="text-white">{c.weightedVectors(result.factors.length)}</dd>
                    </div>
                  </dl>
                </div>

                <Button
                  onClick={() => void exportCertificate()}
                  disabled={result.cyclesScored === 0}
                  className="mt-4 w-full gap-1.5 rounded-lg bg-[#c2f74d] font-mono text-[11px] font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  {c.downloadTxt}
                </Button>
              </div>
            </div>
          </div>

          {/* 3-Column Governance Metrics */}
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label={c.metricExcluded}
              value="0"
              sub={c.metricExcludedSub}
              accent="lime"
            />
            <Metric
              label={c.metricScored}
              value={result.factors.length}
              sub={c.metricScoredSub}
            />
            <Metric
              label={c.metricEvidence}
              value={c.metricEvidenceVal}
              sub={c.metricEvidenceSub}
            />
          </div>

          {/* Factor Breakdown + Radar & Levers */}
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel
              title={c.breakdownTitle}
              subtitle={c.breakdownSub}
              meta={<Chip tone="live">{c.deterministic}</Chip>}
            >
              <ul className="space-y-4">
                {result.factors.map((f) => {
                  const maxPts = Math.round((550 * f.weight) / 100);
                  const earnedPts = Math.round((550 * f.weight * f.value * f.confidence) / 10_000);
                  const factorLabel = c.factorLabels[f.key] ?? f.label;
                  return (
                    <li
                      key={f.key}
                      className="rounded-xl border border-border/80 bg-muted/15 p-4 transition-colors hover:border-foreground/25"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight text-foreground">
                            {factorLabel}
                          </span>
                          <span className="rounded bg-[#151515] px-2 py-0.5 font-mono text-[10px] font-bold text-[#c2f74d]">
                            {c.ptsChip(earnedPts, maxPts)}
                          </span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {c.weightEvidenceLine(
                            f.weight,
                            Math.round(f.value),
                            Math.round(f.confidence * 100),
                          )}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                            <span>{c.factorQuality}</span>
                            <span className="font-semibold text-foreground">
                              {Math.round(f.value)} / 100
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#151515] transition-all duration-500"
                              style={{ width: `${f.value}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                            <span>{c.evidenceConfidence}</span>
                            <span className="font-semibold text-foreground">
                              {Math.round(f.confidence * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#79b200] transition-all duration-500"
                              style={{ width: `${Math.round(f.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-muted-foreground">{f.detail}</p>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <div className="space-y-4">
              <Panel
                title={c.shapeTitle}
                subtitle={c.shapeSub}
              >
                <LazyRadarView
                  ariaLabel={c.radarAria}
                  data={result.factors.map((f) => {
                    const lbl = c.factorLabels[f.key] ?? f.label;
                    return {
                      axis: lbl.split(" ")[0] ?? lbl,
                      value: f.value * f.confidence,
                      potential: 100,
                    };
                  })}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {c.shapeNote}
                </p>
              </Panel>

              <Panel
                title={c.pathTitle}
                subtitle={c.pathSub}
                meta={<Chip tone="lime">{c.leversChip(opportunities(result.factors).length)}</Chip>}
              >
                {opportunities(result.factors).length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-950">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{c.atCeiling}</span>
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {opportunities(result.factors).map((o, i) => {
                      const cta = actionLinks[o.factor.key];
                      const factorLabel = c.factorLabels[o.factor.key] ?? o.factor.label;
                      return (
                        <li
                          key={o.factor.key}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-muted/15 p-3.5"
                        >
                          <div className="flex gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#151515] font-mono text-[11px] font-bold text-[#c2f74d]">
                              0{i + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                <span>{factorLabel}</span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#79b200]/35 bg-[#c2f74d]/25 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                                  <TrendingUp className="size-3 text-[#4d7300]" />
                                  {c.ptsPossible(o.points)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {c.actions[o.factor.key] ?? o.factor.detail}
                              </p>
                            </div>
                          </div>
                          {cta ? (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 shrink-0 gap-1 rounded-md font-mono text-[10px] uppercase"
                            >
                              <Link to={cta.to}>
                                {cta.label}
                                <ArrowUpRight className="size-3" />
                              </Link>
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}
                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Sparkles className="size-3.5 shrink-0 text-[#79b200]" aria-hidden="true" />
                  {c.formulaNote}
                </p>
              </Panel>
            </div>
          </div>

          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            {c.escrowFootnote}
          </p>
        </>
      )}
    </>
  );
}
