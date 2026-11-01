import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenCheck, FileDown, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import escrowGlobe from "@/assets/escrow-globe.png";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/vuka/data-table";
import { Loading, QueryBoundary } from "@/components/vuka/query-state";
import { Chip, Metric, Panel } from "@/components/vuka/shell";
import { describeError, download } from "@/lib/api/client";
import { ledger } from "@/lib/api/endpoints";
import type { StatementEntry } from "@/lib/api/types";
import { money, shortId, when } from "@/lib/format";
import { accountLabel } from "@/lib/trader-data";

export const Route = createFileRoute("/wallets/$id")({
  head: () => ({
    meta: [{ title: "Wallet statement — VUKA" }],
  }),
  component: WalletDetail,
});

/** ISO date (YYYY-MM-DD), for the plain HTML date inputs below. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function statusTone(s: string) {
  if (s === "SUCCESS") return "invert" as const;
  if (s === "FAILED" || s === "REVERSED") return "warn" as const;
  return "live" as const;
}

function WalletDetail() {
  const { id } = Route.useParams();
  const [fromDate, setFromDate] = useState(() => isoDate(new Date(Date.now() - 30 * 86_400_000)));
  const [toDate, setToDate] = useState(() => isoDate(new Date(Date.now() + 86_400_000)));

  const account = useQuery({ queryKey: ["account", id], queryFn: () => ledger.account(id) });
  const balance = useQuery({ queryKey: ["balance", id], queryFn: () => ledger.balance(id) });
  const from = `${fromDate}T00:00:00Z`;
  const to = `${toDate}T00:00:00Z`;
  const statement = useQuery({
    queryKey: ["statement", id, from, to],
    queryFn: () => ledger.statement(id, { from, to }),
    enabled: fromDate < toDate,
  });

  const entries = useMemo(
    () =>
      [...(statement.data?.entries ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [statement.data],
  );

  async function downloadXml() {
    try {
      await download(
        `/api/accounts/${id}/statement`,
        `vuka-statement-${shortId(id)}-${fromDate}-${toDate}.xml`,
        {
          from,
          to,
        },
      );
    } catch (err) {
      toast.error(describeError(err));
    }
  }

  const netChange =
    (statement.data?.closing_balance ?? 0) - (statement.data?.opening_balance ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/wallets"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All wallets
        </Link>
      </div>

      {/* Executive Account Statement Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#151515] bg-[#151515] p-6 text-white shadow-[0_24px_60px_-25px_rgba(21,21,21,0.65)] sm:p-7">
        <img
          src={escrowGlobe}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-16 w-[320px] opacity-[0.14] mix-blend-screen select-none"
        />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2f74d]/30 bg-[#c2f74d]/10 px-3 py-1">
              <BookOpenCheck className="size-3.5 text-[#c2f74d]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2f74d]">
                Double-Entry Account Statement · ISO 20022 camt.053
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {account.data ? (
                accountLabel(account.data)
              ) : (
                <span className="text-white/60">Wallet</span>
              )}
            </h1>
            <p className="mt-1.5 font-mono text-xs text-white/65">
              acct {id}
              {account.data ? ` · opened ${when(account.data.created_at)}` : ""}
            </p>
          </div>
          <Button
            onClick={() => void downloadXml()}
            className="gap-2 rounded-lg bg-[#c2f74d] font-mono text-xs font-bold uppercase text-[#151515] hover:bg-[#c2f74d]/90"
          >
            <FileDown className="size-3.5" aria-hidden="true" />
            Download statement (ISO 20022)
          </Button>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Current balance"
          value={balance.isPending ? "…" : money(balance.data?.amount ?? 0, account.data?.currency)}
          sub="Settled ledger balance"
          accent="lime"
        />
        <Metric
          label={`Opening · ${fromDate}`}
          value={
            statement.isPending
              ? "…"
              : money(statement.data?.opening_balance ?? 0, account.data?.currency)
          }
          sub="Start of statement window"
        />
        <Metric
          label={`Closing · ${toDate}`}
          value={
            statement.isPending
              ? "…"
              : money(statement.data?.closing_balance ?? 0, account.data?.currency)
          }
          sub="End of statement window"
        />
        <Metric
          label="Net period delta"
          value={
            statement.isPending
              ? "…"
              : `${netChange >= 0 ? "+" : "−"}${money(Math.abs(netChange), account.data?.currency)}`
          }
          sub={`${entries.length} ledger postings`}
        />
      </div>

      <Panel
        title="Statement"
        subtitle="Cryptographically balanced journal entries for the selected date window"
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              From
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 font-mono text-[11px] text-foreground"
                aria-label="Statement period start"
              />
            </label>
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              To
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 font-mono text-[11px] text-foreground"
                aria-label="Statement period end"
              />
            </label>
            <Chip tone="lime">{entries.length} entries</Chip>
          </div>
        }
      >
        {fromDate >= toDate ? (
          <p role="alert" className="rounded-xl border-2 border-foreground p-3 text-xs">
            The start date must be before the end date.
          </p>
        ) : statement.isPending ? (
          <Loading label="Loading statement" />
        ) : (
          <QueryBoundary
            query={statement}
            empty="No activity in this period."
            isEmpty={(s) => s.entries.length === 0}
          >
            {() => (
              <DataTable
                caption={`Ledger entries, ${fromDate} to ${toDate}`}
                exportName={`vuka-statement-${shortId(id)}.csv`}
                rows={entries}
                rowKey={(e: StatementEntry) => e.id}
                initialSort={{ key: "time", dir: "desc" }}
                empty="No activity in this period."
                columns={[
                  {
                    key: "time",
                    header: "Date",
                    sort: (e) => e.created_at,
                    text: (e) => e.created_at,
                    cell: (e) => (
                      <span className="tabular font-mono text-xs text-muted-foreground">
                        {when(e.created_at)}
                      </span>
                    ),
                  },
                  {
                    key: "amount",
                    header: "Amount",
                    align: "right",
                    sort: (e) => e.amount,
                    text: (e) => `${e.amount}`,
                    cell: (e) => (
                      <span
                        className={
                          "tabular font-mono text-xs font-semibold " +
                          (e.amount < 0 ? "text-muted-foreground" : "text-[#4d7300]")
                        }
                      >
                        {e.amount < 0 ? "−" : "+"}
                        {money(Math.abs(e.amount), account.data?.currency)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    text: (e) => e.transfer_status,
                    cell: (e) => (
                      <Chip tone={statusTone(e.transfer_status)}>{e.transfer_status}</Chip>
                    ),
                  },
                  {
                    key: "invoice",
                    header: "Invoice",
                    text: (e) => e.invoice_number ?? "",
                    cell: (e) => (
                      <span className="font-mono text-xs">{e.invoice_number ?? "—"}</span>
                    ),
                  },
                  {
                    key: "ref",
                    header: "Reference",
                    text: (e) => e.reference ?? "",
                    cell: (e) => (
                      <span className="font-mono text-xs text-muted-foreground">
                        {e.reference ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "transfer",
                    header: "Transfer",
                    text: (e) => e.transaction_id,
                    cell: (e) => (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <ShieldCheck className="size-3 text-[#79b200]" aria-hidden="true" />
                        {shortId(e.transaction_id)}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </QueryBoundary>
        )}
      </Panel>
    </div>
  );
}
