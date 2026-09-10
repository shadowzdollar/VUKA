# Phase 4 Provider Sandbox Certification Checklist

Status: **pending external provider certification; local/simulated evidence only**

This checklist is an evidence template for MTN MoMo Rwanda and Safaricom
M-Pesa Kenya. It does not grant production approval and must not be marked
complete from local adapter tests alone.

## Common controls

- [x] Adapter contract version is pinned (`v1`).
- [x] Sandbox/simulated environment is explicit.
- [x] Provider and corridor kill switches are available.
- [x] Credential configuration accepts references only.
- [x] Webhook signatures and replay keys are required.
- [x] Webhook events remain observation-only and `NOT_SETTLED`.
- [ ] Provider-issued sandbox credentials received by the security owner.
- [ ] Provider endpoint/IP allow-list and TLS requirements verified.
- [ ] Provider test-case catalogue and expected outcomes signed off.
- [ ] External certification letter or portal evidence attached.

## MTN MoMo Rwanda

Provider owner: __________________  Certification reference: ________________

- [ ] MTN-01: collection/payout happy path — request, callback, reconciliation.
- [ ] MTN-02: timeout/provider outage — bounded retry and no settlement side effect.
- [ ] MTN-03: duplicate request/callback — idempotent replay evidence.
- [ ] MTN-04: invalid recipient/insufficient provider response — refusal evidence.
- [ ] MTN-05: callback signature, timestamp and replay-key verification.
- [ ] MTN-06: reconciliation report compared with provider statement.
- [ ] Provider operations contact and escalation SLA recorded.

Evidence links / artefact IDs (restricted): _________________________________
Test date (UTC): __________  Witness: __________  Result: **PENDING**

## M-Pesa Kenya

Provider owner: __________________  Certification reference: ________________

- [ ] MPESA-01: B2C/B2B sandbox happy path — request, callback, reconciliation.
- [ ] MPESA-02: timeout/provider outage — bounded retry and no settlement side effect.
- [ ] MPESA-03: duplicate request/callback — idempotent replay evidence.
- [ ] MPESA-04: invalid recipient/insufficient provider response — refusal evidence.
- [ ] MPESA-05: callback signature, timestamp and replay-key verification.
- [ ] MPESA-06: reconciliation report compared with provider statement.
- [ ] Provider operations contact and escalation SLA recorded.

Evidence links / artefact IDs (restricted): _________________________________
Test date (UTC): __________  Witness: __________  Result: **PENDING**

## Evidence record

| Field | Value |
| --- | --- |
| Test window (UTC) | |
| Environment / tenant | |
| Build or commit | |
| Operator and reviewer | |
| Provider evidence links (restricted) | |
| Exceptions and expiry dates | |
| Approval decision | **PENDING** |

External certification status: **PENDING for both MTN MoMo Rwanda and
Safaricom M-Pesa Kenya.** Local adapter and webhook tests do not satisfy this
gate.

No external call, real credential, document upload, or fund movement is
permitted while any required item is pending.
