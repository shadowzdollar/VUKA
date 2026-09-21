# VUKA

*Rise & Cross Over*

**A trade-trust settlement platform for East African SME traders — built on top of existing mobile money rails, with trust enforced by blockchain escrow instead of just displayed as a history log.**

> **Current progress and hand-off notes: see [`STATUS.md`](STATUS.md).**

> Status: **RESHAPE / v2 DESIGN.** This is the master planning document for VUKA v2 — a from-scratch rebuild of the original hackathon prototype, no longer built for a regulator's judging panel, but for real traders. This document is meant to be the single source of truth as the system is built, upgraded, and continued across tools (starting in GPT, later continued in Claude Code) and across time.

---

## Table of Contents

1. [Vision](#1-vision)
2. [The Problem](#2-the-problem)
3. [What VUKA Does](#3-what-vuka-does)
4. [What Changed From v1](#4-what-changed-from-v1)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack](#6-tech-stack)
7. [The Escrow Smart Contract](#7-the-escrow-smart-contract)
8. [The Trust / Credit Score](#8-the-trust--credit-score)
9. [Off-Chain Ledger Design](#9-off-chain-ledger-design)
10. [Data Model](#10-data-model)
11. [Compliance & KYC Posture](#11-compliance--kyc-posture)
12. [Repository Structure](#12-repository-structure)
13. [Roadmap](#13-roadmap)
14. [Glossary](#14-glossary)
15. [Build Log Convention](#15-build-log-convention)

---

## 1. Vision

Millions of East African SME traders move money across borders every day using mobile money (MTN MoMo, M-Pesa). The rails exist. What doesn't exist is a **trade-facing trust layer** on top of them — something that lets a trader prove reliability to a stranger, get paid fairly, and resolve disputes, without needing years of personal relationship or a 50-60% upfront deposit just to start doing business.

VUKA is not trying to replace mobile money, PAPSS, or Onafriq. It is the missing front door: **the layer that makes existing rails usable for real trade, not just personal remittance** — upgraded, this time, so that trust is a mechanism, not a display.

---

## 2. The Problem

Basic cross-border mobile money transfers already exist and are heavily used, but they were built for personal remittances, not business trade. This produces specific, well-documented gaps for a small trader running a cross-border business:

- **No context** — a payment is just "money moved." No invoice, no order reference, no shared record of what it was for.
- **Mixed money** — one wallet does everything, so a trader can't separate business income from personal spending, and can't build a credit history.
- **Invisible trust** — there's no reliable signal a new supplier can check before extending terms, so traders are forced into large upfront payments to de-risk a stranger.
- **Trade-sized friction** — transfer limits and interfaces (blind USSD menus) are tuned for personal remittance, not real trade volumes.
- **Weak dispute resolution** — when something goes wrong, there's no shared, tamper-proof record either side can point to.

The deepest version of this problem is trust between two parties who've never worked together before. Payment rails alone don't solve that. A visible history log doesn't really solve it either — it's just a claim, not a guarantee. **Escrow with an enforceable release mechanism is what actually solves it.**

---

## 3. What VUKA Does

### 3.1 Invoice-Linked Escrow Payments
A trader initiates a payment against a specific invoice. Funds do not go straight to the supplier — they lock into an on-chain escrow contract. Both sides get a timestamped, tamper-proof record of exactly what was paid, for what, and under what condition it releases.

### 3.2 Structural Trust, Not Displayed Trust
Trust is no longer "look at their history and hope." The money is provably committed before goods ship, and release only happens when the agreed condition is actually met — confirmation, timeout, or arbitration.

### 3.3 Algorithmic Trust / Credit Score
Every completed escrow cycle (released on time, disputed, refunded, resolved) feeds a trust score computed from real settlement behavior — not self-reported claims. This score is what a new counterparty checks before agreeing to terms.

### 3.4 Business and Personal Money, Separated
Every trader holds a distinct business balance, separate from their personal mobile money wallet, giving a clear, exportable picture of business performance.

### 3.5 Dispute Resolution With a Real Record
If either party disputes before a release, funds freeze in the contract. Arbitration (manual, for v1) resolves it, and the outcome is recorded permanently — building the evidentiary record that's currently missing for the vast majority of trade disputes.

### 3.6 A Real Interface
Live confirmation, visible exchange rate before committing, reviewable transaction and escrow history, clear status from lock to release.

---

## 4. What Changed From v1

VUKA v1 was built in ~72 hours for the National Bank of Rwanda FinTech Innovation Hackathon 2026 and was not accepted into the program. v2 keeps the foundation and upgrades the weakest part of the original design.

| Piece | v1 (hackathon) | v2 (this document) |
|---|---|---|
| Trust | A visible payment-history log | **On-chain escrow** — trust is structural, not just visible |
| Credit signal | Implied, not computed | A real **algorithmic trust/credit score** from settlement behavior |
| Disputes | Not designed | A full **dispute state machine**, arbitrated, permanently recorded |
| KYC/consent | Deferred to "roadmap" | An honest, working **tiered verification** decided upfront |
| Regulatory posture | "Please guide us, BNR" | Owned internally — no external dependency to start building |
| Architecture scope | Full 5-layer stack incl. cross-telecom liquidity rebalancing + ISO 20022 | Liquidity rebalancing and ISO 20022 **cut/deferred** — too large for a solo build; ledger + escrow contract is the real core |
| Money movement | Simulated telecom adapters, fiat-only design | Escrow settles in **stablecoin**, mobile money handles local cash-in/cash-out at the edges |

---

## 5. System Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│  DASHBOARD — React (web) — traders, invoices, escrow status,      │
│  trust score, dispute center, transaction history                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST / WebSocket (SSE)
┌───────────────────────────▼─────────────────────────────────────┐
│  BACKEND ENGINE (Go)                                              │
│  - Ledger core (double-entry, off-chain)                          │
│  - Invoice service                                                 │
│  - Trust/credit scoring engine                                     │
│  - Escrow orchestrator (watches + calls the smart contract)       │
│  - Telecom adapters (MTN MoMo, M-Pesa) — cash-in/cash-out only    │
│  - KYC / tiered verification service                              │
└───────────┬───────────────────────────────────────┬─────────────┘
            │ SQL                                    │ Web3 (RPC)
┌───────────▼──────────────────┐        ┌────────────▼─────────────┐
│  POSTGRESQL                  │        │  ESCROW SMART CONTRACT    │
│  users, accounts, invoices,  │        │  (Solidity, Polygon)      │
│  ledger_entries, trust_score │        │  Lock → Release/Refund/   │
│  _events, disputes           │        │  Dispute → Arbitrate      │
└───────────────────────────────┘        │  Stablecoin (USDC) escrow │
                                          └────────────────────────────┘
                                                     │
                                          ┌──────────▼──────────────┐
                                          │  On/Off-Ramp             │
                                          │  Fiat/MoMo ⇄ Stablecoin  │
                                          │  at lock & release       │
                                          └──────────────────────────┘
```

**Design principle carried over from v1 (and still non-negotiable):** the off-chain ledger never stores a balance directly — a balance is always `SUM(amount) FROM ledger_entries`. Every transfer writes linked debit/credit rows that net to zero. The escrow contract mirrors this discipline on-chain: funds move to states (`LOCKED`, `RELEASED`, `REFUNDED`, `DISPUTED`), never silently.

---

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast iteration, matches v1 experience, easy to extend |
| Backend | Go | Safe concurrency for money movement, carried over from v1 |
| Off-chain DB | PostgreSQL | Double-entry ledger integrity, carried over from v1 |
| Smart contract | Solidity | Standard, widest tooling/tutorial support |
| Chain | **Polygon** (EVM-compatible L2) | Cheap transactions, huge existing tooling, native USDC support — best fit for a first blockchain build on a budget |
| Escrow asset | USDC (or equivalent stablecoin) | Avoids volatility risk while funds sit in escrow |
| On/off-ramp | Telecom mobile money adapters (MTN MoMo, M-Pesa) + a stablecoin on/off-ramp provider | Traders never need to touch crypto directly — conversion happens behind the scenes |

---

## 7. The Escrow Smart Contract

### 7.1 States

```
CREATED → LOCKED → RELEASED
                  → REFUNDED
                  → DISPUTED → ARBITRATED → RELEASED / REFUNDED
```

### 7.2 Release Logic (combined mechanism)

Funds release out of `LOCKED` when **any** of the following occurs first:

1. **Mutual confirmation** — both buyer and supplier confirm completion.
2. **Timeout auto-release** — if a configurable window passes (e.g. 7-14 days) with no dispute raised, funds auto-release to the supplier. Protects suppliers from buyers who go silent.
3. **Dispute → Arbitration** — either party can raise a dispute *before* the timeout expires. This freezes the contract in `DISPUTED` until an arbiter (manually, for v1) resolves it to `RELEASED` or `REFUNDED`.

Once `RELEASED` or `REFUNDED`, the state is final — no re-opening.

### 7.3 Core Contract Functions (draft)

```solidity
function createEscrow(address supplier, uint256 amount, string invoiceRef, uint256 timeoutSeconds) external returns (uint256 escrowId);
function lockFunds(uint256 escrowId) external; // buyer deposits stablecoin
function confirmCompletion(uint256 escrowId) external; // either party calls; releases on 2-of-2
function raiseDispute(uint256 escrowId, string reason) external;
function arbitrate(uint256 escrowId, bool releaseToSupplier) external onlyArbiter;
function checkTimeout(uint256 escrowId) external; // callable by anyone/keeper to trigger auto-release
```

### 7.4 Events (for the off-chain engine to listen to)

```
EscrowCreated(escrowId, buyer, supplier, amount, invoiceRef)
FundsLocked(escrowId)
EscrowReleased(escrowId, to)
EscrowRefunded(escrowId, to)
DisputeRaised(escrowId, by, reason)
DisputeResolved(escrowId, outcome)
```

The Go backend listens to these events and mirrors every state change into the off-chain ledger (as a `LOCKED` account type), so the dashboard, invoices, and trust score always reflect current on-chain truth.

---

## 8. The Trust / Credit Score

**Principle:** the score is computed, never self-reported, and derived only from real settlement outcomes on VUKA.

### 8.1 Signals that feed the score

- Number of completed escrow cycles
- % released via mutual confirmation vs. timeout vs. arbitration
- Average time-to-release relative to the agreed timeout
- Number of disputes raised, and outcome (won / lost / split)
- Transaction size trend over time (growing trade volume = stronger signal)
- Corridor/counterparty diversity (repeat trade with the same partner vs. many different partners)

### 8.2 What the score is NOT (v1 design guardrails)

- Not based on personal identity attributes
- Not based on unrelated financial data VUKA doesn't have visibility into
- Not a black box — a trader should be able to see *why* their score is what it is

### 8.3 Where it's used

- Shown to a prospective counterparty before they agree to open an escrow
- Could inform a future timeout default (higher-trust traders get shorter default timeouts, i.e. faster access to funds)
- Long-term: exportable trade-credit signal a trader could bring to a future lender

---

## 9. Off-Chain Ledger Design

Carried over from v1, extended with escrow awareness:

- **Golden rule:** account rows never carry a balance column. A balance is strictly `SUM(amount) FROM ledger_entries WHERE account_id = X`.
- Every transfer writes exactly two linked ledger entries (debit + credit) summing to zero, inside one DB transaction, with the source account locked `FOR UPDATE`.
- **New account type: `ESCROW_HELD`** — represents funds locked in the smart contract but not yet settled to either party. Mirrors on-chain `LOCKED` state.
- Every on-chain event writes a corresponding off-chain ledger entry — the chain is the source of truth for escrow state, Postgres is the source of truth for the full trade/business picture (invoices, wallets, trust score history).

---

## 10. Data Model

Core tables (extends v1 schema):

```
users
accounts            (PERSONAL, BUSINESS, ESCROW_HELD, SETTLEMENT, FEES)
transactions
ledger_entries
invoices
invoice_items
escrows             (escrow_id, contract_address, on-chain state, invoice_ref, buyer_id, supplier_id, amount, timeout_at)
disputes            (escrow_id, raised_by, reason, status, resolution, arbitrated_by, resolved_at)
trust_score_events  (user_id, event_type, escrow_id, weight, created_at)
kyc_status          (user_id, tier, status, verified_at)
idempotency_keys
```

---

## 11. Compliance & KYC Posture

No external regulator dependency to start building — this is now VUKA's own design decision, made honestly rather than deferred:

- **Tier 0 (no verification):** browsing, viewing trust scores, small test transactions between known contacts.
- **Tier 1 (light verification):** phone number + basic identity check — required before opening escrow with a *first-time* counterparty.
- **Tier 2 (fuller verification):** required once transaction size or cumulative volume crosses a threshold — document upload, business registration if available (but not required to exclude informal traders entirely).
- VUKA never holds mobile money PINs — confirmation is mediated by the MNO (USSD/app push), same principle as v1.
- Arbitration authority for disputes is manual (the builder) at v1 scale — a documented, honest limitation, not hidden.

---

## 12. Repository Structure

```
VUKA/
├── CONTRACTS/
│   └── escrow/                  # Solidity contract, tests, deploy scripts
├── ENGINE/
│   └── go-bridge-core/
│       ├── cmd/
│       └── internal/
│           ├── ledger/          # double-entry core
│           ├── escrow/          # on-chain event listener + orchestrator
│           ├── trust/           # scoring engine
│           ├── kyc/             # tiered verification
│           ├── api/             # REST handlers
│           └── adapters/        # MTN MoMo / M-Pesa cash-in/out
├── FRONTEND/
│   └── vuka-dashboard/          # Read-only React operations dashboard
├── BUILD_LOG.md                 # running technical decision log (see §15)
└── README.md                    # this file
```

---

## 13. Backend completion status

The local backend now includes the double-entry ledger, invoice and transfer
flows, simulated corridor/provider controls, structured FX quotes, operator
governance, compliance and pilot control planes, trader support tickets,
notifications, request correlation IDs, and read-only enforcement across
state-changing identity, ledger, settlement, pilot, and support operations.
Quotes and support records remain local/observation-only; no external provider
call or live settlement is enabled.

The backend is **not production-complete**: trader-native authentication and
session management, full organization ownership enforcement across every legacy
ledger endpoint, provider certification, legal/privacy approval, independent
security review, and live execution approvals remain explicit gates.

## 14. Roadmap

### Phase 3 — governance and acceptance (engineering baseline)

Phase 3 identity/compliance is local-only and metadata-only. Its governance
baseline, conservative retention posture, role controls, explainability
requirements, and acceptance checklist are recorded in
[`CONTRACTS/escrow/PHASE3_GOVERNANCE_ACCEPTANCE.md`](CONTRACTS/escrow/PHASE3_GOVERNANCE_ACCEPTANCE.md).
All legal, regulatory, privacy, and security statements remain engineering
defaults pending formal approval.

### Phase 4 — provider/corridor foundation (sandbox only)

The Go engine now exposes a versioned simulated-provider contract, RW/RWF to
KE/KES corridor policy, fee/limit/FX metadata, ownership, kill switches,
fail-closed credential validation, signed/idempotent webhook evidence, and
read-only operator inspection surfaces. External provider calls remain
disabled by default and webhooks never settle funds. See
[`CONTRACTS/escrow/PHASE4_PROVIDER_CORRIDOR_EVIDENCE.md`](CONTRACTS/escrow/PHASE4_PROVIDER_CORRIDOR_EVIDENCE.md).

Future work requiring separate approval includes production secret management,
provider certification, liquidity operations, live settlement, and any
blockchain release/refund automation.

### Phase 5 — controlled settlement control plane (local dry-run only)

**Status: implemented locally; global kill switch active; no funds move**

Settlement commands, role-separated approvals, explainable preflight checks,
idempotency/conflict handling, reconciliation observations, audit events, and
protected operator APIs are now persisted in the Go engine. The execution
boundary refuses live provider, ledger, and blockchain calls. Dry-run is
simulation-only and read-only mode blocks settlement state changes. See
[`CONTRACTS/escrow/PHASE5_CONTROLLED_SETTLEMENT_EVIDENCE.md`](CONTRACTS/escrow/PHASE5_CONTROLLED_SETTLEMENT_EVIDENCE.md).
Independent security review, provider certification, credential rotation, and
corridor approval records are deliberately still **PENDING**:
[`CONTRACTS/escrow/PHASE5_INDEPENDENT_SECURITY_REVIEW.md`](CONTRACTS/escrow/PHASE5_INDEPENDENT_SECURITY_REVIEW.md),
[`CONTRACTS/escrow/PHASE5_SECRET_ROTATION_APPROVAL.md`](CONTRACTS/escrow/PHASE5_SECRET_ROTATION_APPROVAL.md),
[`CONTRACTS/escrow/PHASE5_CORRIDOR_APPROVAL.md`](CONTRACTS/escrow/PHASE5_CORRIDOR_APPROVAL.md),
and
[`CONTRACTS/escrow/PHASE5_GLOBAL_KILL_SWITCH_GOVERNANCE.md`](CONTRACTS/escrow/PHASE5_GLOBAL_KILL_SWITCH_GOVERNANCE.md).

VUKA is a multi-year financial-infrastructure program. A phase is complete only
when its code, data model, failure paths, permissions, tests, observability,
runbooks, and recovery behavior are proven together. Passing a demo is not a
phase gate.

### Phase 0 — Product and safety foundation
**Status: active**

- Maintain the domain model, threat model, compliance assumptions, and
  non-negotiable safety boundaries.
- Keep all money movement behind explicit feature flags and approval gates.
- Define country, currency, provider, settlement, dispute, and data-retention
  contracts before implementation.
- Establish engineering standards: migrations, audit events, idempotency,
  reconciliation, incident handling, backup/restore, and evidence-based
  acceptance.

**Exit gate:** architecture review, threat model, data classification, and
  acceptance criteria approved for the next build phase.

### Phase 1 — Auditable operations foundation
**Status: substantially complete locally**

- Double-entry ledger and idempotent transaction boundaries.
- Operator/arbiter authentication and role permissions.
- Read-only reconciliation, dispute review, immutable timelines, and exports.
- Append-only operator activity, alert acknowledgement, recovery procedures,
  and production-safe read-only configuration.

**Exit gate:** full backend suite, frontend build, migration rehearsal,
append-only verification, backup restore drill, and signed operational
acceptance record.

### Phase 2 — Escrow domain and chain truth
**Depends on:** Phase 1
**Status: exit-gate evidence assembled; acceptance items remain**

- Finalize the escrow state machine and event specifications.
- Complete contract security review, invariant tests, and upgrade policy.
- Build canonical event ingestion, reorg handling, finality rules, and ledger
  projection.
- Add testnet-only end-to-end flows without production funds.
- Keep release, refund, and arbitration execution disabled until separately
  approved.

**Exit gate:** contract audit, deterministic replay, reorg tests, chain outage
tests, reconciliation recovery, and testnet evidence package.

### Phase 3 — Identity, compliance, and trust data
**Depends on:** Phase 1 and the escrow event model
**Status: local-only workflow implemented; external/provider gates remain**

- Organization, membership, verification, compliance review, risk flag, and
  append-only decision-history data are available through the operator API.
- Dashboard review queue and synthetic seed tooling are available locally.
- No provider calls, document storage, settlement execution, or chain writes
  are enabled by this phase.
- Implement trader, business, counterparty, consent, and access models.
- Build tiered KYC/AML case management with provider abstraction and retention
  controls.
- Define sanctions, transaction limits, enhanced review, suspicious-activity
  escalation, and data-subject workflows with legal review.
- Implement explainable trust-score events and versioned score calculations.
- Never use protected identity attributes as opaque score inputs.

**Exit gate:** policy approval, privacy/security review, explainability tests,
manual-review workflows, and deletion/retention evidence.

### Phase 4 — Provider and corridor integrations
**Depends on:** Phase 2 and Phase 3

- Replace simulated adapters with sandboxed MTN MoMo, M-Pesa, and stablecoin
  on/off-ramp integrations.
- Define provider credentials, webhook authentication, replay protection,
  settlement reconciliation, timeout handling, and provider outage behavior.
- Model corridor-specific currencies, limits, fees, FX quotes, liquidity, and
  operational ownership.
- Keep each provider behind a versioned adapter contract and kill switch.

**Exit gate:** provider certification/sandbox evidence, contract tests, replay
tests, failure injection, reconciliation proof, and corridor operating manual.

### Phase 5 — Controlled settlement execution
**Depends on:** Phases 2–4 and explicit approval

- Enable create, lock, release, refund, timeout, and arbitration transactions
  one capability at a time.
- Use policy checks, multi-party authorization, transaction simulation,
  nonce/gas management, signer isolation, and emergency pause controls.
- Record intent, approval, signed payload, transaction hash, confirmation,
  reversal/compensation path, and final ledger projection.
- Start on testnet, then a capped internal pilot; never enable unrestricted
  production movement by default.

**Exit gate:** independent security review, key-management review, chaos/failure
tests, capped-loss controls, incident drills, and explicit release approval.

### Phase 6 — Rwanda–Kenya supervised pilot preparation
**Depends on:** Phase 5
**Status: implemented locally; synthetic participants only; observation-only**

- Pilot domain, allowlist, governance approvals, scenarios, observations,
  incidents/support records, audit, idempotency and protected APIs are
  implemented in the Go engine.
- Participant onboarding requires a linked Phase 3 organization/user with
  approved/verified KYC metadata, consent and terms metadata; no document bytes
  are accepted.
- Activation is blocked until multi-party approval, participant compliance,
  named owners, and limits are present. Active pilots remain observation-only.
- The global settlement kill switch remains active; no provider, ledger,
  escrow, blockchain, credential, or live settlement action is possible.
- Seed a local fixture with `go run ./cmd/seed-pilot`. Evidence and scenario
  catalogue: [`CONTRACTS/escrow/PHASE6_SUPERVISED_PILOT_EVIDENCE.md`](CONTRACTS/escrow/PHASE6_SUPERVISED_PILOT_EVIDENCE.md).

**Exit gate:** pilot risk review, incident closure, partner sign-off, service
metrics, customer-protection evidence, regulator/legal feedback, and explicit
approval to leave observation-only mode (not available in this build).

### Phase 7 — Multi-country corridor expansion
**Depends on:** successful pilot evidence

- Add Uganda, Tanzania, and other corridors one at a time.
- Introduce country-specific legal entities, licenses, data residency,
  reporting, provider contracts, limits, and operational teams.
- Add multi-region availability, key rotation, disaster recovery, capacity
  testing, and formal service-level objectives.

**Exit gate:** per-country launch dossier and independent operational readiness
  review; no “global” switch enables an unreviewed corridor.

### Phase 8 — Continental network and institutional partnerships
**Depends on:** proven multi-country operations

- Integrate telecom groups, banks, licensed PSPs, trade platforms, and
  institutional partners through governed APIs.
- Revisit PAPSS/ISO 20022, liquidity rebalancing, institutional settlement,
  reporting, and shared arbitration standards.
- Establish governance for protocol changes, data sharing, partner access,
  incident coordination, and public accountability.

**Exit gate:** partnership, regulatory, security, resilience, and governance
  approvals for each institutional capability.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| Escrow | Funds locked in the smart contract, not yet released to either party |
| Ledger | Immutable double-entry record of all off-chain money movement |
| Trust score | Computed signal derived from a trader's real settlement behavior |
| Arbitration | Manual (v1) resolution of a disputed escrow |
| Corridor | A currency pair/geography route (e.g. RWF ↔ KES) |
| Tier (KYC) | Level of identity verification required before certain actions |
| On/off-ramp | Conversion point between fiat/mobile money and stablecoin |

---

## 15. Build Log Convention

To make the eventual handoff to Claude Code seamless, keep a `BUILD_LOG.md` from day one with entries like:

```
## 2026-09-10
- Decided: timeout default = 10 days, configurable per escrow
- Built: createEscrow() + lockFunds() on testnet
- Known shortcut: arbitration is a single hardcoded address for now
- Next: dispute event listener in Go engine
```

Short, dated, honest about shortcuts. This file matters more than clean code — it's what lets work resume exactly where it stopped, in any tool.

---

*Built for Rwanda. Reshaped for the long build. Designed for Africa's traders.*
# test Sat Sep 12 05:50:38 PM CAT 2026
