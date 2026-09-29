# Security policy

VUKA is a **sandbox** platform today: no real telecom or bank credentials are configured, no live
payout rail is enabled, and no independent audit of the contracts or the engine has taken place yet.
This document says what is actually verified, what automated tooling runs, and how to report a
problem — without claiming a certification VUKA does not hold.

## Scope

This repository: `ENGINE/go-bridge-core` (Go API and ledger), `CONTRACTS/escrow` (Solidity), and
`FRONTEND` (TanStack Start). Third-party dependencies are in scope only insofar as VUKA's own code
calls the vulnerable path; see the scan log below for how that is decided.

## Supported branch

Only `main` receives fixes. There are no released versions yet.

## What is verified automatically, on demand

Run before each merge to `main` and re-run at least weekly once real traffic exists. Nothing here is
a substitute for the independent review tracked in
[`CONTRACTS/escrow/PHASE5_INDEPENDENT_SECURITY_REVIEW.md`](CONTRACTS/escrow/PHASE5_INDEPENDENT_SECURITY_REVIEW.md),
which remains **PENDING**.

| Tool | Target | Command |
|---|---|---|
| [`govulncheck`](https://go.dev/security/vuln) | Go engine | `govulncheck ./...` (from `ENGINE/go-bridge-core`) |
| [`gosec`](https://github.com/securego/gosec) | Go engine | `gosec ./...` (from `ENGINE/go-bridge-core`) |
| [`slither`](https://github.com/crytic/slither) | Solidity contracts | `slither . --compile-force-framework foundry --filter-paths lib/` (from `CONTRACTS/escrow`) |
| `npm audit` | Frontend | `npm audit` (from `FRONTEND`) |
| `go test ./...`, `forge test` | Regression | see `FRONTEND/README.md` / `ENGINE/go-bridge-core/README.md` for the test-database rule |

Each run is recorded below with **what was found, what was fixed, and what was reviewed and
accepted as a false positive or an acceptable, documented trade-off** — a clean tool run is not
claimed as "secure", and a finding left open is not hidden.

## Design-level controls already in place

These are implemented and covered by tests, independent of the scans above:

- **Ledger**: double-entry, an entry that does not balance is rejected; idempotency keys so a retried
  payment is never applied twice.
- **Quotes**: HMAC-signed, locked for a TTL, verified statelessly so any replica can check them.
- **Escrow (`VukaEscrowV2`)**: reentrancy guard on every state-changing entry point, checks-effects-
  interactions (state is finalised before external calls), pull-payment fallback so an unpayable
  recipient cannot block the counterparty, fee-on-transfer tokens rejected, protocol fee capped at 1%
  in code, a permissionless 50/50 fallback so an absent arbiter cannot lock funds forever.
- **Sessions**: HttpOnly cookies, login throttling stored in Postgres (holds across replicas), an
  idle-timeout sign-out.
- **Sanctions/KYC**: fail-closed — if a check cannot be completed, the payment does not proceed.
- **Web app**: a strict Content-Security-Policy and standard security headers on every response, no
  secrets in the client bundle, provider credentials are environment-injected and never logged,
  webhooks are HMAC-verified and fail-closed until a secret is configured.
- **Live-provider activation**: a payout rail can only go live if three independent settings agree
  (`VUKA_ALLOW_LIVE_PROVIDERS`, a per-provider mode flag, and a credentials reference) — see
  `ENGINE/PROVIDER_CREDENTIALS.md`.

## What is *not* done yet

- No independent smart-contract audit or penetration test.
- FX rates are sandbox reference values, not market data.
- The sanctions/PEP screener is a sandbox implementation, not a licensed vendor.
- No public bug-bounty program (pre-launch).
- CI (`.github/workflows/ci.yml`) runs `govulncheck`, `gosec`, `slither` and `npm audit` — plus
  `go build`/`vet`/`test`, `forge test`, `tsc`, ESLint and both builds — on every push and pull
  request to `main`. It has not yet had a chance to actually run on GitHub (needs a push); until
  then, the results below remain the manually re-run source of truth.

The frontend's [`/security`](FRONTEND/src/components/vuka/pages/security-page.tsx) page mirrors this
for site visitors in plainer language.

## Reporting a vulnerability

Please report privately, before any public disclosure, to the address configured as
`VITE_SECURITY_EMAIL` for this deployment (shown on the site's `/security` page). Include steps to
reproduce and do not access or modify other users' data while investigating. This is a pre-launch
sandbox, so there is no bounty, but researchers who want credit will be named in this file's log once
a report is resolved.

---

## Scan log

### 2026-09-29

- Wired `govulncheck`, `gosec`, `slither` and `npm audit` — plus `go build`/`vet`/`test`,
  `forge test`, `tsc`, ESLint and both builds — into `.github/workflows/ci.yml` (three jobs: engine,
  contracts, frontend), so the manual passes above run on every push and pull request instead of
  only when someone remembers to run them.
- Getting there required fixing pre-existing drift so the new gates start clean rather than red on
  day one:
  - `gofmt` found 4 files with stale formatting (a numbered-list doc-comment style an older `gofmt`
    had produced) unrelated to any recent change — reformatted.
  - `forge fmt --check` found unformatted lines in `VukaEscrowV2.sol`, its deploy script and its
    test file — reformatted (two passes; `forge fmt` needed a second run to fully converge).
  - Slither's Medium/High findings reviewed and accepted on 2026-09-24 were not actually
    suppressed — the `slither-disable-next-line` comments were misplaced (put *after* the
    justification prose, and inside the function body rather than immediately before the function
    declaration slither anchors reentrancy/interface findings to). Corrected placement for:
    `reentrancy-balance` (`VukaEscrowV2.lockFunds`), `reentrancy-no-eth` (`VukaEscrowV2._settle`),
    `erc20-interface` (`VukaEscrow.sol`'s `IERC20`) — all three now suppress correctly.
    `divide-before-multiply` was anchored to the *division* statement, not the multiplication as
    assumed — moved accordingly.
  - The forwarder's `arbitrary-send-eth` (the one real High, fixed on 2026-09-24 with the
    `ValueMismatch` check) still fires because Slither's pattern-matcher doesn't reason about the
    guard — annotated `slither-disable-next-line` with the guard and the regression tests as the
    justification, rather than leaving it unexplained.
  - `gosec`'s released binary still panics its SSA analyzer on this environment's Go toolchain (see
    2026-09-24's entry); the CI step builds `gosec` from a scratch module with `x/tools` bumped, the
    same workaround validated locally, rather than assume a real runner won't hit it.
  - Result: `slither --exclude-informational --exclude-low` now reports **0** findings (was 3
    remaining after the placement bugs above); `gosec -exclude-generated` reports **0** findings.
- `go test ./...` (all packages), `forge test` (50/50), `tsc`, ESLint (0 errors) and both builds
  re-run clean after every fix above.
- **Not yet verified**: the workflow has not actually run on GitHub — every step was reproduced
  locally with the exact command CI uses, but GitHub Actions itself needs a push to `main` (not done
  as part of this session; ask before pushing).

### 2026-09-24

- **`govulncheck ./...`** (Go engine) — 3 vulnerabilities in code actually called by VUKA:
  - `GO-2026-6443` / `GO-2026-6348` (`google.golang.org/grpc`, panic and OOM via crafted HTTP/2
    frames on the gRPC server) — **fixed**: bumped `google.golang.org/grpc` v1.83.0 → v1.83.2.
  - `GO-2026-5970` (`golang.org/x/text`, infinite loop on invalid input, reached via the M-Pesa
    Daraja adapter's HTTP client) — **fixed**: bumped `golang.org/x/text` v0.37.0 → v0.41.0.
  - A further 19 vulnerabilities were reported in required modules that VUKA's code does not call
    into (govulncheck's whole-module scan vs. call-graph scan); left as-is and re-checked on the next
    dependency bump.
  - `go test ./...` and `forge test` re-run clean after the bump.
- **`slither`** (escrow contracts, `--exclude-dependencies`) — 40 findings (2 High, 5 Medium, 21 Low,
  12 Informational) across 7 contracts:
  - **Fixed** — High, `arbitrary-send-eth` in `VukaForwarder.execute`: the forwarder never checked
    `msg.value` against the signed `req.value`, so an ETH overpayment (or ETH forced in via
    `selfdestruct`, which bypasses `receive`/`fallback`) could rest in the contract and later be
    swept out by an unrelated signed request, to a recipient its own signer never chose. Added
    `require(msg.value == req.value)` (as `ValueMismatch`), plus regression tests
    (`testExecuteRejectsValueMismatch`, `testForcedEthCannotBeSweptByUnrelatedRequest`,
    `testExecuteForwardsMatchingValue`) in `test/VukaForwarder.t.sol`.
  - **Reviewed, accepted** — High, `reentrancy-balance` in `VukaEscrowV2.lockFunds`: the balance
    read before/after `_safeTransferFrom` is the intended fee-on-transfer detector, not a state bug;
    `lockFunds` sets `escrow.state = LOCKED` before the external call and the function is
    `nonReentrant`.
  - **Reviewed, accepted** — Medium × 2, `reentrancy-no-eth` in `VukaEscrowV2._settle`/`_payout`:
    every public entry point that reaches `_settle` is `nonReentrant` and finalises `escrow.state`
    before any external call (checks-effects-interactions); a reentrant token calling back into any
    guarded function reverts.
  - **Reviewed, accepted** — Medium, `divide-before-multiply` in `_settle`'s fee calculation:
    bounded rounding dust from bps math (`amount * bps / BPS` then `* feeBps / BPS`), not an
    exploitable miscalculation at realistic amounts.
  - **Reviewed, accepted** — Medium × 2, `erc20-interface` (`IERC20`/`IERC20V2.transfer`/
    `transferFrom` don't declare the standard `bool` return): intentional — every transfer goes
    through a low-level `.call` with manual, tolerant ABI decoding (to support non-standard tokens
    like USDT); the interface is only used as a selector source, never called in its typed form.
  - Low/Informational findings (missing zero-address checks on constructor-set forwarder addresses,
    `block.timestamp` comparisons for escrow timeouts, inline assembly in `_msgSender`/signature
    recovery, naming-convention nits) reviewed: none are exploitable given the existing timeout
    windows and access controls; left open and re-triaged on the next scan.
  - `forge test` re-run clean (50/50) after the fix.
- **`npm audit`** (frontend) — 0 vulnerabilities at any severity.
- **`gosec`** (Go engine, `-exclude-generated`) — 13 findings at first pass, 0 after review:
  - **Fixed** — 4× `G101` "potential hardcoded credentials", actually a missing safety guard:
    `cmd/seed` (creates demo trader accounts with a well-known, publicly documented fallback
    password) had **no production check**, unlike its sibling seeders. Added the same
    `cfg.Environment == "production"` refusal used by `cmd/seed-analytics` and `cmd/seed-identity`
    to `cmd/seed`, and — on the same review pass — to `cmd/seed-dispute`, `cmd/seed-pilot` and
    `cmd/seed-settlement`, which fabricate synthetic ledger/dispute/pilot data and had no such guard
    either. The two literal-credential findings themselves (`testutil.DefaultTestURL`'s local
    test-DB default, and the demo password literal, now doubly guarded) are annotated `#nosec G101`
    with justification.
  - **Reviewed, accepted, annotated** — 7× `G404` "weak random number generator" in the sandbox
    payout adapters (`sandbox_rail.go`, `mtn_rw.go`, `mpesa_ke.go`: simulated failure-rate jitter and
    a human-readable transaction-reference suffix, never a security token or credential) and in
    `cmd/seed-analytics` (a fixed RNG seed, for reproducible fixture data). Each is now annotated
    `#nosec G404` with a reason, so the finding stays suppressed and visible rather than silently
    reappearing every run.
  - **Excluded, not fixed** — `G103` "unsafe calls should be audited" × 4, entirely inside
    `internal/grpcpb/vuka.pb.go` (protoc-generated code, `// Code generated ... DO NOT EDIT`). Run
    with `-exclude-generated`, matching how the file is actually maintained (regenerated, not
    hand-edited).
  - **Known tooling limitation**: `gosec`'s SSA-based analyzers (deeper taint-tracking rules) panic
    on several packages under this Go toolchain version (an `x/tools`/compiler export-data
    mismatch); the AST-based rules above still ran to completion. Re-check with the panics resolved
    once a compatible `gosec`/`x/tools` pairing is available.
  - `go build ./...`, `go vet ./...` and `go test ./...` re-run clean after all fixes.
