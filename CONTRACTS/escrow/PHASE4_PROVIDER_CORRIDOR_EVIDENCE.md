# Phase 4 Provider and Corridor Integration Foundation

Status: **sandbox/simulated foundation; external integrations disabled**  
Date: 2026-09-10

This is an engineering evidence record, not a provider certification or legal
approval.

## Delivered controls

- Versioned `v1` adapter boundary shared by the MTN MoMo Rwanda and M-Pesa
  Kenya simulated adapters.
- Corridor metadata for RW/RWF -> KE/KES including fee basis, fixed fee,
  amount/daily limits, FX quote provenance/expiry, liquidity ownership,
  operations ownership, enablement, and kill switch.
- Credential boundary accepts references only; literal secrets and external
  calls are rejected by validation. No credentials are committed.
- Local webhook intake requires a replay key and signature validator,
  records explicit accepted/rejected/duplicate state, and is append-only in
  the database schema.
- Accepted webhooks update observation/reconciliation evidence only. They
  never call an adapter, write ledger entries, release/refund/arbitrate, or
  submit blockchain transactions.
- Read-only provider, corridor, webhook-event, and reconciliation surfaces are
  protected by `operator`/`arbiter` when auth is enabled.
- Embedded schema bootstrap and a recovery migration cover provider control
  plane tables.

## Acceptance checklist

- [x] Adapter contract and sandbox fixtures are deterministic and cancellable.
- [x] Invalid fees, FX metadata, limits, credentials, and contract versions
  fail closed.
- [x] Corridor kill switch blocks authorization.
- [x] Webhook signature rejection and replay detection are tested.
- [x] Read-only inspection does not invoke settlement paths.
- [x] No real provider API call, credential, document upload, blockchain write,
  automatic release/refund, or live settlement execution.
- [ ] Provider-specific external sandbox certification remains pending; use
  [`PHASE4_PROVIDER_SANDBOX_CERTIFICATION.md`](PHASE4_PROVIDER_SANDBOX_CERTIFICATION.md).
- [x] Secret-manager boundary/rotation, webhook operations, and corridor
  failure/reconciliation runbooks are versioned in `ENGINE/`.
- [ ] Secret-manager integration, legal approval, and live provider access
  remain future work.

## Test evidence

Targeted commands:

```bash
cd ENGINE/go-bridge-core
go test ./internal/providers ./internal/adapters
go test ./internal/api -run '^TestProvider' -count=1
```

The database-backed API suite requires a configured PostgreSQL test database;
when unavailable it must be reported rather than bypassed.

## Final local verification

Completed on 2026-09-10 against the local PostgreSQL-backed engine:

- Provider status inspection: HTTP 200
- Corridor inspection: HTTP 200
- Provider webhook-event inspection: HTTP 200
- Provider reconciliation inspection: HTTP 200
- Operator authentication: HTTP 200
- Ledger write attempt with `VUKA_READ_ONLY=true`: HTTP 423
  `read_only_mode`
- Provider route and webhook safety tests passed

The provider and corridor foundation is therefore operational locally in
simulated mode. External provider calls, production credentials, live
webhooks, settlement execution, and blockchain transactions remain disabled.

Phase 5 controlled settlement execution is implemented as a persisted,
approval-gated, dry-run-only control plane. Its global kill switch is active
by default; see `PHASE5_CONTROLLED_SETTLEMENT_EVIDENCE.md`.
