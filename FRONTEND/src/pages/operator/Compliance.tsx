import { Card, Table, Badge, Button, Tabs } from "../../components";

export function Compliance() {
  const reviews = [
    {
      id: "rev_8x7k2m",
      traderId: "trd_8x7k2m",
      traderName: "Kigali Electronics Ltd",
      type: "KYC_VERIFICATION",
      status: "PENDING",
      priority: "HIGH",
      submitted: "2026-09-12",
      documents: 3,
    },
    {
      id: "rev_3x9k1m",
      traderId: "trd_3x9k1m",
      traderName: "Nairobi Parts Co",
      type: "AML_SCREENING",
      status: "UNDER_REVIEW",
      priority: "MEDIUM",
      submitted: "2026-09-10",
      documents: 5,
    },
    {
      id: "rev_5n2p8q",
      traderId: "trd_5n2p8q",
      traderName: "Uganda Electronics",
      type: "KYC_VERIFICATION",
      status: "APPROVED",
      priority: "LOW",
      submitted: "2026-09-08",
      documents: 4,
    },
  ];

  const columns = [
    { key: "traderName", header: "Trader" },
    { key: "type", header: "Review Type" },
    { key: "status", header: "Status", render: (v: string) => {
      const variant = v === "APPROVED" ? "success" : v === "PENDING" ? "warning" : "info";
      return <Badge variant={variant}>{v}</Badge>;
    }},
    { key: "priority", header: "Priority", render: (v: string) => <Badge variant={v === "HIGH" ? "error" : "default"}>{v}</Badge> },
    { key: "documents", header: "Documents" },
    { key: "submitted", header: "Submitted" },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">Review</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Compliance & KYC</h1>
          <p className="text-gray-600">Manage trader verification and compliance reviews.</p>
        </div>
        <Button variant="primary">Initiate Review</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Pending Reviews</div>
          <div className="text-2xl font-bold text-black">1</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Under Review</div>
          <div className="text-2xl font-bold text-black">1</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Approved This Week</div>
          <div className="text-2xl font-bold text-black">8</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Compliance Rate</div>
          <div className="text-2xl font-bold text-black">94%</div>
        </Card>
      </div>

      <Tabs
        defaultTab="pending"
        tabs={[
          {
            id: "pending",
            label: "Pending",
            content: <Card padding="none"><Table columns={columns} data={reviews.filter(r => r.status === "PENDING")} emptyMessage="No pending reviews" /></Card>,
          },
          {
            id: "review",
            label: "Under Review",
            content: <Card padding="none"><Table columns={columns} data={reviews.filter(r => r.status === "UNDER_REVIEW")} emptyMessage="No reviews under review" /></Card>,
          },
          {
            id: "approved",
            label: "Approved",
            content: <Card padding="none"><Table columns={columns} data={reviews.filter(r => r.status === "APPROVED")} emptyMessage="No approved reviews" /></Card>,
          },
          {
            id: "all",
            label: "All Reviews",
            content: <Card padding="none"><Table columns={columns} data={reviews} emptyMessage="No reviews" /></Card>,
          },
        ]}
      />

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Compliance Checklist</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Business Registration Verification</div>
              <div className="text-sm text-gray-500">Verify business registration with local authorities</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">AML Screening</div>
              <div className="text-sm text-gray-500">Screen against international watchlists</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Identity Verification</div>
              <div className="text-sm text-gray-500">Verify director and beneficial owner identities</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-black">Tax Compliance</div>
              <div className="text-sm text-gray-500">Verify tax registration and status</div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
