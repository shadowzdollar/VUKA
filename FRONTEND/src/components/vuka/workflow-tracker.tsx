import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CircleDollarSign,
  Copy,
  FileCheck2,
  PartyPopper,
  Send,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, Loading } from "@/components/vuka/query-state";
import { Chip } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { workflows } from "@/lib/api/endpoints";
import type { Workflow, WorkflowState } from "@/lib/api/types";
import { money, shortId, when } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Happy-path order; FAILED / REQUIRES_REVIEW are off-path terminal-until-acted-on states. */
const PATH: WorkflowState[] = [
  "QUOTED",
  "COLLECTION_PENDING",
  "COLLECTED",
  "LEDGER_POSTED",
  "PAYOUT_PENDING",
  "COMPLETED",
];

const LABEL: Record<string, string> = {
  CREATED: "Created",
  QUOTED: "Quote Bound",
  COLLECTION_PENDING: "Collecting Mobile Money",
  COLLECTED: "Funds Collected",
  LEDGER_POSTED: "Ledger Posted",
  PAYOUT_PENDING: "Disbursing Payout",
  COMPLETED: "Settled",
  FAILED: "Failed",
  REQUIRES_REVIEW: "Requires Review",
};

export const isSettled = (s?: string) =>
  s === "COMPLETED" || s === "FAILED" || s === "REQUIRES_REVIEW";

export function stateTone(s: string) {
  if (s === "COMPLETED") return "live" as const;
  if (s === "FAILED" || s === "REQUIRES_REVIEW") return "warn" as const;
  return "invert" as const;
}

const STEP_ICON: Partial<Record<WorkflowState, LucideIcon>> = {
  QUOTED: FileCheck2,
  COLLECTION_PENDING: Wallet,
  COLLECTED: CircleDollarSign,
  LEDGER_POSTED: BookOpenCheck,
  PAYOUT_PENDING: Send,
  COMPLETED: PartyPopper,
};

/**
 * Live, connected stepper for one payment's journey — the rail fills as the engine actually
 * advances the workflow (polled, not simulated), with the in-flight step pulsing and a failed
 * step called out in place rather than just going dark.
 */
function PaymentStepper({ idx, failedNodeIndex }: { idx: number; failedNodeIndex: number | null }) {
  const pct = idx <= 0 ? 0 : (idx / (PATH.length - 1)) * 100;
  return (
    <div className="relative rounded-2xl border border-border/80 bg-muted/20 p-5">
      <div
        aria-hidden="true"
        className="absolute left-10 right-10 top-10 hidden h-1 overflow-hidden rounded-full bg-border sm:block"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-700 ease-out",
            failedNodeIndex !== null
              ? "bg-destructive"
              : "bg-gradient-to-r from-[#79b200] to-[#c2f74d]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-6 sm:gap-y-0">
        {PATH.map((s, i) => {
          const Icon = STEP_ICON[s] ?? FileCheck2;
          const isFailedNode = i === failedNodeIndex;
          const reached = i <= idx && !isFailedNode;
          const current = i === idx && failedNodeIndex === null;
          return (
            <li key={s} className="flex flex-col items-center gap-2.5 text-center">
              <span
                className={cn(
                  "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 bg-background transition-all duration-500",
                  reached && "border-[#151515] bg-[#151515] text-[#c2f74d] shadow-md",
                  !reached && !isFailedNode && "border-border text-muted-foreground",
                  isFailedNode && "border-destructive bg-destructive text-destructive-foreground",
                  current && "motion-safe:animate-pulse ring-4 ring-[#c2f74d]/40",
                )}
              >
                {isFailedNode ? (
                  <AlertTriangle className="size-4.5" aria-hidden="true" />
                ) : i < idx ? (
                  <Check className="size-4.5" aria-hidden="true" />
                ) : (
                  <Icon className="size-4.5" aria-hidden="true" />
                )}
              </span>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground">0{i + 1}</div>
                <span
                  className={cn(
                    "font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.06em]",
                    reached || isFailedNode ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {LABEL[s]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Live view of one quote-bound provider workflow. Polls while the workflow is in flight and offers
 * the engine's only two legal recoveries: retry a failed collection, or retry a payout that needs review.
 */
export function WorkflowTracker({ id, defaultPhone = "" }: { id: string; defaultPhone?: string }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const wf = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => workflows.get(id),
    refetchInterval: (q) => (isSettled(q.state.data?.state) ? false : 2000),
  });
  const events = useQuery({
    queryKey: ["workflow-events", id, wf.data?.state],
    queryFn: () => workflows.events(id),
    enabled: wf.isSuccess,
  });
  const [phone, setPhone] = useState(defaultPhone);

  const retry = useMutation({
    mutationFn: () => workflows.retry(id, phone.trim()),
    onSuccess: (res) => {
      const err = "error" in res ? res.error : undefined;
      if (err) toast.warning("Retry did not complete", { description: err });
      else toast.success("Retry submitted");
    },
    onError: (e) => toast.error("Retry rejected", { description: describeError(e) }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["workflow", id] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });

  if (wf.isPending) return <Loading label="Loading payment workflow" />;
  if (wf.isError) return <ErrorState error={wf.error} onRetry={() => void wf.refetch()} />;

  const w: Workflow = wf.data;
  const pathIdx = PATH.indexOf(w.state);
  const offPath = w.state === "FAILED" || w.state === "REQUIRES_REVIEW";
  const failedNodeIndex = !offPath
    ? null
    : w.failed_step === "PAYOUT"
      ? PATH.indexOf("PAYOUT_PENDING")
      : w.failed_step === "COLLECTION"
        ? PATH.indexOf("COLLECTION_PENDING")
        : null;
  const idx = pathIdx >= 0 ? pathIdx : (failedNodeIndex ?? -1) - 1;
  const canRetry =
    (w.state === "FAILED" && w.failed_step === "COLLECTION") ||
    (w.state === "REQUIRES_REVIEW" && w.failed_step === "PAYOUT");

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#151515] bg-[#151515] p-5 text-white">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c2f74d]">
            <ShieldCheck className="size-3.5" /> Quote-Bound Cross-Border Workflow
          </div>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-sm font-bold">
            <span>{w.id}</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(w.id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-white/60 hover:text-[#c2f74d]"
              aria-label="Copy workflow ID"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <div className="mt-1 font-mono text-xs text-white/70">
            {money(w.amount, w.currency_from)} → {w.currency_to} · Corridor{" "}
            <span className="text-[#c2f74d]">{w.corridor_id}</span>
          </div>
        </div>
        <Chip tone={stateTone(w.state)}>{LABEL[w.state] ?? w.state}</Chip>
      </div>

      <PaymentStepper idx={idx} failedNodeIndex={failedNodeIndex} />

      {w.state === "FAILED" || w.state === "REQUIRES_REVIEW" ? (
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-4 text-xs">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
            {w.state === "FAILED" ? "Payment failed" : "Payout needs review"}
            {w.failed_step ? ` · ${w.failed_step.toLowerCase()} step` : ""}
          </div>
          <p className="mt-1 text-muted-foreground">
            {w.failure_reason ?? "The provider did not confirm this step."}
          </p>
          {w.state === "REQUIRES_REVIEW" ? (
            <p className="mt-1 text-muted-foreground">
              Your funds were collected and posted to the ledger. The payout is not treated as
              successful until it is confirmed or retried.
            </p>
          ) : null}
          {canRetry ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={
                  w.failed_step === "PAYOUT" ? "Recipient mobile number" : "Your mobile number"
                }
                className="h-9 w-60 rounded-xl font-mono text-xs"
              />
              <Button
                size="sm"
                className="h-9 rounded-xl font-mono text-[10px] uppercase"
                disabled={retry.isPending || !phone.trim()}
                onClick={() => retry.mutate()}
              >
                {retry.isPending ? "Retrying…" : `Retry ${w.failed_step?.toLowerCase()}`}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {w.state === "COMPLETED" ? (
        <dl className="grid gap-2.5 rounded-2xl border border-[#79b200]/40 bg-[#f6fce8] p-4 font-mono text-xs text-[#151515] sm:grid-cols-2 dark:bg-[#1b2410] dark:text-foreground">
          <Row k="Ledger transfer ID" v={shortId(w.ledger_transfer_id, 14)} />
          <Row k="Locked FX rate" v={String(w.rate)} />
          <Row k="Collection rail" v={w.collection_provider} />
          <Row k="Payout rail" v={w.payout_provider} />
        </dl>
      ) : null}

      <details className="rounded-2xl border border-border bg-card">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          State Machine Audit Trail ({events.data?.length ?? "…"} transitions)
        </summary>
        <ul className="divide-y divide-border/60 border-t border-border/60 px-4">
          {(events.data ?? []).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 font-mono text-[11px]"
            >
              <span>
                <span className="text-muted-foreground">#{e.sequence}</span>{" "}
                {e.from_state || "INIT"} →{" "}
                <span className="font-semibold text-foreground">{e.to_state}</span>
                {e.step ? ` · ${e.step.toLowerCase()}` : ""}
              </span>
              <span className="text-muted-foreground">{when(e.created_at)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
