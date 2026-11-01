import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

export const usd0 = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const usdCompact = (n: number) =>
  `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;

/** Accessible segmented control (a radio group) for the reporting period. */
export function PeriodPicker({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Reporting period"
      className="inline-flex rounded-xl border border-border bg-muted/40 p-1"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-lg px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-all",
            value === p
              ? "bg-[#151515] text-[#c2f74d] shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p === 365 ? "1y" : `${p}d`}
        </button>
      ))}
    </div>
  );
}

export function InsightList({ items }: { items: Insight[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((i) => {
        const Icon = i.tone === "watch" ? TriangleAlert : Info;
        return (
          <li
            key={i.title}
            className={cn(
              "flex gap-3.5 rounded-xl p-4 transition-colors",
              i.tone === "watch"
                ? "border border-[#79b200]/50 bg-[#f6fce8] text-[#151515] dark:bg-[#1e2612] dark:text-foreground"
                : "border border-border/80 bg-muted/20",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                i.tone === "watch"
                  ? "bg-[#151515] text-[#c2f74d]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-sm font-semibold">
                {i.title}
                {i.tone === "watch" ? <span className="sr-only"> (worth attention)</span> : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Basis({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-muted-foreground">{children}</p>;
}
