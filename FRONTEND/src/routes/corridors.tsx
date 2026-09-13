import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, PageHeader, Panel, Metric, Chip } from "@/components/vuka/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { corridors, pacs008, usd } from "@/lib/vuka-data";

export const Route = createFileRoute("/corridors")({
  head: () => ({
    meta: [
      { title: "Corridor Operations & ISO 20022 Gateway — VUKA" },
      {
        name: "description",
        content:
          "RWF/KES corridor rates, fee schedules, simulated telecom adapters and a pacs.008 ISO 20022 message viewer with schema validation.",
      },
      { property: "og:title", content: "Corridor Operations & ISO 20022 Gateway — VUKA" },
      {
        property: "og:description",
        content: "Translate VUKA trade payments into central-banking standard messaging.",
      },
    ],
  }),
  component: Corridors,
});

const adapters = [
  { name: "MTN MoMo Rwanda", env: "SANDBOX", uptime: "99.94%", latency: "1.9s" },
  { name: "Safaricom M-Pesa Kenya", env: "SANDBOX", uptime: "99.88%", latency: "2.4s" },
  { name: "Airtel Money Uganda", env: "SANDBOX", uptime: "99.41%", latency: "3.1s" },
  { name: "Vodacom M-Pesa Tanzania", env: "SANDBOX", uptime: "98.90%", latency: "3.8s" },
];

function Corridors() {
  const [amount, setAmount] = useState("1000000");
  const [selected, setSelected] = useState(corridors[0]!);
  const [validation, setValidation] = useState<string | null>(null);

  const send = Number(amount) || 0;
  const gross = send * selected.rate;
  const fee = gross * (selected.feePct / 100);

  return (
    <Shell>
      <PageHeader
        eyebrow="Network operations"
        title="Corridors & ISO 20022 Gateway"
        description="Corridor pricing, telecom adapter health and the translation layer that renders every VUKA trade payment as a standards-compliant pacs.008 message."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Live corridors" value={corridors.filter((c) => c.status === "LIVE").length} sub="Rwanda, Kenya, Uganda" />
        <Metric label="Pilot corridors" value={corridors.filter((c) => c.status === "PILOT").length} sub="Volume-capped observation" />
        <Metric label="24h corridor volume" value={`$${usd(corridors.reduce((s, c) => s + c.volume24h, 0))}`} sub="All rails combined" />
        <Metric label="Adapters online" value={`${adapters.length}/4`} sub="Sandbox telecom simulators" />
      </div>

      <Panel title="Corridor rate card" meta={<Chip tone="live">Indicative mid + spread</Chip>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Pair</th>
                <th className="py-2">Route</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Spread</th>
                <th className="py-2 text-right">Fee</th>
                <th className="py-2">Rails</th>
                <th className="py-2 text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {corridors.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40 ${selected.id === c.id ? "bg-accent/30" : ""}`}
                >
                  <td className="py-2.5 font-mono text-xs">{c.pair}</td>
                  <td className="py-2.5 text-muted-foreground">{c.route}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{c.rate}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{c.spreadBps} bps</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{c.feePct}%</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{c.rails.join(" · ")}</td>
                  <td className="py-2.5 text-right">
                    <Chip tone={c.status === "LIVE" ? "invert" : c.status === "PILOT" ? "live" : "dead"}>
                      {c.status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="FX quote simulator" meta={<Chip>{selected.pair}</Chip>}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">
                Send amount ({selected.pair.split(" / ")[0]})
              </Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="rounded-none font-mono"
              />
            </div>
            <dl className="space-y-2 border border-border p-3 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rate applied</dt>
                <dd className="tabular-nums">{selected.rate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Gross converted</dt>
                <dd className="tabular-nums">{usd(gross)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Corridor fee ({selected.feePct}%)</dt>
                <dd className="tabular-nums">−{usd(fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt>Beneficiary receives</dt>
                <dd className="tabular-nums">
                  {usd(gross - fee)} {selected.pair.split(" / ")[1]}
                </dd>
              </div>
            </dl>
            <Button
              className="w-full rounded-none font-mono text-xs uppercase"
              onClick={() =>
                toast.success("Quote locked for 90 seconds", {
                  description: `${selected.route} · ${selected.rails.join(" → ")}`,
                })
              }
            >
              Lock quote
            </Button>
          </div>
        </Panel>

        <Panel title="Telecom adapters" meta={<Chip tone="live">Sandbox</Chip>}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Adapter</th>
                <th className="py-2 text-right">Uptime</th>
                <th className="py-2 text-right">p50 latency</th>
                <th className="py-2 text-right">Probe</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((a) => (
                <tr key={a.name} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5">{a.name}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{a.uptime}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{a.latency}</td>
                  <td className="py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-none font-mono text-[10px] uppercase"
                      onClick={() =>
                        toast.success(`${a.name} probe OK`, { description: "Handshake 200 · sandbox" })
                      }
                    >
                      Ping
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel
        title="ISO 20022 pacs.008 message"
        meta={
          <>
            {validation ? <Chip tone="invert">{validation}</Chip> : null}
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none font-mono text-[10px] uppercase"
              onClick={() => {
                setValidation("Schema valid · 0 errors");
                toast.success("pacs.008.001.08 validated against schema");
              }}
            >
              Validate schema
            </Button>
          </>
        }
      >
        <pre className="overflow-x-auto border border-border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-foreground">
          {pacs008}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">
          Every released escrow emits a pacs.008 credit transfer with the invoice reference carried
          in structured remittance information, so bank and central-bank counterparties can
          reconcile a VUKA settlement without bespoke integration.
        </p>
      </Panel>
    </Shell>
  );
}
