import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, Bell, CheckCheck, CheckCircle2, Info } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/vuka/query-state";
import { Chip, PageHeader, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { support } from "@/lib/api/endpoints";
import type { Notification } from "@/lib/api/types";
import { relativeTime, when } from "@/lib/format";
import { useNotifications } from "@/lib/trader-data";
import { useTrader } from "@/lib/session";
import { toast } from "sonner";

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
        icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
        label: "Success",
        tone: "invert",
      };
    case "error":
      return {
        icon: <AlertCircle className="size-4" aria-hidden="true" />,
        label: "Error",
        tone: "warn",
      };
    case "warning":
      return {
        icon: <AlertTriangle className="size-4" aria-hidden="true" />,
        label: "Warning",
        tone: "warn",
      };
    default:
      return {
        icon: <Info className="size-4" aria-hidden="true" />,
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
        eyebrow="Account"
        title="Notifications"
        description="Payment, verification and trust-score updates for your account, newest first."
        actions={
          <Button
            variant="outline"
            disabled={unreadIds.length === 0 || markRead.isPending}
            onClick={() => void markAllRead()}
            className="rounded-none font-mono text-xs uppercase"
          >
            <CheckCheck className="mr-2 size-3.5" aria-hidden="true" />
            Mark all as read
          </Button>
        }
      />

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
              "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors " +
              (filter === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-accent")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <Loading label="Loading notifications" />
      ) : q.isError ? (
        <div className="border-2 border-foreground p-4 text-sm">{describeError(q.error)}</div>
      ) : items.length === 0 ? (
        <EmptyState>
          <Bell className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden="true" />
          {all.length === 0
            ? "No notifications yet. Payment, verification and trust-score updates will show up here."
            : "Nothing matches this filter."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {items.map((n) => {
            const meta = severityMeta(n.severity);
            const unread = !n.read_at;
            return (
              <li key={n.id} className={unread ? "bg-card" : "bg-background"}>
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 shrink-0 text-foreground" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={unread ? "font-semibold" : "font-medium"}>{n.title}</span>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                      {unread ? (
                        <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
                      ) : null}
                      <span className="sr-only">{unread ? "Unread" : "Read"}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <time
                      dateTime={n.created_at}
                      title={when(n.created_at)}
                      className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {relativeTime(n.created_at)}
                    </time>
                  </div>
                  {unread ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(n.id)}
                      className="shrink-0 rounded-none font-mono text-[10px] uppercase"
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
    </div>
  );
}
