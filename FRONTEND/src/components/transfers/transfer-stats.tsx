import { ArrowUpRightIcon, ArrowDownLeftIcon, ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TransferRecord } from "@/data/seed"
import { dominantCurrency, formatMoney } from "@/lib/dashboard-data"

interface TransferStatsProps {
  transfers: TransferRecord[]
}

export function TransferStats({ transfers: all }: TransferStatsProps) {
  const currency = dominantCurrency(all)
  const fmt = (n: number) => formatMoney(n, currency)
  const transfers = all.filter((t) => (t.currency ?? "USD").trim() === currency)
  const totalSent = transfers
    .filter((t) => t.type === "sent" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0)

  const totalReceived = transfers
    .filter((t) => t.type === "received")
    .reduce((s, t) => s + t.amount, 0)

  const scheduled = transfers.filter((t) => t.type === "scheduled")
  const scheduledTotal = scheduled.reduce((s, t) => s + t.amount, 0)

  const cards = [
    {
      label: "Total Sent",
      value: fmt(totalSent),
      icon: ArrowUpRightIcon,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Total Received",
      value: fmt(totalReceived),
      icon: ArrowDownLeftIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Scheduled",
      value: `${scheduled.length} (${fmt(scheduledTotal)})`,
      icon: ClockIcon,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              card.bg
            )}
          >
            <card.icon className={cn("size-4", card.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="tabular-nums text-base font-semibold tracking-tight">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
