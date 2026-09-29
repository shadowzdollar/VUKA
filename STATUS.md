# VUKA — where we ended

A living hand-off note. Newest day first; each day adds a section at the top. For the long-form plan see
[`README.md`](README.md); for the change-by-change record see [`BUILD_LOG.md`](BUILD_LOG.md).

---

## 2026-09-29 — day 4: ISO 20022 statements, audit-export fix, then a direction change

**Morning:** asked to work through the agreement-free backlog broadly rather than one item at a
time. Started on standards/interoperability and found pacs.002 (payment status) was already fully
built in `ENGINE/python-iso-gateway` — genuinely missing was **camt.053** (account statements).

### What was built and shipped

- `GET /api/accounts/{id}/statement` — an ISO 20022 **camt.053.001.08** Bank-to-Customer Statement
  (XML by default, `?format=json` for the UI), built server-side from the real ledger. Opening
  balance = entries before the window; closing = opening + entries in it; both derived from the
  same double-entry data the ledger already guarantees. 4 new tests (balance reconciliation across
  adjacent windows, XML well-formedness, range validation).
- A real bug found and fixed while wiring this up: the operator activity **CSV export was silently
  capped at 200 rows** — a regulator asking for a full period's audit trail would get a truncated
  file with no indication it was cut off. Root cause was in `listActivity` itself (any limit outside
  1–200 fell back to 50, rather than clamping to 200); fixed at the source, and the export now pages
  through everything up to a documented 100,000-row cap. New regression test proves it.
- A "Statement" download button on each wallet card, using the ISO calls above.
- `go test ./...` (all packages), `tsc`, ESLint, both builds — clean.

### Direction change, mid-session

The user left the next instruction **inside this file** (a direct edit to `STATUS.md`, not a chat
message — worth remembering that this file can double as a channel). Paraphrased: stop treating
this as a backend checklist to clear in one sweep; the AU submission needs the full product, not an
MVP; the next 2-3 days are about the **frontend** — many more pages (100+), built deliberately,
page by page, "as a developer assigned a task", not rushed all at once.

**What this means going forward:** the agreement-free backend backlog (OpenAPI spec, more of the 54
markets, more languages, service worker, load testing, backup/restore drill, status history) is
paused, not abandoned — pick it back up after the frontend push, or whenever asked. See the next
session's entry (added at the top of this file) for what the frontend work actually became.

---

## 2026-09-29 — day 3: CI pipeline (no-agreement-needed backlog item #1)

**Context:** asked directly whether everything VUKA "needs" was built — answer was no, with an
honest gap list (independent audit, real rail licensing, compliance vendors, full 54-market
coverage, etc.). Split that list into what needs a signed agreement (can't do) vs. what doesn't
(CI, standards work, reach, resilience, testnet trust evidence). Picked CI first: cheapest, fastest,
and it makes day 2's security work durable instead of a one-off.

### What happened

- New `.github/workflows/ci.yml`: three jobs (engine, contracts, frontend) that run every check from
  `SECURITY.md` — `govulncheck`, `gosec`, `slither`, `npm audit`, plus the full build/test/lint
  suite for each component — on every push and pull request to `main`.
- Found and fixed a real problem in day 2's own work while preparing this: several of the
  `slither-disable-next-line` suppression comments added on 2026-09-24 were **misplaced and not
  actually suppressing anything** — re-running Slither today still showed all three "accepted"
  Medium/High findings. Fixed the placement (Slither anchors each detector to a different exact
  line than intuition suggests) and confirmed 0 findings at Medium+ severity, for real this time.
- Fixed pre-existing `gofmt`/`forge fmt` drift (unrelated to recent work) so the new CI gates start
  green instead of immediately red.
- Every job's steps were run locally, verbatim, before calling this done — see `BUILD_LOG.md` and
  `SECURITY.md`'s 2026-09-29 entry for the full detail.

### What this does *not* claim

- **The workflow has not run on GitHub yet.** Everything above was verified by running the exact
  same commands locally; GitHub Actions itself only executes after a push to the repo, and that
  wasn't done this session (pushing is a call for the user, not something to do unprompted).
- This doesn't touch any of the backlog items that genuinely need a signed agreement (real rail
  licensing, compliance vendors, a USSD shortcode) — those are unchanged from day 1/2.

### Next candidates (agreement-free, not started)

From the same backlog, still ranked by trust-per-effort: standards/interoperability (ISO 20022
pacs.002/camt.053, OpenAPI spec), reach (more of the 54 AU markets as sandbox country packs, more
languages), resilience (service worker, load test, backup/restore drill, public status history), and
testnet trust evidence (deploy `VukaEscrowV2` to Polygon Amoy — free, but needs a funded wallet and
the user's go-ahead per `CONTRACTS/escrow/PHASE2_TESTNET_EVIDENCE.md`'s own approval requirement).

---

## 2026-09-24 — day 2: security hardening & evidence

**Chosen focus for today** (of four options put to the user: security, standards/interoperability,
reach/localisation, access-on-real-networks): security hardening, because it needs no external
account or partner and is the first thing a telecom or regulator reviewer checks.

### What happened

- New [`SECURITY.md`](SECURITY.md) at the repo root: scope, a table of the automated scans, the
  design-level controls already in place, what is honestly *not* done yet, how to report a
  vulnerability, and a **dated scan log** (below is the summary; the file has full detail).
- Ran four scanners for the first time on this codebase and fixed what they found:
  - `govulncheck` (Go): 3 real vulnerabilities, all fixed by dependency bumps (grpc, x/text).
  - `slither` (Solidity): 1 real High fixed — `VukaForwarder.execute` didn't check `msg.value`
    against the signed `req.value`, so forced/overpaid ETH could later be swept by an unrelated
    signed request. Fixed with a `require`-equivalent check + 3 new tests. Several more findings
    reviewed and documented as already-mitigated (reentrancy guard + CEI, intentional low-level
    ERC20 calls) rather than silently ignored.
  - `gosec` (Go): found a real gap — `cmd/seed` (creates demo accounts with a public password) had
    no production guard, unlike its sibling seed commands. Fixed by adding the same guard there and
    to three other unguarded seed commands. Remaining findings (simulated RNG, test-DB defaults)
    annotated `#nosec` with a reason so they don't silently resurface.
  - `npm audit` (frontend): clean, 0 vulnerabilities.
- Full regression after every fix: `go build`, `go vet`, `go test ./...` (all packages, against
  `vuka_test`), `forge test` (50/50). All clean.
- The Postgres dev container (`vuka-postgres`) had stopped since the last session; restarted it —
  routine, not a finding.

### What this does *not* claim

- This is **not** the independent audit or penetration test tracked as `PENDING` in
  `CONTRACTS/escrow/PHASE5_INDEPENDENT_SECURITY_REVIEW.md`. Automated scanning is a prerequisite for
  that review, not a substitute.
- No CI pipeline runs these scans automatically yet — today's run was manual. Wiring `govulncheck`/
  `gosec`/`slither`/`npm audit` into CI on every push is the natural next step in this area.
- `gosec`'s SSA-based analyzers (the deeper taint-tracking rules) crash on several packages under
  this environment's Go toolchain version — a tooling/toolchain compatibility gap, not a code issue.
  The simpler AST-based rules (which is what found the real `cmd/seed` gap) still ran to completion.

### Housekeeping

- Working tree for today's changes is committed as one snapshot (see `git log`); nothing pushed.

---

## 2026-09-21 — end of day 1 of the AU-grade upgrade

**Goal:** VUKA is a submission to the African Union and a partner pitch to telecoms across the continent, so the
bar is "beyond expectations", not "works in a demo". Everything is still a **sandbox**: no real credentials, no
live rails, no licence, no external audit. Nothing in the product claims otherwise.

### What exists now

| Area | State |
|---|---|
| **ENGINE** (Go, PostgreSQL) | Pan-African catalog: 10 countries, 90 corridors, one sandbox rail per country. Double-entry ledger, idempotency keys, firm HMAC-signed quotes that lock the rate, KYC-tiered USD limits, fail-closed sanctions screening, server-side trust score, analytics aggregation, Prometheus metrics, login throttling, explicit per-provider live activation gate (MTN MoMo and M-Pesa Daraja adapters written; other rails are "to build"). New today: unauthenticated indicative pricing at `GET /api/public/estimate`. |
| **CONTRACTS** (Foundry) | `VukaEscrowV2`: arbiter set, pause never blocks settlement, permissionless 50/50 fallback, split arbitration, fee capped at 1%, pull-payment fallback, reentrancy guard. Indexer understands V2 events. `VukaEscrowFactory` still deploys V1. |
| **FRONTEND** (TanStack Start) | Enterprise design system (light/dark, monochrome), role-aware trader and operator apps, analytics (donuts, histograms, heatmaps, corridor matrix), i18n (en/fr/sw/pt/rw). **New today:** a complete public site: landing, sign-in, four-step registration, `/about` `/security` `/status` `/privacy` `/terms`, expansive footer. Details below. |
| **Branding** | Lovable tooling and assets removed. Own `vite.config.ts`, own error-reporting hook (`src/lib/report-error.ts`), own VUKA mark (`brand.tsx`, `public/icon.svg`, favicon.ico, apple-touch, PWA icons incl. maskable, social card). |

### Public site, in one paragraph

Editorial-serif, engraved-map, paper-stack visual language (deliberately not "futuristic"); monochrome apart from
national flags. Landing sections: canvas globe hero, cost estimator (live engine pricing, share/WhatsApp),
payment journey (3D paper stack), escrow lab (four scenarios), **mobile section** (3D phone: press-and-hold
confirm, weak-signal idempotent retry demo, USSD concept on live pricing, share/install, data saver + measured page
weight), features, trust-score lab, **atlas of markets** (papercut Africa map with flag-printed markets, passport
stamps, fee groups from the engine), frameworks timeline (Abuja Treaty, Agenda 2063, AfCFTA, PAPSS — with an
independence notice), illustrative stories, comparison, FAQ, CTA. Full description: `FRONTEND/README.md`.

### Verified today (all re-run at the end)

- `go test ./...` — every package passes (against `vuka_test`).
- `forge test` — 47 tests pass.
- `npx tsc --noEmit` clean; ESLint 0 errors; `vite build` clean; the production Node bundle boots and serves
  with the CSP and security headers.
- Real Chrome + axe-core (WCAG 2/2.1 A/AA): 0 violations on landing (light/dark/375 px), the five public pages,
  sign-in, each registration step, the mobile section on each tab, the atlas; plus keyboard, touch,
  reduced-motion and data-saver paths. Trader and operator regression suite passes.

### Known issues and honest limits

- **Regression test flake, not a bug:** the browser suite's "FX payment" step fails once the demo trader
  (`+250700000991`, PENDING tier) has spent its $500 daily limit through repeated runs. The KYC limit is
  working. Reset by using a different seeded trader or re-seeding the dev DB.
- Non-English translations are first-pass, do not cover the new public sections, and need native review.
- Flag emblems are simplified drawings; the AU emblem is intentionally not reproduced; framework seals are generic.
- USSD is a concept (needs telecom shortcode agreements; `*000#` is a placeholder). The PWA has a manifest and icons
  but **no service worker**, so it installs but is not offline-capable.
- Google Fonts is the one third-party request (disclosed on `/privacy`); self-host before launch.
- `/privacy` and `/terms` are drafts pending legal review. Contact addresses come from `VITE_CONTACT_EMAIL`,
  `VITE_SECURITY_EMAIL`; social-card URLs need `VITE_PUBLIC_URL`.
- Production build defaults to a Node server (Nitro). Set `NITRO_PRESET` for another target.
- FX rates are sandbox reference values; the sanctions screener is a sandbox; contracts and engine are unaudited.
- `script-src` still needs `'unsafe-inline'` until nonce support is adopted.

### How to resume

```sh
# database + engine (see ENGINE/deploy and FRONTEND/README.md "Run it locally")
# engine on :8080, then:
cd FRONTEND && npm i && npm run dev          # http://localhost:5173
# Go tests: ALWAYS use the test database — the helpers TRUNCATE tables
TEST_DATABASE_URL='postgres://vuka:vukadev-local@localhost:5433/vuka_test?sslmode=disable' go test ./...
cd CONTRACTS/escrow && forge test
```

Seeded **local dev** logins (dev DB only): traders `+250700000991`, `+254700000882`, `+250700000773` /
`vuka-demo-2026`; `operator@vuka.local`, `arbiter@vuka.local`, `approver@vuka.local` (passwords in
`FRONTEND/README.md`). These exist only because the engine reports `environment=development`.

### Next: what would take this beyond expectations

Ordered by how much trust each buys from telecoms, regulators and the AU. Nothing here is started.

1. **Independent assurance:** third-party smart-contract audit; penetration test; publish a security disclosure
   policy and a coordinated-disclosure contact. (Telecom partners will ask for these first.)
2. **Real rail certification:** sandbox-certify MTN MoMo (RW/UG/GH) and Safaricom Daraja with their test numbers;
   attach evidence; then build Vodacom, Airtel, Orange, Telebirr and an aggregator for NIBSS/instant EFT.
   Each needs a licence or licensed partner — start the regulatory mapping per corridor.
3. **Standards and interoperability:** ISO 20022 message coverage beyond pacs.008 (pacs.002 status, camt.053
   statements), PAPSS-compatible settlement model, an OpenAPI spec and a developer portal with signed webhooks
   and SDKs.
4. **Resilience and operations:** multi-replica deployment with a shared quote key, load and chaos tests with
   published limits, backups and restore drills, SLOs with alerting, a real status page with history.
5. **Compliance depth:** real sanctions/PEP vendor, KYC vendor sessions, travel-rule data, audit-log export for
   regulators, data-residency options per country.
6. **Reach:** all 54 markets is a catalog and rail problem, not a UI one — add country packs (currency, dial code,
   rail, language). Languages: Arabic (RTL), Amharic, Hausa, Yoruba, Zulu, Portuguese review; native-speaker review
   of everything, including the new public sections.
7. **Access:** a real USSD gateway pilot with one operator, a service worker for offline reads, low-bandwidth mode
   audit on real 2G/3G profiles, screen-reader test with NVDA/VoiceOver/TalkBack.
8. **Trust evidence on the site:** publish the escrow contract address, a verified-source link and the test
   report once audited — the landing page should be able to point at proof, not just describe it.

### Housekeeping before the next session

- The working tree holds a large uncommitted-until-today set of changes; this day's work is committed as one
  snapshot (see `git log`). Nothing has been pushed.
- `FRONTEND/bun.lock` and `bunfig.toml` were removed (they only referenced Lovable packages); the project uses
  npm and `package-lock.json`.





