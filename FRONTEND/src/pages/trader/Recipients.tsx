import { Card, Button, Table, Badge, Input, Modal } from "../../components";
import { useState } from "react";

export function Recipients() {
  const [showAddModal, setShowAddModal] = useState(false);

  const recipients = [
    {
      id: "rec_8x7k2m",
      name: "Nairobi Parts Co",
      phone: "+254 700 000 000",
      country: "Kenya",
      currency: "KES",
      transactions: 15,
      lastUsed: "2026-09-12",
      status: "VERIFIED",
    },
    {
      id: "rec_3x9k1m",
      name: "Uganda Electronics",
      phone: "+256 700 000 000",
      country: "Uganda",
      currency: "UGX",
      transactions: 8,
      lastUsed: "2026-09-11",
      status: "VERIFIED",
    },
    {
      id: "rec_5n2p8q",
      name: "Dar es Salaam Trading",
      phone: "+255 700 000 000",
      country: "Tanzania",
      currency: "TZS",
      transactions: 12,
      lastUsed: "2026-09-10",
      status: "VERIFIED",
    },
    {
      id: "rec_7m4k9n",
      name: "Moba Tech Ltd",
      phone: "+250 700 000 000",
      country: "Rwanda",
      currency: "RWF",
      transactions: 5,
      lastUsed: "2026-09-08",
      status: "VERIFIED",
    },
  ];

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone Number" },
    { key: "country", header: "Country" },
    { key: "currency", header: "Currency" },
    { key: "transactions", header: "Transactions" },
    { key: "lastUsed", header: "Last Used" },
    {
      key: "status",
      header: "Status",
      render: (value: string) => <Badge variant="success">{value}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">Send</Button>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Recipients</h1>
          <p className="text-gray-600">Manage your business contacts and payment recipients.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Add Recipient
        </Button>
      </div>

      <Card padding="md" variant="bordered">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <div className="font-medium text-black mb-1">How Recipients Work</div>
            <p className="text-sm text-gray-600">
              Recipients are verified business contacts you can send payments to. 
              Each recipient must have a verified account on VUKA to receive funds.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Total Recipients</div>
          <div className="text-2xl font-bold text-black">12</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Active This Month</div>
          <div className="text-2xl font-bold text-black">8</div>
        </Card>
        <Card padding="md">
          <div className="text-sm text-gray-500 mb-1">Countries</div>
          <div className="text-2xl font-bold text-black">4</div>
        </Card>
      </div>

      <Card padding="md">
        <Input placeholder="Search recipients by name or phone number..." className="w-full" />
      </Card>

      <Card padding="none">
        <Table columns={columns} data={recipients} emptyMessage="No recipients found" />
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Recipient" size="md">
        <div className="space-y-4">
          <Input label="Recipient Name" placeholder="Business name or contact name" />
          <Input label="Phone Number" type="tel" placeholder="+250 700 000 000" />
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              We'll search for this recipient in the VUKA network.
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowAddModal(false)}>Search & Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
