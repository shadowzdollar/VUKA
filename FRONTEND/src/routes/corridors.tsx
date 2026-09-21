import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { corridors as corridorApi } from "@/lib/api/endpoints";
import type { Corridor } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, when } from "@/lib/format";
import { buildPacs008, structuralCheck } from "@/lib/pacs008";
import { useSession, useTrader } from "@/lib/session";
import { useTransfers, useWallet } from "@/lib/trader-data";

export const Route = createFileRoute("/corridors")({
  head: () => ({
    meta: [
      { title: "Corridors — VUKA" },
      {
        name: "description",
        content: "Corridor pricing, limits, provider health and ISO 20022 message rendering.",
      },
    ],
  }),
  component: CorridorsPage,
});

function CorridorsPage() {
  return (
    <Shell>
      <Switch />
    </Shell>
  );
}

function Switch() {
  const { session } = useSession();
  return session.status === "operator" ? <OperatorProviders /> : <TraderCorridors />;
}

// ---------------------------------------------------------------------------------------------
// Trader: rate card, live quote, ISO 20022 rendering of a real transfer
// ---------------------------------------------------------------------------------------------
function TraderCorridors() {
  const corridors = useQuery({ queryKey: ["corridors"], queryFn: corridorApi.list });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("100000");

  const selected: Corridor | undefined =
    corridors.data?.find((c) => c.id === selectedId) ?? corridors.data?.[0];
  const minor = Number(amount) > 0 ? toMinor(Number(amount)) : 0;

  const quote = useQuery({
    queryKey: ["quote", selected?.id, minor],
    queryFn: () => corridorApi.quote(selected!.id, minor),
    enabled: !!selected && minor > 0,
    retry: false,
  });

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Corridors"
        description="Live corridor pricing and limits from the engine, a firm quote calculator, and an ISO 20022 rendering of your own transfers."
      />

      <QueryBoundary
        query={corridors}
        isEmpty={(d) => d.length === 0}
        empty="No corridors are configured."
      >
        {(rows) => (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Corridors" value={rows.length} sub="Configured on this engine" />
              <Metric
                label="Enabled"
                value={rows.filter((c) => c.enabled && !c.kill_switch).length}
                sub="Accepting quotes"
              />
              <Metric
                label="Halted"
                value={rows.filter((c) => c.kill_switch).length}
                sub="Kill switch active"
              />
            </div>

            <Panel title="Corridor rate card" meta={<Chip tone="live">Live from engine</Chip>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="py-2">Corridor</th>
                      <th className="py-2">Pair</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Fee</th>
                      <th className="py-2 text-right">Min / max</th>
                      <th className="py-2">Provider</th>
                      <th className="py-2 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40 ${selected?.id === c.id ? "bg-accent/30" : ""}`}
                      >
                        <td className="py-2.5 font-mono text-xs">{c.id}</td>
                        <td className="py-2.5 font-mono text-xs">
                          {c.from_currency} → {c.to_currency} ({c.from_country}→{c.to_country})
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{c.fx.rate}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">
                          {c.fees_bps / 100}%
                          {c.fixed_fee_minor ? ` + ${fromMinor(c.fixed_fee_minor)}` : ""}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                          {money(fromMinor(c.min_amount_minor))} –{" "}
                          {money(fromMinor(c.max_amount_minor))}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{c.provider_id}</td>
                        <td className="py-2.5 text-right">
                          <Chip tone={c.kill_switch || !c.enabled ? "warn" : "invert"}>
                            {c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {selected ? (
              <Panel title="Quote calculator" meta={<Chip>{selected.id}</Chip>}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Send amount ({selected.from_currency})
                    </Label>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="decimal"
                      className="rounded-none font-mono"
                    />
                  </div>
                  <div>
                    {minor === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Enter an amount for a firm quote.
                      </p>
                    ) : quote.isFetching && !quote.data ? (
                      <Loading label="Fetching quote" />
                    ) : quote.isError ? (
                      <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
                    ) : quote.data ? (
                      <dl className="space-y-2 border border-border p-3 font-mono text-xs">
                        <Row k="Rate applied" v={String(quote.data.quote.rate)} />
                        <Row
                          k="Fee"
                          v={`−${money(fromMinor(quote.data.quote.fee_minor), selected.from_currency)}`}
                        />
                        <div className="flex justify-between border-t border-border pt-2 text-sm">
                          <dt>Beneficiary receives</dt>
                          <dd className="tabular-nums">
                            {money(
                              fromMinor(quote.data.quote.deliver_amount_minor),
                              selected.to_currency,
                            )}
                          </dd>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Quote {quote.data.quote.id} · expires {when(quote.data.quote.expires_at)}
                        </p>
                      </dl>
                    ) : null}
                  </div>
                </div>
              </Panel>
            ) : null}
          </>
        )}
      </QueryBoundary>

      <IsoViewer />
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

function IsoViewer() {
  const trader = useTrader();
  const wallet = useWallet();
  const transfers = useTransfers();
  const [id, setId] = useState("");
  const [result, setResult] = useState<ReturnType<typeof structuralCheck> | null>(null);

  const usable = (transfers.data ?? []).filter((t) => t.status === "SUCCESS");
  const t = usable.find((x) => x.id === id) ?? usable[0];
  const own = new Set(wallet.data?.accounts.map((a) => a.id) ?? []);
  const xml = t
    ? buildPacs008(t, {
        debtorName: own.has(t.source_account_id)
          ? trader.full_name
          : `VUKA account ${shortId(t.source_account_id)}`,
        creditorName: own.has(t.destination_account_id)
          ? trader.full_name
          : `VUKA account ${shortId(t.destination_account_id)}`,
      })
    : "";

  return (
    <Panel
      title="ISO 20022 pacs.008 message"
      meta={
        <>
          {result ? (
            <Chip tone={result.ok ? "invert" : "warn"}>
              {result.ok ? "Structure OK" : `${result.problems.length} problem(s)`}
            </Chip>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={!xml}
            className="h-7 rounded-none font-mono text-[10px] uppercase"
            onClick={() => {
              const r = structuralCheck(xml);
              setResult(r);
              if (r.ok) toast.success("Well-formed, all mandatory elements present");
              else toast.error(r.problems[0] ?? "Invalid message");
            }}
          >
            Check structure
          </Button>
        </>
      }
    >
      {transfers.isPending ? (
        <Loading />
      ) : usable.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Complete a payment to render it as a standards-based credit-transfer message.
        </p>
      ) : (
        <>
          <div className="mb-3 max-w-md space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Transfer</Label>
            <Select
              value={t?.id ?? ""}
              onValueChange={(v) => {
                setId(v);
                setResult(null);
              }}
            >
              <SelectTrigger className="rounded-none font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {usable.slice(0, 25).map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {shortId(x.id)} · {money(x.amount, x.currency)}
                    {x.invoice_number ? ` · ${x.invoice_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <pre className="overflow-x-auto border border-border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed">
            {xml}
          </pre>
          {result && !result.ok ? (
            <ul className="mt-3 border-2 border-foreground p-3 text-xs">
              {result.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            Rendered in your browser from the ledger transfer. The check above confirms
            well-formedness and mandatory elements only; full schema validation is performed by the
            ISO 20022 gateway service.
          </p>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------
// Operator: provider health, webhook evidence, provider reconciliation
// ---------------------------------------------------------------------------------------------
function OperatorProviders() {
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: corridorApi.providers,
    refetchInterval: 30_000,
  });
  const events = useQuery({ queryKey: ["webhook-events"], queryFn: corridorApi.webhookEvents });
  const recon = useQuery({ queryKey: ["provider-recon"], queryFn: corridorApi.reconciliation });

  return (
    <>
      <PageHeader
        eyebrow="Network operations"
        title="Corridors & Providers"
        description="Telecom provider readiness and kill switches, authenticated webhook evidence, and per-corridor provider reconciliation. Callbacks are evidence only and never mutate ledger entries."
      />

      <QueryBoundary
        query={providers}
        isEmpty={(d) => d.length === 0}
        empty="No providers registered."
      >
        {(rows) => (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Providers" value={rows.length} sub="Registered adapters" />
              <Metric
                label="Healthy"
                value={rows.filter((p) => p.healthy).length}
                sub="Passing readiness checks"
              />
              <Metric
                label="Kill switch"
                value={rows.filter((p) => p.config.kill_switch).length}
                sub="Providers halted"
              />
              <Metric
                label="External calls"
                value={rows.filter((p) => p.config.external_calls).length}
                sub="Live provider traffic"
              />
            </div>
            <Panel title="Provider registry" meta={<Chip tone="live">Sandbox</Chip>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="py-2">Provider</th>
                      <th className="py-2">Environment</th>
                      <th className="py-2">Countries</th>
                      <th className="py-2">Currencies</th>
                      <th className="py-2">Checked</th>
                      <th className="py-2 text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.config.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5">
                          <div>{p.config.display_name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {p.config.id}
                          </div>
                        </td>
                        <td className="py-2.5 font-mono text-xs">{p.config.environment}</td>
                        <td className="py-2.5 font-mono text-xs">
                          {p.config.supported_countries.join(", ")}
                        </td>
                        <td className="py-2.5 font-mono text-xs">
                          {p.config.supported_currencies.join(", ")}
                        </td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">
                          {when(p.last_checked)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Chip tone={p.config.kill_switch || !p.healthy ? "warn" : "invert"}>
                            {p.config.kill_switch
                              ? "KILL SWITCH"
                              : p.healthy
                                ? "HEALTHY"
                                : "DEGRADED"}
                          </Chip>
                          {p.reason ? (
                            <div className="mt-1 text-[10px] text-muted-foreground">{p.reason}</div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </QueryBoundary>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Provider reconciliation">
          <QueryBoundary
            query={recon}
            isEmpty={(d) => d.length === 0}
            empty="No reconciliation records yet."
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.map((r) => (
                  <li
                    key={`${r.provider_id}-${r.corridor_id}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div>
                      <div className="font-mono text-xs">
                        {r.provider_id} · {r.corridor_id}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.open_items} open · last event {when(r.last_event_at)}
                      </div>
                    </div>
                    <Chip tone={r.open_items > 0 ? "warn" : "invert"}>{r.state}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Panel>

        <Panel title="Webhook evidence">
          <QueryBoundary
            query={events}
            isEmpty={(d) => d.length === 0}
            empty="No provider callbacks received."
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <div className="font-mono text-xs">
                        {e.provider_id} · {e.event_type}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {when(e.received_at)} · {e.settlement_action}
                      </div>
                    </div>
                    <Chip tone={e.authenticated ? "invert" : "warn"}>
                      {e.authenticated ? "AUTHENTICATED" : "UNVERIFIED"}
                    </Chip>
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
