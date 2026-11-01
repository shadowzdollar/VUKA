import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gavel, Scale, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
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
import { DataTable } from "@/components/vuka/data-table";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
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
  const me = useOperator();
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
        eyebrow="Arbitration & Separation of Duties"
        title="Dispute Tribunal"
        description="Disputes are raised on-chain and freeze the escrow. Arbiters record review notes and a RELEASE / REFUND recommendation; an operator approves it before the outcome is executed by the contract."
      />

      {/* Executive Dispute Tribunal Banner */}
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
              <Scale className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Two-Stage Arbitration Governance · {me.role.toUpperCase()} DESK
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              On-Chain Escrow Dispute Resolution
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
              Arbiters investigate claims and file written `RELEASE` or `REFUND` recommendations.
              Operators countersign and approve decisions before any smart-contract settlement is
              authorized.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
            <Gavel className="size-4 text-[#c2f74d]" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                Active Role
              </div>
              <div className="font-bold uppercase text-white">{me.role}</div>
            </div>
          </div>
        </div>
      </div>

      <ChainScopeBar scope={scope} onChange={setScope} />

      {!ready ? (
        <EmptyState>Enter the escrow contract address to load disputes.</EmptyState>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Metric
              label="Open disputes"
              value={open}
              sub="Awaiting a resolution"
              accent={open > 0 ? "warn" : "lime"}
            />
            <Metric
              label="Resolved"
              value={(disputes.data?.length ?? 0) - open}
              sub="Closed on-chain"
            />
            <Metric label="Total" value={disputes.data?.length ?? "—"} sub="For this contract" />
          </div>

          {disputes.data && disputes.data.length > 0 ? (
            <Panel
              title="Disputes by status"
              subtitle="Distribution of active vs resolved arbitration cases"
            >
              <LazyDonutChart
                ariaLabel="Disputes by status"
                data={Object.entries(
                  disputes.data.reduce<Record<string, number>>((acc, d) => {
                    acc[d.status] = (acc[d.status] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([label, value]) => ({ label, value }))}
                center={{ value: String(disputes.data.length), label: "Disputes" }}
                format={(v) => String(v)}
              />
            </Panel>
          ) : null}

          <Panel
            title="Arbitration queue"
            subtitle="Click any case row to inspect decisions, arbiter notes, and the append-only audit timeline"
            meta={<Chip tone="live">Live</Chip>}
          >
            <QueryBoundary
              query={disputes}
              disabledCodes={["reconciliation_disabled"]}
              isEmpty={(d) => d.length === 0}
              empty="No disputes have been raised for this contract."
            >
              {(rows) => (
                <DataTable
                  caption="Arbitration queue"
                  exportName="vuka-disputes.csv"
                  rows={rows}
                  rowKey={(d) => d.id}
                  onRowClick={setActive}
                  initialSort={{ key: "raised", dir: "desc" }}
                  columns={[
                    {
                      key: "case",
                      header: "Case",
                      sort: (d) => d.id,
                      text: (d) => d.id,
                      cell: (d) => (
                        <span className="font-mono text-xs font-semibold">
                          {truncMid(d.id, 8, 4)}
                        </span>
                      ),
                    },
                    {
                      key: "escrow",
                      header: "Escrow",
                      sort: (d) => d.escrow_id,
                      text: (d) => `#${d.escrow_id}`,
                      cell: (d) => <span className="font-mono text-xs">#{d.escrow_id}</span>,
                    },
                    {
                      key: "claim",
                      header: "Claim",
                      text: (d) => d.reason,
                      cell: (d) => <span className="line-clamp-2 text-xs">{d.reason}</span>,
                    },
                    {
                      key: "raised",
                      header: "Raised",
                      sort: (d) => d.created_at,
                      text: (d) => d.created_at,
                      cell: (d) => (
                        <span className="tabular font-mono text-xs text-muted-foreground">
                          {when(d.created_at)}
                        </span>
                      ),
                    },
                    {
                      key: "tx",
                      header: "Tx",
                      text: (d) => d.raised_transaction_hash,
                      cell: (d) => (
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncMid(d.raised_transaction_hash)}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      align: "right",
                      sort: (d) => d.status,
                      cell: (d) => <Chip tone={isOpen(d) ? "warn" : "invert"}>{d.status}</Chip>,
                    },
                  ]}
                />
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
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
            <p className="rounded-xl border border-border bg-muted/20 p-3.5 text-sm">
              {dispute.reason}
            </p>

            <Section title="Decisions">
              <QueryBoundary
                query={decisions}
                isEmpty={(d) => d.length === 0}
                empty="No recommendation yet."
              >
                {(rows) => (
                  <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                    {rows.map((d) => (
                      <li key={d.id} className="space-y-1.5 px-3.5 py-3">
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
                                className="h-7 rounded-lg font-mono text-[10px] uppercase"
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
                      <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
                        {rows.map((r) => (
                          <li key={r.id} className="px-3.5 py-2.5">
                            <p className="text-xs">{r.note}</p>
                            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
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
                      className="min-h-16 rounded-lg"
                    />
                    <Button
                      variant="outline"
                      className="rounded-lg font-mono text-[10px] uppercase"
                      disabled={!note.trim() || addNote.isPending}
                      onClick={() => addNote.mutate()}
                    >
                      Add note
                    </Button>
                  </div>
                </Section>

                {isOpen(dispute) ? (
                  <Section title="Record recommendation">
                    <div className="space-y-2.5">
                      <Select value={choice} onValueChange={(v) => setChoice(v as typeof choice)}>
                        <SelectTrigger
                          aria-label="Recommendation"
                          className="w-52 rounded-lg font-mono text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="RELEASE">Release to supplier</SelectItem>
                          <SelectItem value="REFUND">Refund to buyer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Written rationale (required, permanently recorded)…"
                        className="min-h-20 rounded-lg"
                      />
                      <Button
                        className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
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
              <p className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/15 p-3.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-[#79b200]" aria-hidden="true" />
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
                  className="h-7 rounded-lg font-mono text-[10px] uppercase"
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
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
                    {rows.map((t) => (
                      <li key={t.id} className="px-3.5 py-2.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-xs font-medium">{t.summary}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {when(t.created_at)}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
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
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
