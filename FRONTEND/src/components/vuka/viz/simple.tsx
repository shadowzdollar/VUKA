import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight (no chart library) visual primitives. All monochrome: value is encoded by length,
 * opacity or position, and every mark has a text equivalent, so nothing depends on colour.
 */

/** Inline trend line for KPI cards. Purely decorative: the number beside it carries the meaning. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const gradId = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1e-9);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = values.map(
    (v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`,
  );
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#79b200" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#c2f74d" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#79b200"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Semicircular gauge for a 0..1 ratio (success rate, limit usage). */
export function Gauge({ value, label, sub }: { value: number; label: string; sub?: ReactNode }) {
  const gradId = useId();
  const v = Math.max(0, Math.min(1, value));
  const r = 42;
  const c = Math.PI * r;
  return (
    <figure className="m-0 text-center" role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
      <svg viewBox="0 0 100 60" className="mx-auto w-full max-w-[210px]" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#79b200" />
            <stop offset="100%" stopColor="#c2f74d" />
          </linearGradient>
        </defs>
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${v * c} ${c}`}
        />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          className="fill-foreground font-mono text-[16px] font-bold"
        >
          {Math.round(v * 100)}%
        </text>
      </svg>
      <figcaption className="-mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </figcaption>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </figure>
  );
}

export interface RankedItem {
  label: string;
  value: number;
  display?: string;
  note?: string;
}

/** Ranked horizontal bars (top counterparties, provider reliability, workflow states...). */
export function RankedBars({
  items,
  ariaLabel,
  empty = "No data in this period.",
}: {
  items: RankedItem[];
  ariaLabel: string;
  empty?: string;
}) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1e-9);
  return (
    <ul className="space-y-3.5" aria-label={ariaLabel}>
      {items.map((i, idx) => (
        <li key={i.label} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 truncate font-medium">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] text-muted-foreground">
                {idx + 1}
              </span>
              <span className="truncate">{i.label}</span>
            </span>
            <span className="tabular shrink-0 font-mono text-xs font-semibold">
              {i.display ?? i.value}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(4, (i.value / max) * 100)}%`,
                background:
                  idx === 0
                    ? "linear-gradient(90deg, #79b200 0%, #b5ef3a 100%)"
                    : "var(--color-foreground)",
              }}
            />
          </div>
          {i.note ? <div className="mt-1 text-[11px] text-muted-foreground">{i.note}</div> : null}
        </li>
      ))}
    </ul>
  );
}

/** Stage funnel: each row's bar is relative to the first stage. */
export function Funnel({
  stages,
  ariaLabel,
}: {
  stages: { label: string; count: number }[];
  ariaLabel: string;
}) {
  const top = Math.max(stages[0]?.count ?? 0, 1);
  return (
    <ol className="space-y-2.5" aria-label={ariaLabel}>
      {stages.map((s, i) => {
        const pct = Math.round((s.count / top) * 100);
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">
              {s.label}
            </span>
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted" aria-hidden="true">
              <div
                className="flex h-full items-center justify-between rounded-lg px-2.5 font-mono text-[10px] font-semibold"
                style={{
                  width: `${Math.max((s.count / top) * 100, 10)}%`,
                  background: i === stages.length - 1 ? "#c2f74d" : "var(--color-foreground)",
                  color: i === stages.length - 1 ? "#141414" : "var(--color-background)",
                  opacity: i === stages.length - 1 ? 1 : 1 - i * 0.14,
                }}
              >
                <span>{s.count}</span>
                { pct < 100 ? <span className="opacity-75">{pct}%</span> : null }
              </div>
            </div>
            <span className="sr-only">{s.count}</span>
          </li>
        );
      })}
    </ol>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weekday x hour activity heatmap; opacity encodes volume and each cell has a text label. */
export function ActivityHeatmap({ grid }: { grid: number[][] }) {
  const id = useId();
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  if (total === 0)
    return <p className="text-xs text-muted-foreground">No activity in this period.</p>;
  return (
    <div>
      <div role="img" aria-labelledby={id} className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div
            className="ml-9 grid grid-cols-24 gap-px"
            style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
            aria-hidden="true"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center font-mono text-[9px] text-muted-foreground">
                {h % 3 === 0 ? h : ""}
              </span>
            ))}
          </div>
          {grid.map((row, d) => (
            <div key={DAYS[d]} className="mt-px flex items-center gap-1" aria-hidden="true">
              <span className="w-8 shrink-0 font-mono text-[10px] text-muted-foreground">
                {DAYS[d]}
              </span>
              <div
                className="grid flex-1 gap-px"
                style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              >
                {row.map((n, h) => (
                  <span
                    key={h}
                    title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 UTC — ${n} payment${n === 1 ? "" : "s"}`}
                    className="aspect-square border border-border/60 bg-foreground"
                    style={{ opacity: n === 0 ? 0.03 : 0.15 + (n / max) * 0.85 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p id={id} className="mt-2 text-[11px] text-muted-foreground">
        Payments by weekday and hour (UTC). Busiest slot: {busiest(grid)}.
      </p>
      <div className="sr-only">
        <table className="sr-only">
          <caption>Payments by weekday and hour (UTC)</caption>
          <thead>
            <tr>
              <th scope="col">Weekday</th>
              <th scope="col">Hours with activity</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={DAYS[d]}>
                <th scope="row">{DAYS[d]}</th>
                <td>
                  {row
                    .map((n, h) => (n ? `${h}:00 ×${n}` : null))
                    .filter(Boolean)
                    .join(", ") || "none"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function busiest(grid: number[][]): string {
  let best = { d: 0, h: 0, n: 0 };
  grid.forEach((row, d) => row.forEach((n, h) => n > best.n && (best = { d, h, n })));
  return best.n === 0 ? "—" : `${DAYS[best.d]} ${String(best.h).padStart(2, "0")}:00 (${best.n})`;
}

/**
 * Quantised shading steps chosen so the label stays >= 4.5:1 against the cell in both themes:
 * light steps carry foreground text, dark steps flip to background text. No mid-tone in between.
 */
function shade(frac: number): { pct: number; light: boolean } {
  if (frac < 0.34) return { pct: 10, light: true };
  if (frac < 0.5) return { pct: 25, light: true };
  if (frac < 0.67) return { pct: 38, light: true };
  if (frac < 0.85) return { pct: 72, light: false };
  return { pct: 86, light: false };
}

/** Currency-to-currency flow matrix (heatmap table). Rows = source, columns = destination. */
export function FlowMatrix({
  flows,
  format,
}: {
  flows: { from: string; to: string; volume_usd: number; count: number }[];
  format: (usd: number) => string;
}) {
  if (flows.length === 0)
    return (
      <p className="text-xs text-muted-foreground">No cross-currency payments in this period.</p>
    );
  const cur = Array.from(new Set(flows.flatMap((f) => [f.from, f.to]))).sort();
  const cell = new Map(flows.map((f) => [`${f.from}>${f.to}`, f]));
  const max = Math.max(...flows.map((f) => f.volume_usd), 1e-9);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <caption className="sr-only">
          Payment volume by source currency (rows) and destination currency (columns), in USD
          equivalent
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="p-1.5 text-left font-mono text-[10px] font-normal text-muted-foreground"
            >
              from ↓ / to →
            </th>
            {cur.map((c) => (
              <th
                key={c}
                scope="col"
                className="p-1.5 font-mono text-[10px] font-normal text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cur.map((r) => (
            <tr key={r}>
              <th
                scope="row"
                className="p-1.5 text-left font-mono text-[10px] font-normal text-muted-foreground"
              >
                {r}
              </th>
              {cur.map((c) => {
                const f = cell.get(`${r}>${c}`);
                return (
                  <td key={c} className="border border-border/60 p-0">
                    {f ? (
                      <div
                        className={cn(
                          "flex h-10 min-w-[52px] items-center justify-center font-mono text-[10px]",
                          shade(f.volume_usd / max).light ? "text-foreground" : "text-background",
                        )}
                        style={{
                          background: `color-mix(in oklab, var(--color-foreground) ${shade(f.volume_usd / max).pct}%, var(--color-background))`,
                        }}
                        title={`${r} → ${c}: ${format(f.volume_usd)} in ${f.count} payment${f.count === 1 ? "" : "s"}`}
                      >
                        {format(f.volume_usd)}
                      </div>
                    ) : (
                      <div
                        className="h-10 text-center leading-10 text-muted-foreground/40"
                        aria-label="none"
                      >
                        ·
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
