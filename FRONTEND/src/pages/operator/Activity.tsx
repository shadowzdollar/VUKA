import { Card, Table, Badge, Input, Button } from "../../components";

export function Activity() {
  const activities = [
    { id: "act_8x7k2m", type: "ESCROW_LOCK", entity: "esc_8x7k2m", description: "Escrow locked for RWF 1,200,000", actor: "system", timestamp: "2026-09-12 14:34" },
    { id: "act_3x9k1m", type: "SETTLEMENT", entity: "set_3x9k1m", description: "Settlement completed to Nairobi Parts Co", actor: "system", timestamp: "2026-09-12 11:20" },
    { id: "act_5n2p8q", type: "DISPUTE_CREATED", entity: "dsp_8x7k2m", description: "Dispute opened for escrow esc_8x7k2m", actor: "trd_8x7k2m", timestamp: "2026-09-12 09:15" },
    { id: "act_7m4k9n", type: "COMPLIANCE_APPROVED", entity: "rev_5n2p8q", description: "KYC verification approved for Uganda Electronics", actor: "operator", timestamp: "2026-09-11 16:45" },
  ];

  const columns = [
    { key: "timestamp", header: "Timestamp" },
    { key: "type", header: "Type" },
    { key: "entity", header: "Entity" },
    { key: "description", header: "Description" },
    { key: "actor", header: "Actor" },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">Details</Button> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">System Activity</h1>
        <p className="text-gray-600">Complete audit log of all system events.</p>
      </div>

      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <Input placeholder="Search activities..." className="flex-1" />
          <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Types</option>
            <option value="escrow">Escrow Events</option>
            <option value="settlement">Settlements</option>
            <option value="dispute">Disputes</option>
            <option value="compliance">Compliance</option>
          </select>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Total Events (24h)</div><div className="text-2xl font-bold text-black">1,247</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Escrow Events</div><div className="text-2xl font-bold text-black">156</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Settlements</div><div className="text-2xl font-bold text-black">142</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Compliance Actions</div><div className="text-2xl font-bold text-black">12</div></Card>
      </div>

      <Card padding="none">
        <Table columns={columns} data={activities} emptyMessage="No activities found" />
      </Card>
    </div>
  );
}
