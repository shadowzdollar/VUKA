import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight (no chart library) visual primitives. All monochrome: value is encoded by length,
 * opacity or position, and every mark has a text equivalent, so nothing depends on colour.
 */

/** Inline trend line for KPI cards. Purely decorative: the number beside it carries the meaning. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1e-9);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const w = 100;
  const h = 28;
  const pts = values.map(
    (v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`,
  );
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-7 w-full", className)}
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="currentColor" opacity="0.08" />
    </svg>
  );
}

/** Semicircular gauge for a 0..1 ratio (success rate, limit usage). */
export function Gauge({ value, label, sub }: { value: number; label: string; sub?: ReactNode }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 42;
  const c = Math.PI * r;
  return (
    <figure className="m-0 text-center" role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
      <svg viewBox="0 0 100 58" className="mx-auto w-full max-w-[200px]" aria-hidden="true">
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="9"
        />
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke="var(--color-foreground)"
          strokeWidth="9"
          strokeDasharray={`${v * c} ${c}`}
        />
        <text x="50" y="46" textAnchor="middle" className="fill-foreground font-mono text-[15px]">
          {Math.round(v * 100)}%
        </text>
      </svg>
      <figcaption className="-mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
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
    <ul className="space-y-3" aria-label={ariaLabel}>
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{i.label}</span>
            <span className="tabular shrink-0 font-mono text-xs">{i.display ?? i.value}</span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-muted" aria-hidden="true">
            <div className="h-full bg-foreground" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          {i.note ? <div className="mt-0.5 text-[11px] text-muted-foreground">{i.note}</div> : null}
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
    <ol className="space-y-2" aria-label={ariaLabel}>
      {stages.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-muted-foreground">{s.label}</span>
          <div className="h-6 flex-1 bg-muted" aria-hidden="true">
            <div
              className="flex h-full items-center bg-foreground px-2 font-mono text-[10px] text-background"
              style={{ width: `${Math.max((s.count / top) * 100, 4)}%`, opacity: 1 - i * 0.18 }}
            >
              {s.count}
            </div>
          </div>
          <span className="sr-only">{s.count}</span>
        </li>
      ))}
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
