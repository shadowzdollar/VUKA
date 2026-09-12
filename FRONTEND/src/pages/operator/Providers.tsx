import { Card, Badge, Button } from "../../components";

export function Providers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Provider Management</h1>
          <p className="text-gray-600">Monitor and manage mobile money and blockchain providers.</p>
        </div>
        <Button variant="primary">Add Provider</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">MTN Rwanda</h2>
            <Badge variant="success">Online</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-medium text-black">MoMo API</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-black">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Ping</span>
              <span className="font-medium text-black">2s ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Success Rate (24h)</span>
              <span className="font-medium text-black">99.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transactions (24h)</span>
              <span className="font-medium text-black">156</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">View Details</Button>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">M-Pesa Kenya</h2>
            <Badge variant="success">Online</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-medium text-black">Daraja API</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-black">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Ping</span>
              <span className="font-medium text-black">5s ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Success Rate (24h)</span>
              <span className="font-medium text-black">98.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transactions (24h)</span>
              <span className="font-medium text-black">142</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">View Details</Button>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Polygon Amoy</h2>
            <Badge variant="success">Synced</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-medium text-black">RPC Endpoint</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-black">Synced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Block Height</span>
              <span className="font-medium text-black">5,234,567</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Gas Price</span>
              <span className="font-medium text-black">15 Gwei</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Network</span>
              <span className="font-medium text-black">Testnet</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">View Details</Button>
          </div>
        </Card>

        <Card padding="lg" variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Add New Provider</h2>
          </div>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">➕</div>
            <p className="text-gray-600 mb-4">Connect a new mobile money or blockchain provider</p>
            <Button variant="primary">Configure Provider</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
