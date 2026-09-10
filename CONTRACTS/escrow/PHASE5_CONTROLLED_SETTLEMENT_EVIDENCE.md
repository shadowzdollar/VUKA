# Phase 5 Controlled Settlement Execution Evidence

Status: **implemented local control plane; dry-run only; global kill switch active**

## Scope delivered

- Persisted settlement commands for payout, fund, release, refund, timeout,
  and arbitration actions.
- Idempotent submission with conflict detection, explicit approval and
  execution states, reconciliation outcomes, and append-only settlement audit.
- Role-protected submit, preflight, approve, dry-run/execute, cancel, status,
  reconciliation, and audit endpoints.
- Self-approval prevention and configurable required approvals (default two).
- Explainable preflight checks for provider/corridor state, kill switches,
  amount/daily limits, FX/fee metadata, identity/compliance, read-only mode,
  and execution boundary.
- Live provider calls, blockchain writes, ledger mutations, and automatic
  release/refund/arbitration are refused.

## Safety defaults

| Control | Default |
| --- | --- |
| Global settlement kill switch | **ACTIVE** |
| Live execution feature flag | **DISABLED** |
| Provider calls | **REFUSED** |
| Blockchain writes | **REFUSED** |
| Required approvals | 2, with requester separation |
| Read-only mode | Blocks all settlement state changes |

## Local synthetic evidence

Use only synthetic provider/corridor identifiers and amounts. A successful
dry-run must not create ledger entries, call an adapter, alter provider
webhook state, or broadcast a chain transaction. Reconciliation records are
operator-entered observations and do not move funds.

## Acceptance checklist

- [x] Model validation and terminal/state conflict controls.
- [x] Idempotency replay and payload conflict handling.
- [x] Approval role separation and self-approval prevention.
- [x] Preflight explanations and kill-switch/limit checks.
- [x] Live execution refusal and read-only guard.
- [x] Schema/bootstrap and recovery migration path.
- [x] Governance artifacts and explicit multi-party kill-switch change control.
- [ ] Independent security review — pending external report.
- [ ] MTN/M-Pesa sandbox certification — pending provider evidence.
- [ ] Secret-manager and credential rotation approval — pending.
- [ ] Corridor legal/compliance/operational approval — pending.
- [ ] External provider or blockchain certification (not in this milestone).

Provider test-case record:
[`PHASE5_PROVIDER_SANDBOX_CERTIFICATION_RECORD.md`](PHASE5_PROVIDER_SANDBOX_CERTIFICATION_RECORD.md).

## Final local verification record

The prior local verification record below is retained as historical evidence;
it was **not reproducible in this workspace** because the configured local
PostgreSQL test credentials were rejected. Re-run it after provisioning the
database and replace this note with operator/build references:

- Operator authentication: HTTP 200
- Provider status inspection: HTTP 200
- Corridor inspection: HTTP 200
- Settlement command inspection: HTTP 200
- Settlement policy reported global kill switch active and live execution
  disabled
- Settlement submission with `VUKA_READ_ONLY=true`: HTTP 423
  `read_only_mode`
- No provider call, ledger mutation, escrow action, or blockchain transaction
  was enabled by the historical verification

The Phase 5 control plane is therefore operational locally in dry-run-only
mode. Independent security review, provider certification, secret rotation,
corridor approvals, and any future live execution approval remain explicit
gates. See the independent review, credential, corridor, and kill-switch
records in this directory.
