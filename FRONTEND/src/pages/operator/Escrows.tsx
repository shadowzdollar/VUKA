import { Card, Table, Badge, Button, Tabs } from "../../components";

export function Escrows() {
  const escrows = [
    { id: "esc_8x7k2m", invoice: "INV-2026-0847", amount: "RWF 1,200,000", buyer: "Kigali Electronics", supplier: "Nairobi Parts Co", state: "LOCKED", created: "2026-09-12" },
    { id: "esc_3x9k1m", invoice: "INV-2026-0845", amount: "RWF 2,000,000", buyer: "Dar es Salaam Trading", supplier: "Uganda Electronics", state: "LOCKED", created: "2026-09-10" },
    { id: "esc_5n2p8q", invoice: "INV-2026-0842", amount: "RWF 3,500,000", buyer: "Kigali Electronics", supplier: "Uganda Electronics", state: "RELEASED", created: "2026-09-08" },
  ];

  const columns = [
    { key: "invoice", header: "Invoice" },
    { key: "amount", header: "Amount" },
    { key: "buyer", header: "Buyer" },
    { key: "supplier", header: "Supplier" },
    { key: "state", header: "Status", render: (v: string) => <Badge variant={v === "LOCKED" ? "warning" : "success"}>{v}</Badge> },
    { key: "created", header: "Created" },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">View</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Escrow Management</h1>
          <p className="text-gray-600">Monitor and manage all escrow transactions.</p>
        </div>
        <Button variant="primary">Create Escrow</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Active Escrows</div><div className="text-2xl font-bold text-black">24</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Total Locked</div><div className="text-2xl font-bold text-black">RWF 8.4M</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Released Today</div><div className="text-2xl font-bold text-black">RWF 2.1M</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Disputed</div><div className="text-2xl font-bold text-black">2</div></Card>
      </div>

      <Tabs
        defaultTab="active"
        tabs={[
          { id: "active", label: "Active", content: <Card padding="none"><Table columns={columns} data={escrows.filter(e => e.state === "LOCKED")} emptyMessage="No active escrows" /></Card> },
          { id: "released", label: "Released", content: <Card padding="none"><Table columns={columns} data={escrows.filter(e => e.state === "RELEASED")} emptyMessage="No released escrows" /></Card> },
          { id: "all", label: "All", content: <Card padding="none"><Table columns={columns} data={escrows} emptyMessage="No escrows" /></Card> },
        ]}
      />
    </div>
  );
}
