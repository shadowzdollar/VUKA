# VUKA v2 Build Log

This log records durable architecture decisions, implemented work, known
limitations, and the next verified step for the long-term VUKA platform.

## 2026-09-06

- Decided: the root `README.md` is the v2 source of truth; the existing
  `ENGINE/` implementation is legacy reference code, not the target system.
- Decided: VUKA v2 starts with the escrow contract and an off-chain
  reconciliation model. Mobile-money integrations remain cash-in/cash-out
  boundaries rather than the escrow authority.
- Built: repository boundary for the first contract implementation under
  `CONTRACTS/escrow/`.
- Built: Foundry `v1.8.1` project with Solidity compiler pinned to `0.8.24`
  and `forge-std` pinned through `foundry.lock`.
- Built: six local lifecycle tests covering locking, mutual confirmation,
  timeout release, dispute/refund, access control, and terminal states.
- Prepared: Polygon Amoy deployment script and placeholder-only environment
  configuration. No wallet, RPC secret, or deployment transaction is stored
  in the repository.
- Deployed: testnet-only `VukaTestToken` and `VukaEscrow` to Polygon Amoy
  (chain ID 80002) after explicit deployment authorization. The deployed
  addresses are recorded in the handoff below.
- Security decision: escrow state changes precede ERC-20 external calls so a
  malicious token cannot re-enter a still-`CREATED` escrow.
- Added: fuzz coverage for arbitrary positive amounts, timeout durations, and
  confirmation order, plus invariants covering valid state values and locked
  funds coverage.
- Built: first Go reconciliation slice under `ENGINE/go-bridge-core/internal/
  reconciliation/`, including idempotent chain-event persistence, derived
  escrow-state transitions, reconciliation cursors, and PostgreSQL schema
  bootstrap. This remains isolated from the legacy ledger service.
- Known limitation: the contract has not yet undergone an independent security
  audit, and the current invariant suite targets the escrow contract directly
  rather than a full stateful handler.
- Built: dependency-free Polygon JSON-RPC log decoding for all VUKA escrow
  events and a confirmation-depth-aware poller that applies only finalized
  blocks to the reconciliation repository.
- Built: durable reconciliation cursor reads and atomic advancement. A
  finalized event batch and its cursor update commit together, while empty
  finalized ranges still advance safely.
- Built: bounded RPC polling with a cancellable worker loop, configurable
  block ranges, and in-memory counters for polls, applied events, successes,
  and errors. Poll failures are returned to the supervisor rather than
  swallowed.
- Built: opt-in environment configuration and process supervision wiring in
  the Go entrypoint. The worker bootstraps the reconciliation schema, resumes
  from its durable cursor, and shuts the process down on an unrecoverable
  polling error; it remains disabled by default.
- Built: reconciled escrow read endpoints (`GET /api/escrows` and
  `GET /api/reconciliation/status`) plus canonical block-hash tracking that
  detects reorganization conflicts before applying an event.
- Added: PostgreSQL integration coverage for atomic batch application,
  idempotent replay, cursor advancement, and reorganization detection. The
  test runs when `TEST_DATABASE_URL` is provided.
- Operational note: Polygon Amoy free-tier RPC rejected `eth_getLogs` ranges
  larger than 10 blocks, so the default reconciliation range is now 10 blocks.
  Providers with larger limits can override `VUKA_RECONCILIATION_MAX_RANGE`.
- Next: run the worker in read/reconcile mode against Polygon Amoy using the
  deployed test contract, with explicit confirmation depth and no transaction
  signing.

## Polygon Amoy deployment

- Settlement token: `0x715817B8582300771E87C0801Bfb93Bab5b042f5`
- Escrow contract: `0x491a0E68B440621435B606D17FDa50f7999DE4ef`
- Arbiter: `0xDC261A3b25990266f3E7D38142CB19c1eB51A181`
- Initial test-token supply: `1,000,000,000,000,000` base units (`1,000,000,000` vUSDC)
- Status: deployed to Amoy only; not a production asset or production escrow.

## Polygon Amoy smoke test

- Created escrow `0` for invoice `VUKA-SMOKE-001`.
- Buyer funded and locked `1,000,000` base units (`1 vUSDC`) in the deployed
  escrow contract.
- Verified on-chain state is `LOCKED`, the escrow holds the funds, and the
  buyer balance decreased accordingly.
- Created escrow `1` for invoice `VUKA-SMOKE-002`, locked `1,000,000` base
  units, waited past its short timeout, and verified on-chain state is
  `RELEASED` with the supplier receiving the funds.
- The smoke escrows are testnet-only data and must not be treated as production
  transactions.
