import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Copy,
  FileCode2,
  Globe2,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
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
import { DataTable } from "@/components/vuka/data-table";
import { Flag } from "@/components/vuka/landing/flags";
import { LazyDonutChart } from "@/components/vuka/lazy-charts";
import { ErrorState, Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, PageHeader, Panel, Shell } from "@/components/vuka/shell";
import { corridors as corridorApi } from "@/lib/api/endpoints";
import type { Corridor } from "@/lib/api/types";
import { fromMinor, money, shortId, toMinor, truncMid, when } from "@/lib/format";
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

const QUOTE_PRESETS = ["25000", "100000", "500000", "1000000"] as const;

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
        eyebrow="Cross-Border FX & Settlement Mesh"
        title="Corridors"
        description="Live corridor pricing and limits from the engine, a firm quote calculator, and an ISO 20022 rendering of your own transfers."
        actions={
          <Button
            asChild
            className="gap-1.5 rounded-lg bg-[#151515] font-mono text-xs uppercase text-white hover:bg-[#151515]/90"
          >
            <Link to="/send">
              Send on Corridor
              <ArrowUpRight className="size-3.5 text-[#c2f74d]" />
            </Link>
          </Button>
        }
      />

      <QueryBoundary
        query={corridors}
        isEmpty={(d) => d.length === 0}
        empty="No corridors are configured."
      >
        {(rows) => {
          const liveCount = rows.filter((c) => c.enabled && !c.kill_switch).length;
          const haltedCount = rows.filter((c) => c.kill_switch).length;
          return (
            <>
              {/* Executive Corridor Mesh Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
                <img
                  src={escrowGlobe}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -bottom-16 w-[340px] opacity-[0.15] mix-blend-screen select-none"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-[#c2f74d]/10 blur-3xl"
                />

                <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                      <Globe2 className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                        Deterministic FX & Telecom Rail Routing
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {liveCount} Live Intra-African Settlement Corridors
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                      Click any corridor row in the rate card below to inspect live engine liquidity,
                      lock a firm quote in minor units, or verify ISO 20022{" "}
                      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#c2f74d]">
                        pacs.008.001.08
                      </code>{" "}
                      settlement payloads.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {rows.slice(0, 6).map((c) => {
                        const active = selected?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedId(c.id)}
                            className={
                              active
                                ? "inline-flex items-center gap-1.5 rounded-lg border border-[#c2f74d] bg-[#c2f74d] px-2.5 py-1 font-mono text-[11px] font-bold text-[#151515] transition-all"
                                : "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] text-white/80 transition-all hover:border-white/30 hover:text-white"
                            }
                          >
                            <Flag code={c.from_country} className="h-3 w-4 rounded-[1px]" />
                            <span>{c.from_currency}</span>
                            <ArrowRight className="size-3 opacity-60" />
                            <Flag code={c.to_country} className="h-3 w-4 rounded-[1px]" />
                            <span>{c.to_currency}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selected ? (
                    <div className="rounded-xl border border-white/15 bg-black/45 p-4 font-mono text-xs backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                          Selected Corridor
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c2f74d]">
                          <Flag code={selected.from_country} className="h-3 w-4 rounded-[1px]" />
                          {selected.id}
                          <Flag code={selected.to_country} className="h-3 w-4 rounded-[1px]" />
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <dt className="text-white/50">Indicative FX</dt>
                          <dd className="font-bold text-white">
                            1 {selected.from_currency} ={" "}
                            {selected.fx.inverse_rate.toPrecision(5)} {selected.to_currency}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-white/50">Corridor Fee</dt>
                          <dd className="text-[#c2f74d]">
                            {(selected.fees_bps / 100).toFixed(2)}% ({selected.fees_bps} bps)
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-white/50">Payout Adapter</dt>
                          <dd className="text-white">{selected.provider_id}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <Metric
                  label="Corridors"
                  value={rows.length}
                  sub="Configured on this engine"
                  accent="lime"
                />
                <Metric label="Enabled" value={liveCount} sub="Accepting quotes" />
                <Metric
                  label="Halted"
                  value={haltedCount}
                  sub="Kill switch active"
                  accent={haltedCount > 0 ? "warn" : "default"}
                />
              </div>

              {/* Interactive Quote Calculator + Destination Currency Mix */}
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                {selected ? (
                  <Panel
                    title="Quote calculator"
                    subtitle="Simulate a deterministic firm quote with live corridor fee and FX lock"
                    meta={<Chip tone="lime">{selected.id}</Chip>}
                  >
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="quote-amount"
                            className="font-mono text-[10px] uppercase tracking-[0.16em]"
                          >
                            Send amount ({selected.from_currency})
                          </Label>
                          <Input
                            id="quote-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputMode="decimal"
                            className="rounded-lg font-mono text-sm"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {QUOTE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmount(preset)}
                              className={
                                amount === preset
                                  ? "rounded-md border border-[#151515] bg-[#151515] px-2.5 py-1 font-mono text-[10px] font-bold text-[#c2f74d]"
                                  : "rounded-md border border-border bg-muted/30 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                              }
                            >
                              {Number(preset).toLocaleString("en-US")} {selected.from_currency}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/15 p-3 font-mono text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Corridor Min / Max</span>
                            <span className="font-semibold text-foreground">
                              {money(fromMinor(selected.min_amount_minor))} –{" "}
                              {money(fromMinor(selected.max_amount_minor))}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span>Payout Rail</span>
                            <span className="text-foreground">{selected.provider_id}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {minor === 0 ? (
                          <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                            Enter an amount for a firm quote.
                          </p>
                        ) : quote.isFetching && !quote.data ? (
                          <Loading label="Fetching quote" />
                        ) : quote.isError ? (
                          <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
                        ) : quote.data ? (
                          <div className="rounded-xl border border-[#151515] bg-[#151515] p-4 text-white">
                            <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                              <span className="inline-flex items-center gap-1.5">
                                <Calculator className="size-3 text-[#c2f74d]" />
                                Firm Engine Quote
                              </span>
                              <span className="text-[#c2f74d]">{selected.id}</span>
                            </div>
                            <dl className="space-y-2 font-mono text-xs">
                              <Row
                                k="Rate"
                                v={`1 ${selected.from_currency} = ${quote.data.quote.inverse_rate.toPrecision(5)} ${selected.to_currency}`}
                              />
                              <Row
                                k="Ledger rate"
                                v={`${quote.data.quote.rate.toPrecision(5)} ${selected.from_currency} per ${selected.to_currency}`}
                              />
                              <Row
                                k="Fee"
                                v={`−${money(fromMinor(quote.data.quote.fee_minor), selected.from_currency)}`}
                              />
                              <div className="flex justify-between border-t border-white/15 pt-2.5 text-sm font-bold text-[#c2f74d]">
                                <dt>Beneficiary receives</dt>
                                <dd className="tabular-nums">
                                  {money(
                                    fromMinor(quote.data.quote.deliver_amount_minor),
                                    selected.to_currency,
                                  )}
                                </dd>
                              </div>
                            </dl>
                            <p className="mt-3 break-all border-t border-white/10 pt-2 font-mono text-[10px] text-white/55">
                              Quote {truncMid(quote.data.quote.id, 10, 8)} · expires{" "}
                              {when(quote.data.quote.expires_at)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Panel>
                ) : null}

                {rows.length > 0 ? (
                  <Panel
                    title="Corridors by destination currency"
                    subtitle="Settlement endpoint distribution across supported regional currencies"
                  >
                    <LazyDonutChart
                      ariaLabel="Corridors by destination currency"
                      data={Object.entries(
                        rows.reduce<Record<string, number>>((acc, c) => {
                          acc[c.to_currency] = (acc[c.to_currency] ?? 0) + 1;
                          return acc;
                        }, {}),
                      ).map(([label, value]) => ({ label, value }))}
                      center={{ value: String(rows.length), label: "Corridors" }}
                      format={(v) => String(v)}
                    />
                  </Panel>
                ) : null}
              </div>

              <Panel
                title="Corridor rate card"
                subtitle="Click any row to load its parameters into the live quote calculator"
                meta={<Chip tone="live">Live from engine</Chip>}
              >
                <DataTable
                  caption="Corridor rate card"
                  rows={rows}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => setSelectedId(c.id)}
                  pageSize={12}
                  exportName="vuka-corridors.csv"
                  initialSort={{ key: "pair", dir: "asc" }}
                  columns={[
                    {
                      key: "pair",
                      header: "Corridor",
                      sort: (c) => c.id,
                      text: (c) =>
                        `${c.id} ${c.from_country} ${c.to_country} ${c.from_currency} ${c.to_currency}`,
                      cell: (c) => (
                        <span
                          className={`inline-flex items-center gap-2 ${
                            selected?.id === c.id ? "font-semibold" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Flag code={c.from_country} className="h-3 w-4 rounded-[1px]" />
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <Flag code={c.to_country} className="h-3 w-4 rounded-[1px]" />
                          </span>
                          <span className="font-mono text-xs">
                            {c.from_currency} → {c.to_currency}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.from_country} → {c.to_country}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: "rate",
                      header: "Indicative rate",
                      align: "right",
                      sort: (c) => c.fx.inverse_rate,
                      text: (c) => String(c.fx.inverse_rate),
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">
                          1 {c.from_currency} = {c.fx.inverse_rate.toPrecision(5)} {c.to_currency}
                        </span>
                      ),
                    },
                    {
                      key: "fee",
                      header: "Fee",
                      align: "right",
                      sort: (c) => c.fees_bps,
                      text: (c) => `${c.fees_bps / 100}%`,
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">{c.fees_bps / 100}%</span>
                      ),
                    },
                    {
                      key: "limits",
                      header: "Min / max",
                      align: "right",
                      text: (c) => `${c.min_amount_minor}-${c.max_amount_minor}`,
                      cell: (c) => (
                        <span className="tabular font-mono text-xs">
                          {money(fromMinor(c.min_amount_minor))} –{" "}
                          {money(fromMinor(c.max_amount_minor))}
                        </span>
                      ),
                    },
                    {
                      key: "provider",
                      header: "Payout rail",
                      sort: (c) => c.provider_id,
                      cell: (c) => (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {c.provider_id}
                        </span>
                      ),
                    },
                    {
                      key: "state",
                      header: "State",
                      align: "right",
                      sort: (c) => (c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"),
                      cell: (c) => (
                        <Chip tone={c.kill_switch || !c.enabled ? "warn" : "invert"}>
                          {c.kill_switch ? "HALTED" : c.enabled ? "LIVE" : "DISABLED"}
                        </Chip>
                      ),
                    },
                  ]}
                />
              </Panel>

              <Panel
                title="How pricing works"
                subtitle="Deterministic fee tiers and atomic quote locking across African regional blocs"
              >
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Every corridor is priced from a transparent fee tier plus the indicative FX
                      rate. A firm quote locks the rate, fee and delivered amount for its validity
                      window, so what you confirm is what settles.
                    </p>
                    <ol className="mt-4 space-y-2.5 text-sm">
                      {[
                        "Choose the corridor and amount — the quote shows fee, rate and the amount delivered.",
                        "Confirm — the quote id is bound to the payment; a changed market cannot alter it.",
                        "Collect and pay out — your mobile-money wallet is charged, the recipient is paid on their local rail.",
                      ].map((step, i) => (
                        <li
                          key={step}
                          className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/15 p-3"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[#151515] font-mono text-[10px] font-bold text-[#c2f74d]">
                            0{i + 1}
                          </span>
                          <span className="text-xs leading-relaxed text-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Fee tiers
                    </div>
                    <ul className="space-y-2.5">
                      {Array.from(new Set(rows.map((c) => c.fees_bps)))
                        .sort((a, b) => a - b)
                        .map((bps) => {
                          const n = rows.filter((c) => c.fees_bps === bps).length;
                          return (
                            <li
                              key={bps}
                              className="flex items-baseline justify-between rounded-xl border border-border/80 bg-muted/15 px-4 py-3"
                            >
                              <span className="tabular font-mono text-xl font-bold">
                                {(bps / 100).toFixed(2)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {n} corridors ·{" "}
                                {bps <= 80
                                  ? "within a regional economic community"
                                  : "across regions"}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
              </Panel>
            </>
          );
        }}
      </QueryBoundary>

      <IsoViewer />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/55">{k}</dt>
      <dd className="tabular-nums text-white">{v}</dd>
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

  async function copyXml() {
    if (!xml) return;
    try {
      await navigator.clipboard.writeText(xml);
      toast.success("ISO 20022 pacs.008 XML copied");
    } catch {
      toast.error("Could not copy XML");
    }
  }

  return (
    <Panel
      title="ISO 20022 pacs.008 message"
      subtitle="Standards-compliant FIToFICustomerCreditTransferV08 payload rendered from your settled ledger entries"
      meta={
        <div className="flex flex-wrap items-center gap-2">
          {result ? (
            <Chip tone={result.ok ? "invert" : "warn"}>
              {result.ok ? "Structure OK" : `${result.problems.length} problem(s)`}
            </Chip>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={!xml}
            className="h-7 gap-1.5 rounded-md font-mono text-[10px] uppercase"
            onClick={() => void copyXml()}
          >
            <Copy className="size-3" aria-hidden="true" />
            Copy XML
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!xml}
            className="h-7 gap-1.5 rounded-md font-mono text-[10px] uppercase"
            onClick={() => {
              const r = structuralCheck(xml);
              setResult(r);
              if (r.ok) toast.success("Well-formed, all mandatory elements present");
              else toast.error(r.problems[0] ?? "Invalid message");
            }}
          >
            <FileCode2 className="size-3" aria-hidden="true" />
            Check structure
          </Button>
        </div>
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
              <SelectTrigger aria-label="Transfer" className="rounded-lg font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {usable.slice(0, 25).map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {shortId(x.id)} · {money(x.amount, x.currency)}
                    {x.invoice_number ? ` · ${x.invoice_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#151515] bg-[#151515] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[10px] text-white/55">
              <span>urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08</span>
              <span className="text-[#c2f74d]">{t ? shortId(t.id, 12) : ""}</span>
            </div>
            <pre className="max-h-[380px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#e5e7eb]">
              {xml}
            </pre>
          </div>
          {result && !result.ok ? (
            <ul className="mt-3 rounded-lg border-2 border-foreground p-3 text-xs">
              {result.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-[#79b200]" aria-hidden="true" />
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
        {(rows) => {
          const healthyCount = rows.filter((p) => p.healthy).length;
          const haltedCount = rows.filter((p) => p.config.kill_switch).length;
          return (
            <>
              {/* Operator Telecom NOC Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
                <img
                  src={escrowGlobe}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
                />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
                      <Radio className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                        Telecom Adapter & Webhook NOC
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {healthyCount} of {rows.length} Payment Rail Adapters Healthy
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/65">
                      Provider webhooks are cryptographically authenticated and recorded as
                      append-only evidence. Ledger settlement mutations occur strictly inside
                      serialized engine transactions.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs">
                    <ShieldCheck className="size-4 text-[#c2f74d]" aria-hidden="true" />
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                        Kill Switch Guard
                      </div>
                      <div className="font-bold text-white">
                        {haltedCount === 0 ? "All Rails Armed" : `${haltedCount} Rail(s) Halted`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-4">
                <Metric
                  label="Providers"
                  value={rows.length}
                  sub="Registered adapters"
                  accent="lime"
                />
                <Metric label="Healthy" value={healthyCount} sub="Passing readiness checks" />
                <Metric
                  label="Kill switch"
                  value={haltedCount}
                  sub="Providers halted"
                  accent={haltedCount > 0 ? "warn" : "default"}
                />
                <Metric
                  label="External calls"
                  value={rows.filter((p) => p.config.external_calls).length}
                  sub="Live provider traffic"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <Panel
                  title="Provider registry"
                  subtitle="Adapter environment, supported country markets, and live readiness status"
                  meta={<Chip tone="live">Sandbox</Chip>}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          <th className="py-2.5">Provider</th>
                          <th className="py-2.5">Environment</th>
                          <th className="py-2.5">Countries</th>
                          <th className="py-2.5">Currencies</th>
                          <th className="py-2.5">Checked</th>
                          <th className="py-2.5 text-right">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => (
                          <tr
                            key={p.config.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                          >
                            <td className="py-3">
                              <div className="font-semibold text-foreground">
                                {p.config.display_name}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {p.config.id}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-xs">{p.config.environment}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                                {p.config.supported_countries.map((cc) => (
                                  <span
                                    key={cc}
                                    className="inline-flex items-center gap-1 rounded border border-border/80 bg-muted/25 px-1.5 py-0.5 text-[11px]"
                                  >
                                    <Flag code={cc} className="h-2.5 w-3.5 rounded-[1px]" />
                                    {cc}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-xs">
                              {p.config.supported_currencies.join(", ")}
                            </td>
                            <td className="py-3 font-mono text-xs text-muted-foreground">
                              {when(p.last_checked)}
                            </td>
                            <td className="py-3 text-right">
                              <Chip tone={p.config.kill_switch || !p.healthy ? "warn" : "invert"}>
                                {p.config.kill_switch
                                  ? "KILL SWITCH"
                                  : p.healthy
                                    ? "HEALTHY"
                                    : "DEGRADED"}
                              </Chip>
                              {p.reason ? (
                                <div className="mt-1 text-[10px] text-muted-foreground">
                                  {p.reason}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {rows.length > 0 ? (
                  <Panel
                    title="Providers by readiness"
                    subtitle="Adapter health distribution across registered telecom rails"
                  >
                    <LazyDonutChart
                      ariaLabel="Providers by readiness"
                      data={[
                        { label: "Healthy", value: healthyCount },
                        { label: "Unhealthy", value: rows.length - healthyCount },
                      ]}
                      center={{ value: String(rows.length), label: "Providers" }}
                      format={(v) => String(v)}
                    />
                  </Panel>
                ) : null}
              </div>
            </>
          );
        }}
      </QueryBoundary>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Provider reconciliation"
          subtitle="Per-corridor settlement vs provider callback matching state"
          meta={<Activity className="size-4 text-muted-foreground" aria-hidden="true" />}
        >
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
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <div className="font-mono text-xs font-semibold">
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

        <Panel
          title="Webhook evidence"
          subtitle="Authenticated provider callbacks logged for audit and reconciliation"
          meta={<CheckCircle2 className="size-4 text-[#79b200]" aria-hidden="true" />}
        >
          <QueryBoundary
            query={events}
            isEmpty={(d) => d.length === 0}
            empty="No provider callbacks received."
          >
            {(rows) => (
              <ul className="divide-y divide-border/60">
                {rows.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="font-mono text-xs font-semibold">
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
