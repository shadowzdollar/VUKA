import { Card, Badge, Button, Table, Tabs } from "../../components";

export function EscrowManagement() {
  const escrows = [
    {
      id: "esc_8x7k2m",
      invoice: "INV-2026-0847",
      amount: "RWF 1,200,000",
      buyer: "Kigali Electronics Ltd",
      supplier: "Nairobi Parts Co",
      state: "LOCKED",
      created: "2026-09-12",
      timeout: "2026-09-19",
    },
    {
      id: "esc_3x9k1m",
      invoice: "INV-2026-0845",
      amount: "RWF 2,000,000",
      buyer: "Kigali Electronics Ltd",
      supplier: "Dar es Salaam Trading",
      state: "LOCKED",
      created: "2026-09-10",
      timeout: "2026-09-17",
    },
    {
      id: "esc_5n2p8q",
      invoice: "INV-2026-0842",
      amount: "RWF 3,500,000",
      buyer: "Kigali Electronics Ltd",
      supplier: "Uganda Electronics",
      state: "RELEASED",
      created: "2026-09-08",
      timeout: "2026-09-15",
    },
    {
      id: "esc_7m4k9n",
      invoice: "INV-2026-0840",
      amount: "RWF 800,000",
      buyer: "Kigali Electronics Ltd",
      supplier: "Moba Tech Ltd",
      state: "RELEASED",
      created: "2026-09-05",
      timeout: "2026-09-12",
    },
  ];

  const columns = [
    { key: "invoice", header: "Invoice" },
    { key: "amount", header: "Amount" },
    { key: "buyer", header: "Buyer" },
    { key: "supplier", header: "Supplier" },
    { 
      key: "state", 
      header: "Status",
      render: (value: string) => (
        <Badge variant={value === "LOCKED" ? "warning" : "success"}>
          {value}
        </Badge>
      ),
    },
    { key: "created", header: "Created" },
    { key: "timeout", header: "Timeout" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Escrow Management</h1>
          <p className="text-gray-600">View and manage your escrow transactions.</p>
        </div>
        <Button variant="primary">Create New Escrow</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Active Escrows</div>
          <div className="text-2xl font-bold text-black">2</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Locked</div>
          <div className="text-2xl font-bold text-black">RWF 3.2M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Released This Month</div>
          <div className="text-2xl font-bold text-black">RWF 4.3M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-black">100%</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        defaultTab="active"
        tabs={[
          {
            id: "active",
            label: "Active Escrows",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={escrows.filter((e) => e.state === "LOCKED")}
                  emptyMessage="No active escrows"
                />
              </Card>
            ),
          },
          {
            id: "completed",
            label: "Completed",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={escrows.filter((e) => e.state === "RELEASED")}
                  emptyMessage="No completed escrows"
                />
              </Card>
            ),
          },
          {
            id: "all",
            label: "All History",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={escrows}
                  emptyMessage="No escrow history"
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
