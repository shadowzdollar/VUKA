import { Card, Button } from "../../components";

export function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform-wide analytics and reporting.</p>
        </div>
        <Button variant="outline">Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Volume (30d)</div>
          <div className="text-2xl font-bold text-black">RWF 124.5M</div>
          <div className="text-sm text-green-600">+12.5%</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Active Traders</div>
          <div className="text-2xl font-bold text-black">1,247</div>
          <div className="text-sm text-green-600">+8.2%</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Transactions (30d)</div>
          <div className="text-2xl font-bold text-black">3,892</div>
          <div className="text-sm text-green-600">+15.3%</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-black">99.8%</div>
          <div className="text-sm text-gray-500">Stable</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Volume Trend</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📈</div>
              <div>Volume chart visualization coming soon</div>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Transaction Distribution</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>Distribution chart coming soon</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <h2 className="text-lg font-bold text-black mb-4">Top Corridors</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">RWF → KES</span>
              <span className="font-bold text-black">RWF 45.2M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">RWF → UGX</span>
              <span className="font-bold text-black">RWF 32.1M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">RWF → TZS</span>
              <span className="font-bold text-black">RWF 28.4M</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-black mb-4">Top Traders</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Kigali Electronics</span>
              <span className="font-bold text-black">RWF 18.5M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Nairobi Parts Co</span>
              <span className="font-bold text-black">RWF 15.2M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Uganda Electronics</span>
              <span className="font-bold text-black">RWF 12.8M</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-black mb-4">Escrow States</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Locked</span>
              <span className="font-bold text-black">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Released</span>
              <span className="font-bold text-black">3,868</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Disputed</span>
              <span className="font-bold text-black">2</span>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">Monthly Volume Report</div>
            <p className="text-sm text-gray-600 mb-3">Detailed breakdown of monthly transaction volumes</p>
            <Button variant="outline" size="sm">Generate</Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">Trader Performance</div>
            <p className="text-sm text-gray-600 mb-3">Individual trader analytics and rankings</p>
            <Button variant="outline" size="sm">Generate</Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">Risk Analysis</div>
            <p className="text-sm text-gray-600 mb-3">Platform risk metrics and exposure analysis</p>
            <Button variant="outline" size="sm">Generate</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
