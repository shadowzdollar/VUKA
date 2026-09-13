import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { traders as seed, usd, type Trader } from "@/lib/vuka-data";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & Tiered KYC Gateway — VUKA" },
      {
        name: "description",
        content:
          "Tier 0 to Tier 2 verification, sanctions screening, risk flags and explainable compliance decision logs for cross-border traders.",
      },
      { property: "og:title", content: "Compliance & Tiered KYC Gateway — VUKA" },
      {
        property: "og:description",
        content: "Proportionate KYC tiers tied to cross-border trade volume thresholds.",
      },
    ],
  }),
  component: Compliance,
});

const tiers = [
  {
    tier: "TIER 0",
    name: "Unverified browsing",
    gate: "No funding, no escrow creation. Directory and rate viewing only.",
    checks: ["Device attestation", "Rate-limited access"],
  },
  {
    tier: "TIER 1",
    name: "Verified counterparty",
    gate: "Escrow up to $10,000 per contract; new counterparties permitted.",
    checks: ["Mobile number ownership", "National ID match", "PEP watchlist pass"],
  },
  {
    tier: "TIER 2",
    name: "Cross-border business",
    gate: "Unlimited corridor volume, ISO 20022 settlement, lender certificate export.",
    checks: [
      "Business registration certificate",
      "Beneficial ownership declaration",
      "OFAC / UN / EU sanctions screening",
      "Source-of-funds attestation",
    ],
  },
];

const decisionLog = [
  {
    ts: "2026-09-12 05:41:19",
    subject: "TRD-1188",
    decision: "FLAG RAISED",
    rationale: "30d volume $41,620 crossed 80% of the Tier 2 trigger while DSP-0312 is open.",
  },
  {
    ts: "2026-09-10 14:02:55",
    subject: "TRD-1207",
    decision: "TIER 1 GRANTED",
    rationale: "Mobile ownership and national ID matched; sanctions screen returned clear.",
  },
  {
    ts: "2026-09-07 09:18:03",
    subject: "TRD-1102",
    decision: "TIER 2 MAINTAINED",
    rationale: "Annual re-screen of 3 directors returned no consolidated-list matches.",
  },
  {
    ts: "2026-09-02 11:47:40",
    subject: "TRD-1244",
    decision: "FUNDING BLOCKED",
    rationale: "Tier 0 account attempted escrow funding; blocked at the gateway, no funds moved.",
  },
];

function Compliance() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Trader | null>(null);

  const rows = useMemo(
    () =>
      seed.filter((t) =>
        `${t.name} ${t.country} ${t.id}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <Shell>
      <PageHeader
        eyebrow="Regulatory gateway"
        title="Compliance & Tiered KYC"
        description="Verification is proportionate to trade exposure. Every gating decision is logged with a plain-language rationale that the trader can read and contest."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Verified traders" value={seed.filter((t) => t.status === "VERIFIED").length} sub="Tier 1 and Tier 2" />
        <Metric label="Open risk flags" value={seed.filter((t) => t.status === "FLAGGED").length} sub="Manual review queue" />
        <Metric label="Sanctions hits" value={seed.filter((t) => t.sanctions === "HIT").length} sub="Consolidated list screening" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {tiers.map((t) => (
          <Panel key={t.tier} title={t.tier} meta={<Chip>{t.name}</Chip>}>
            <p className="text-sm text-muted-foreground">{t.gate}</p>
            <ul className="mt-3 space-y-1.5 font-mono text-[11px]">
              {t.checks.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-muted-foreground">—</span>
                  {c}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <Panel
        title="Trader verification register"
        meta={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traders…"
            className="h-8 w-56 rounded-none font-mono text-xs"
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Trader</th>
                <th className="py-2">Country</th>
                <th className="py-2">MSISDN</th>
                <th className="py-2 text-right">30d volume</th>
                <th className="py-2 text-center">Sanctions</th>
                <th className="py-2 text-right">Tier</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setActive(t)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="py-2.5">{t.name}</td>
                  <td className="py-2.5 text-muted-foreground">{t.country}</td>
                  <td className="py-2.5 font-mono text-xs">{t.msisdn}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">${usd(t.volume30d)}</td>
                  <td className="py-2.5 text-center">
                    <Chip tone={t.sanctions === "CLEAR" ? "neutral" : "warn"}>{t.sanctions}</Chip>
                  </td>
                  <td className="py-2.5 text-right font-mono">T{t.tier}</td>
                  <td className="py-2.5 text-right">
                    <Chip tone={t.status === "VERIFIED" ? "invert" : t.status === "FLAGGED" ? "warn" : "neutral"}>
                      {t.status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Explainable decision log" meta={<Chip tone="live">Append-only</Chip>}>
        <ul className="divide-y divide-border/60">
          {decisionLog.map((d) => (
            <li key={d.ts} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{d.ts}</span>
                <span className="font-mono text-xs">{d.subject}</span>
                <Chip tone={d.decision.includes("BLOCKED") || d.decision.includes("FLAG") ? "warn" : "neutral"}>
                  {d.decision}
                </Chip>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="rounded-none sm:max-w-xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                  {active.id} · {active.name}
                </DialogTitle>
                <DialogDescription>{active.notes}</DialogDescription>
              </DialogHeader>
              <dl className="grid gap-2 border border-border p-3 font-mono text-[11px] sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd>T{active.tier}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{active.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">National ID</dt>
                  <dd>{active.nationalId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Registration</dt>
                  <dd>{active.registration}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Sanctions</dt>
                  <dd>{active.sanctions}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">30d volume</dt>
                  <dd>${usd(active.volume30d)}</dd>
                </div>
              </dl>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase"
                  onClick={() => toast.info("Re-screen queued against OFAC, UN and EU lists")}
                >
                  Re-run sanctions screen
                </Button>
                <Button
                  className="rounded-none font-mono text-xs uppercase"
                  disabled={active.tier === 2}
                  onClick={() =>
                    toast.success(`${active.id} upgrade requested`, {
                      description: "Trader notified to submit registration documents.",
                    })
                  }
                >
                  Request tier upgrade
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
