import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell, PageHeader, Panel, Chip, Metric } from "@/components/vuka/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { corridors, escrows as seed, usd, type Escrow, type EscrowStatus } from "@/lib/vuka-data";

export const Route = createFileRoute("/escrow")({
  head: () => ({
    meta: [
      { title: "Invoices & Smart Escrow — VUKA" },
      {
        name: "description",
        content:
          "Invoice-linked escrow lifecycle: created, locked on Polygon, released by mutual confirmation, refunded on timeout or disputed.",
      },
      { property: "og:title", content: "Invoices & Smart Escrow — VUKA" },
      {
        property: "og:description",
        content: "Lock, confirm and resolve invoice-bound escrows across MoMo and M-Pesa rails.",
      },
    ],
  }),
  component: EscrowDesk,
});

const stages: EscrowStatus[] = ["CREATED", "LOCKED", "RELEASED", "REFUNDED", "DISPUTED"];

function daysLeft(iso: string) {
  const diff = new Date(iso.replace(" ", "T") + "Z").getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function EscrowDesk() {
  const [rows, setRows] = useState<Escrow[]>(seed);
  const [filter, setFilter] = useState<"ALL" | EscrowStatus>("ALL");
  const [active, setActive] = useState<Escrow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    invoice: "",
    buyer: "",
    supplier: "",
    amount: "",
    corridor: "RWF / KES",
  });

  const visible = useMemo(
    () => rows.filter((r) => filter === "ALL" || r.status === filter),
    [rows, filter],
  );

  function update(id: string, patch: Partial<Escrow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setActive((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  function confirmSide(e: Escrow, side: "buyer" | "supplier") {
    const buyerConfirmed = side === "buyer" ? true : e.buyerConfirmed;
    const supplierConfirmed = side === "supplier" ? true : e.supplierConfirmed;
    const released = buyerConfirmed && supplierConfirmed;
    update(e.id, {
      buyerConfirmed,
      supplierConfirmed,
      status: released ? "RELEASED" : e.status === "CREATED" ? "LOCKED" : e.status,
    });
    toast.success(released ? "Mutual confirmation — funds released" : `${side} confirmation recorded`, {
      description: released
        ? `${e.id} settled to supplier via ${e.rail}`
        : "Awaiting the counterparty signature.",
    });
  }

  function createEscrow() {
    const amount = Number(form.amount);
    if (!form.invoice || !form.buyer || !form.supplier || !amount) {
      toast.error("Invoice, both counterparties and an amount are required.");
      return;
    }
    const id = `ESC-${4831 + rows.length}`;
    const created = new Date();
    const timeout = new Date(created.getTime() + 10 * 86_400_000);
    const next: Escrow = {
      id,
      invoice: form.invoice,
      buyer: form.buyer,
      supplier: form.supplier,
      corridor: form.corridor,
      amountUsdc: amount,
      localAmount: "—",
      status: "CREATED",
      createdAt: created.toISOString().slice(0, 19).replace("T", " "),
      timeoutAt: timeout.toISOString().slice(0, 19).replace("T", " "),
      buyerConfirmed: false,
      supplierConfirmed: false,
      txHash: `0x${Math.random().toString(16).slice(2).padEnd(12, "0").repeat(5).slice(0, 64)}`,
      rail: corridors.find((c) => c.pair === form.corridor)?.rails.join(" → ") ?? "—",
    };
    setRows((prev) => [next, ...prev]);
    setCreateOpen(false);
    setForm({ invoice: "", buyer: "", supplier: "", amount: "", corridor: "RWF / KES" });
    toast.success(`${id} created`, { description: `Invoice ${next.invoice} bound to contract.` });
  }

  const locked = rows.filter((r) => r.status === "LOCKED").reduce((s, r) => s + r.amountUsdc, 0);

  return (
    <Shell>
      <PageHeader
        eyebrow="Settlement desk"
        title="Invoices & Smart Escrow"
        description="Each escrow cryptographically binds an invoice number to an on-chain contract. Funds move only on mutual confirmation, timeout release or arbiter verdict."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none font-mono text-xs uppercase">New escrow</Button>
            </DialogTrigger>
            <DialogContent className="rounded-none sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-[0.18em]">
                  Invoice-linked escrow
                </DialogTitle>
                <DialogDescription>
                  The invoice reference is hashed into the contract call data and cannot be altered
                  after locking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Invoice number</Label>
                  <Input
                    className="rounded-none font-mono"
                    value={form.invoice}
                    onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                    placeholder="INV-RW-2301"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Buyer</Label>
                    <Input
                      className="rounded-none"
                      value={form.buyer}
                      onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Supplier</Label>
                    <Input
                      className="rounded-none"
                      value={form.supplier}
                      onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Amount (USDC)</Label>
                    <Input
                      className="rounded-none font-mono"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="18400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-[0.16em]">Corridor</Label>
                    <Select
                      value={form.corridor}
                      onValueChange={(v) => setForm({ ...form, corridor: v })}
                    >
                      <SelectTrigger className="rounded-none font-mono text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {corridors.map((c) => (
                          <SelectItem key={c.id} value={c.pair}>
                            {c.pair} — {c.route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="border border-dashed border-border p-3 font-mono text-[11px] text-muted-foreground">
                  Timeout: 10 days from lock. On expiry the contract auto-releases to the supplier
                  unless a dispute is open.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={createEscrow} className="rounded-none font-mono text-xs uppercase">
                  Create & bind invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open contracts" value={rows.filter((r) => r.status === "LOCKED" || r.status === "CREATED").length} sub="Awaiting confirmation" />
        <Metric label="Value locked" value={`$${usd(locked)}`} sub="USDC on Polygon" />
        <Metric label="Mutual releases" value={rows.filter((r) => r.status === "RELEASED").length} sub="Dual signature settled" />
        <Metric label="Disputed" value={rows.filter((r) => r.status === "DISPUTED").length} sub="Frozen pending arbitration" />
      </div>

      <Panel
        title="Escrow register"
        meta={
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", ...stages] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className="cursor-pointer">
                <Chip tone={filter === s ? "invert" : "neutral"}>{s}</Chip>
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="py-2">Contract</th>
                <th className="py-2">Invoice</th>
                <th className="py-2">Counterparties</th>
                <th className="py-2">Corridor</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2 text-center">Signatures</th>
                <th className="py-2 text-right">Timeout</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setActive(e)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="py-2.5 font-mono text-xs">{e.id}</td>
                  <td className="py-2.5 font-mono text-xs">{e.invoice}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {e.buyer} → {e.supplier}
                  </td>
                  <td className="py-2.5 font-mono text-xs">{e.corridor}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">${usd(e.amountUsdc)}</td>
                  <td className="py-2.5 text-center font-mono text-xs">
                    {e.buyerConfirmed ? "B✓" : "B·"} {e.supplierConfirmed ? "S✓" : "S·"}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                    {e.status === "LOCKED" || e.status === "CREATED" ? `${daysLeft(e.timeoutAt)}d` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <Chip tone={e.status === "RELEASED" ? "invert" : e.status === "DISPUTED" ? "warn" : e.status === "REFUNDED" ? "dead" : "live"}>
                      {e.status}
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
                  {active.id} · {active.invoice}
                </DialogTitle>
                <DialogDescription>
                  {active.buyer} → {active.supplier} · {active.rail}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-1.5">
                {stages.slice(0, 3).map((s) => (
                  <Chip key={s} tone={active.status === s ? "invert" : "neutral"}>
                    {s}
                  </Chip>
                ))}
                <Chip tone={active.status === "REFUNDED" ? "invert" : "neutral"}>REFUNDED</Chip>
                <Chip tone={active.status === "DISPUTED" ? "warn" : "neutral"}>DISPUTED</Chip>
              </div>

              <dl className="grid gap-2 border border-border p-3 font-mono text-[11px] sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd>${usd(active.amountUsdc)} USDC</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Local leg</dt>
                  <dd>{active.localAmount}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{active.createdAt}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Timeout at</dt>
                  <dd>{active.timeoutAt}</dd>
                </div>
                <div className="col-span-full flex justify-between gap-3">
                  <dt className="text-muted-foreground">Tx hash</dt>
                  <dd className="truncate">{active.txHash}</dd>
                </div>
              </dl>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase"
                  disabled={active.buyerConfirmed || active.status !== "LOCKED" && active.status !== "CREATED"}
                  onClick={() => confirmSide(active, "buyer")}
                >
                  Buyer confirms delivery
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase"
                  disabled={active.supplierConfirmed || (active.status !== "LOCKED" && active.status !== "CREATED")}
                  onClick={() => confirmSide(active, "supplier")}
                >
                  Supplier confirms shipment
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase"
                  onClick={() =>
                    toast.success("Rail simulation complete", {
                      description: `${active.rail} handshake acknowledged in 4.2s (sandbox).`,
                    })
                  }
                >
                  Test MoMo / M-Pesa rail
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase"
                  disabled={active.status !== "LOCKED"}
                  onClick={() => {
                    update(active.id, { status: "DISPUTED" });
                    toast.warning("Dispute opened — assets frozen", {
                      description: `${active.id} routed to the arbitration tribunal.`,
                    });
                  }}
                >
                  Raise dispute
                </Button>
                {active.status === "CREATED" ? (
                  <Button
                    className="rounded-none font-mono text-xs uppercase sm:col-span-2"
                    onClick={() => {
                      update(active.id, { status: "LOCKED" });
                      toast.success("Funds locked on Polygon", {
                        description: `${usd(active.amountUsdc)} USDC held in ESCROW_HELD.`,
                      });
                    }}
                  >
                    Lock funds in escrow
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
