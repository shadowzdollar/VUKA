import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { operator } from "@/lib/api/endpoints";
import type { Dispute } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { truncMid, when } from "@/lib/format";
import { useOperator } from "@/lib/session";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title: "Dispute Tribunal — VUKA" },
      {
        name: "description",
        content:
          "Arbitration queue for disputed escrows with review notes, arbiter recommendations and operator approval.",
      },
    ],
  }),
  component: () => (
    <Shell role="operator">
      <Tribunal />
    </Shell>
  ),
});

const isOpen = (d: Dispute) => !d.resolved_at && d.status.toLowerCase() !== "resolved";

function Tribunal() {
  const [scope, setScope] = useChainScope();
  const ready = scopeReady(scope);
  const [active, setActive] = useState<Dispute | null>(null);

  const disputes = useQuery({
    queryKey: ["disputes", scope],
    queryFn: () => operator.disputes(scope),
    enabled: ready,
    refetchInterval: 20_000,
  });
  const open = useMemo(() => (disputes.data ?? []).filter(isOpen).length, [disputes.data]);

  return (
    <>
      <PageHeader
        eyebrow="Arbitration"
        title="Dispute Tribunal"
        description="Disputes are raised on-chain and freeze the escrow. Arbiters record review notes and a RELEASE / REFUND recommendation; an operator approves it before the outcome is executed by the contract."
      />
      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>Enter the escrow contract address to load disputes.</EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Open disputes" value={open} sub="Awaiting a resolution" />
            <Metric
              label="Resolved"
              value={(disputes.data?.length ?? 0) - open}
              sub="Closed on-chain"
            />
            <Metric label="Total" value={disputes.data?.length ?? "—"} sub="For this contract" />
          </div>

          <Panel title="Arbitration queue" meta={<Chip tone="live">Live</Chip>}>
            <QueryBoundary
              query={disputes}
              disabledCodes={["reconciliation_disabled"]}
              isEmpty={(d) => d.length === 0}
              empty="No disputes have been raised for this contract."
            >
              {(rows) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="py-2">Case</th>
                        <th className="py-2">Escrow</th>
                        <th className="py-2">Claim</th>
                        <th className="py-2">Raised</th>
                        <th className="py-2">Tx</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => setActive(d)}
                          className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                        >
                          <td className="py-2.5 font-mono text-xs">{truncMid(d.id, 8, 4)}</td>
                          <td className="py-2.5 font-mono text-xs">#{d.escrow_id}</td>
                          <td className="max-w-xs truncate py-2.5 text-xs">{d.reason}</td>
                          <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                            {when(d.created_at)}
                          </td>
                          <td className="py-2.5 font-mono text-xs text-muted-foreground">
                            {truncMid(d.raised_transaction_hash)}
                          </td>
                          <td className="py-2.5 text-right">
                            <Chip tone={isOpen(d) ? "warn" : "invert"}>{d.status}</Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </QueryBoundary>
          </Panel>
        </>
      )}

      <CaseDialog dispute={active} onClose={() => setActive(null)} />
    </>
  );
}

function CaseDialog({ dispute, onClose }: { dispute: Dispute | null; onClose: () => void }) {
  const me = useOperator();
  const qc = useQueryClient();
  const id = dispute?.id;
  const isArbiter = me.role === "arbiter";

  const timeline = useQuery({
    queryKey: ["dispute-timeline", id],
    queryFn: () => operator.disputeTimeline(id!),
    enabled: !!id,
  });
  // Review notes are arbiter-only on the engine (403 for operators), so do not even ask.
  const reviews = useQuery({
    queryKey: ["dispute-reviews", id],
    queryFn: () => operator.disputeReviews(id!),
    enabled: !!id && isArbiter,
  });
  const decisions = useQuery({
    queryKey: ["dispute-decisions", id],
    queryFn: () => operator.disputeDecisions(id!),
    enabled: !!id,
  });

  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<"RELEASE" | "REFUND">("RELEASE");
  const [rationale, setRationale] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["dispute-timeline", id] });
    void qc.invalidateQueries({ queryKey: ["dispute-reviews", id] });
    void qc.invalidateQueries({ queryKey: ["dispute-decisions", id] });
  };

  const addNote = useMutation({
    mutationFn: () => operator.addReview(id!, note.trim()),
    onSuccess: () => {
      toast.success("Review note recorded");
      setNote("");
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const recommend = useMutation({
    mutationFn: () => operator.recommend(id!, choice, rationale.trim()),
    onSuccess: () => {
      toast.success(`${choice} recommendation recorded`, {
        description: "Awaiting operator approval.",
      });
      setRationale("");
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });
  const approve = useMutation({
    mutationFn: (decisionId: string) => operator.approveDecision(decisionId),
    onSuccess: () => {
      toast.success("Decision approved");
      refresh();
    },
    onError: (e) => toast.error("Approval refused", { description: describeError(e) }),
  });

  return (
    <Dialog open={dispute !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none sm:max-w-3xl">
        {dispute ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                Case {truncMid(dispute.id, 8, 4)} · escrow #{dispute.escrow_id}
              </DialogTitle>
              <DialogDescription>
                Raised {when(dispute.created_at)} · {dispute.status}
              </DialogDescription>
            </DialogHeader>
            <p className="border border-border p-3 text-sm">{dispute.reason}</p>

            <Section title="Decisions">
              <QueryBoundary
                query={decisions}
                isEmpty={(d) => d.length === 0}
                empty="No recommendation yet."
              >
                {(rows) => (
                  <ul className="divide-y divide-border border border-border">
                    {rows.map((d) => (
                      <li key={d.id} className="space-y-1 px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <Chip tone="invert">{d.decision}</Chip>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              by {d.decided_by} · {when(d.created_at)}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <Chip tone={d.approvals.length > 0 ? "invert" : "warn"}>
                              {d.approvals.length} approval{d.approvals.length === 1 ? "" : "s"}
                            </Chip>
                            {me.role === "operator" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-none font-mono text-[10px] uppercase"
                                disabled={
                                  approve.isPending ||
                                  d.approvals.some((a) => a.approver_email === me.email)
                                }
                                onClick={() => approve.mutate(d.id)}
                              >
                                Approve
                              </Button>
                            ) : null}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{d.rationale}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </QueryBoundary>
            </Section>

            {isArbiter ? (
              <>
                <Section title="Review notes">
                  <QueryBoundary
                    query={reviews}
                    isEmpty={(d) => d.length === 0}
                    empty="No notes yet."
                  >
                    {(rows) => (
                      <ul className="divide-y divide-border border border-border">
                        {rows.map((r) => (
                          <li key={r.id} className="px-3 py-2">
                            <p className="text-xs">{r.note}</p>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {r.reviewer_email} · {when(r.created_at)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </QueryBoundary>
                  <div className="mt-2 flex gap-2">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a review note…"
                      className="min-h-16 rounded-none"
                    />
                    <Button
                      variant="outline"
                      className="rounded-none font-mono text-[10px] uppercase"
                      disabled={!note.trim() || addNote.isPending}
                      onClick={() => addNote.mutate()}
                    >
                      Add note
                    </Button>
                  </div>
                </Section>

                {isOpen(dispute) ? (
                  <Section title="Record recommendation">
                    <div className="space-y-2">
                      <Select value={choice} onValueChange={(v) => setChoice(v as typeof choice)}>
                        <SelectTrigger className="w-48 rounded-none font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="RELEASE">Release to supplier</SelectItem>
                          <SelectItem value="REFUND">Refund to buyer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Written rationale (required, permanently recorded)…"
                        className="min-h-20 rounded-none"
                      />
                      <Button
                        className="rounded-none font-mono text-xs uppercase"
                        disabled={rationale.trim().length < 12 || recommend.isPending}
                        onClick={() => recommend.mutate()}
                      >
                        Record recommendation
                      </Button>
                    </div>
                  </Section>
                ) : null}
              </>
            ) : (
              <p className="border border-dashed border-border p-3 text-xs text-muted-foreground">
                Review notes and recommendations are recorded by arbiters. As an operator you can
                approve a recommendation above and export the audit trail.
              </p>
            )}

            <Section
              title="Audit timeline"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-none font-mono text-[10px] uppercase"
                  onClick={() =>
                    void download(
                      `/api/disputes/${dispute.id}/export`,
                      `dispute-${dispute.escrow_id}-audit.csv`,
                    ).catch((e) => toast.error(describeError(e)))
                  }
                >
                  Export CSV
                </Button>
              }
            >
              <QueryBoundary
                query={timeline}
                isEmpty={(d) => d.length === 0}
                empty="No timeline entries."
              >
                {(rows) => (
                  <ul className="divide-y divide-border/60 border border-border">
                    {rows.map((t) => (
                      <li key={t.id} className="px-3 py-2">
                        <div className="flex justify-between gap-3">
                          <span className="text-xs">{t.summary}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {when(t.created_at)}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {t.kind}
                          {t.actor ? ` · ${t.actor}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </QueryBoundary>
            </Section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
