import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLangCopy } from "@/lib/i18n";

const CHART_COPY = {
  en: {
    flowAria: (cur: string) => `Money in and out by week, in ${cur}`,
    flowCaption: (cur: string) => `Money in and out by week (${cur})`,
    moneyIn: "Money in",
    moneyOut: "Money out",
    week: "Week",
    inCol: "In",
    outCol: "Out",
    stateAria: "Escrow value by state",
    tokenUnits: "Token units",
    stateCol: "State",
    amountCol: "Amount",
    other: "Other",
    noDataPeriod: "No data in this period.",
    rangeCol: "Range",
    dateCol: "Date",
    potential: "Potential",
    current: "Current",
    factorCol: "Factor",
  },
  fr: {
    flowAria: (cur: string) => `Entrées et sorties par semaine, en ${cur}`,
    flowCaption: (cur: string) => `Entrées et sorties par semaine (${cur})`,
    moneyIn: "Entrées",
    moneyOut: "Sorties",
    week: "Semaine",
    inCol: "Entrées",
    outCol: "Sorties",
    stateAria: "Valeur sous séquestre par état",
    tokenUnits: "Unités de jeton",
    stateCol: "État",
    amountCol: "Montant",
    other: "Autre",
    noDataPeriod: "Aucune donnée sur cette période.",
    rangeCol: "Plage",
    dateCol: "Date",
    potential: "Potentiel",
    current: "Actuel",
    factorCol: "Facteur",
  },
  sw: {
    flowAria: (cur: string) => `Pesa zinazoingia na kutoka kwa wiki, katika ${cur}`,
    flowCaption: (cur: string) => `Pesa zinazoingia na kutoka kwa wiki (${cur})`,
    moneyIn: "Pesa zinazoingia",
    moneyOut: "Pesa zinazotoka",
    week: "Wiki",
    inCol: "Zinazoingia",
    outCol: "Zinazotoka",
    stateAria: "Thamani ya escrow kulingana na hali",
    tokenUnits: "Vitengo vya tokeni",
    stateCol: "Hali",
    amountCol: "Kiasi",
    other: "Nyingine",
    noDataPeriod: "Hakuna data katika kipindi hiki.",
    rangeCol: "Kiwango",
    dateCol: "Tarehe",
    potential: "Uwezo",
    current: "Sasa",
    factorCol: "Sababu",
  },
  pt: {
    flowAria: (cur: string) => `Entradas e saídas por semana, em ${cur}`,
    flowCaption: (cur: string) => `Entradas e saídas por semana (${cur})`,
    moneyIn: "Entradas",
    moneyOut: "Saídas",
    week: "Semana",
    inCol: "Entrada",
    outCol: "Saída",
    stateAria: "Valor em caução por estado",
    tokenUnits: "Unidades de token",
    stateCol: "Estado",
    amountCol: "Montante",
    other: "Outro",
    noDataPeriod: "Sem dados neste período.",
    rangeCol: "Intervalo",
    dateCol: "Data",
    potential: "Potencial",
    current: "Atual",
    factorCol: "Fator",
  },
  rw: {
    flowAria: (cur: string) => `Amafaranga yinjira n'asohoka buri cyumweru, mu ${cur}`,
    flowCaption: (cur: string) => `Amafaranga yinjira n'asohoka buri cyumweru (${cur})`,
    moneyIn: "Ayinjira",
    moneyOut: "Asohoka",
    week: "Icyumweru",
    inCol: "Ayinjira",
    outCol: "Asohoka",
    stateAria: "Agaciro ka escrow ukurikije imiterere",
    tokenUnits: "Ingano ya tokeni",
    stateCol: "Imiterere",
    amountCol: "Umubare",
    other: "Ibindi",
    noDataPeriod: "Nta makuru aboneka muri iki gihe.",
    rangeCol: "Urwego",
    dateCol: "Itariki",
    potential: "Igishoboka",
    current: "Ubu",
    factorCol: "Ingingo",
  },
} as const;

/**
 * Monochrome charts (frontend_color_guidelines.md: no hue). Series are told apart by tone AND by
 * position/legend, never by colour alone. Each chart ships an sr-only table so the data is
 * available to assistive technology. This module is lazy-loaded (recharts is heavy).
 */
interface FlowPoint {
  label: string;
  in: number;
  out: number;
}

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" } as const;

function tooltipStyle() {
  return {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    boxShadow: "0 16px 36px -12px rgba(0, 0, 0, 0.18)",
    color: "var(--color-foreground)",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    padding: "8px 12px",
  };
}

export function FlowChart({ data, currencyLabel }: { data: FlowPoint[]; currencyLabel: string }) {
  const copy = useLangCopy(CHART_COPY);
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={copy.flowAria(currencyLabel)}
        className="h-60 w-full"
      >
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer={false}
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={4}
            >
              <defs>
                <linearGradient id="vukaFlowIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8fd100" />
                  <stop offset="100%" stopColor="#5e8c00" />
                </linearGradient>
                <linearGradient id="vukaFlowOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.92} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.65} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => v.toLocaleString("en-US", { notation: "compact" })}
              />
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "var(--color-accent)", opacity: 0.45 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 8 }} />
              <Bar dataKey="in" name={copy.moneyIn} fill="url(#vukaFlowIn)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="out" name={copy.moneyOut} fill="url(#vukaFlowOut)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{copy.flowCaption(currencyLabel)}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.week}</th>
              <th scope="col">{copy.inCol}</th>
              <th scope="col">{copy.outCol}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{d.in}</td>
                <td>{d.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

interface StatePoint {
  state: string;
  amount: number;
}

export function StateChart({ data }: { data: StatePoint[] }) {
  const copy = useLangCopy(CHART_COPY);
  return (
    <figure className="m-0">
      <div role="img" aria-label={copy.stateAria} className="h-56 w-full">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer={false}
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                tickFormatter={(v: number) => v.toLocaleString("en-US", { notation: "compact" })}
              />
              <YAxis
                type="category"
                dataKey="state"
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={84}
              />
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "var(--color-accent)" }} />
              <Bar dataKey="amount" name={copy.tokenUnits} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{copy.stateAria}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.stateCol}</th>
              <th scope="col">{copy.amountCol}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.state}>
                <th scope="row">{d.state}</th>
                <td>{d.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ---- Donut ---------------------------------------------------------------------------------------
export interface DonutDatum {
  label: string;
  value: number;
}

const TONES = [
  "#79b200",
  "var(--chart-1)",
  "#a8e024",
  "var(--chart-2)",
  "var(--chart-4)",
];

/** Groups everything past the 4th slice into "Other" so five tones stay distinguishable. */
function topSlices(data: DonutDatum[], otherLabel = "Other"): DonutDatum[] {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= 5) return sorted;
  const rest = sorted.slice(4).reduce((s, d) => s + d.value, 0);
  return [...sorted.slice(0, 4), { label: otherLabel, value: rest }];
}

export function DonutChart({
  data,
  ariaLabel,
  center,
  format,
}: {
  data: DonutDatum[];
  ariaLabel: string;
  center: { value: string; label: string };
  format: (v: number) => string;
}) {
  const copy = useLangCopy(CHART_COPY);
  const slices = topSlices(data, copy.other);
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-muted-foreground">{copy.noDataPeriod}</p>;
  return (
    <figure className="m-0 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <div role="img" aria-label={ariaLabel} className="relative mx-auto h-44 w-44">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Pie
                rootTabIndex={-1}
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="94%"
                paddingAngle={1}
                stroke="var(--color-background)"
                strokeWidth={2}
                isAnimationActive={true} animationDuration={700}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={TONES[i % TONES.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => format(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tabular font-mono text-lg leading-none">{center.value}</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            {center.label}
          </span>
        </div>
      </div>
      <figcaption>
        <ul className="space-y-1.5 text-sm">
          {slices.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-3 shrink-0 border border-foreground"
                style={{ background: TONES[i % TONES.length] }}
              />
              <span className="min-w-0 flex-1 truncate">{d.label}</span>
              <span className="tabular font-mono text-xs">{format(d.value)}</span>
              <span className="tabular w-10 text-right font-mono text-[11px] text-muted-foreground">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

// ---- Histogram ---------------------------------------------------------------------------------
export function HistogramChart({
  data,
  ariaLabel,
  unit = "payments",
}: {
  data: { label: string; count: number }[];
  ariaLabel: string;
  unit?: string;
}) {
  const copy = useLangCopy(CHART_COPY);
  return (
    <figure className="m-0">
      <div role="img" aria-label={ariaLabel} className="h-56 w-full">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer={false}
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap={2}
            >
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                interval={0}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "var(--color-accent)", opacity: 0.4 }} />
              <Bar
                dataKey="count"
                name={unit}
                fill="#79b200"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.rangeCol}</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ---- Trend (area) ------------------------------------------------------------------------------
export interface TrendPoint {
  label: string;
  a: number;
  b?: number;
}

export function TrendChart({
  data,
  ariaLabel,
  aName,
  bName,
  format,
}: {
  data: TrendPoint[];
  ariaLabel: string;
  aName: string;
  bName?: string;
  format: (v: number) => string;
}) {
  const copy = useLangCopy(CHART_COPY);
  return (
    <figure className="m-0">
      <div role="img" aria-label={ariaLabel} className="h-64 w-full">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer={false}
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="vukaAreaA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#79b200" stopOpacity={0.42} />
                  <stop offset="65%" stopColor="#c2f74d" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#c2f74d" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="vukaAreaB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                minTickGap={24}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={54}
                tickFormatter={(v: number) => v.toLocaleString("en-US", { notation: "compact" })}
              />
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => format(v)} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="a"
                name={aName}
                stroke="#79b200"
                strokeWidth={2.4}
                fill="url(#vukaAreaA)"
                fillOpacity={1}
                isAnimationActive={true}
                animationDuration={700}
              />
              {bName ? (
                <Area
                  type="monotone"
                  dataKey="b"
                  name={bName}
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="url(#vukaAreaB)"
                  fillOpacity={1}
                  isAnimationActive={true}
                  animationDuration={700}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.dateCol}</th>
              <th scope="col">{aName}</th>
              {bName ? <th scope="col">{bName}</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{d.a}</td>
                {bName ? <td>{d.b ?? 0}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ---- Radar ---------------------------------------------------------------------------------------
export function RadarView({
  data,
  ariaLabel,
}: {
  data: { axis: string; value: number; potential: number }[];
  ariaLabel: string;
}) {
  const copy = useLangCopy(CHART_COPY);
  return (
    <figure className="m-0">
      <div role="img" aria-label={ariaLabel} className="h-72 w-full">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart accessibilityLayer={false} data={data} outerRadius="72%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={copy.potential}
                dataKey="potential"
                stroke="var(--chart-3)"
                strokeDasharray="4 3"
                fill="var(--chart-3)"
                fillOpacity={0.08}
                isAnimationActive={true} animationDuration={700}
              />
              <Radar
                name={copy.current}
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.25}
                isAnimationActive={true} animationDuration={700}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle()} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.factorCol}</th>
              <th scope="col">{copy.current}</th>
              <th scope="col">{copy.potential}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.axis}>
                <th scope="row">{d.axis}</th>
                <td>{Math.round(d.value)}</td>
                <td>{Math.round(d.potential)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
