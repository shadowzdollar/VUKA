import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CircleDollarSign,
  FileCheck2,
  PartyPopper,
  Send,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/vuka/shell";
import { ErrorState, Loading } from "@/components/vuka/query-state";
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
  QUOTED: "Quote bound",
  COLLECTION_PENDING: "Collecting from payer wallet",
  COLLECTED: "Funds collected",
  LEDGER_POSTED: "Ledger posted",
  PAYOUT_PENDING: "Paying out to recipient",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REQUIRES_REVIEW: "Requires review",
};

export const isSettled = (s?: string) =>
  s === "COMPLETED" || s === "FAILED" || s === "REQUIRES_REVIEW";

export function stateTone(s: string) {
  if (s === "COMPLETED") return "invert" as const;
  if (s === "FAILED" || s === "REQUIRES_REVIEW") return "warn" as const;
  return "live" as const;
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
    <div className="relative">
      <div aria-hidden="true" className="absolute left-5 right-5 top-5 hidden h-0.5 bg-border sm:block">
        <div
          className={cn("h-full transition-[width] duration-700 ease-out", failedNodeIndex !== null ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="relative grid grid-cols-3 gap-y-6 sm:grid-cols-6 sm:gap-y-0">
        {PATH.map((s, i) => {
          const Icon = STEP_ICON[s] ?? FileCheck2;
          const isFailedNode = i === failedNodeIndex;
          const reached = i <= idx && !isFailedNode;
          const current = i === idx && failedNodeIndex === null;
          return (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-colors duration-500",
                  reached && "border-primary bg-primary text-primary-foreground",
                  !reached && !isFailedNode && "border-border text-muted-foreground",
                  isFailedNode && "border-destructive bg-destructive text-destructive-foreground",
                  current && "motion-safe:animate-pulse ring-4 ring-primary/20",
                )}
              >
                {isFailedNode ? (
                  <AlertTriangle className="size-4" aria-hidden="true" />
                ) : i < idx ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase leading-tight tracking-[0.08em]",
                  reached || isFailedNode ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {LABEL[s]}
              </span>
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

  if (wf.isPending) return <Loading label="Loading payment" />;
  if (wf.isError) return <ErrorState error={wf.error} onRetry={() => void wf.refetch()} />;

  const w: Workflow = wf.data;
  const pathIdx = PATH.indexOf(w.state);
  const offPath = w.state === "FAILED" || w.state === "REQUIRES_REVIEW";
  // Off-path states aren't in PATH, but failed_step still tells us how far the money actually
  // got — show that real progress instead of resetting the whole rail to empty.
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs">{w.id}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {money(w.amount, w.currency_from)} → {w.currency_to} · corridor {w.corridor_id}
          </div>
        </div>
        <Chip tone={stateTone(w.state)}>{LABEL[w.state] ?? w.state}</Chip>
      </div>

      <PaymentStepper idx={idx} failedNodeIndex={failedNodeIndex} />

      {w.state === "FAILED" || w.state === "REQUIRES_REVIEW" ? (
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-3 text-xs">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
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
                className="h-8 w-56 rounded-lg font-mono text-xs"
              />
              <Button
                size="sm"
                className="h-8 rounded-lg font-mono text-[10px] uppercase"
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
        <dl className="grid gap-2 rounded-2xl border border-success/30 bg-success/5 p-4 font-mono text-[11px] sm:grid-cols-2">
          <Row k="Ledger transfer" v={shortId(w.ledger_transfer_id, 12)} />
          <Row k="Rate applied" v={String(w.rate)} />
          <Row k="Collected via" v={w.collection_provider} />
          <Row k="Paid out via" v={w.payout_provider} />
        </dl>
      ) : null}

      <details className="rounded-2xl border border-border">
        <summary className="cursor-pointer px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Audit trail ({events.data?.length ?? "…"} transitions)
        </summary>
        <ul className="divide-y divide-border/60 px-3">
          {(events.data ?? []).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 font-mono text-[11px]"
            >
              <span>
                #{e.sequence} {e.from_state || "—"} → {e.to_state}
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
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
