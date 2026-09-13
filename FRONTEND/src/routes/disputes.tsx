import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { disputes as seed, usd, type Dispute } from "@/lib/vuka-data";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title: "Dispute Tribunal & Arbitration — VUKA" },
      {
        name: "description",
        content:
          "Arbitration queue with frozen escrow assets, an evidence locker of hashed filings and immutable verdict recording.",
      },
      { property: "og:title", content: "Dispute Tribunal & Arbitration — VUKA" },
      {
        property: "og:description",
        content: "Evidence-backed arbitration for cross-border trade escrow disputes.",
      },
    ],
  }),
  component: Tribunal,
});

function Tribunal() {
  const [rows, setRows] = useState<Dispute[]>(seed);
  const [active, setActive] = useState<Dispute | null>(null);
  const [verdict, setVerdict] = useState("");

  const frozen = rows.reduce((s, d) => s + d.frozen, 0);

  function record() {
    if (!active) return;
    if (verdict.trim().length < 12) {
      toast.error("A verdict needs a written rationale before it can be recorded.");
      return;
    }
    setRows((prev) =>
      prev.map((d) =>
        d.id === active.id ? { ...d, stage: "RESOLVED", frozen: 0, verdict: verdict.trim() } : d,
      ),
    );
    toast.success(`${active.id} resolved`, {
      description: "Verdict written to the immutable arbitration record.",
    });
    setActive(null);
    setVerdict("");
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Arbitration"
        title="Dispute Tribunal"
        description="Disputed escrows freeze on chain. Only the arbiter can move frozen assets, and every verdict is permanently recorded with its evidence hashes."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Open disputes" value={rows.filter((d) => d.stage !== "RESOLVED").length} sub="Across all corridors" />
        <Metric label="Assets frozen" value={`$${usd(frozen)}`} sub="Held under arbiter control" />
        <Metric label="Median resolution" value="6.4 days" sub="Trailing 90-day average" />
      </div>

      <Panel title="Arbitration queue" meta={<Chip tone="live">Arbiter desk</Chip>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Case</th>
                <th className="py-2">Escrow</th>
                <th className="py-2">Parties</th>
                <th className="py-2">Claim</th>
                <th className="py-2 text-right">Frozen</th>
                <th className="py-2 text-right">Stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setActive(d)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="py-2.5 font-mono text-xs">{d.id}</td>
                  <td className="py-2.5 font-mono text-xs">{d.escrow}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {d.claimant} v. {d.respondent}
                  </td>
                  <td className="py-2.5 max-w-xs truncate text-xs">{d.reason}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {d.frozen ? `$${usd(d.frozen)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <Chip tone={d.stage === "RESOLVED" ? "invert" : d.stage === "ARBITER_REVIEW" ? "warn" : "live"}>
                      {d.stage.replace("_", " ")}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="rounded-none sm:max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                  {active.id} · {active.escrow}
                </DialogTitle>
                <DialogDescription>
                  {active.claimant} v. {active.respondent} · opened {active.opened}
                </DialogDescription>
              </DialogHeader>

              <p className="border border-border p-3 text-sm">{active.reason}</p>

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Evidence locker
                </div>
                <ul className="divide-y divide-border border border-border">
                  {active.evidence.map((ev) => (
                    <li key={ev.hash} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div>
                        <div className="text-xs">{ev.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {ev.hash} · filed {ev.filed}
                        </div>
                      </div>
                      <Chip>{ev.kind}</Chip>
                    </li>
                  ))}
                </ul>
              </div>

              {active.stage === "RESOLVED" ? (
                <p className="border border-dashed border-border p-3 font-mono text-[11px]">
                  VERDICT RECORDED: {active.verdict}
                </p>
              ) : (
                <>
                  <Textarea
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value)}
                    placeholder="Arbiter rationale and settlement split…"
                    className="min-h-28 rounded-none"
                  />
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      className="rounded-none font-mono text-xs uppercase"
                      onClick={() =>
                        toast.info("Evidence request issued to both counterparties")
                      }
                    >
                      Request more evidence
                    </Button>
                    <Button onClick={record} className="rounded-none font-mono text-xs uppercase">
                      Record immutable verdict
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
