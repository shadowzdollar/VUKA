import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Info,
  Radio,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { support } from "@/lib/api/endpoints";
import type { Notification } from "@/lib/api/types";
import { relativeTime, when } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { useNotifications } from "@/lib/trader-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — VUKA" },
      {
        name: "description",
        content: "Account and payment notifications for your trader account.",
      },
    ],
  }),
  component: () => (
    <Shell role="trader">
      <Notifications />
    </Shell>
  ),
});

const SEVERITIES = ["success", "info", "warning", "error"] as const;
type Severity = (typeof SEVERITIES)[number];

function severityMeta(s: string): {
  icon: ReactNode;
  label: string;
  tone: "neutral" | "live" | "warn" | "invert";
} {
  switch (s) {
    case "success":
      return {
        icon: <CheckCircle2 className="size-4 text-[#79b200]" aria-hidden="true" />,
        label: "Success",
        tone: "invert",
      };
    case "error":
      return {
        icon: <AlertCircle className="size-4 text-destructive" aria-hidden="true" />,
        label: "Error",
        tone: "warn",
      };
    case "warning":
      return {
        icon: <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />,
        label: "Warning",
        tone: "warn",
      };
    default:
      return {
        icon: <Info className="size-4 text-sky-500" aria-hidden="true" />,
        label: "Info",
        tone: "neutral",
      };
  }
}

function Notifications() {
  const trader = useTrader();
  const qc = useQueryClient();
  const q = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | Severity>("all");

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, trader.id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications", trader.id] });
      const prev = qc.getQueryData<Notification[]>(["notifications", trader.id]);
      qc.setQueryData<Notification[]>(["notifications", trader.id], (list) =>
        (list ?? []).map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications", trader.id], ctx.prev);
      toast.error(describeError(err));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["notifications", trader.id] }),
  });

  const all = useMemo(() => q.data ?? [], [q.data]);
  const unreadIds = useMemo(() => all.filter((n) => !n.read_at).map((n) => n.id), [all]);
  const successCount = useMemo(
    () => all.filter((n) => n.severity === "success").length,
    [all],
  );
  const alertCount = useMemo(
    () => all.filter((n) => n.severity === "warning" || n.severity === "error").length,
    [all],
  );
  const items = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "unread") return all.filter((n) => !n.read_at);
    return all.filter((n) => n.severity === filter);
  }, [all, filter]);

  async function markAllRead() {
    const ids = unreadIds;
    for (const id of ids) {
      try {
        await markRead.mutateAsync(id);
      } catch {
        // markRead already surfaces a toast per failure; keep going through the rest.
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account Telemetry"
        title="Notifications"
        description="Payment, verification and trust-score updates for your account, newest first."
        actions={
          <Button
            variant="outline"
            disabled={unreadIds.length === 0 || markRead.isPending}
            onClick={() => void markAllRead()}
            className="gap-2 rounded-lg font-mono text-xs uppercase"
          >
            <CheckCheck className="size-3.5 text-[#79b200]" aria-hidden="true" />
            Mark all as read
          </Button>
        }
      />

      {/* Executive Account Telemetry Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[300px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <Radio className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Live Settlement & Compliance Event Stream
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {unreadIds.length === 0
                ? "All Account Alerts Reviewed"
                : `${unreadIds.length} Unread Account Notification${unreadIds.length === 1 ? "" : "s"}`}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Every mobile-money debit confirmation, corridor payout completion, and KYC tier
              change emits an immutable notification to your trader inbox.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Unread" value={unreadIds.length} sub="Awaiting review" accent="lime" />
        <Metric label="Total events" value={all.length} sub="Recorded in inbox" />
        <Metric label="Settlements & OK" value={successCount} sub="Positive confirmations" />
        <Metric
          label="Warnings & alerts"
          value={alertCount}
          sub="Actionable notices"
          accent={alertCount > 0 ? "warn" : "default"}
        />
      </div>

      <Panel
        title="Notification stream"
        subtitle="Filter by read state or event severity"
        meta={
          <div role="tablist" aria-label="Filter notifications" className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", `All${all.length ? ` (${all.length})` : ""}`],
                ["unread", `Unread${unreadIds.length ? ` (${unreadIds.length})` : ""}`],
                ...SEVERITIES.map((s) => [s, severityMeta(s).label] as const),
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={
                  "rounded-lg border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors " +
                  (filter === key
                    ? "border-[#151515] bg-[#151515] text-[#c2f74d]"
                    : "border-border bg-muted/25 text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {q.isPending ? (
          <Loading label="Loading notifications" />
        ) : q.isError ? (
          <div className="rounded-xl border-2 border-foreground p-4 text-sm">
            {describeError(q.error)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState>
            <Bell className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden="true" />
            {all.length === 0
              ? "No notifications yet. Payment, verification and trust-score updates will show up here."
              : "Nothing matches this filter."}
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {items.map((n) => {
              const meta = severityMeta(n.severity);
              const unread = !n.read_at;
              return (
                <li
                  key={n.id}
                  className={
                    unread
                      ? "rounded-xl border-2 border-[#151515]/80 bg-card p-4 shadow-sm"
                      : "rounded-xl border border-border/80 bg-muted/10 p-4"
                  }
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40"
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={unread ? "text-sm font-bold" : "text-sm font-medium"}>
                          {n.title}
                        </span>
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                        {unread ? (
                          <span
                            className="size-2 rounded-full bg-[#79b200] shadow-[0_0_8px_#c2f74d]"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="sr-only">{unread ? "Unread" : "Read"}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                      <time
                        dateTime={n.created_at}
                        title={when(n.created_at)}
                        className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        <Clock className="size-3" aria-hidden="true" />
                        {relativeTime(n.created_at)}
                      </time>
                    </div>
                    {unread ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(n.id)}
                        className="h-7 shrink-0 rounded-lg font-mono text-[10px] uppercase"
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
