import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle, Send, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { corridors, pilots, settlements } from "@/lib/api/endpoints";
import type { PreflightResult, SettlementCommand } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, when } from "@/lib/format";
import { useOperator } from "@/lib/session";

export const Route = createFileRoute("/settlements")({
  head: () => ({ meta: [{ title: "Settlements & Pilots — VUKA" }] }),
  component: () => (
    <Shell role="operator">
      <Settlements />
    </Shell>
  ),
});

const ACTIONS = ["payout", "fund", "release", "refund", "timeout", "arbitration"];
const tone = (s: string) =>
  ["succeeded", "approved", "active", "completed"].includes(s)
    ? ("invert" as const)
    : ["failed", "cancelled", "expired", "rejected", "paused"].includes(s)
      ? ("warn" as const)
      : ("live" as const);

function Settlements() {
  const me = useOperator();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["settlements"], queryFn: () => settlements.list() });
  const pilotList = useQuery({ queryKey: ["pilots"], queryFn: pilots.list });
  const [createOpen, setCreateOpen] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [approving, setApproving] = useState<SettlementCommand | null>(null);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["settlements"] });

  const run = useMutation({
    mutationFn: async ({
      kind,
      cmd,
    }: {
      kind: "preflight" | "execute" | "cancel";
      cmd: SettlementCommand;
    }) => {
      if (kind === "preflight") setPreflight(await settlements.preflight(cmd.id, false));
      else if (kind === "execute") await settlements.execute(cmd.id);
      else await settlements.cancel(cmd.id);
      return kind;
    },
    onSuccess: (kind) => {
      if (kind !== "preflight")
        toast.success(kind === "execute" ? "Execution recorded (dry run)" : "Command cancelled");
      refresh();
    },
    onError: (e) => toast.error("Action refused", { description: describeError(e) }),
  });

  const pilotAction = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "pause" | "resume" | "cancel" | "complete";
    }) => pilots.action(id, action),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["pilots"] }),
    onError: (e) => toast.error("Pilot action refused", { description: describeError(e) }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Controlled settlement"
        title="Settlements & Pilots"
        description="Settlement commands need multiple approvals and pass preflight checks. Live execution is refused by policy: execute records a dry run only. Pilots are supervised, observation-only programmes."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <PlusCircle className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
            New command
          </Button>
        }
      />

      <QueryBoundary query={list}>
        {({ commands, policy }) => (
          <>
            {/* Executive Controlled Settlement Banner */}
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
                    <Send className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                      Multi-Approval Settlement Governance · Dry-Run Policy Guard
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Preflight-Gated Settlement Command Queue
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                    Every command requires {policy.RequiredApprovals} distinct arbiter approval(s)
                    and passes deterministic preflight checks before dry-run execution is recorded.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
                  {policy.ExecutionEnabled ? (
                    <ShieldAlert className="size-4 text-amber-400" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                      Execution Mode
                    </div>
                    <div className="font-bold text-white">
                      {policy.ExecutionEnabled ? "Live Enabled" : "Dry-Run Enforced"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Kill switch"
                value={policy.GlobalKillSwitch ? "ACTIVE" : "off"}
                sub="Deployment configuration"
                accent={policy.GlobalKillSwitch ? "warn" : "lime"}
              />
              <Metric
                label="Live execution"
                value={policy.ExecutionEnabled ? "enabled" : "disabled"}
                sub="Dry run only when disabled"
              />
              <Metric
                label="Approvals required"
                value={policy.RequiredApprovals}
                sub="Distinct approvers"
              />
              <Metric
                label="Per-command cap"
                value={money(fromMinor(policy.MaxAmountMinor))}
                sub={`Daily ${money(fromMinor(policy.DailyLimitMinor))}`}
              />
            </div>

            {commands.length > 0 ? (
              <Panel
                title="Commands by status"
                subtitle="Lifecycle distribution across submitted settlement commands"
              >
                <LazyDonutChart
                  ariaLabel="Settlement commands by status"
                  data={Object.entries(
                    commands.reduce<Record<string, number>>((acc, c) => {
                      acc[c.status] = (acc[c.status] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([label, value]) => ({ label, value }))}
                  center={{ value: String(commands.length), label: "Commands" }}
                  format={(v) => String(v)}
                />
              </Panel>
            ) : null}

            <Panel
              title="Settlement commands"
              subtitle="Run preflight checks, approve (arbiter), or execute dry-run settlement actions"
              meta={<Chip tone="live">{commands.length} commands</Chip>}
            >
              {commands.length === 0 ? (
                <p className="text-xs text-muted-foreground">No settlement commands submitted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-2.5 py-2.5">Command</th>
                        <th className="px-2.5 py-2.5">Action</th>
                        <th className="px-2.5 py-2.5">Target</th>
                        <th className="px-2.5 py-2.5 text-right">Amount</th>
                        <th className="px-2.5 py-2.5">Requested</th>
                        <th className="px-2.5 py-2.5">Approval</th>
                        <th className="px-2.5 py-2.5 text-right">Status</th>
                        <th className="px-2.5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {commands.map((c) => {
                        const closed = ["succeeded", "failed", "cancelled", "expired"].includes(
                          c.status,
                        );
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-2.5 py-3 font-mono text-xs font-semibold">
                              {shortId(c.id)}
                            </td>
                            <td className="px-2.5 py-3 font-mono text-xs uppercase">{c.action}</td>
                            <td className="px-2.5 py-3 font-mono text-xs text-muted-foreground">
                              {c.target}
                            </td>
                            <td className="px-2.5 py-3 text-right font-mono font-semibold tabular-nums">
                              {money(fromMinor(c.amount_minor), c.currency)}
                            </td>
                            <td className="px-2.5 py-3 font-mono text-[11px] text-muted-foreground">
                              {c.requested_by}
                              <br />
                              {when(c.created_at)}
                            </td>
                            <td className="px-2.5 py-3">
                              <Chip tone={tone(c.approval_state)}>{c.approval_state}</Chip>
                            </td>
                            <td className="px-2.5 py-3 text-right">
                              <Chip tone={tone(c.status)}>{c.status}</Chip>
                            </td>
                            <td className="px-2.5 py-3 text-right">
                              {!closed ? (
                                <div className="flex justify-end gap-1.5">
                                  <Mini onClick={() => run.mutate({ kind: "preflight", cmd: c })}>
                                    Preflight
                                  </Mini>
                                  {me.role === "arbiter" && c.approval_state === "pending" ? (
                                    <Mini onClick={() => setApproving(c)}>Approve</Mini>
                                  ) : null}
                                  {c.approval_state === "approved" ? (
                                    <Mini onClick={() => run.mutate({ kind: "execute", cmd: c })}>
                                      Execute
                                    </Mini>
                                  ) : null}
                                  <Mini onClick={() => run.mutate({ kind: "cancel", cmd: c })}>
                                    Cancel
                                  </Mini>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {me.role !== "arbiter" ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Approvals can only be given by an arbiter account; operators submit, run preflight
                  and cancel.
                </p>
              ) : null}
            </Panel>
          </>
        )}
      </QueryBoundary>

      <Panel
        title="Supervised pilots"
        subtitle="Bounded corridor pilot programmes with per-transaction and daily caps"
        meta={<Chip>{pilotList.data?.observationOnly ? "Observation only" : "—"}</Chip>}
      >
        <QueryBoundary
          query={pilotList}
          isEmpty={(d) => d.pilots.length === 0}
          empty="No pilots configured. Seed one with `make pilot-seed` or create it via the API."
        >
          {({ pilots: rows }) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-2.5 py-2.5">Pilot</th>
                    <th className="px-2.5 py-2.5">Corridor</th>
                    <th className="px-2.5 py-2.5">Scope</th>
                    <th className="px-2.5 py-2.5 text-right">Limits (txn / day)</th>
                    <th className="px-2.5 py-2.5">Window</th>
                    <th className="px-2.5 py-2.5 text-right">Status</th>
                    <th className="px-2.5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-2.5 py-3 font-mono text-xs font-semibold">
                        {shortId(p.id)}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-xs">{p.corridor_id}</td>
                      <td className="px-2.5 py-3 text-xs text-muted-foreground">{p.scope}</td>
                      <td className="px-2.5 py-3 text-right font-mono text-xs tabular-nums">
                        {money(fromMinor(p.transaction_limit_minor))} /{" "}
                        {money(fromMinor(p.daily_limit_minor))}
                      </td>
                      <td className="px-2.5 py-3 font-mono text-[11px] text-muted-foreground">
                        {when(p.start_at)} → {when(p.end_at)}
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <Chip tone={tone(p.status)}>{p.status}</Chip>
                      </td>
                      <td className="px-2.5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {p.status === "active" ? (
                            <Mini onClick={() => pilotAction.mutate({ id: p.id, action: "pause" })}>
                              Pause
                            </Mini>
                          ) : null}
                          {p.status === "paused" ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "resume" })}
                            >
                              Resume
                            </Mini>
                          ) : null}
                          {p.status === "active" ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "complete" })}
                            >
                              Complete
                            </Mini>
                          ) : null}
                          {["draft", "planned", "approved", "active", "paused"].includes(
                            p.status,
                          ) ? (
                            <Mini
                              onClick={() => pilotAction.mutate({ id: p.id, action: "cancel" })}
                            >
                              Cancel
                            </Mini>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
      </Panel>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onDone={refresh} />
      <ApproveDialog cmd={approving} onClose={() => setApproving(null)} onDone={refresh} />
      <Dialog open={preflight !== null} onOpenChange={(o) => !o && setPreflight(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          {preflight ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                  Preflight {shortId(preflight.command_id)}
                </DialogTitle>
                <DialogDescription>
                  {preflight.passed
                    ? "All required checks passed."
                    : "One or more required checks failed."}
                </DialogDescription>
              </DialogHeader>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {preflight.checks.map((c) => (
                  <li key={c.name} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                    <div>
                      <div className="font-mono text-xs font-semibold">
                        {c.name}
                        {c.required ? "" : " (advisory)"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.explain}</p>
                    </div>
                    <Chip tone={c.passed ? "invert" : "warn"}>{c.passed ? "PASS" : "FAIL"}</Chip>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Mini({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 rounded-lg px-2.5 font-mono text-[10px] uppercase"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</Label>
      {children}
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridors.providers,
    enabled: open,
  });
  const [action, setAction] = useState("payout");
  const [target, setTarget] = useState("");
  const [provider, setProvider] = useState("");
  const [corridor, setCorridor] = useState("rw-rwf-ke-kes");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [reason, setReason] = useState("");
  // Key held for the life of the dialog so a double-click cannot submit twice.
  const [key] = useState(() => crypto.randomUUID());

  const create = useMutation({
    mutationFn: () =>
      settlements.submit(
        {
          action,
          target: target.trim(),
          provider_id: provider || providers.data?.[0]?.config.id || "",
          corridor_id: corridor.trim(),
          amount_minor: toMinor(Number(amount)),
          currency: currency.trim().toUpperCase(),
          reason: reason.trim(),
        },
        key,
      ),
    onSuccess: ({ command }) => {
      toast.success(`Command ${shortId(command.id)} submitted`, {
        description: "Dry-run only; awaiting approvals.",
      });
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error("Command refused", { description: describeError(e) }),
  });

  const ok =
    target.trim() &&
    Number(amount) > 0 &&
    reason.trim() &&
    corridor.trim() &&
    currency.trim().length === 3;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            New settlement command
          </DialogTitle>
          <DialogDescription>
            Submitted commands are idempotent and can never move real funds while live execution is
            disabled.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Action">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger aria-label="Action" className="rounded-lg font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Provider">
            <Select
              value={provider || providers.data?.[0]?.config.id || ""}
              onValueChange={setProvider}
            >
              <SelectTrigger aria-label="Provider" className="rounded-lg font-mono text-xs">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {(providers.data ?? []).map((p) => (
                  <SelectItem key={p.config.id} value={p.config.id}>
                    {p.config.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Target">
            <Input
              className="rounded-lg font-mono"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="escrow / transfer reference"
            />
          </Field>
          <Field label="Corridor">
            <Input
              className="rounded-lg font-mono"
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
            />
          </Field>
          <Field label="Amount">
            <Input
              className="rounded-lg font-mono"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <Input
              className="rounded-lg font-mono"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Reason">
          <Textarea
            className="min-h-20 rounded-lg"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!ok || create.isPending}
            onClick={() => create.mutate()}
          >
            Submit command
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveDialog({
  cmd,
  onClose,
  onDone,
}: {
  cmd: SettlementCommand | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      settlements.approve(cmd!.id, decision, reason.trim()),
    onSuccess: (_r, decision) => {
      toast.success(`Command ${decision}`);
      setReason("");
      onDone();
      onClose();
    },
    onError: (e) => toast.error("Approval refused", { description: describeError(e) }),
  });
  return (
    <Dialog open={cmd !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
            Approval
          </DialogTitle>
          <DialogDescription>
            {cmd
              ? `${cmd.action} ${money(fromMinor(cmd.amount_minor), cmd.currency)} → ${cmd.target}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-20 rounded-lg"
          placeholder="Reason for your decision…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-lg font-mono text-xs uppercase"
            disabled={!reason.trim() || decide.isPending}
            onClick={() => decide.mutate("rejected")}
          >
            Reject
          </Button>
          <Button
            className="rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
            disabled={!reason.trim() || decide.isPending}
            onClick={() => decide.mutate("approved")}
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
