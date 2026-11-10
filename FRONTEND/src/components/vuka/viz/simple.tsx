import { useId, type ReactNode } from "react";
import { pickLang, useLangCopy, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const VIZ_COPY = {
  en: {
    noDataPeriod: "No data in this period.",
    noActivityPeriod: "No activity in this period.",
    noCrossCurrencyPeriod: "No cross-currency payments in this period.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    cellTitle: (day: string, hour: string, n: number) =>
      `${day} ${hour}:00 UTC — ${n} payment${n === 1 ? "" : "s"}`,
    heatmapFooter: (slot: string) =>
      `Payments by weekday and hour (UTC). Busiest slot: ${slot}.`,
    heatmapCaption: "Payments by weekday and hour (UTC)",
    weekdayCol: "Weekday",
    hoursActivityCol: "Hours with activity",
    none: "none",
    matrixCaption:
      "Payment volume by source currency (rows) and destination currency (columns), in USD equivalent",
    fromToHeader: "from ↓ / to →",
    matrixCellTitle: (from: string, to: string, vol: string, count: number) =>
      `${from} → ${to}: ${vol} in ${count} payment${count === 1 ? "" : "s"}`,
  },
  fr: {
    noDataPeriod: "Aucune donnée sur cette période.",
    noActivityPeriod: "Aucune activité sur cette période.",
    noCrossCurrencyPeriod: "Aucun paiement inter-devises sur cette période.",
    days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    cellTitle: (day: string, hour: string, n: number) =>
      `${day} ${hour}:00 UTC — ${n} paiement${n === 1 ? "" : "s"}`,
    heatmapFooter: (slot: string) =>
      `Paiements par jour et par heure (UTC). Créneau le plus actif : ${slot}.`,
    heatmapCaption: "Paiements par jour et par heure (UTC)",
    weekdayCol: "Jour",
    hoursActivityCol: "Heures actives",
    none: "aucun",
    matrixCaption:
      "Volume de paiements par devise source (lignes) et devise de destination (colonnes), en équivalent USD",
    fromToHeader: "de ↓ / vers →",
    matrixCellTitle: (from: string, to: string, vol: string, count: number) =>
      `${from} → ${to} : ${vol} en ${count} paiement${count === 1 ? "" : "s"}`,
  },
  sw: {
    noDataPeriod: "Hakuna data katika kipindi hiki.",
    noActivityPeriod: "Hakuna shughuli katika kipindi hiki.",
    noCrossCurrencyPeriod: "Hakuna malipo ya kubadilisha sarafu katika kipindi hiki.",
    days: ["Jtt", "Jnn", "Jtn", "Alh", "Ijm", "Jms", "Jpi"],
    cellTitle: (day: string, hour: string, n: number) =>
      `${day} ${hour}:00 UTC — malipo ${n}`,
    heatmapFooter: (slot: string) =>
      `Malipo kwa siku ya wiki na saa (UTC). Wakati wenye shughuli nyingi: ${slot}.`,
    heatmapCaption: "Malipo kwa siku ya wiki na saa (UTC)",
    weekdayCol: "Siku ya wiki",
    hoursActivityCol: "Saa zenye shughuli",
    none: "hakuna",
    matrixCaption:
      "Kiasi cha malipo kwa sarafu ya asili (safu mlalo) na sarafu ya mwisho (safu wima), sawa na USD",
    fromToHeader: "kutoka ↓ / kwenda →",
    matrixCellTitle: (from: string, to: string, vol: string, count: number) =>
      `${from} → ${to}: ${vol} katika malipo ${count}`,
  },
  pt: {
    noDataPeriod: "Sem dados neste período.",
    noActivityPeriod: "Sem atividade neste período.",
    noCrossCurrencyPeriod: "Sem pagamentos entre moedas neste período.",
    days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    cellTitle: (day: string, hour: string, n: number) =>
      `${day} ${hour}:00 UTC — ${n} pagamento${n === 1 ? "" : "s"}`,
    heatmapFooter: (slot: string) =>
      `Pagamentos por dia da semana e hora (UTC). Horário mais movimentado: ${slot}.`,
    heatmapCaption: "Pagamentos por dia da semana e hora (UTC)",
    weekdayCol: "Dia da semana",
    hoursActivityCol: "Horas com atividade",
    none: "nenhuma",
    matrixCaption:
      "Volume de pagamentos por moeda de origem (linhas) e moeda de destino (colunas), em equivalente USD",
    fromToHeader: "de ↓ / para →",
    matrixCellTitle: (from: string, to: string, vol: string, count: number) =>
      `${from} → ${to}: ${vol} em ${count} pagamento${count === 1 ? "" : "s"}`,
  },
  rw: {
    noDataPeriod: "Nta makuru aboneka muri iki gihe.",
    noActivityPeriod: "Nta bikorwa byabaye muri iki gihe.",
    noCrossCurrencyPeriod: "Nta bwishyu bwambukiranya amafaranga bwabaye muri iki gihe.",
    days: ["Mbe", "Kab", "Gat", "Kan", "Gtn", "Gtd", "Cyu"],
    cellTitle: (day: string, hour: string, n: number) =>
      `${day} ${hour}:00 UTC — ubwishyu ${n}`,
    heatmapFooter: (slot: string) =>
      `Ubwishyu ku munsi w'icyumweru n'isaha (UTC). Igihe cyakozwemo cyane: ${slot}.`,
    heatmapCaption: "Ubwishyu ku munsi w'icyumweru n'isaha (UTC)",
    weekdayCol: "Umunsi",
    hoursActivityCol: "Amasaha yakozwemo",
    none: "ntacyo",
    matrixCaption:
      "Ingano y'ubwishyu ukurikije ifaranga ryoherejwe (imirongo) n'ifaranga ryakiriwe (inkingi), mu gaciro ka USD",
    fromToHeader: "kuva ↓ / kujya →",
    matrixCellTitle: (from: string, to: string, vol: string, count: number) =>
      `${from} → ${to}: ${vol} mu bwishyu ${count}`,
  },
} as const;

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
  empty,
}: {
  items: RankedItem[];
  ariaLabel: string;
  empty?: string;
}) {
  const copy = useLangCopy(VIZ_COPY);
  const emptyText = empty ?? copy.noDataPeriod;
  if (items.length === 0) return <p className="text-xs text-muted-foreground">{emptyText}</p>;
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
  const copy = useLangCopy(VIZ_COPY);
  const max = Math.max(1, ...grid.flat());
  const total = grid.flat().reduce((a, b) => a + b, 0);
  if (total === 0)
    return <p className="text-xs text-muted-foreground">{copy.noActivityPeriod}</p>;
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
                {copy.days[d]}
              </span>
              <div
                className="grid flex-1 gap-px"
                style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              >
                {row.map((n, h) => (
                  <span
                    key={h}
                    title={copy.cellTitle(copy.days[d] ?? DAYS[d]!, String(h).padStart(2, "0"), n)}
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
        {copy.heatmapFooter(busiest(grid, copy.days))}
      </p>
      <div className="sr-only">
        <table className="sr-only">
          <caption>{copy.heatmapCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.weekdayCol}</th>
              <th scope="col">{copy.hoursActivityCol}</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={DAYS[d]}>
                <th scope="row">{copy.days[d]}</th>
                <td>
                  {row
                    .map((n, h) => (n ? `${h}:00 ×${n}` : null))
                    .filter(Boolean)
                    .join(", ") || copy.none}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function busiest(grid: number[][], days: readonly string[] = DAYS): string {
  let best = { d: 0, h: 0, n: 0 };
  grid.forEach((row, d) => row.forEach((n, h) => n > best.n && (best = { d, h, n })));
  return best.n === 0 ? "—" : `${days[best.d] ?? DAYS[best.d]} ${String(best.h).padStart(2, "0")}:00 (${best.n})`;
}

export function busiestForLang(grid: number[][], lang: Lang = "en"): string {
  return busiest(grid, pickLang(lang, VIZ_COPY).days);
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
  const copy = useLangCopy(VIZ_COPY);
  if (flows.length === 0)
    return (
      <p className="text-xs text-muted-foreground">{copy.noCrossCurrencyPeriod}</p>
    );
  const cur = Array.from(new Set(flows.flatMap((f) => [f.from, f.to]))).sort();
  const cell = new Map(flows.map((f) => [`${f.from}>${f.to}`, f]));
  const max = Math.max(...flows.map((f) => f.volume_usd), 1e-9);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <caption className="sr-only">
          {copy.matrixCaption}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="p-1.5 text-left font-mono text-[10px] font-normal text-muted-foreground"
            >
              {copy.fromToHeader}
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
                        title={copy.matrixCellTitle(r, c, format(f.volume_usd), f.count)}
                      >
                        {format(f.volume_usd)}
                      </div>
                    ) : (
                      <div
                        className="h-10 text-center leading-10 text-muted-foreground/40"
                        aria-label={copy.none}
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
