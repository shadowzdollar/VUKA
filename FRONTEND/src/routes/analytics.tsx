import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  InsightList,
  PeriodPicker,
  usd0,
  usdCompact,
  type Period,
} from "@/components/vuka/analytics-parts";
import { LazyDonutChart, LazyHistogramChart, LazyTrendChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import {
  ActivityHeatmap,
  FlowMatrix,
  Funnel,
  Gauge,
  RankedBars,
  Sparkline,
} from "@/components/vuka/viz/simple";
import { operator, platform } from "@/lib/api/endpoints";
import type { AnalyticsReport } from "@/lib/api/types";
import { useLangCopy, type Lang } from "@/lib/i18n";
import { buildInsights } from "@/lib/insights";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — VUKA" },
      {
        name: "description",
        content:
          "Volume trends, corridor flows, payment-size distribution, reliability and activity patterns.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <ByRole />
    </Shell>
  ),
});

const COPY: Record<
  Lang,
  {
    traderEyebrow: string;
    traderTitle: string;
    traderDesc: string;
    operatorEyebrow: string;
    operatorTitle: string;
    operatorDesc: string;
    metricSent: string;
    metricReceived: string;
    metricAvgPayment: string;
    metricCrossBorder: string;
    crossBorderSub: string;
    whatNumbersSay: string;
    observationsCount: (n: number) => string;
    moneyInAndOut: string;
    moneyOut: string;
    moneyIn: string;
    settlementReliability: string;
    successRate: string;
    reliabilitySub: (s: number, f: number, r: number) => string;
    whereMoneyMoves: string;
    paymentOutcomes: string;
    settled: string;
    payments: string;
    paymentSizeDist: string;
    paymentSizeNote: string;
    topCounterparties: string;
    counterpartyPayments: (c: number) => string;
    corridorFlows: string;
    whenActive: string;
    settledVolume: string;
    activeTraders: string;
    tradersSub: (nw: number, tot: number) => string;
    cashIn: string;
    cashInSub: string;
    settledVolumePerDay: string;
    volumeByCurrency: string;
    corridorFlowMatrix: string;
    verificationFunnel: string;
    allTraders: string;
    verifiedOrAbove: string;
    businessVerified: string;
    tradersLabel: string;
    railReliability: string;
    noProviderExec: string;
    providerCallsNote: (ok: number, f: number, tot: number) => string;
    crossBorderWorkflows: string;
    noWorkflows: string;
    supportLoad: string;
    tickets: string;
    settlementCommands: string;
    commands: string;
    networkActivity: string;
    basisText: (basis: string, days: number, gen: string) => string;
    paymentsCount: (n: number) => string;
    largestSub: (v: string) => string;
  }
> = {
  en: {
    traderEyebrow: "Enterprise Treasury Insights",
    traderTitle: "Your Trade, in Numbers",
    traderDesc:
      "How money moves through your business: corridor velocity, currency settlement mix, counterparty concentration, and operational reliability computed directly from your double-entry ledger.",
    operatorEyebrow: "Network Intelligence · Oversight",
    operatorTitle: "Platform Settlement Analytics",
    operatorDesc:
      "Throughput, cross-border corridor flow matrices, payment size distributions, KYC verification conversion, and African mobile-money rail reliability across the entire VUKA network.",
    metricSent: "Sent",
    metricReceived: "Received",
    metricAvgPayment: "Average payment",
    metricCrossBorder: "Cross-border",
    crossBorderSub: "Settled payments across currencies",
    whatNumbersSay: "What the numbers say",
    observationsCount: (n) => `${n} observations`,
    moneyInAndOut: "Money in and out per day",
    moneyOut: "Money out",
    moneyIn: "Money in",
    settlementReliability: "Settlement reliability",
    successRate: "Success rate",
    reliabilitySub: (s, f, r) => `${s} settled · ${f} failed · ${r} reversed`,
    whereMoneyMoves: "Where your money moves",
    paymentOutcomes: "Payment outcomes",
    settled: "settled",
    payments: "payments",
    paymentSizeDist: "Payment size distribution",
    paymentSizeNote: "Each bar counts settled payments whose USD value falls in the range.",
    topCounterparties: "Top counterparties",
    counterpartyPayments: (c) => `${c} payment${c === 1 ? "" : "s"}`,
    corridorFlows: "Corridor flows",
    whenActive: "When you are active",
    settledVolume: "Settled volume",
    activeTraders: "Active traders",
    tradersSub: (nw, tot) => `${nw} new · ${tot} total`,
    cashIn: "Cash-in",
    cashInSub: "Wallet top-ups settled",
    settledVolumePerDay: "Settled volume per day",
    volumeByCurrency: "Volume by currency",
    corridorFlowMatrix: "Corridor flow matrix",
    verificationFunnel: "Verification funnel",
    allTraders: "All traders",
    verifiedOrAbove: "Verified or above",
    businessVerified: "Business verified",
    tradersLabel: "traders",
    railReliability: "Rail reliability",
    noProviderExec: "No provider executions in this period.",
    providerCallsNote: (ok, f, tot) => `${ok} ok · ${f} failed · ${tot} calls`,
    crossBorderWorkflows: "Cross-border workflows",
    noWorkflows: "No workflows in this period.",
    supportLoad: "Support load",
    tickets: "tickets",
    settlementCommands: "Settlement commands",
    commands: "commands",
    networkActivity: "Network activity by weekday and hour",
    basisText: (b, d, g) =>
      `Figures are USD-equivalent at the platform's ${b} reference rates, over the last ${d} days, counting settled payments between traders. Generated ${g}.`,
    paymentsCount: (n) => `${n} payments`,
    largestSub: (v) => `Largest ${v}`,
  },
  fr: {
    traderEyebrow: "Perspectives Trésorerie Entreprise",
    traderTitle: "Votre Commerce en Chiffres",
    traderDesc:
      "Comment l'argent circule dans votre activité : vélocité des corridors, devises de règlement, concentration des contreparties et fiabilité opérationnelle calculée depuis votre grand livre.",
    operatorEyebrow: "Intelligence Réseau · Supervision",
    operatorTitle: "Analytique des Règlements Plateforme",
    operatorDesc:
      "Débit, matrices des corridors transfrontaliers, distribution des montants, conversion KYC et fiabilité des rails de mobile-money à travers tout le réseau VUKA.",
    metricSent: "Envoyé",
    metricReceived: "Reçu",
    metricAvgPayment: "Paiement moyen",
    metricCrossBorder: "Transfrontalier",
    crossBorderSub: "Paiements réglés entre devises",
    whatNumbersSay: "Ce que disent les chiffres",
    observationsCount: (n) => `${n} observations`,
    moneyInAndOut: "Entrées et sorties d'argent par jour",
    moneyOut: "Sorties",
    moneyIn: "Entrées",
    settlementReliability: "Fiabilité des règlements",
    successRate: "Taux de réussite",
    reliabilitySub: (s, f, r) => `${s} réglés · ${f} échoués · ${r} contrepassés`,
    whereMoneyMoves: "Répartition des flux",
    paymentOutcomes: "Résultats des paiements",
    settled: "réglé",
    payments: "paiements",
    paymentSizeDist: "Distribution par montant",
    paymentSizeNote: "Chaque barre compte les paiements réglés dont la valeur USD est dans l'intervalle.",
    topCounterparties: "Principales contreparties",
    counterpartyPayments: (c) => `${c} paiement${c > 1 ? "s" : ""}`,
    corridorFlows: "Flux des corridors",
    whenActive: "Périodes d'activité",
    settledVolume: "Volume réglé",
    activeTraders: "Commerçants actifs",
    tradersSub: (nw, tot) => `${nw} nouveaux · ${tot} total`,
    cashIn: "Dépôts",
    cashInSub: "Recharges de portefeuille réglées",
    settledVolumePerDay: "Volume réglé par jour",
    volumeByCurrency: "Volume par devise",
    corridorFlowMatrix: "Matrice des corridors",
    verificationFunnel: "Entonnoir de vérification",
    allTraders: "Tous les commerçants",
    verifiedOrAbove: "Vérifiés ou supérieur",
    businessVerified: "Entreprise vérifiée",
    tradersLabel: "commerçants",
    railReliability: "Fiabilité des opérateurs",
    noProviderExec: "Aucune exécution opérateur sur cette période.",
    providerCallsNote: (ok, f, tot) => `${ok} réussis · ${f} échoués · ${tot} appels`,
    crossBorderWorkflows: "Workflows transfrontaliers",
    noWorkflows: "Aucun workflow sur cette période.",
    supportLoad: "Charge d'assistance",
    tickets: "tickets",
    settlementCommands: "Ordres de règlement",
    commands: "ordres",
    networkActivity: "Activité réseau par jour et heure",
    basisText: (b, d, g) =>
      `Montants équivalents USD aux taux de référence ${b}, sur les ${d} derniers jours, comptabilisant les règlements entre commerçants. Généré le ${g}.`,
    paymentsCount: (n) => `${n} paiements`,
    largestSub: (v) => `Plus élevé ${v}`,
  },
  sw: {
    traderEyebrow: "Maarifa ya Hazina ya Biashara",
    traderTitle: "Biashara Yako kwa Nambari",
    traderDesc:
      "Jinsi pesa zinavyotembea kupitia biashara yako: kasi ya njia za malipo, mchanganyiko wa sarafu, mikusanyiko ya washirika, na uaminifu unaokokotolewa moja kwa moja kutoka kwenye leja.",
    operatorEyebrow: "Uchambuzi wa Mtandao · Usimamizi",
    operatorTitle: "Uchambuzi wa Malipo ya Mfumo",
    operatorDesc:
      "Upatikanaji, mifumo ya mtiririko wa njia za mpakani, mgawanyo wa malipo, uhakiki wa KYC, na uaminifu wa huduma za pesa kwa simu kwenye mtandao wote wa VUKA.",
    metricSent: "Zilizotumwa",
    metricReceived: "Zilizopokelewa",
    metricAvgPayment: "Wastani wa malipo",
    metricCrossBorder: "Kuvuka mipaka",
    crossBorderSub: "Malipo yaliyokamilika ya sarafu tofauti",
    whatNumbersSay: "Nambari zinachosema",
    observationsCount: (n) => `Uchunguzi ${n}`,
    moneyInAndOut: "Pesa zinazoingia na kutoka kwa siku",
    moneyOut: "Pesa zilizotoka",
    moneyIn: "Pesa zilizoingia",
    settlementReliability: "Uaminifu wa ulipaji",
    successRate: "Kiwango cha mafanikio",
    reliabilitySub: (s, f, r) => `${s} zimekamilika · ${f} zimeshindwa · ${r} zimerudishwa`,
    whereMoneyMoves: "Pesa zako zinakokwenda",
    paymentOutcomes: "Matokeo ya malipo",
    settled: "zimelipwa",
    payments: "malipo",
    paymentSizeDist: "Mgawanyo wa ukubwa wa malipo",
    paymentSizeNote: "Kila upau huhesabu malipo yaliyokamilika ambayo thamani yake ya USD iko katika kiwango hicho.",
    topCounterparties: "Washirika wakuu",
    counterpartyPayments: (c) => `Malipo ${c}`,
    corridorFlows: "Mtiririko wa njia",
    whenActive: "Wakati unapofanya kazi",
    settledVolume: "Kiasi kilicholipwa",
    activeTraders: "Wafanyabiashara hai",
    tradersSub: (nw, tot) => `${nw} wapya · ${tot} jumla`,
    cashIn: "Kuweka pesa",
    cashInSub: "Ujazaji wa pochi uliokamilika",
    settledVolumePerDay: "Kiasi kilicholipwa kwa siku",
    volumeByCurrency: "Kiasi kwa sarafu",
    corridorFlowMatrix: "Mtiririko wa njia zote",
    verificationFunnel: "Mchakato wa uthibitisho",
    allTraders: "Wafanyabiashara wote",
    verifiedOrAbove: "Waliothibitishwa au zaidi",
    businessVerified: "Biashara imethibitishwa",
    tradersLabel: "wafanyabiashara",
    railReliability: "Uaminifu wa mitandao",
    noProviderExec: "Hakuna utekelezaji wa watoa huduma katika kipindi hiki.",
    providerCallsNote: (ok, f, tot) => `${ok} sawa · ${f} zimeshindwa · ${tot} simu`,
    crossBorderWorkflows: "Mifumo ya kuvuka mpaka",
    noWorkflows: "Hakuna mifumo katika kipindi hiki.",
    supportLoad: "Kazi ya usaidizi",
    tickets: "tiketi",
    settlementCommands: "Amri za ulipaji",
    commands: "amri",
    networkActivity: "Shughuli za mtandao kwa siku na saa",
    basisText: (b, d, g) =>
      `Takwimu ni sawa na USD kwa viwango vya ${b}, katika siku ${d} zilizopita, zikihesabu malipo yaliyokamilika kati ya wafanyabiashara. Imetolewa ${g}.`,
    paymentsCount: (n) => `Malipo ${n}`,
    largestSub: (v) => `Kubwa zaidi ${v}`,
  },
  pt: {
    traderEyebrow: "Perspetivas de Tesouraria Empresarial",
    traderTitle: "O Seu Negócio em Números",
    traderDesc:
      "Como o dinheiro se move na sua empresa: velocidade dos corredores, combinação de liquidação cambial, concentração de contrapartes e fiabilidade operacional calculada pelo razão.",
    operatorEyebrow: "Inteligência de Rede · Supervisão",
    operatorTitle: "Analítica de Liquidação da Plataforma",
    operatorDesc:
      "Taxa de transferência, matrizes de fluxo de corredores transfronteiriços, distribuição de pagamentos, conversão de verificação KYC e fiabilidade de mobile money na rede VUKA.",
    metricSent: "Enviado",
    metricReceived: "Recebido",
    metricAvgPayment: "Pagamento médio",
    metricCrossBorder: "Transfronteiriço",
    crossBorderSub: "Pagamentos liquidados entre moedas",
    whatNumbersSay: "O que os números revelam",
    observationsCount: (n) => `${n} observações`,
    moneyInAndOut: "Entradas e saídas de dinheiro por dia",
    moneyOut: "Saída de fundos",
    moneyIn: "Entrada de fundos",
    settlementReliability: "Fiabilidade de liquidação",
    successRate: "Taxa de sucesso",
    reliabilitySub: (s, f, r) => `${s} liquidados · ${f} falhados · ${r} revertidos`,
    whereMoneyMoves: "Para onde o dinheiro se move",
    paymentOutcomes: "Resultados dos pagamentos",
    settled: "liquidado",
    payments: "pagamentos",
    paymentSizeDist: "Distribuição por montante",
    paymentSizeNote: "Cada barra conta os pagamentos liquidados cujo valor em USD recai no intervalo.",
    topCounterparties: "Principais contrapartes",
    counterpartyPayments: (c) => `${c} pagamento${c > 1 ? "s" : ""}`,
    corridorFlows: "Fluxos de corredores",
    whenActive: "Quando está ativo",
    settledVolume: "Volume liquidado",
    activeTraders: "Comerciantes ativos",
    tradersSub: (nw, tot) => `${nw} novos · ${tot} total`,
    cashIn: "Depósitos",
    cashInSub: "Carregamentos de carteira liquidados",
    settledVolumePerDay: "Volume liquidado por dia",
    volumeByCurrency: "Volume por moeda",
    corridorFlowMatrix: "Matriz de fluxo de corredores",
    verificationFunnel: "Funil de verificação",
    allTraders: "Todos os comerciantes",
    verifiedOrAbove: "Verificados ou superior",
    businessVerified: "Empresa verificada",
    tradersLabel: "comerciantes",
    railReliability: "Fiabilidade dos operadores",
    noProviderExec: "Sem execuções de operadores neste período.",
    providerCallsNote: (ok, f, tot) => `${ok} ok · ${f} falhados · ${tot} chamadas`,
    crossBorderWorkflows: "Fluxos de trabalho transfronteiriços",
    noWorkflows: "Sem fluxos de trabalho neste período.",
    supportLoad: "Volume de suporte",
    tickets: "pedidos",
    settlementCommands: "Ordens de liquidação",
    commands: "ordens",
    networkActivity: "Atividade de rede por dia e hora",
    basisText: (b, d, g) =>
      `Valores equivalentes a USD às taxas de referência ${b}, nos últimos ${d} dias, contabilizando pagamentos liquidados entre comerciantes. Gerado a ${g}.`,
    paymentsCount: (n) => `${n} pagamentos`,
    largestSub: (v) => `Maior ${v}`,
  },
  rw: {
    traderEyebrow: "Ubusesenguzi bw'Umutungo w'Ubucuruzi",
    traderTitle: "Ubucuruzi Bwawe mu Mibare",
    traderDesc:
      "Uko amafaranga agenda mu bucuruzi bwawe: umuvuduko mu mayira y'imipaka, ihererekanya ry'ifaranga, abafatanyabikorwa, n'ubwizerane bibarirwa mu bitabo by'icungamutungo.",
    operatorEyebrow: "Ubumenyi bw'Urusobe · Igenzura",
    operatorTitle: "Ubusesenguzi bw'Ihererekanya kuri Sisitemu",
    operatorDesc:
      "Ingano y'ibikorerwa, imbonerahamwe y'imigendere y'amafaranga ku mipaka, ibyiciro by'amafaranga, ihamywa rya KYC, n'ubwizerane bwa mobile-money muri VUKA.",
    metricSent: "Yishyuwe",
    metricReceived: "Yakiriwe",
    metricAvgPayment: "Impuzandengo yo kwishyura",
    metricCrossBorder: "Hambuka y'umupaka",
    crossBorderSub: "Kwishyura kwarangiye hagati y'amanyamahanga",
    whatNumbersSay: "Icyo imibare ivuga",
    observationsCount: (n) => `Ibyagaragaye ${n}`,
    moneyInAndOut: "Amafaranga yinjiye n'ayasohotse ku munsi",
    moneyOut: "Ayasohotse",
    moneyIn: "Ayinjiye",
    settlementReliability: "Ubwizerane bw'ishyura",
    successRate: "Ijanisha ry'ibyagenze neza",
    reliabilitySub: (s, f, r) => `${s} byarangiye · ${f} byanze · ${r} byasubijwe inyuma`,
    whereMoneyMoves: "Aho amafaranga yawe yerekeza",
    paymentOutcomes: "Ibisubizo by'ihererekanya",
    settled: "byarangiye",
    payments: "ubwishyu",
    paymentSizeDist: "Ingano y'ubwishyu",
    paymentSizeNote: "Buri murongo ugaragaza ubwishyu bwarangiye bufite agaciro ka USD muri icyo cyiciro.",
    topCounterparties: "Abafatanyabikorwa b'ingenzi",
    counterpartyPayments: (c) => `Ubwishyu ${c}`,
    corridorFlows: "Amayira y'amafaranga",
    whenActive: "Igihe ukorera",
    settledVolume: "Amafaranga yose yishyuwe",
    activeTraders: "Abacuruzi bakora",
    tradersSub: (nw, tot) => `${nw} bashya · ${tot} bose hamwe`,
    cashIn: "Kuzana amafaranga",
    cashInSub: "Gushyira amafaranga kuri konti byarangiye",
    settledVolumePerDay: "Amafaranga yishyuwe ku munsi",
    volumeByCurrency: "Ingano ku ifaranga",
    corridorFlowMatrix: "Imbonerahamwe y'amayira yose",
    verificationFunnel: "Intambwe zo kwemeza umwirondoro",
    allTraders: "Abacuruzi bose",
    verifiedOrAbove: "Bemejwe cyangwa hejuru",
    businessVerified: "Ubucuruzi bwemejwe",
    tradersLabel: "abacuruzi",
    railReliability: "Ubwizerane bw'imiyoboro",
    noProviderExec: "Nta gikorwa cy'imiyoboro cyabayeho muri iki gihe.",
    providerCallsNote: (ok, f, tot) => `${ok} byakunze · ${f} byanze · ${tot} byose hamwe`,
    crossBorderWorkflows: "Inzira zo kwishyura ku mipaka",
    noWorkflows: "Nta nzira zishyuwe muri iki gihe.",
    supportLoad: "Ibikorwa by'ubufasha",
    tickets: "amatike",
    settlementCommands: "Amabwiriza yo kwishyura",
    commands: "amabwiriza",
    networkActivity: "Ibikorwa by'urusobe ku munsi n'isaha",
    basisText: (b, d, g) =>
      `Imibare ingana na USD hakurikijwe ibipimo bya ${b}, mu minsi ${d} ishize, ibarura ubwishyu bwarangiye hagati y'abacuruzi. Byakozwe kuwa ${g}.`,
    paymentsCount: (n) => `Ubwishyu ${n}`,
    largestSub: (v) => `Kinini ${v}`,
  },
};

function ByRole() {
  const { session } = useSession();
  return session.status === "operator" ? <Intelligence /> : <Insights />;
}

const monthDay = (iso: string) => iso.slice(5);

function Trend({ r, aName, bName }: { r: AnalyticsReport; aName: string; bName?: string }) {
  const data = r.daily.map((d) => ({
    label: monthDay(d.date),
    a: d.out_usd,
    ...(bName ? { b: d.in_usd } : {}),
  }));
  return (
    <LazyTrendChart
      data={data}
      aName={aName}
      {...(bName ? { bName } : {})}
      ariaLabel={`${aName}${bName ? ` and ${bName}` : ""} per day, USD equivalent`}
      format={usd0}
    />
  );
}

function Basis({ r }: { r: AnalyticsReport }) {
  const t = useLangCopy(COPY);
  return (
    <p className="text-[11px] text-muted-foreground">
      {t.basisText(r.rate_basis, r.period_days, new Date(r.generated_at).toLocaleString())}
    </p>
  );
}

// ------------------------------------------------------------------------------------------------
// Trader
// ------------------------------------------------------------------------------------------------
function Insights() {
  const t = useLangCopy(COPY);
  const [days, setDays] = useState<Period>(30);
  const q = useQuery({
    queryKey: ["analytics", "trader", days],
    queryFn: () => platform.analytics(days),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.traderEyebrow}
        title={t.traderTitle}
        description={t.traderDesc}
        actions={<PeriodPicker value={days} onChange={setDays} />}
      />
      <QueryBoundary query={q} disabledCodes={["analytics_unavailable"]}>
        {(r) => <TraderBody r={r} />}
      </QueryBoundary>
    </div>
  );
}

function TraderBody({ r }: { r: AnalyticsReport }) {
  const tr = useLangCopy(COPY);
  const t = r.totals;
  const insights = useMemo(() => buildInsights(r), [r]);
  const outSeries = r.daily.map((d) => d.out_usd);
  const inSeries = r.daily.map((d) => d.in_usd);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={tr.metricSent}
          value={usd0(t.sent_usd)}
          sub={tr.paymentsCount(t.payments_out)}
          trend={<Sparkline values={outSeries} />}
        />
        <Metric
          label={tr.metricReceived}
          value={usd0(t.received_usd)}
          sub={tr.paymentsCount(t.payments_in)}
          trend={<Sparkline values={inSeries} />}
        />
        <Metric
          label={tr.metricAvgPayment}
          value={usd0(t.avg_payment_usd)}
          sub={tr.largestSub(usd0(t.largest_payment_usd))}
        />
        <Metric
          label={tr.metricCrossBorder}
          value={t.cross_currency_payments}
          sub={tr.crossBorderSub}
        />
      </div>

      <Panel title={tr.whatNumbersSay} meta={<Chip>{tr.observationsCount(insights.length)}</Chip>}>
        <InsightList items={insights} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <Panel title={tr.moneyInAndOut}>
          <Trend r={r} aName={tr.moneyOut} bName={tr.moneyIn} />
        </Panel>
        <Panel title={tr.settlementReliability}>
          <Gauge
            value={t.success_rate}
            label={tr.successRate}
            sub={tr.reliabilitySub(t.succeeded, t.failed, t.reversed)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.whereMoneyMoves}>
          <LazyDonutChart
            data={r.currencies.map((c) => ({ label: c.label, value: c.value_usd }))}
            ariaLabel="Settled volume by currency"
            center={{ value: usdCompact(t.volume_usd), label: tr.settled }}
            format={usd0}
          />
        </Panel>
        <Panel title={tr.paymentOutcomes}>
          <LazyDonutChart
            data={r.statuses.map((s) => ({ label: s.label, value: s.count }))}
            ariaLabel="Payments by outcome"
            center={{ value: String(t.payments), label: tr.payments }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.paymentSizeDist}>
          <LazyHistogramChart
            data={r.histogram.map((b) => ({ label: b.label, count: b.count }))}
            ariaLabel="Settled payments by size, USD equivalent"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {tr.paymentSizeNote}
          </p>
        </Panel>
        <Panel title={tr.topCounterparties}>
          <RankedBars
            ariaLabel="Counterparties by settled volume"
            items={(r.counterparties ?? []).map((c) => ({
              label: c.name,
              value: c.volume_usd,
              display: usd0(c.volume_usd),
              note: tr.counterpartyPayments(c.count),
            }))}
          />
        </Panel>
      </div>

      <Panel title={tr.corridorFlows}>
        <FlowMatrix flows={r.corridors} format={usdCompact} />
      </Panel>

      <Panel title={tr.whenActive}>
        <ActivityHeatmap grid={r.heatmap} />
      </Panel>
      <Basis r={r} />
    </>
  );
}

// ------------------------------------------------------------------------------------------------
// Operator
// ------------------------------------------------------------------------------------------------
function Intelligence() {
  const t = useLangCopy(COPY);
  const [days, setDays] = useState<Period>(30);
  const q = useQuery({
    queryKey: ["analytics", "platform", days],
    queryFn: () => operator.analytics(days),
    staleTime: 60_000,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.operatorEyebrow}
        title={t.operatorTitle}
        description={t.operatorDesc}
        actions={<PeriodPicker value={days} onChange={setDays} />}
      />
      <QueryBoundary query={q} disabledCodes={["analytics_unavailable"]}>
        {(r) => <PlatformBody r={r} />}
      </QueryBoundary>
    </div>
  );
}

const KYC_LABEL: Record<string, string> = {
  PENDING: "Unverified",
  VERIFIED: "Verified",
  APPROVED: "Verified",
  BUSINESS_VERIFIED: "Business verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

function PlatformBody({ r }: { r: AnalyticsReport }) {
  const tr = useLangCopy(COPY);
  const t = r.totals;
  const insights = useMemo(() => buildInsights(r), [r]);
  const kyc = r.kyc ?? [];
  const count = (k: string) => kyc.find((x) => x.label === k)?.count ?? 0;
  const total = t.total_traders ?? 0;
  const verified = count("VERIFIED") + count("APPROVED") + count("BUSINESS_VERIFIED");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={tr.settledVolume}
          value={usd0(t.volume_usd)}
          sub={tr.paymentsCount(t.succeeded)}
          trend={<Sparkline values={r.daily.map((d) => d.out_usd)} />}
        />
        <Metric
          label={tr.successRate}
          value={`${Math.round(t.success_rate * 100)}%`}
          sub={tr.reliabilitySub(t.succeeded, t.failed, t.reversed)}
          trend={<Sparkline values={r.daily.map((d) => d.failed)} />}
        />
        <Metric
          label={tr.activeTraders}
          value={t.active_traders ?? 0}
          sub={tr.tradersSub(t.new_traders ?? 0, total)}
        />
        <Metric label={tr.cashIn} value={usd0(t.cash_in_usd)} sub={tr.cashInSub} />
      </div>

      <Panel title={tr.whatNumbersSay} meta={<Chip>{tr.observationsCount(insights.length)}</Chip>}>
        <InsightList items={insights} />
      </Panel>

      <Panel title={tr.settledVolumePerDay}>
        <Trend r={r} aName={tr.settledVolume} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.volumeByCurrency}>
          <LazyDonutChart
            data={r.currencies.map((c) => ({ label: c.label, value: c.value_usd }))}
            ariaLabel="Settled volume by currency"
            center={{ value: usdCompact(t.volume_usd), label: tr.settled }}
            format={usd0}
          />
        </Panel>
        <Panel title={tr.paymentOutcomes}>
          <LazyDonutChart
            data={r.statuses.map((s) => ({ label: s.label, value: s.count }))}
            ariaLabel="Payments by outcome"
            center={{ value: String(t.payments), label: tr.payments }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel title={tr.corridorFlowMatrix}>
        <FlowMatrix flows={r.corridors} format={usdCompact} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.paymentSizeDist}>
          <LazyHistogramChart
            data={r.histogram.map((b) => ({ label: b.label, count: b.count }))}
            ariaLabel="Settled payments by size, USD equivalent"
          />
        </Panel>
        <Panel title={tr.verificationFunnel}>
          <Funnel
            ariaLabel="Trader verification funnel"
            stages={[
              { label: tr.allTraders, count: total },
              { label: tr.verifiedOrAbove, count: verified },
              { label: tr.businessVerified, count: count("BUSINESS_VERIFIED") },
            ]}
          />
          <div className="mt-5">
            <LazyDonutChart
              data={kyc.map((k) => ({ label: KYC_LABEL[k.label] ?? k.label, value: k.count }))}
              ariaLabel="Traders by verification level"
              center={{ value: String(total), label: tr.tradersLabel }}
              format={(v) => String(v)}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.railReliability}>
          <RankedBars
            ariaLabel="Provider success rate"
            empty={tr.noProviderExec}
            items={(r.providers ?? []).map((p) => ({
              label: p.provider,
              value: p.success_rate * 100,
              display: `${Math.round(p.success_rate * 100)}%`,
              note: tr.providerCallsNote(p.succeeded, p.failed, p.total),
            }))}
          />
        </Panel>
        <Panel title={tr.crossBorderWorkflows}>
          <RankedBars
            ariaLabel="Workflows by state"
            empty={tr.noWorkflows}
            items={(r.workflows ?? []).map((w) => ({
              label: w.label.replaceAll("_", " "),
              value: w.count,
              display: String(w.count),
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title={tr.supportLoad}>
          <LazyDonutChart
            data={(r.tickets ?? []).map((k) => ({ label: k.label, value: k.count }))}
            ariaLabel="Support tickets by status"
            center={{
              value: String((r.tickets ?? []).reduce((s, k) => s + k.count, 0)),
              label: tr.tickets,
            }}
            format={(v) => String(v)}
          />
        </Panel>
        <Panel title={tr.settlementCommands}>
          <LazyDonutChart
            data={(r.settlements ?? []).map((k) => ({ label: k.label, value: k.count }))}
            ariaLabel="Settlement commands by status"
            center={{
              value: String((r.settlements ?? []).reduce((s, k) => s + k.count, 0)),
              label: tr.commands,
            }}
            format={(v) => String(v)}
          />
        </Panel>
      </div>

      <Panel title={tr.networkActivity}>
        <ActivityHeatmap grid={r.heatmap} />
      </Panel>
      <Basis r={r} />
    </>
  );
}
