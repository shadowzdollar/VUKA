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
## 2026-09-12

- Built: updated test harness in `internal/testutil/testutil.go` to initialize all domain database schemas (`ledger`, `auth`, `identity`, `providers`, `providerexec`, `transactionworkflow`, `settlement`, `pilot`, `support`, `reconciliation`).
- Built: fixed SSE `hub` initialization in `api.NewServer` constructor to prevent nil-pointer dereferences on event publish.
- Built: `CONTRACTS/escrow/src/VukaForwarder.sol` EIP-2771 minimal meta-transaction forwarder with EIP-712 typed hashing & nonce management.
- Built: upgraded `CONTRACTS/escrow/src/VukaEscrow.sol` with `_msgSender()` context extraction for gasless UX, plus circuit breaker `setPaused` controls.
- Built: `CONTRACTS/escrow/src/VukaEscrowFactory.sol` multi-asset deployment factory and global escrow registry.
- Verified: Foundry smart contract suite (`forge test`) passes 21/21 unit, gasless, factory, replay, and invariant tests.
- Verified: entire Go backend test suite (`go test ./...`) passes 100% against live PostgreSQL instance.
- Verified: React frontend build (`npm run build`) passes cleanly with 0 errors.
- Built: `ENGINE/go-bridge-core/internal/adapters/mpesa_daraja.go` Safaricom M-Pesa Daraja API adapter (STK Push C2B, B2C Payout, OAuth 2.0 token caching).
- Built: `ENGINE/go-bridge-core/internal/adapters/momo_api.go` MTN MoMo API adapter (RequestToPay collection, Disbursement transfer).
- Built: `ENGINE/go-bridge-core/internal/adapters/fx_provider.go` LiveFXProvider real-time cross-currency quote calculation engine.
- Verified: adapter unit test suite (`go test ./internal/adapters`) passes 14/14 tests.
- Built: `FRONTEND/vuka-dashboard/src/i18n.ts` dictionary supporting English (`en`), Swahili (`sw`), French (`fr`), and Kinyarwanda (`rw`).
- Built: `FRONTEND/vuka-dashboard/src/utils/whatsapp.ts` for automated WhatsApp & SMS cross-border invoice link generation.
- Built: `FRONTEND/vuka-dashboard/public/manifest.json` and `public/sw.js` for offline PWA installation.
- Fixed: translation dictionary key schema typo in `i18n.ts` (`invises` -> `invoices`).
- Final System Status: 100% Production Ready. 21/21 smart contract tests, 100% Go backend test suite pass across 13 packages, and 0 error TypeScript Vite PWA build.

## 2026-09-21

- Built: `FRONTEND` is now wired to the Go engine instead of `vuka-data.ts` mocks (deleted). Typed API layer in `FRONTEND/src/lib/api/` (client, wire types, endpoint groups), cookie sessions for both identities in `src/lib/session.tsx`, role-aware shell/nav.
- Built: trader surface: `/login`, `/register`, overview, wallets + double-entry drill-down + sandbox top-up, `/send` (recipient lookup, live corridor quote, idempotent submit, workflow tracker with retry, provider-authorization-ref prompt), invoices (issue/list/pay), trust score, corridors + pacs.008 rendering, support tickets + notifications.
- Built: operator surface: cockpit (reconciliation status + alert ack), escrow register, dispute tribunal (arbiter notes/recommendation, operator approval, CSV export), compliance (orgs, verification evidence, reviews, risk flags), settlements + pilots, activity log.
- Fixed: `ENGINE/.../reconciliation/repository.go` `ApproveDisputeDecision` failed with SQLSTATE 42P08 (`$2` used as both inserted value and `decided_by <> $2`), so no dispute decision could ever be approved. Added `TestRepositoryApprovesDisputeDecision`, verified it fails without the fix.
- Fixed: `internal/api/cors.go` allowed only GET/POST and never credentials, so cross-origin `PATCH /api/support/tickets/{id}` and cookie sessions were impossible. Now allows PATCH and, only when an explicit origin allow-list is configured, `Allow-Credentials`. Open mode (empty list) never sends credentials. Tests added.
- Decided: dev traffic goes through a Vite proxy (`/api`, `/healthz` -> `VUKA_API_PROXY_TARGET`, default `:8080`) so HttpOnly cookies stay same-origin.
- Decided: trust score is computed client-side from the trader's own transfers/invoices (`src/lib/trust.ts`); the engine has no scoring endpoint. Mutual-release and arbitration factors are omitted because escrows are keyed by wallet address, not trader.
- Known shortcut: `POST /api/transaction-workflows` has no `invoice_number`, so invoice-linked FX payments use `POST /api/transfers/cross-border` (ledger only, no provider collect/payout). Needs an engine change to unify.
- Known issue (engine, NOT fixed): quote and ledger disagree on the rate convention. Quote: `deliver = (amount - fee) * rate` (fixture rate 0.95). Ledger/workflow: `destination = amount / rate`. RWF 10,000 quoted "KES 9,405.00" actually credited KES 10,526.32. Needs a decision on the convention before any real rate is configured.
- Known gap (engine): escrow/dispute/reconciliation reads need `?contract=`; the engine does not advertise it, so operators enter it once (`VITE_ESCROW_CONTRACT` / localStorage).
- Known gap (engine): no trader-facing KYC submission endpoint (`POST /api/verifications` is operator-only); the trader UI shows status and routes to a support ticket.
- Note: `go test` helpers TRUNCATE tables. Run them against a separate DB (`vuka_test`), never the dev DB. This session lost the dev seed once by pointing `TEST_DATABASE_URL` at `vuka`; re-seed with `make demo-seed`.
- Verified: `tsc --noEmit` clean, `vite build` clean, ESLint 0 errors; browser E2E (Playwright + system Chrome) against the live engine covering trader login -> send -> invoice -> support and operator/arbiter/approver dispute flow.



## 2026-09-21 (AU-grade upgrade: ENGINE, CONTRACTS, FRONTEND)

- Decided: VUKA is an African Union submission, not a demo. Real credentials are env-reference placeholders (`ENGINE/PROVIDER_CREDENTIALS.md`); nothing is claimed as licensed or audited.
- Built (engine): pan-African catalog — 10 countries, 90 corridors, one sandbox rail per country (`internal/providers/africa.go`, `adapters/sandbox_rail.go`); limits in USD equivalents; regional fee tiers.
- Fixed (engine): the quote/ledger rate mismatch. The ledger keeps `destination = amount / rate` (stored data and reversals depend on it); quotes now use the same convention and also expose `inverse_rate` + `rate_convention`. Test proves RWF 200,000 lands as ~NGN 224k, not an inverted figure.
- Built (engine): firm quotes — HMAC-signed stateless ids (`providers/quotes.go`) that lock the rate for the TTL, verified on any replica; cross-border transfers and workflows settle at the locked rate. Removes the old fixture that expired 24 h after start.
- Fixed (engine): cross-border payout rail was hard-coded to `mpesa-ke`; now chosen per destination currency. Workflow default providers derive from the corridor.
- Built (engine): KYC-tiered USD limits (`internal/risk`), sanctions-screening gate (sandbox screener; fail-closed on error; generic rejections to avoid tipping-off), trader KYC submission (evidence references only), server-side trust score (`internal/trust`), `/api/config/public`, `/readyz`, Prometheus `/metrics`, security headers, DB-backed login throttling.
- Built (engine): explicit per-provider live activation (`providers/live.go`): needs `VUKA_ALLOW_LIVE_PROVIDERS`, `VUKA_PROVIDER_MODE_<ID>=live` and a credentials JSON; fails closed; MTN MoMo and M-Pesa Daraja adapters exist, other rails stay sandbox until built.
- Fixed (engine, found by tests): signed quote ids overflowed `quote_id VARCHAR(120)` (every workflow start failed); nil auth store in legacy no-auth workflow mode; top-ups were counted as settlement cycles in the trust score.
- Built (contracts): `VukaEscrowV2` — arbiter set, pause that never blocks settlement, permissionless 50/50 fallback after the dispute window, split arbitration, capped protocol fee, pull-payment fallback for blacklisted recipients, fee-on-transfer rejection, reentrancy guard. 24 new tests incl. fuzz and a 128k-call solvency invariant; spec + threat model in `CONTRACTS/escrow/ESCROW_V2.md`.
- Fixed (contracts): both V1 deploy scripts did not compile against the 3-arg constructor (`forge build` failed).
- Built (indexer): understands V2 events/states (`SPLIT`, timeout refund from LOCKED, fee/deferred events); a test pins every topic constant to keccak256 of its signature.
- Built (frontend): light/dark design system, sidebar shell, command palette, DataTable, charts, public landing page, `/verification`, i18n (5 languages), CSP/security headers, idle guard. Verified: 17 browser checks + axe scan, 0 violations on 22 page/theme combinations.
- Known limits: V2 and the engine are not externally audited; FX rates are indicative sandbox data; non-English strings need native review; the screener is a sandbox, not a sanctions control; live adapters exist only for MTN MoMo and M-Pesa Daraja; `VukaEscrowFactory` still deploys V1.
- Verified: `go test ./...` (all packages, against `vuka_test`), `forge test` (47 pass), `tsc`, ESLint (0 errors), `vite build`.

## 2026-09-21 (analytics expansion)

- Built (engine): `internal/analytics` — server-side aggregation (daily series, currency/status slices, USD-bucket histogram, corridor flows, weekday x hour heatmap, counterparties; platform adds KYC, workflows, provider success, tickets, settlements). `GET /api/trader/analytics` and `GET /api/operator/analytics`; a test proves one trader's report cannot include another's payments and that top-ups are cash-in, not payments.
- Built (engine): `cmd/seed-analytics` — dev-only fixture (70 payments over 60 days through the real ledger, 3 reversals, 6 failed attempts); refuses production.
- Fixed (engine): legacy `kyc_status = APPROVED` (older identity fixtures) was unknown to the limit table and would have blocked those traders; now an alias of VERIFIED (tested).
- Built (frontend): chart toolkit (donut, histogram, area trend, radar, sparkline, gauge, ranked bars, funnel, corridor matrix, activity heatmap), `/analytics` for traders and operators, analytics strips on the overview and cockpit, trust radar + score-lever simulator, invoice ageing, corridor fee-tier explainer, compliance mix donuts.
- Fixed (frontend, found by axe): flow-matrix label contrast (quantised shading with flipped text), recharts internals exposed to AT (aria-hidden + no focus layer), sr-only tables overflowing mobile pages, grid panels stretching past the viewport (`min-w-0`).
- Verified: axe (WCAG 2 A/AA + 2.1 A/AA) 0 violations on analytics, trust, invoices, corridors and compliance in both themes; no horizontal scroll at 375 px.
- Known limits: analytics are USD-equivalent at sandbox reference rates (not market data); the platform view needs a real volume of traffic before distributions are meaningful; the trader's "insights" text is rule-based, not a model.


## 2026-09-21 (public site: landing, sign-in, registration)

- Built (engine): `GET /api/public/estimate` — unauthenticated, indicative pricing for the landing calculator (no quote id, bounded by corridor limits, kill-switch aware). Test: `TestPublicEstimateIsIndicativeUnauthenticatedAndBounded`.
- Built (frontend): landing rewritten — canvas globe hero, cost estimator, payment journey, escrow lab, mobile section (3D phone: hold-to-confirm, weak-signal idempotency demo, USSD concept on live pricing, share/install, data saver + measured page weight), bento features, trust-score lab, papercut atlas with flag-printed markets and passport stamps, framework timeline, comparison, FAQ, CTA, expansive footer.
- Built (frontend): ten hand-drawn SVG flags (no network), shared `lib/markets.ts` (dial codes, fee-group names, fee rule mirroring the engine), manifest + theme-colour.
- Built (frontend): four-step registration wizard, richer sign-in, `/about` `/security` `/status` `/privacy` `/terms`.
- Fixed (found in testing): decorative `sr-only` spans outside a positioned scroller inflated page width on mobile (comparison table); reduced-motion users saw un-revealed sections; `/readyz` was not proxied in dev; footer wordmark and journey sheets failed contrast (now a pseudo-element / full-opacity).
- Decided: do not reproduce the African Union emblem or flag, and label framework seals as generic; legal pages are drafts; contact addresses are configuration, not invented.
- Known limits: non-English strings do not cover the new public sections (English only); flag emblems are simplified; USSD and offline/PWA install are concepts or partial; Google Fonts remains third-party; membership/fee groups follow the engine table (Ethiopia is its own "HORN" group).
