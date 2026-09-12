import { useState } from "react";
import { Card, Input, Select, Button, Alert } from "../../components";

export function SendMoney() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [corridor, setCorridor] = useState("");
  const [sourceAccount, setSourceAccount] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Send Money</h1>
        <p className="text-gray-600">Send cross-border payments with escrow protection.</p>
      </div>

      <Alert variant="info" className="mb-6">
        <strong>Local Environment:</strong> This is a controlled test environment. No real funds will move.
      </Alert>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= s ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 4 && (
              <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-black' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-4">Step 1: Enter Details</h2>
              <div className="space-y-4">
                <Input
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                
                <Select
                  label="Source Account"
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                >
                  <option value="">Select account</option>
                  <option value="business">Business Account (RWF 12,450,000)</option>
                  <option value="personal">Personal Account (RWF 850,000)</option>
                </Select>

                <Input
                  label="Recipient Phone"
                  type="tel"
                  placeholder="+250 700 000 000"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />

                <Select
                  label="Corridor"
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                >
                  <option value="">Select corridor</option>
                  <option value="rw-ke">Rwanda (RWF) → Kenya (KES)</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setStep(2)}>
                Continue to Quote →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-4">Step 2: Review Quote</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">You send</span>
                  <span className="text-2xl font-bold text-black">{amount || "0"} RWF</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Exchange rate</span>
                  <span className="font-medium">1 RWF = 0.085 KES</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Fee</span>
                  <span className="font-medium">RWF 2,500</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-medium text-black">They receive</span>
                  <span className="text-2xl font-bold text-black">
                    {amount ? (parseFloat(amount) * 0.085).toFixed(2) : "0"} KES
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                Quote expires in 15 minutes
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Continue to Authorization →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-4">Step 3: Authorize Payment</h2>
              
              <Alert variant="warning" className="mb-6">
                <strong>Provider Authorization Required:</strong> Complete the authorization with your mobile money provider.
              </Alert>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Provider</div>
                  <div className="font-medium text-black">MTN Rwanda</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Authorization Method</div>
                  <div className="font-medium text-black">USSD Push / App Notification</div>
                </div>

                <Button variant="outline" className="w-full" disabled>
                  Request Provider Authorization (Coming Soon)
                </Button>

                <div className="text-center text-sm text-gray-500">
                  For testing, use the synthetic authorization below
                </div>

                <Button variant="primary" className="w-full" onClick={() => setStep(4)}>
                  Use Test Authorization
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Payment Submitted</h2>
              <p className="text-gray-600 mb-6">
                Your payment has been submitted and is being processed.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                <div className="text-sm text-gray-500 mb-2">Transaction ID</div>
                <div className="font-mono text-black mb-4">txn_8x7k2m3n4p5q6r7</div>
                
                <div className="text-sm text-gray-500 mb-2">Status</div>
                <div className="font-medium text-black">Processing</div>
              </div>

              <Button variant="primary" onClick={() => setStep(1)}>
                Send Another Payment
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
