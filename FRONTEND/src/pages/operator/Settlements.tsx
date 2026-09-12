import { Card, Table, Badge, Button, Tabs } from "../../components";

export function Settlements() {
  const settlements = [
    { id: "set_8x7k2m", escrowId: "esc_8x7k2m", amount: "RWF 1,200,000", currency: "RWF", recipient: "Nairobi Parts Co", status: "COMPLETED", txHash: "0x8f7a2b...", executed: "2026-09-12 14:34" },
    { id: "set_3x9k1m", escrowId: "esc_3x9k1m", amount: "RWF 2,000,000", currency: "KES", recipient: "Uganda Electronics", status: "COMPLETED", txHash: "0x9e8c3d...", executed: "2026-09-12 11:20" },
    { id: "set_5n2p8q", escrowId: "esc_5n2p8q", amount: "RWF 3,500,000", currency: "UGX", recipient: "Uganda Electronics", status: "PENDING", txHash: "-", executed: "-" },
  ];

  const columns = [
    { key: "escrowId", header: "Escrow ID" },
    { key: "amount", header: "Amount" },
    { key: "currency", header: "Currency" },
    { key: "recipient", header: "Recipient" },
    { key: "status", header: "Status", render: (v: string) => <Badge variant={v === "COMPLETED" ? "success" : "warning"}>{v}</Badge> },
    { key: "txHash", header: "Tx Hash", render: (v: string) => <span className="font-mono text-sm">{v}</span> },
    { key: "executed", header: "Executed" },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">View</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Settlement Management</h1>
          <p className="text-gray-600">Monitor and manage settlement transactions.</p>
        </div>
        <Button variant="primary">Manual Settlement</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Pending Settlements</div><div className="text-2xl font-bold text-black">3</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Completed Today</div><div className="text-2xl font-bold text-black">RWF 3.2M</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Total Volume (24h)</div><div className="text-2xl font-bold text-black">RWF 6.7M</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Success Rate</div><div className="text-2xl font-bold text-black">99.5%</div></Card>
      </div>

      <Tabs
        defaultTab="pending"
        tabs={[
          { id: "pending", label: "Pending", content: <Card padding="none"><Table columns={columns} data={settlements.filter(s => s.status === "PENDING")} emptyMessage="No pending settlements" /></Card> },
          { id: "completed", label: "Completed", content: <Card padding="none"><Table columns={columns} data={settlements.filter(s => s.status === "COMPLETED")} emptyMessage="No completed settlements" /></Card> },
          { id: "all", label: "All", content: <Card padding="none"><Table columns={columns} data={settlements} emptyMessage="No settlements" /></Card> },
        ]}
      />

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Settlement Queue</h2>
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-black">set_5n2p8q</span>
              <Badge variant="warning">Awaiting Confirmation</Badge>
            </div>
            <div className="text-sm text-gray-600">RWF 3,500,000 to Uganda Electronics - Waiting for blockchain confirmation</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
