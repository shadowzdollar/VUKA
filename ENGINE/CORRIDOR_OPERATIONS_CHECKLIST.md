# Corridor-specific operations and compliance checklist

Corridor: RW/RWF -> KE/KES  |  Provider: M-Pesa Kenya (simulated)

- [ ] Source and destination countries/currencies match the registered corridor.
- [ ] Provider contract and sandbox certification are current.
- [ ] FX quote source, quote id, expiry, fee basis, and markup are recorded.
- [ ] Amount, daily, and velocity limits are configured and reviewed.
- [ ] Liquidity owner and operations owner are named and on-call.
- [ ] Organization identity/compliance status is approved before a command can
  pass preflight.
- [ ] Sanctions/risk review and invoice/business purpose evidence are recorded
  as metadata only.
- [ ] Provider, corridor, and global kill-switch drill has been completed.

## Provider failure and reconciliation

Timeouts and ambiguous responses remain pending; retry with the same key.
Invalid recipient, rejected, or expired outcomes become failed/expired and
require operator review. Compare provider statements to webhook evidence and
settlement reconciliation records, open a discrepancy, and keep the corridor
disabled until the operations owner signs off. Never repair a discrepancy by
writing directly to balances or replaying a payout.

This checklist is not a regulatory approval and does not authorize live funds.
