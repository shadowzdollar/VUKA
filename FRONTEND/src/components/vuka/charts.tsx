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

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

function tooltipStyle() {
  return {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 0,
    color: "var(--color-foreground)",
    fontSize: 12,
  };
}

export function FlowChart({ data, currencyLabel }: { data: FlowPoint[]; currencyLabel: string }) {
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Money in and out by week, in ${currencyLabel}`}
        className="h-56 w-full"
      >
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer={false}
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
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
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "var(--color-accent)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="in" name="Money in" fill="var(--chart-1)" />
              <Bar dataKey="out" name="Money out" fill="var(--chart-4)" stroke="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>Money in and out by week ({currencyLabel})</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">In</th>
              <th scope="col">Out</th>
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
  return (
    <figure className="m-0">
      <div role="img" aria-label="Escrow value by state" className="h-56 w-full">
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
              <Bar dataKey="amount" name="Token units" fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>Escrow value by state</caption>
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Amount</th>
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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Groups everything past the 4th slice into "Other" so five tones stay distinguishable. */
function topSlices(data: DonutDatum[]): DonutDatum[] {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= 5) return sorted;
  const rest = sorted.slice(4).reduce((s, d) => s + d.value, 0);
  return [...sorted.slice(0, 4), { label: "Other", value: rest }];
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
  const slices = topSlices(data);
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-muted-foreground">No data in this period.</p>;
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
                isAnimationActive={false}
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
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
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
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "var(--color-accent)" }} />
              <Bar dataKey="count" name={unit} fill="var(--chart-1)" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Range</th>
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
  return (
    <figure className="m-0">
      <div role="img" aria-label={ariaLabel} className="h-64 w-full">
        <div aria-hidden="true" className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer={false}
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                minTickGap={28}
              />
              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v: number) => v.toLocaleString("en-US", { notation: "compact" })}
              />
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => format(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="a"
                name={aName}
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.14}
                isAnimationActive={false}
              />
              {bName ? (
                <Area
                  type="monotone"
                  dataKey="b"
                  name={bName}
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="var(--chart-3)"
                  fillOpacity={0.1}
                  isAnimationActive={false}
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
              <th scope="col">Date</th>
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
                name="Potential"
                dataKey="potential"
                stroke="var(--chart-3)"
                strokeDasharray="4 3"
                fill="var(--chart-3)"
                fillOpacity={0.08}
                isAnimationActive={false}
              />
              <Radar
                name="Current"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="var(--chart-1)"
                fillOpacity={0.25}
                isAnimationActive={false}
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
              <th scope="col">Factor</th>
              <th scope="col">Current</th>
              <th scope="col">Potential</th>
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
