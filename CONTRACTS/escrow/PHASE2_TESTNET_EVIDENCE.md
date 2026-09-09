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

The local backup and restore path is now verified. A restore against a
separately disposable database, followed by the documented post-restore
smoke checks and projection-count comparison, is still required before this
evidence package can be accepted for externally controlled testnet activity.
