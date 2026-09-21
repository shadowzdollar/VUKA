import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChainScopeBar } from "@/components/vuka/chain-scope-bar";
import { EmptyState, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { corridors, operator, pilots, settlements } from "@/lib/api/endpoints";
import type { ReconciliationStatus } from "@/lib/api/types";
import { scopeReady, useChainScope } from "@/lib/chain-scope";
import { money, tokenUnits, when } from "@/lib/format";
import { useOperator } from "@/lib/session";

/** Must match the wording the engine computes in handleAcknowledgeReconciliationAlert. */
function alertMessage(s: ReconciliationStatus): string {
  const errs = s.metrics.Errors;
  return errs > 0
    ? `The worker has reported ${errs} error${errs === 1 ? "" : "s"}.`
    : `Indexing is behind by ${s.lag_blocks} finalized blocks.`;
}

export function OperatorCockpit() {
  const me = useOperator();
  const qc = useQueryClient();
  const [scope, setScope] = useChainScope();
  const ready = scopeReady(scope);

  const status = useQuery({
    queryKey: ["recon-status", scope],
    queryFn: () => operator.reconciliationStatus(scope),
    enabled: ready,
    refetchInterval: 15_000,
    retry: false,
  });
  const escrows = useQuery({
    queryKey: ["escrows", scope],
    queryFn: () => operator.escrows(scope),
    enabled: ready,
    refetchInterval: 30_000,
    retry: false,
  });
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridors.providers,
    refetchInterval: 30_000,
  });
  const policy = useQuery({ queryKey: ["settlements"], queryFn: () => settlements.list() });
  const pilotList = useQuery({ queryKey: ["pilots"], queryFn: pilots.list });

  const ack = useMutation({
    mutationFn: (s: ReconciliationStatus) =>
      operator.ackAlert(scope, s.alert_level as "warning" | "critical", alertMessage(s)),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      void qc.invalidateQueries({ queryKey: ["recon-status"] });
    },
    onError: (e) => toast.error("Could not acknowledge", { description: describeError(e) }),
  });

  const sums = { locked: 0, released: 0, refunded: 0, disputed: 0 };
  for (const e of escrows.data ?? []) {
    const v = tokenUnits(e.amount);
    if (e.state === "LOCKED" || e.state === "CREATED") sums.locked += v;
    else if (e.state === "RELEASED") sums.released += v;
    else if (e.state === "REFUNDED") sums.refunded += v;
    else sums.disputed += v;
  }

  return (
    <>
      <PageHeader
        eyebrow="Executive operations"
        title="Settlement Cockpit"
        description={`Signed in as ${me.email} (${me.role}). Chain reconciliation, escrow exposure, provider readiness and the settlement safety policy in one view.`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-none font-mono text-xs uppercase">
              <Link to="/escrow">Escrow register</Link>
            </Button>
            <Button asChild className="rounded-none font-mono text-xs uppercase">
              <Link to="/disputes">Dispute tribunal</Link>
            </Button>
          </>
        }
      />

      <ChainScopeBar scope={scope} onChange={setScope} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Escrow locked"
          value={ready ? money(sums.locked) : "—"}
          sub="Token units in contract"
        />
        <Metric
          label="Released"
          value={ready ? money(sums.released) : "—"}
          sub="Paid to suppliers"
        />
        <Metric
          label="Refunded"
          value={ready ? money(sums.refunded) : "—"}
          sub="Returned to buyers"
        />
        <Metric
          label="Disputed / frozen"
          value={ready ? money(sums.disputed) : "—"}
          sub="Under arbiter control"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Chain reconciliation"
          className="lg:col-span-2"
          meta={
            status.data ? (
              <Chip tone={status.data.alert_level === "ok" ? "invert" : "warn"}>
                {status.data.alert_level}
              </Chip>
            ) : null
          }
        >
          {!ready ? (
            <EmptyState>Enter the escrow contract above to see reconciliation status.</EmptyState>
          ) : (
            <QueryBoundary query={status} disabledCodes={["reconciliation_disabled"]}>
              {(s) => (
                <div className="space-y-4">
                  <dl className="grid gap-2 font-mono text-xs sm:grid-cols-2">
                    <Row k="Cursor (indexed to)" v={String(s.cursor)} />
                    <Row k="Latest block" v={String(s.latest_block)} />
                    <Row k="Finalized block" v={String(s.finalized_block)} />
                    <Row
                      k="Lag (blocks)"
                      v={`${s.lag_blocks} (warn ${s.warning_lag_blocks} / crit ${s.critical_lag_blocks})`}
                    />
                    <Row k="Polls" v={`${s.metrics.SuccessfulPolls}/${s.metrics.Polls}`} />
                    <Row k="Events applied" v={String(s.metrics.EventsApplied)} />
                    <Row k="Worker errors" v={String(s.metrics.Errors)} />
                  </dl>
                  {s.alert_level !== "ok" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-3">
                      <div className="text-xs">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
                          {s.alert_level} alert
                        </div>
                        <p className="mt-1 text-muted-foreground">{alertMessage(s)}</p>
                        {s.acknowledged_by ? (
                          <p className="mt-1 text-muted-foreground">
                            Acknowledged by {s.acknowledged_by} · {when(s.acknowledged_at)}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none font-mono text-[10px] uppercase"
                        disabled={ack.isPending}
                        onClick={() => ack.mutate(s)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </QueryBoundary>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Settlement safety" meta={<Chip tone="live">Read-only</Chip>}>
            <QueryBoundary query={policy}>
              {(p) => (
                <dl className="space-y-2 font-mono text-xs">
                  <Row k="Global kill switch" v={p.policy.GlobalKillSwitch ? "ACTIVE" : "off"} />
                  <Row k="Live execution" v={p.policy.ExecutionEnabled ? "enabled" : "disabled"} />
                  <Row k="Approvals required" v={String(p.policy.RequiredApprovals)} />
                  <Row k="Per-command cap" v={money(p.policy.MaxAmountMinor / 100)} />
                  <Row
                    k="Pending commands"
                    v={String(p.commands.filter((c) => c.status === "pending").length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <p className="mt-3 text-[11px] text-muted-foreground">
              The kill switch is deployment configuration (VUKA_SETTLEMENT_GLOBAL_KILL_SWITCH). It
              cannot be toggled from the browser by design.
            </p>
          </Panel>

          <Panel title="Providers & pilots">
            <QueryBoundary query={providers}>
              {(rows) => (
                <dl className="space-y-2 font-mono text-xs">
                  <Row
                    k="Providers healthy"
                    v={`${rows.filter((r) => r.healthy).length}/${rows.length}`}
                  />
                  <Row
                    k="Providers halted"
                    v={String(rows.filter((r) => r.config.kill_switch).length)}
                  />
                </dl>
              )}
            </QueryBoundary>
            <div className="mt-2">
              <QueryBoundary query={pilotList}>
                {(p) => (
                  <dl className="space-y-2 font-mono text-xs">
                    <Row
                      k="Active pilots"
                      v={String(p.pilots.filter((x) => x.status === "active").length)}
                    />
                    <Row k="Observation only" v={p.observationOnly ? "yes" : "no"} />
                  </dl>
                )}
              </QueryBoundary>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
