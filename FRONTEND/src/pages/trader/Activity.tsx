import { Card, Table, Badge, Input, Button } from "../../components";

export function Activity() {
  const transactions = [
    {
      id: "txn_8x7k2m",
      type: "PAYMENT",
      amount: "RWF 450,000",
      counterparty: "Nairobi Parts Co",
      status: "COMPLETED",
      date: "2026-09-12 14:34",
      reference: "INV-2026-0846",
    },
    {
      id: "txn_3x9k1m",
      type: "ESCROW_LOCK",
      amount: "RWF 1,200,000",
      counterparty: "Nairobi Parts Co",
      status: "LOCKED",
      date: "2026-09-12 11:20",
      reference: "INV-2026-0847",
    },
    {
      id: "txn_5n2p8q",
      type: "ESCROW_RELEASE",
      amount: "RWF 2,000,000",
      counterparty: "Uganda Electronics",
      status: "RELEASED",
      date: "2026-09-11 16:45",
      reference: "INV-2026-0842",
    },
    {
      id: "txn_7m4k9n",
      type: "PAYMENT",
      amount: "RWF 850,000",
      counterparty: "Moba Tech Ltd",
      status: "COMPLETED",
      date: "2026-09-10 09:15",
      reference: "INV-2026-0840",
    },
    {
      id: "txn_2p8k4m",
      type: "ESCROW_LOCK",
      amount: "RWF 2,000,000",
      counterparty: "Dar es Salaam Trading",
      status: "LOCKED",
      date: "2026-09-10 08:30",
      reference: "INV-2026-0845",
    },
  ];

  const columns = [
    { key: "date", header: "Date & Time" },
    { key: "type", header: "Type" },
    { key: "amount", header: "Amount" },
    { key: "counterparty", header: "Counterparty" },
    { key: "reference", header: "Reference" },
    {
      key: "status",
      header: "Status",
      render: (value: string) => {
        const variant = value === "COMPLETED" || value === "RELEASED" ? "success" : 
                        value === "LOCKED" ? "warning" : "default";
        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <Button variant="ghost" size="sm">
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Activity</h1>
        <p className="text-gray-600">View your complete transaction history.</p>
      </div>

      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <Input placeholder="Search transactions..." className="flex-1" />
          <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Types</option>
            <option value="payment">Payments</option>
            <option value="escrow_lock">Escrow Locks</option>
            <option value="escrow_release">Escrow Releases</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="locked">Locked</option>
            <option value="pending">Pending</option>
          </select>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
          <div className="text-2xl font-bold text-black">47</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">This Month</div>
          <div className="text-2xl font-bold text-black">RWF 8.2M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-black">100%</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Active Escrows</div>
          <div className="text-2xl font-bold text-black">2</div>
        </Card>
      </div>

      <Card padding="none">
        <Table columns={columns} data={transactions} emptyMessage="No transactions found" />
      </Card>
    </div>
  );
}
