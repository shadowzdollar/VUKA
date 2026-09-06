# VUKA

*Rise & Cross Over*

**A trade-trust settlement platform for East African SME traders — built on top of existing mobile money rails, with trust enforced by blockchain escrow instead of just displayed as a history log.**

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

## 13. Roadmap

### Phase 0 — Design (current)
This document, contract state machine, scoring model outline.

### Phase 1 — Core Ledger + Contract (solo build, GPT-assisted)
- Off-chain ledger with `ESCROW_HELD` account type
- Deploy escrow contract to Polygon testnet
- End-to-end simulated flow: create invoice → lock → release (manual trigger)

### Phase 2 — Real Release Logic
- Timeout auto-release (keeper/cron)
- Dispute → manual arbitration flow
- Trust score computed from testnet activity

### Phase 3 — Rails Integration
- Real stablecoin on/off-ramp
- MTN MoMo / M-Pesa sandbox cash-in/cash-out adapters

### Phase 4 — Pilot
- Onboard a small real trader cohort (Rwanda-Kenya corridor)
- Tiered KYC live
- Real disputes, real arbitration, real score data

### Phase 5 — Scale
- Expand corridors (Uganda, Tanzania)
- Explore decentralized/automated arbitration
- Revisit ISO 20022 and licensed PSP partnership for liquidity rebalancing

---

## 14. Glossary

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
