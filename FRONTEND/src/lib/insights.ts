import type { AnalyticsReport } from "@/lib/api/types";
import { busiestForLang } from "@/components/vuka/viz/simple";
import { pickLang, type Lang } from "@/lib/i18n";

export interface Insight {
  title: string;
  body: string;
  /** "watch" items deserve attention; "info" items are neutral facts. */
  tone: "info" | "watch";
}

const usd = (n: number) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

const COPY = {
  en: {
    noPaymentsTitle: "No payments in this period",
    noPaymentsBody:
      "Once payments settle, this page shows volume trends, corridor usage and reliability. Send a payment or widen the period to see data.",
    volGrowing: "Volume is growing",
    volSlowing: "Volume is slowing",
    volBody: (second: string, first: string, sign: string, changePct: number) =>
      `The second half of the period moved ${second} against ${first} in the first half (${sign}${changePct}%).`,
    relGood: "Reliable settlement",
    relWatch: "Settlement reliability needs attention",
    relBody: (succ: number, fin: number, rate: string, bad: number) =>
      `${succ} of ${fin} finished payments settled (${rate}); ${bad} failed or were reversed.`,
    concTitle: "Concentrated on one counterparty",
    concBody: (name: string, share: string) =>
      `${name} accounts for ${share} of your settled volume. Spreading activity across partners also strengthens your trust score.`,
    xbShareTitle: "Cross-border share",
    allDomesticTitle: "All activity is domestic",
    xbShareBody: (share: string, topCorridor?: { from: string; to: string; vol: string }) =>
      `${share} of settled payments crossed a currency border${topCorridor ? `, led by ${topCorridor.from} → ${topCorridor.to} (${topCorridor.vol})` : ""}.`,
    allDomesticBody: "No settled payment crossed a currency border in this period.",
    typicalSizeTitle: "Typical payment size",
    typicalSizeBody: (avg: string, max: string) =>
      `The average settled payment is ${avg}; the largest was ${max}.`,
    busiestTitle: "Busiest time",
    busiestBody: (slot: string) => `Most activity happens on ${slot} UTC.`,
  },
  fr: {
    noPaymentsTitle: "Aucun paiement sur cette période",
    noPaymentsBody:
      "Une fois les paiements réglés, cette page affiche les tendances de volume, l'utilisation des corridors et la fiabilité. Envoyez un paiement ou élargissez la période pour voir les données.",
    volGrowing: "Le volume est en hausse",
    volSlowing: "Le volume ralentit",
    volBody: (second: string, first: string, sign: string, changePct: number) =>
      `La seconde moitié de la période a traité ${second} contre ${first} dans la première moitié (${sign}${changePct}%).`,
    relGood: "Règlement fiable",
    relWatch: "La fiabilité des règlements nécessite une attention",
    relBody: (succ: number, fin: number, rate: string, bad: number) =>
      `${succ} paiements terminés sur ${fin} ont été réglés (${rate}) ; ${bad} ont échoué ou ont été annulés.`,
    concTitle: "Concentration sur une seule contrepartie",
    concBody: (name: string, share: string) =>
      `${name} représente ${share} de votre volume réglé. Répartir l'activité entre plusieurs partenaires renforce également votre score de confiance.`,
    xbShareTitle: "Part transfrontalière",
    allDomesticTitle: "Toute l'activité est nationale",
    xbShareBody: (share: string, topCorridor?: { from: string; to: string; vol: string }) =>
      `${share} des paiements réglés ont franchi une frontière monétaire${topCorridor ? `, menés par ${topCorridor.from} → ${topCorridor.to} (${topCorridor.vol})` : ""}.`,
    allDomesticBody: "Aucun paiement réglé n'a franchi de frontière monétaire sur cette période.",
    typicalSizeTitle: "Taille typique des paiements",
    typicalSizeBody: (avg: string, max: string) =>
      `Le paiement réglé moyen est de ${avg} ; le plus élevé était de ${max}.`,
    busiestTitle: "Période la plus active",
    busiestBody: (slot: string) => `La majorité de l'activité a lieu le ${slot} UTC.`,
  },
  sw: {
    noPaymentsTitle: "Hakuna malipo katika kipindi hiki",
    noPaymentsBody:
      "Malipo yakishakamilika, ukurasa huu huonyesha mwenendo wa kiasi, matumizi ya korido na uhakika. Tuma malipo au panua kipindi ili kuona data.",
    volGrowing: "Kiasi kinaongezeka",
    volSlowing: "Kiasi kinapungua",
    volBody: (second: string, first: string, sign: string, changePct: number) =>
      `Nusu ya pili ya kipindi ilipitisha ${second} dhidi ya ${first} katika nusu ya kwanza (${sign}${changePct}%).`,
    relGood: "Uaminifu mzuri wa malipo",
    relWatch: "Uaminifu wa malipo unahitaji umakini",
    relBody: (succ: number, fin: number, rate: string, bad: number) =>
      `Malipo ${succ} kati ya ${fin} yaliyomalizika yalikamilika (${rate}); ${bad} yalishindwa au kurudishwa.`,
    concTitle: " imejikita kwa mshirika mmoja",
    concBody: (name: string, share: string) =>
      `${name} inachukua ${share} ya kiasi chako kilicholipwa. Kusambaza shughuli kwa washirika wengi pia huimarisha alama yako ya uaminifu.`,
    xbShareTitle: "Sehemu ya malipo ya mipakani",
    allDomesticTitle: "Shughuli zote ni za ndani ya nchi",
    xbShareBody: (share: string, topCorridor?: { from: string; to: string; vol: string }) =>
      `${share} ya malipo yaliyokamilika yalivuka mpaka wa sarafu${topCorridor ? `, ikiongozwa na ${topCorridor.from} → ${topCorridor.to} (${topCorridor.vol})` : ""}.`,
    allDomesticBody: "Hakuna malipo yaliyokamilika yaliyovuka mpaka wa sarafu katika kipindi hiki.",
    typicalSizeTitle: "Ukubwa wa kawaida wa malipo",
    typicalSizeBody: (avg: string, max: string) =>
      `Wastani wa malipo yaliyokamilika ni ${avg}; kubwa zaidi lilikuwa ${max}.`,
    busiestTitle: "Wakati wenye shughuli nyingi",
    busiestBody: (slot: string) => `Shughuli nyingi hufanyika ${slot} UTC.`,
  },
  pt: {
    noPaymentsTitle: "Sem pagamentos neste período",
    noPaymentsBody:
      "Assim que os pagamentos são liquidados, esta página mostra tendências de volume, uso de corredores e fiabilidade. Envie um pagamento ou alargue o período para ver dados.",
    volGrowing: "O volume está a crescer",
    volSlowing: "O volume está a abrandar",
    volBody: (second: string, first: string, sign: string, changePct: number) =>
      `A segunda metade do período movimentou ${second} face a ${first} na primeira metade (${sign}${changePct}%).`,
    relGood: "Liquidação fiável",
    relWatch: "A fiabilidade de liquidação requer atenção",
    relBody: (succ: number, fin: number, rate: string, bad: number) =>
      `${succ} de ${fin} pagamentos concluídos foram liquidados (${rate}); ${bad} falharam ou foram revertidos.`,
    concTitle: "Concentrado numa única contraparte",
    concBody: (name: string, share: string) =>
      `${name} representa ${share} do seu volume liquidado. Distribuir a atividade entre parceiros também fortalece a sua pontuação de confiança.`,
    xbShareTitle: "Quota transfronteiriça",
    allDomesticTitle: "Toda a atividade é doméstica",
    xbShareBody: (share: string, topCorridor?: { from: string; to: string; vol: string }) =>
      `${share} dos pagamentos liquidados cruzaram uma fronteira cambial${topCorridor ? `, liderados por ${topCorridor.from} → ${topCorridor.to} (${topCorridor.vol})` : ""}.`,
    allDomesticBody: "Nenhum pagamento liquidado cruzou uma fronteira cambial neste período.",
    typicalSizeTitle: "Dimensão típica de pagamento",
    typicalSizeBody: (avg: string, max: string) =>
      `O pagamento liquidado médio é de ${avg}; o maior foi de ${max}.`,
    busiestTitle: "Horário mais movimentado",
    busiestBody: (slot: string) => `A maior parte da atividade ocorre em ${slot} UTC.`,
  },
  rw: {
    noPaymentsTitle: "Nta bwishyu bwabaye muri iki gihe",
    noPaymentsBody:
      "Iyo ubwishyu bwarangiye, uru rupapuro rugaragaza imigendekere y'ingano, imikoreshereze y'inzira n'uko byizewe. Ohereza ubwishyu cyangwa wagure igihe kugira ngo ubone amakuru.",
    volGrowing: "Ingano y'ubwishyu iriyongera",
    volSlowing: "Ingano y'ubwishyu iragabanuka",
    volBody: (second: string, first: string, sign: string, changePct: number) =>
      `Igice cya kabiri cy'iki gihe cyanyujije ${second} ugereranyije na ${first} mu gice cya mbere (${sign}${changePct}%).`,
    relGood: "Ubwishyu bwizewe",
    relWatch: "Uko ubwishyu bwizewe bisaba kwitabwaho",
    relBody: (succ: number, fin: number, rate: string, bad: number) =>
      `${succ} kuri ${fin} by'ubwishyu bwarangiye byatunganye (${rate}); ${bad} byanze cyangwa bisubizwa inyuma.`,
    concTitle: "Byibanze ku mufatanyabikorwa umwe",
    concBody: (name: string, share: string) =>
      `${name} yihariye ${share} by'ingano y'ubwishyu bwawe bwarangiye. Kugabanya ibikorwa mu bafatanyabikorwa batandukanye byongera amanota yawe y'icyizere.`,
    xbShareTitle: "Ijanisha ry'ubwishyu mpuzamahanga",
    allDomesticTitle: "Ibikorwa byose ni iby'imbere mu gihugu",
    xbShareBody: (share: string, topCorridor?: { from: string; to: string; vol: string }) =>
      `${share} by'ubwishyu bwarangiye byambukiranyije ifaranga${topCorridor ? `, biyobowe na ${topCorridor.from} → ${topCorridor.to} (${topCorridor.vol})` : ""}.`,
    allDomesticBody: "Nta bwishyu bwarangiye bwambukiranyije ifaranga muri iki gihe.",
    typicalSizeTitle: "Ingano rusange y'ubwishyu",
    typicalSizeBody: (avg: string, max: string) =>
      `Impuzandengo y'ubwishyu bwarangiye ni ${avg}; ubwinshi kurusha ubundi bwari ${max}.`,
    busiestTitle: "Igihe cyakozwemo cyane",
    busiestBody: (slot: string) => `Ibikorwa byinshi bikorwa ku wa ${slot} UTC.`,
  },
} as const;

/**
 * Plain-language observations derived deterministically from a report. Each statement quotes the
 * figures it is based on, so a reader can verify it against the charts.
 */
export function buildInsights(r: AnalyticsReport, lang: Lang = "en"): Insight[] {
  const c = pickLang(lang, COPY);
  const t = r.totals;
  const out: Insight[] = [];
  if (t.payments === 0) {
    return [
      {
        title: c.noPaymentsTitle,
        body: c.noPaymentsBody,
        tone: "info",
      },
    ];
  }

  // Momentum: second half of the period vs the first half.
  const half = Math.floor(r.daily.length / 2);
  const sum = (days: typeof r.daily) => days.reduce((s, d) => s + d.out_usd + d.in_usd, 0);
  const first = sum(r.daily.slice(0, half));
  const second = sum(r.daily.slice(half));
  if (first > 0 && second > 0) {
    const change = (second - first) / first;
    out.push({
      title: change >= 0 ? c.volGrowing : c.volSlowing,
      body: c.volBody(usd(second), usd(first), change >= 0 ? "+" : "", Math.round(change * 100)),
      tone: change < -0.25 ? "watch" : "info",
    });
  }

  const finished = t.succeeded + t.failed + t.reversed;
  if (finished >= 5) {
    const bad = t.failed + t.reversed;
    out.push({
      title: t.success_rate >= 0.9 ? c.relGood : c.relWatch,
      body: c.relBody(t.succeeded, finished, pct(t.success_rate), bad),
      tone: t.success_rate >= 0.9 ? "info" : "watch",
    });
  }

  const top = r.counterparties?.[0];
  if (top && t.volume_usd > 0) {
    const share = top.volume_usd / t.volume_usd;
    if (share >= 0.5) {
      out.push({
        title: c.concTitle,
        body: c.concBody(top.name, pct(share)),
        tone: "watch",
      });
    }
  }

  if (t.succeeded > 0) {
    const share = t.cross_currency_payments / t.succeeded;
    out.push({
      title: share > 0 ? c.xbShareTitle : c.allDomesticTitle,
      body:
        share > 0
          ? c.xbShareBody(
              pct(share),
              r.corridors[0]
                ? {
                    from: r.corridors[0].from,
                    to: r.corridors[0].to,
                    vol: usd(r.corridors[0].volume_usd),
                  }
                : undefined,
            )
          : c.allDomesticBody,
      tone: "info",
    });
    out.push({
      title: c.typicalSizeTitle,
      body: c.typicalSizeBody(usd(t.avg_payment_usd), usd(t.largest_payment_usd)),
      tone: "info",
    });
  }

  const slot = busiestForLang(r.heatmap, lang);
  if (slot !== "—")
    out.push({
      title: c.busiestTitle,
      body: c.busiestBody(slot),
      tone: "info",
    });
  return out;
}
