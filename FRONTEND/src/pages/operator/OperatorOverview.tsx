import { Card, Badge, Table, Button } from "../../components";

export function OperatorOverview() {
  const recentEscrows = [
    { id: "esc_8x7k2m", invoice: "INV-2026-0847", amount: "RWF 1,200,000", state: "LOCKED", created: "2026-09-12" },
    { id: "esc_3x9k1m", invoice: "INV-2026-0845", amount: "RWF 2,000,000", state: "LOCKED", created: "2026-09-10" },
    { id: "esc_5n2p8q", invoice: "INV-2026-0842", amount: "RWF 3,500,000", state: "RELEASED", created: "2026-09-08" },
  ];

  const escrowColumns = [
    { key: "invoice", header: "Invoice" },
    { key: "amount", header: "Amount" },
    { key: "state", header: "Status", render: (v: string) => <Badge variant={v === "LOCKED" ? "warning" : "success"}>{v}</Badge> },
    { key: "created", header: "Created" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Operator Control Room</h1>
        <p className="text-gray-600">System overview and real-time monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Active Escrows</div>
          <div className="text-2xl font-bold text-black">24</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Volume (24h)</div>
          <div className="text-2xl font-bold text-black">RWF 8.4M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Settlement Rate</div>
          <div className="text-2xl font-bold text-black">99.8%</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">System Health</div>
          <Badge variant="success">Healthy</Badge>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Reconciliation Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Chain Events Processed</span>
              <span className="font-bold text-black">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Reconciliation</span>
              <span className="font-bold text-black">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Block Height</span>
              <span className="font-mono text-black">5,234,567</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confirmation Depth</span>
              <span className="font-bold text-black">128 blocks</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Provider Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-black">MTN Rwanda</div>
                <div className="text-sm text-gray-500">MoMo API</div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-black">M-Pesa Kenya</div>
                <div className="text-sm text-gray-500">Daraja API</div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-black">Polygon Amoy</div>
                <div className="text-sm text-gray-500">RPC Endpoint</div>
              </div>
              <Badge variant="success">Synced</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Recent Escrows</h2>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <Table columns={escrowColumns} data={recentEscrows} />
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">System Alerts</h2>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-medium text-black">All systems operational</div>
            <div className="text-sm text-gray-600">No critical alerts at this time.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
