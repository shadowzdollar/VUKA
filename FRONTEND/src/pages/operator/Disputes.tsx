import { Card, Table, Badge, Button, Tabs, Modal } from "../../components";
import { useState } from "react";

export function Disputes() {
  const [showResolveModal, setShowResolveModal] = useState(false);

  const disputes = [
    {
      id: "dsp_8x7k2m",
      escrowId: "esc_8x7k2m",
      invoice: "INV-2026-0847",
      amount: "RWF 1,200,000",
      buyer: "Kigali Electronics",
      supplier: "Nairobi Parts Co",
      status: "OPEN",
      priority: "HIGH",
      created: "2026-09-12",
      reason: "Goods not received",
    },
    {
      id: "dsp_3x9k1m",
      escrowId: "esc_3x9k1m",
      invoice: "INV-2026-0845",
      amount: "RWF 2,000,000",
      buyer: "Dar es Salaam Trading",
      supplier: "Uganda Electronics",
      status: "UNDER_REVIEW",
      priority: "MEDIUM",
      created: "2026-09-10",
      reason: "Quality dispute",
    },
  ];

  const columns = [
    { key: "invoice", header: "Invoice" },
    { key: "amount", header: "Amount" },
    { key: "buyer", header: "Buyer" },
    { key: "supplier", header: "Supplier" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (v: string) => <Badge variant={v === "OPEN" ? "warning" : "info"}>{v}</Badge> },
    { key: "priority", header: "Priority", render: (v: string) => <Badge variant={v === "HIGH" ? "error" : "default"}>{v}</Badge> },
    { key: "created", header: "Created" },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">Review</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Dispute Resolution</h1>
          <p className="text-gray-600">Manage and resolve escrow disputes.</p>
        </div>
        <Button variant="primary">Create Dispute</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Open Disputes</div>
          <div className="text-2xl font-bold text-black">2</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Under Review</div>
          <div className="text-2xl font-bold text-black">1</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Resolved This Week</div>
          <div className="text-2xl font-bold text-black">5</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Avg Resolution Time</div>
          <div className="text-2xl font-bold text-black">48h</div>
        </Card>
      </div>

      <Tabs
        defaultTab="open"
        tabs={[
          {
            id: "open",
            label: "Open Disputes",
            content: <Card padding="none"><Table columns={columns} data={disputes.filter(d => d.status === "OPEN")} emptyMessage="No open disputes" /></Card>,
          },
          {
            id: "review",
            label: "Under Review",
            content: <Card padding="none"><Table columns={columns} data={disputes.filter(d => d.status === "UNDER_REVIEW")} emptyMessage="No disputes under review" /></Card>,
          },
          {
            id: "resolved",
            label: "Resolved",
            content: <Card padding="none"><Table columns={columns} data={[]} emptyMessage="No resolved disputes" /></Card>,
          },
        ]}
      />

      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Dispute" size="lg">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Dispute ID</div>
            <div className="font-mono text-black">dsp_8x7k2m</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Resolution Decision</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black">
              <option value="release">Release to Supplier</option>
              <option value="refund">Refund to Buyer</option>
              <option value="partial">Partial Release</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Rationale</label>
            <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black" rows={4} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowResolveModal(false)}>Submit Decision</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
