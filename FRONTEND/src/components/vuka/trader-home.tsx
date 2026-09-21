import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usd0 } from "@/components/vuka/analytics-parts";
import { LazyTrendChart } from "@/components/vuka/lazy-charts";
import { QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel } from "@/components/vuka/shell";
import { describeError } from "@/lib/api/client";
import { Sparkline } from "@/components/vuka/viz/simple";
import { platform, support } from "@/lib/api/endpoints";
import { money, shortId, when } from "@/lib/format";
import { useTrader } from "@/lib/session";
import { directionFor, useNotifications, useTransfers, useWallet } from "@/lib/trader-data";

export function TraderHome() {
  const trader = useTrader();
  const qc = useQueryClient();
  const wallet = useWallet();
  const transfers = useTransfers();
  const notifications = useNotifications();

  const ownIds = useMemo(
    () => new Set(wallet.data?.accounts.map((a) => a.id) ?? []),
    [wallet.data],
  );
  const unread = (notifications.data ?? []).filter((n) => !n.read_at);

  const markRead = useMutation({
    mutationFn: (id: string) => support.markRead(id, trader.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => toast.error(describeError(e)),
  });

  const analytics = useQuery({
    queryKey: ["analytics", "trader", 30],
    queryFn: () => platform.analytics(30),
    staleTime: 60_000,
  });

  const verified = trader.kyc_status === "VERIFIED" || trader.kyc_status === "APPROVED";

  return (
    <>
      <PageHeader
        eyebrow="Trader overview"
        title={`Welcome, ${trader.full_name}`}
        description="Your business and personal money, kept apart. Send payments across corridors, issue invoices, and follow every settlement to the ledger."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-none font-mono text-xs uppercase">
              <Link to="/escrow">Invoices</Link>
            </Button>
            <Button asChild className="rounded-none font-mono text-xs uppercase">
              <Link to="/send">Send payment</Link>
            </Button>
          </>
        }
      />

      {!verified ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
              Verification {trader.kyc_status.toLowerCase()}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Your account is not yet verified. Higher limits and new counterparties require a
              completed identity check by the compliance team.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-none font-mono text-[10px] uppercase"
          >
            <Link to="/support">Request verification</Link>
          </Button>
        </div>
      ) : null}

      <QueryBoundary query={wallet}>
        {(w) => (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {w.accounts.map((a) => (
              <Metric
                key={a.id}
                label={`${a.type === "BUSINESS" ? "Business trade" : "Personal"} wallet`}
                value={money(w.balances[a.id]?.amount ?? 0, a.currency)}
                sub="Derived from ledger postings"
              />
            ))}
            <Metric label="Verification" value={trader.kyc_status} sub={trader.phone_number} />
            <Metric
              label="Unread notices"
              value={unread.length}
              sub="From settlements and support"
            />
          </div>
        )}
      </QueryBoundary>

      <Panel
        title="Last 30 days"
        meta={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-none font-mono text-[10px] uppercase"
          >
            <Link to="/analytics">Open insights</Link>
          </Button>
        }
      >
        <QueryBoundary query={analytics} disabledCodes={["analytics_unavailable"]}>
          {(r) => (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Sent"
                  value={usd0(r.totals.sent_usd)}
                  trend={<Sparkline values={r.daily.map((d) => d.out_usd)} />}
                />
                <Metric
                  label="Received"
                  value={usd0(r.totals.received_usd)}
                  trend={<Sparkline values={r.daily.map((d) => d.in_usd)} />}
                />
                <Metric
                  label="Success rate"
                  value={`${Math.round(r.totals.success_rate * 100)}%`}
                  sub={`${r.totals.succeeded} of ${r.totals.succeeded + r.totals.failed + r.totals.reversed} finished`}
                />
              </div>
              <LazyTrendChart
                data={r.daily.map((d) => ({ label: d.date.slice(5), a: d.out_usd, b: d.in_usd }))}
                aName="Money out"
                bName="Money in"
                ariaLabel="Money in and out per day, USD equivalent"
                format={usd0}
              />
            </div>
          )}
        </QueryBoundary>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Recent activity"
          className="lg:col-span-2"
          meta={
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 rounded-none font-mono text-[10px] uppercase"
            >
              <Link to="/wallets">All transfers</Link>
            </Button>
          }
        >
          <QueryBoundary
            query={transfers}
            isEmpty={(d) => d.length === 0}
            empty="No transfers yet. Top up your business wallet to get started."
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((t) => {
                  const dir = directionFor(t, ownIds);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <div className="font-mono text-xs">
                          {dir === "out" ? "Sent" : dir === "in" ? "Received" : "Internal"} ·{" "}
                          {shortId(t.id)}
                          {t.invoice_number ? ` · ${t.invoice_number}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">{when(t.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm tabular-nums">
                          {dir === "out" ? "−" : dir === "in" ? "+" : ""}
                          {money(t.amount, t.currency)}
                        </span>
                        <Chip
                          tone={
                            t.status === "SUCCESS"
                              ? "invert"
                              : t.status === "FAILED" || t.status === "REVERSED"
                                ? "warn"
                                : "live"
                          }
                        >
                          {t.status}
                        </Chip>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </QueryBoundary>
        </Panel>

        <Panel title="Notifications" meta={<Chip>{unread.length} unread</Chip>}>
          <QueryBoundary
            query={notifications}
            isEmpty={(d) => d.length === 0}
            empty="Nothing to report."
            disabledCodes={["support_unavailable"]}
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 6).map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div
                          className={
                            n.read_at ? "text-sm text-muted-foreground" : "text-sm font-medium"
                          }
                        >
                          {n.title}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {when(n.created_at)}
                        </div>
                      </div>
                      {!n.read_at ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 rounded-none px-2 font-mono text-[10px] uppercase"
                          disabled={markRead.isPending}
                          onClick={() => markRead.mutate(n.id)}
                        >
                          Read
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>
      </div>
    </>
  );
}
