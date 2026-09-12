import { Card, Input, Button, Table, Badge, Modal } from "../../components";
import { useState } from "react";

export function Support() {
  const [showNewTicket, setShowNewTicket] = useState(false);

  const tickets = [
    {
      id: "tkt_8x7k2m",
      subject: "Escrow timeout issue",
      status: "OPEN",
      priority: "HIGH",
      created: "2026-09-12",
      lastUpdate: "2026-09-12",
    },
    {
      id: "tkt_3x9k1m",
      subject: "Payment not received",
      status: "RESOLVED",
      priority: "MEDIUM",
      created: "2026-09-10",
      lastUpdate: "2026-09-11",
    },
  ];

  const columns = [
    { key: "subject", header: "Subject" },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge variant={value === "OPEN" ? "warning" : "success"}>{value}</Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <Badge variant={value === "HIGH" ? "error" : "default"}>{value}</Badge>
      ),
    },
    { key: "created", header: "Created" },
    { key: "lastUpdate", header: "Last Update" },
    {
      key: "actions",
      header: "",
      render: () => <Button variant="ghost" size="sm">View</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Support</h1>
          <p className="text-gray-600">Get help with your VUKA account and transactions.</p>
        </div>
        <Button variant="primary" onClick={() => setShowNewTicket(true)}>
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Open Tickets</div>
          <div className="text-2xl font-bold text-black">1</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Resolved This Month</div>
          <div className="text-2xl font-bold text-black">3</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold text-black">2h</div>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Your Tickets</h2>
        <Table columns={columns} data={tickets} emptyMessage="No support tickets" />
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold text-black mb-4">Quick Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">💳 Payment Issues</div>
            <p className="text-sm text-gray-600 mb-3">Trouble with a payment or escrow?</p>
            <Button variant="outline" size="sm">Get Help</Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">🔒 Escrow Problems</div>
            <p className="text-sm text-gray-600 mb-3">Need help with escrow release or disputes?</p>
            <Button variant="outline" size="sm">Get Help</Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">👤 Account Issues</div>
            <p className="text-sm text-gray-600 mb-3">Problems with your account or verification?</p>
            <Button variant="outline" size="sm">Get Help</Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-black mb-2">📱 Technical Issues</div>
            <p className="text-sm text-gray-600 mb-3">App not working as expected?</p>
            <Button variant="outline" size="sm">Get Help</Button>
          </div>
        </div>
      </Card>

      <Modal isOpen={showNewTicket} onClose={() => setShowNewTicket(false)} title="Create Support Ticket" size="md">
        <div className="space-y-4">
          <Input label="Subject" placeholder="Brief description of your issue" />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Priority</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
              rows={4}
              placeholder="Describe your issue in detail..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowNewTicket(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowNewTicket(false)}>Submit Ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
