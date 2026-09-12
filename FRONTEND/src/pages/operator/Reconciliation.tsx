import { Card, Badge, Button } from "../../components";

export function Reconciliation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Reconciliation</h1>
          <p className="text-gray-600">Monitor blockchain event processing and ledger reconciliation.</p>
        </div>
        <Button variant="outline">Force Reconciliation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Events Processed</div><div className="text-2xl font-bold text-black">1,247</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Pending</div><div className="text-2xl font-bold text-black">0</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Last Block</div><div className="text-2xl font-bold text-black">5,234,567</div></Card>
        <Card padding="md"><div className="text-sm text-gray-500 mb-1">Status</div><Badge variant="success">Synced</Badge></Card>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Reconciliation Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <div className="font-medium text-black">Chain Event Processing</div>
              <div className="text-sm text-gray-600">All events successfully processed</div>
            </div>
            <Badge variant="success">Healthy</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <div className="font-medium text-black">Ledger Synchronization</div>
              <div className="text-sm text-gray-600">Off-chain ledger in sync with blockchain</div>
            </div>
            <Badge variant="success">Synced</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <div className="font-medium text-black">Confirmation Depth</div>
              <div className="text-sm text-gray-600">128 block confirmations required</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Recent Events</h2>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-black">EscrowLocked</span>
              <span className="text-sm text-gray-500">2026-09-12 14:34</span>
            </div>
            <div className="text-sm text-gray-600">Escrow esc_8x7k2m locked for RWF 1,200,000</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-black">EscrowReleased</span>
              <span className="text-sm text-gray-500">2026-09-12 11:20</span>
            </div>
            <div className="text-sm text-gray-600">Escrow esc_5n2p8q released to supplier</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-black">EscrowCreated</span>
              <span className="text-sm text-gray-500">2026-09-12 09:15</span>
            </div>
            <div className="text-sm text-gray-600">New escrow esc_3x9k1m created for INV-2026-0845</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
