import { ArrowUpRight, FileText, Globe2, LayoutGrid, Lock, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { VukaLogo } from "../brand";

/** Illustrative only — a mocked device preview, not a live data feed. */
const payments = [
  { name: "MTN Mobile Money", reference: "INV-2041 · Kigali", amount: "USDC 4,250.00", status: "Released" },
  { name: "M-Pesa", reference: "INV-2038 · Nairobi", amount: "USDC 2,180.00", status: "Released" },
  { name: "Airtel Money", reference: "INV-2036 · Kampala", amount: "USDC 6,720.00", status: "Locked" },
  { name: "USDC · Polygon", reference: "INV-2032 · Dar", amount: "USDC 980.00", status: "Released" },
];

const NAV = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: FileText, label: "Invoices" },
  { icon: Lock, label: "Escrow" },
  { icon: Wallet, label: "Balances" },
  { icon: ShieldCheck, label: "Trust score" },
  { icon: Settings2, label: "Settings" },
];

/** Mocked device preview for the landing hero. All figures are illustrative. */
export function HeroDashboard() {
  return (
    <div className="hero-dashboard" aria-hidden="true">
      <div className="dashboard-window">
        <span /><span /><span /><p>VUKA Business — illustrative preview</p>
      </div>
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <VukaLogo size="md" />
          <div className="dashboard-business">
            Amani Textiles <span>⌄</span>
          </div>
          {NAV.map(({ icon: Icon, label }, i) => (
            <div key={label} className={`dashboard-nav ${i === 0 ? "is-active" : ""}`}>
              <Icon size={13} />
              {label}
            </div>
          ))}
          <div className="dashboard-sidebar-foot">
            <ShieldCheck size={15} /> Escrow protected
          </div>
        </aside>
        <div className="dashboard-content">
          <div className="dashboard-heading">
            <h3>Overview</h3>
            <span>This month ⌄</span>
          </div>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div>
                Locked in escrow <ArrowUpRight size={13} />
              </div>
              <strong>USDC 18,420.00</strong>
              <small>
                ↑ +12.4% <span>vs. last month</span>
              </small>
            </div>
            <div className="dashboard-stat">
              <div>
                Payment volume <ArrowUpRight size={13} />
              </div>
              <strong>USDC 42,915.50</strong>
              <div className="dashboard-bars">
                {[25, 29, 36, 32, 45, 40, 53, 61, 58, 69, 80, 73, 92].map((height, i) => (
                  <span key={i} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-transactions">
            <div className="dashboard-heading">
              <h4>Recent settlements</h4>
              <small>4 payments</small>
            </div>
            <table>
              <thead>
                <tr>
                  <th>PAYMENT METHOD</th>
                  <th>REFERENCE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, i) => (
                  <tr key={payment.reference}>
                    <td>
                      <span className="payment-symbol">{["M", "M", "A", "$"][i]}</span>
                      {payment.name}
                    </td>
                    <td>{payment.reference}</td>
                    <td>{payment.amount}</td>
                    <td>
                      <span className={`payment-status ${payment.status === "Locked" ? "is-locked" : ""}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dashboard-bottom">
            <div>
              <Globe2 size={27} />
              <h4>Trade across borders</h4>
              <p>
                Rwanda · Kenya · Uganda
                <br />
                Tanzania · Burundi
              </p>
              <div className="dashboard-corridor">
                KGL <span>↗</span> NBO <span>↗</span> EAC
              </div>
            </div>
            <div>
              <ShieldCheck size={27} />
              <h4>Every payment protected</h4>
              <p>
                Invoice-linked escrow.
                <br />
                Mobile money in. Confidence out.
              </p>
              <div className="dashboard-trust">
                <strong>812</strong>
                <span>
                  Trust score
                  <br />
                  Strong settlement record
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
