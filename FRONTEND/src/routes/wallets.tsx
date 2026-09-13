import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { accounts, ledger, usd } from "@/lib/vuka-data";

export const Route = createFileRoute("/wallets")({
  head: () => ({
    meta: [
      { title: "Wallets & Double-Entry Ledger — VUKA" },
      {
        name: "description",
        content:
          "Segregated personal, business, escrow, settlement and fee accounts with an immutable double-entry ledger stream.",
      },
      { property: "og:title", content: "Wallets & Double-Entry Ledger — VUKA" },
      {
        property: "og:description",
        content: "Balances derived strictly from immutable double-entry ledger postings.",
      },
    ],
  }),
  component: Wallets,
});

function Wallets() {
  const [account, setAccount] = useState("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      ledger.filter(
        (l) =>
          (account === "ALL" || l.account === account) &&
          (query.trim() === "" ||
            `${l.ref} ${l.narrative} ${l.id}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [account, query],
  );

  const debits = rows.reduce((s, l) => s + l.debit, 0);
  const credits = rows.reduce((s, l) => s + l.credit, 0);

  function exportLedger() {
    const csv = [
      "entry_id,timestamp,account,reference,narrative,debit,credit",
      ...rows.map((r) =>
        [r.id, r.ts, r.account, r.ref, `"${r.narrative}"`, r.debit, r.credit].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vuka-ledger-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ledger audit record exported", { description: `${rows.length} postings` });
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Ledger engine"
        title="Wallets & Double-Entry Ledger"
        description="Trade capital is held in strictly segregated accounts. No balance is stored — every figure below is derived from the immutable posting stream."
        actions={
          <Button onClick={exportLedger} className="rounded-none font-mono text-xs uppercase">
            Export audit record
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {accounts.map((a) => (
          <Metric
            key={a.code}
            label={a.name}
            value={`$${usd(a.balance)}`}
            sub={`${a.code} · ${a.type} · ${a.entries} postings`}
          />
        ))}
      </div>

      <Panel
        title="Chart of accounts"
        meta={<Chip tone="live">Derived balances</Chip>}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="py-2">Code</th>
              <th className="py-2">Account</th>
              <th className="py-2">Class</th>
              <th className="py-2">Owner</th>
              <th className="py-2 text-right">Derived balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.code} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-mono text-xs">{a.code}</td>
                <td className="py-2.5">{a.name}</td>
                <td className="py-2.5">
                  <Chip>{a.type}</Chip>
                </td>
                <td className="py-2.5 text-muted-foreground">{a.owner}</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {a.currency} {usd(a.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Immutable posting stream"
        meta={
          <>
            <Chip>{rows.length} rows</Chip>
            <Chip tone={Math.round((debits - credits) * 100) === 0 ? "invert" : "warn"}>
              Δ {usd(debits - credits)}
            </Chip>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="w-56 rounded-none font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="ALL">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by reference or narrative…"
            className="w-72 rounded-none font-mono text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Entry</th>
                <th className="py-2">Timestamp (UTC)</th>
                <th className="py-2">Account</th>
                <th className="py-2">Reference</th>
                <th className="py-2">Narrative</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 font-mono text-xs">{l.id}</td>
                  <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {l.ts}
                  </td>
                  <td className="py-2.5 font-mono text-xs">{l.account}</td>
                  <td className="py-2.5 font-mono text-xs">{l.ref}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{l.narrative}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {l.debit ? `DR ${usd(l.debit)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {l.credit ? `CR ${usd(l.credit)}` : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                    No postings match the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}
