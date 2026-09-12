import { Card, Badge } from "../../components";

export function TrustScore() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Trust Score</h1>
        <p className="text-gray-600">Your algorithmic credit score based on settlement behavior.</p>
      </div>

      {/* Main Score Card */}
      <Card padding="lg" variant="elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-4xl font-bold">A+</div>
                <div className="text-white text-sm">Excellent</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Credit Rating</div>
              <div className="text-2xl font-bold text-black mb-4">Excellent Trust</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="success">High</Badge>
                  <span className="text-sm text-gray-600">Settlement Reliability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">High</Badge>
                  <span className="text-sm text-gray-600">On-Time Performance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">High</Badge>
                  <span className="text-sm text-gray-600">Dispute Resolution</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Score Range</div>
            <div className="text-lg font-bold text-black">850-900</div>
            <div className="text-sm text-gray-500">of 900 possible</div>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="text-lg font-bold text-black mb-4">Transaction History</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Completed Transactions</span>
                <span className="font-bold text-black">47</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">On-Time Settlement</span>
                <span className="font-bold text-black">100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Volume Growth</span>
                <span className="font-bold text-black">+23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "77%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-bold text-black mb-4">Partner Diversity</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Unique Partners</span>
                <span className="font-bold text-black">12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Repeat Business</span>
                <span className="font-bold text-black">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Corridor Coverage</span>
                <span className="font-bold text-black">2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-bold text-black mb-4">Risk Factors</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">No disputes raised</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">No payment failures</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Consistent payment patterns</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Strong account age</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-600">Limited corridor diversity</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Score History */}
      <Card padding="lg">
        <h3 className="text-lg font-bold text-black mb-4">Score History</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">📈</div>
            <div>Score trend visualization coming soon</div>
          </div>
        </div>
      </Card>

      {/* How It's Calculated */}
      <Card padding="lg">
        <h3 className="text-lg font-bold text-black mb-4">How Your Score Is Calculated</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Your trust score is computed from real settlement behavior on VUKA, not self-reported claims. 
            The following factors contribute to your score:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Settlement Reliability (40%):</strong> Percentage of escrows completed successfully without disputes</li>
            <li><strong>On-Time Performance (25%):</strong> Average time-to-release relative to agreed timeouts</li>
            <li><strong>Transaction Volume (15%):</strong> Total value and growth rate of your transactions</li>
            <li><strong>Partner Diversity (10%):</strong> Number of unique trading partners and repeat business ratio</li>
            <li><strong>Account History (10%):</strong> Age of account and consistency of activity</li>
          </ul>
          <p className="mt-4">
            Scores are updated daily based on your most recent 90 days of activity. 
            Maintaining a high score unlocks better terms, higher limits, and faster settlement times.
          </p>
        </div>
      </Card>
    </div>
  );
}
