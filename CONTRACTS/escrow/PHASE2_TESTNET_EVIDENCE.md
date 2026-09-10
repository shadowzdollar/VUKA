# Phase 2 Testnet-Readiness Evidence

This document records the evidence required before any controlled testnet
activity. It is an evidence package, not deployment approval. Production
deployment, production funds, and settlement execution remain disabled.

## Contract evidence

Validated locally with Foundry from `CONTRACTS/escrow`:

```text
forge test -vv
16 unit/fuzz tests passed
1 invariant suite passed
17 total tests passed
0 failed
0 skipped
```

The invariant suite executed 256 runs and 128,000 calls. The validated
behaviors include:

- absolute `timeoutAt` persistence and event emission;
- confirmation rejection at or after the timeout;
- one confirmation per participant;
- release at mutual confirmation;
- timeout release at the deadline;
- dispute arbitration to refund or release;
- exact locked-amount refund and release;
- terminal-state immutability;
- no double payout.

## Independent security review

An independent read-only security review was completed on 2026-09-10. The
review covered access control, timeout handling, dispute and arbitration
paths, token custody, release/refund behavior, reentrancy exposure, replay and
double-payout resistance, and terminal-state invariants.

Result: no high-confidence exploitable vulnerabilities were found under the
standard ERC20 assumptions used by the project.

The final local Foundry validation completed after the review:

```text
17 total tests passed
0 failed
0 skipped
1 invariant suite passed
```

## Reconciliation evidence

The Go reconciliation package covers:

- strict decoding of `EscrowCreated(amount, timeoutAt, invoiceRef)`;
- canonical event-topic matching;
- durable event idempotency;
- conflicting replay rejection;
- canonical block hash conflict detection;
- ordered finalized batches;
- atomic rollback of events, projections, and cursors;
- confirmation-depth finality boundaries;
- RPC HTTP, JSON-RPC, and cancellation failures;
- poller error metrics and cursor safety.

Run the focused suite from `ENGINE/go-bridge-core`:

```bash
go test ./internal/reconciliation
```

The focused suite passes in the development environment. The complete
PostgreSQL-backed Go suite also passes across adapters, API, configuration,
gRPC, idempotency, ledger, reconciliation, and shared test utilities.
Database-backed integration tests require a valid `TEST_DATABASE_URL`.

## Recovery evidence

The recovery runbook is:

```text
ENGINE/deploy/RECOVERY_RUNBOOK.md
```

Local recovery evidence recorded on 2026-09-09:

- Backup: `ENGINE/deploy/backups/vuka-20260909T073415Z.dump`
- Size: 57,201 bytes
- SHA-256: `c9e76300142a0e79010d05a28d62ca24bdde4996eb0075e2e1935201e9f3814c`
- Restore command: `make restore CONFIRM_RESTORE=YES`
- Result: restore completed successfully into the local `vuka` database
- Disposable drill command: `make restore-drill`
- Disposable drill database: `vuka_restore_drill`
- Restored projection counts: 5 escrows, 8 chain events, 482 operator-activity records
- Restored schema checks: `escrows`, `chain_events`, `operator_activity`, and
  `escrows.timeout_at` all present
- Cleanup: disposable drill database removed automatically

Required evidence before any externally controlled testnet operation remains:

1. A verified database backup and SHA-256 checksum.
2. A successful restore drill against a disposable database.
3. Reconciliation schema bootstrap after restore.
4. Read-only reconciliation confirmed after restore.
5. Escrow and chain-event projection counts compared with the drill record.
6. Operator activity and audit exports verified.

## Explicit safety gates

The following remain blocked:

- no production deployment;
- no domain or paid hosting commitment;
- no production stablecoin;
- no unrestricted contract execution;
- no automated release, refund, timeout, or arbitration transactions from Go;
- no testnet broadcast without a separately recorded approval and runbook;
- no transition to Phase 3 until the Phase 2 exit gate is accepted.

## Remaining acceptance items

Before testnet deployment is considered, the project still requires:

- an independent contract security review with a usable report;
- a recorded database restore drill;
- testnet deployment parameters reviewed and recorded;
- a testnet-only end-to-end observation plan;
- explicit approval for any broadcast transaction.

The local backup and restore path is now verified, including a disposable
database restore and projection/schema checks. Application-level smoke checks
such as `/healthz`, operator sign-in, audit recording, and read-only
reconciliation confirmation remain required before this evidence package can
be accepted for externally controlled testnet activity.

Application smoke checks recorded on 2026-09-10:

- `/healthz`: HTTP 200, `{"status":"ok"}`
- Operator login: HTTP 200; authenticated operator
  `shadowzdollar@gmail.com` with role `arbiter`
- `/api/auth/me`: HTTP 200 with the expected operator identity and role
- `/api/activity`: HTTP 200; sign-in and activity-view events present
- Read-only ledger write attempt: HTTP 423 with `read_only_mode`
- Activity records visible after the smoke check: 544

These checks confirm database connectivity, authentication, audit activity
recording, and enforcement of the local read-only safety boundary.
