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
      className="inline-flex border border-border"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
            value === p
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
              "flex gap-3 p-4",
              i.tone === "watch" ? "border-2 border-foreground" : "border border-border",
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium">
                {i.title}
                {i.tone === "watch" ? <span className="sr-only"> (worth attention)</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{i.body}</p>
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
