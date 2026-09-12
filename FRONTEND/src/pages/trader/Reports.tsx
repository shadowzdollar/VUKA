import { Card, Button } from "../../components";

export function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Reports</h1>
        <p className="text-gray-600">Business analytics and financial reporting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-black">RWF 8.2M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">This Month</div>
          <div className="text-2xl font-bold text-black">RWF 2.4M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Transactions</div>
          <div className="text-2xl font-bold text-black">47</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Partners</div>
          <div className="text-2xl font-bold text-black">12</div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black">Available Reports</h2>
          <Button variant="outline">Export All</Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Transaction Summary</div>
              <div className="text-sm text-gray-500">Monthly breakdown of all transactions</div>
            </div>
            <Button variant="outline" size="sm">Download CSV</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Escrow Performance</div>
              <div className="text-sm text-gray-500">Escrow lock, release, and timeout metrics</div>
            </div>
            <Button variant="outline" size="sm">Download CSV</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Partner Analysis</div>
              <div className="text-sm text-gray-500">Trading partner volume and frequency</div>
            </div>
            <Button variant="outline" size="sm">Download CSV</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Trust Score History</div>
              <div className="text-sm text-gray-500">Score changes over time</div>
            </div>
            <Button variant="outline" size="sm">Download CSV</Button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Custom Report Builder</h2>
        <p className="text-gray-600 mb-4">Build custom reports with your preferred filters and date ranges.</p>
        <Button variant="primary">Create Custom Report</Button>
      </Card>
    </div>
  );
}
