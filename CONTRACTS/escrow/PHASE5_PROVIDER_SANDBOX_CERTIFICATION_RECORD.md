# Phase 5 Provider Sandbox Certification Record

Status: **PENDING EXTERNAL CERTIFICATION for MTN MoMo Rwanda and Safaricom
M-Pesa Kenya**

This record gates any future settlement consideration. The Phase 4 adapter
tests in this repository are local/simulated evidence only and do not
represent provider certification.

## MTN MoMo Rwanda

| Test case | Expected evidence | Owner | Test date | Status |
|---|---|---|---|---|
| Happy-path collection/payout | Provider request/callback/statement references | | | PENDING |
| Timeout/provider outage | Timeout response, bounded retry, no duplicate | | | PENDING |
| Duplicate request/callback | Provider replay/idempotency evidence | | | PENDING |
| Invalid recipient/provider rejection | Error response and reconciliation result | | | PENDING |
| Callback authentication | Signature/timestamp/replay-key evidence | | | PENDING |
| Operations escalation | Named contact and sandbox SLA | | | PENDING |

Provider certification reference: __________________  
Restricted evidence location: ______________________

## Safaricom M-Pesa Kenya

| Test case | Expected evidence | Owner | Test date | Status |
|---|---|---|---|---|
| B2C/B2B happy path | Provider request/callback/statement references | | | PENDING |
| Timeout/provider outage | Timeout response, bounded retry, no duplicate | | | PENDING |
| Duplicate request/callback | Provider replay/idempotency evidence | | | PENDING |
| Invalid recipient/provider rejection | Error response and reconciliation result | | | PENDING |
| Callback authentication | Signature/timestamp/replay-key evidence | | | PENDING |
| Operations escalation | Named contact and sandbox SLA | | | PENDING |

Provider certification reference: __________________  
Restricted evidence location: ______________________

Final provider owner: __________  Security reviewer: __________  
Certification decision: **PENDING**

No real credential, live endpoint, external call, fund movement, or webhook
settlement is permitted while either provider remains pending.
