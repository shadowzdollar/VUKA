import { Card, Button, Table, Badge, Tabs } from "../../components";

export function InvoiceManagement() {
  const invoices = [
    {
      id: "inv_8x7k2m",
      number: "INV-2026-0847",
      counterparty: "Nairobi Parts Co",
      amount: "RWF 1,200,000",
      currency: "RWF",
      status: "PENDING",
      issueDate: "2026-09-12",
      dueDate: "2026-09-19",
    },
    {
      id: "inv_3x9k1m",
      number: "INV-2026-0845",
      counterparty: "Dar es Salaam Trading",
      amount: "RWF 2,000,000",
      currency: "RWF",
      status: "PAID",
      issueDate: "2026-09-10",
      dueDate: "2026-09-17",
    },
    {
      id: "inv_5n2p8q",
      number: "INV-2026-0842",
      counterparty: "Uganda Electronics",
      amount: "RWF 3,500,000",
      currency: "RWF",
      status: "PAID",
      issueDate: "2026-09-08",
      dueDate: "2026-09-15",
    },
  ];

  const columns = [
    { key: "number", header: "Invoice Number" },
    { key: "counterparty", header: "Counterparty" },
    { key: "amount", header: "Amount" },
    { 
      key: "status", 
      header: "Status",
      render: (value: string) => (
        <Badge variant={value === "PAID" ? "success" : "warning"}>
          {value}
        </Badge>
      ),
    },
    { key: "dueDate", header: "Due Date" },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Invoice Management</h1>
          <p className="text-gray-600">Create, track, and manage your trade invoices.</p>
        </div>
        <Button variant="primary">Create Invoice</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Pending Invoices</div>
          <div className="text-2xl font-bold text-black">1</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-black">RWF 1.2M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Paid This Month</div>
          <div className="text-2xl font-bold text-black">RWF 5.5M</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-black">47</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        defaultTab="pending"
        tabs={[
          {
            id: "pending",
            label: "Pending",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={invoices.filter((i) => i.status === "PENDING")}
                  emptyMessage="No pending invoices"
                />
              </Card>
            ),
          },
          {
            id: "paid",
            label: "Paid",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={invoices.filter((i) => i.status === "PAID")}
                  emptyMessage="No paid invoices"
                />
              </Card>
            ),
          },
          {
            id: "all",
            label: "All Invoices",
            content: (
              <Card padding="none">
                <Table
                  columns={columns}
                  data={invoices}
                  emptyMessage="No invoices"
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
