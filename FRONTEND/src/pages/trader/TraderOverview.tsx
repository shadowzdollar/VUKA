import { Card, Badge, Button } from "../../components";

export function TraderOverview() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Welcome back, John</h1>
        <p className="text-gray-600">Your trade activity is protected and every payment is traceable.</p>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Business Account</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="text-3xl font-bold text-black mb-1">RWF 12,450,000</div>
          <div className="text-sm text-gray-500">Available balance</div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">Account ID</div>
            <div className="text-sm font-mono text-gray-600">acct_8x7k2m...</div>
          </div>
        </Card>

        <Card variant="bordered" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Personal Account</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="text-3xl font-bold text-black mb-1">RWF 850,000</div>
          <div className="text-sm text-gray-500">Available balance</div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">Account ID</div>
            <div className="text-sm font-mono text-gray-600">acct_3x9k1m...</div>
          </div>
        </Card>

        <Card variant="bordered" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Escrow Held</span>
            <Badge variant="warning">Locked</Badge>
          </div>
          <div className="text-3xl font-bold text-black mb-1">RWF 3,200,000</div>
          <div className="text-sm text-gray-500">In 2 active escrows</div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" className="w-full">
              View Escrows
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="primary" size="lg" className="h-24 flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">💸</span>
          <span className="text-sm">Send Money</span>
        </Button>
        <Button variant="outline" size="lg" className="h-24 flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">📄</span>
          <span className="text-sm">Create Invoice</span>
        </Button>
        <Button variant="outline" size="lg" className="h-24 flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">👥</span>
          <span className="text-sm">Add Recipient</span>
        </Button>
        <Button variant="outline" size="lg" className="h-24 flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">🔒</span>
          <span className="text-sm">New Escrow</span>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-black">Recent Activity</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <div className="font-medium text-black">Payment to Nairobi Parts Co</div>
                <div className="text-sm text-gray-500">Today, 2:34 PM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">-RWF 450,000</div>
              <Badge variant="success">Completed</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">🔒</span>
              </div>
              <div>
                <div className="font-medium text-black">Escrow locked - INV-2026-0847</div>
                <div className="text-sm text-gray-500">Today, 11:20 AM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">RWF 1,200,000</div>
              <Badge variant="warning">Locked</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <div className="font-medium text-black">Escrow released - INV-2026-0842</div>
                <div className="text-sm text-gray-500">Yesterday, 4:15 PM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">+RWF 2,000,000</div>
              <Badge variant="success">Released</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Trust Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Your Trust Score</h2>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">A+</span>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Credit Rating</div>
              <div className="text-2xl font-bold text-black mb-2">Excellent</div>
              <div className="text-sm text-gray-600">
                Based on 47 completed transactions with 100% on-time settlement
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-xl font-bold text-black mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-black">47</div>
              <div className="text-sm text-gray-500">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">RWF 8.2M</div>
              <div className="text-sm text-gray-500">Total Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">12</div>
              <div className="text-sm text-gray-500">Trading Partners</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">0</div>
              <div className="text-sm text-gray-500">Disputes</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
