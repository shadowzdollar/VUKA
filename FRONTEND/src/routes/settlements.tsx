import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
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
            className="rounded-none font-mono text-xs uppercase"
          >
            New command
          </Button>
        }
      />

      <QueryBoundary query={list}>
        {({ commands, policy }) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Kill switch"
                value={policy.GlobalKillSwitch ? "ACTIVE" : "off"}
                sub="Deployment configuration"
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

            <Panel
              title="Settlement commands"
              meta={<Chip tone="live">{commands.length} commands</Chip>}
            >
              {commands.length === 0 ? (
                <p className="text-xs text-muted-foreground">No settlement commands submitted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="py-2">Command</th>
                        <th className="py-2">Action</th>
                        <th className="py-2">Target</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2">Requested</th>
                        <th className="py-2">Approval</th>
                        <th className="py-2 text-right">Status</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {commands.map((c) => {
                        const closed = ["succeeded", "failed", "cancelled", "expired"].includes(
                          c.status,
                        );
                        return (
                          <tr key={c.id} className="border-b border-border/60 last:border-0">
                            <td className="py-2.5 font-mono text-xs">{shortId(c.id)}</td>
                            <td className="py-2.5 font-mono text-xs">{c.action}</td>
                            <td className="py-2.5 font-mono text-xs text-muted-foreground">
                              {c.target}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums">
                              {money(fromMinor(c.amount_minor), c.currency)}
                            </td>
                            <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                              {c.requested_by}
                              <br />
                              {when(c.created_at)}
                            </td>
                            <td className="py-2.5">
                              <Chip tone={tone(c.approval_state)}>{c.approval_state}</Chip>
                            </td>
                            <td className="py-2.5 text-right">
                              <Chip tone={tone(c.status)}>{c.status}</Chip>
                            </td>
                            <td className="py-2.5 text-right">
                              {!closed ? (
                                <div className="flex justify-end gap-1">
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
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-2">Pilot</th>
                    <th className="py-2">Corridor</th>
                    <th className="py-2">Scope</th>
                    <th className="py-2 text-right">Limits (txn / day)</th>
                    <th className="py-2">Window</th>
                    <th className="py-2 text-right">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-mono text-xs">{shortId(p.id)}</td>
                      <td className="py-2.5 font-mono text-xs">{p.corridor_id}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{p.scope}</td>
                      <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                        {money(fromMinor(p.transaction_limit_minor))} /{" "}
                        {money(fromMinor(p.daily_limit_minor))}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                        {when(p.start_at)} → {when(p.end_at)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Chip tone={tone(p.status)}>{p.status}</Chip>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
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
        <DialogContent className="rounded-none sm:max-w-lg">
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
              <ul className="divide-y divide-border border border-border">
                {preflight.checks.map((c) => (
                  <li key={c.name} className="flex items-start justify-between gap-3 px-3 py-2">
                    <div>
                      <div className="font-mono text-xs">
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
      className="h-7 rounded-none px-2 font-mono text-[10px] uppercase"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
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
              <SelectTrigger aria-label="Action" className="rounded-none font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
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
              <SelectTrigger aria-label="Provider" className="rounded-none font-mono text-xs">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
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
              className="rounded-none font-mono"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="escrow / transfer reference"
            />
          </Field>
          <Field label="Corridor">
            <Input
              className="rounded-none font-mono"
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
            />
          </Field>
          <Field label="Amount">
            <Input
              className="rounded-none font-mono"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <Input
              className="rounded-none font-mono"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Reason">
          <Textarea
            className="min-h-20 rounded-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button
            className="rounded-none font-mono text-xs uppercase"
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
      <DialogContent className="rounded-none sm:max-w-md">
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
          className="min-h-20 rounded-none"
          placeholder="Reason for your decision…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-none font-mono text-xs uppercase"
            disabled={!reason.trim() || decide.isPending}
            onClick={() => decide.mutate("rejected")}
          >
            Reject
          </Button>
          <Button
            className="rounded-none font-mono text-xs uppercase"
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
