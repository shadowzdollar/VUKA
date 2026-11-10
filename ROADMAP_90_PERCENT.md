# VUKA 90% Production Readiness Roadmap (Pre-Credential Architecture)

**Target:** Reach **90%+ system completion** where **every single component, background service, contract mechanism, UI route, offline capability, and test suite is 100% built, verified, and operational**, leaving **only** real telecom production credentials and signed regulatory partnership papers to flip the final live switch.

---

## The 4 Execution Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Backend Automated Automation & Solvency Daemons               │
│ - Escrow Timeout Keeper background worker                              │
│ - Continuous Global Ledger Solvency Daemon (SUM(Dr) == SUM(Cr))        │
│ - End-to-end Go test suite & invariant validation                     │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Deep Frontend Route Localization (100% 5 Languages)           │
│ - Complete all remaining trader & operator interior pages into:        │
│   EN (English), FR (Français), SW (Kiswahili), PT (Português), RW (RW) │
│ - Verified by zero missing keys, zero typecheck errors                 │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Offline Border-Zone PWA Engine                                │
│ - IndexedDB invoice draft stash & offline queue manager                │
│ - Background synchronization when connectivity resumes                 │
│ - Service Worker asset & cache policy verification                     │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: End-to-End Guided Simulation & Full System Integration Test   │
│ - Interactive 1-click Trade Journey Simulator (RW RWF ⇄ KE KES)        │
│ - Full automated end-to-end integration test (Contract + Engine + UI)  │
│ - Deployment verification & production runbook confirmation            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend Automation & Solvency Daemons
* **Objective:** Remove all manual intervention for escrow timeouts and continuous accounting audits.
* **Deliverables:**
  1. `internal/escrow/keeper.go`: A resilient, supervised Go background daemon that monitors escrows, tracks `timeout_at`, detects un-disputed expired locks, and executes auto-release.
  2. `internal/ledger/solvency.go`: A continuous invariant daemon verifying global zero-sum integrity across all currencies (`RWF`, `KES`, `UGX`, `TZS`, `USD`, `USDC`).
  3. API endpoints for operators to inspect keeper activity and download cryptographic proof-of-solvency attestations.
* **Validation & Exit Gate:** Full Go test suite (`go test -race ./...`) passing with zero failures.

---

## Phase 2: Complete Deep Localization (100% Coverage Across 5 Languages)
* **Objective:** Ensure every single page, modal, data table, wizard step, form error, and button translates in real-time when switching between English, French, Kiswahili, Portuguese, and Kinyarwanda.
* **Deliverables:**
  1. Localize `/send`, `/wallets`, `/escrow`, `/trust-score`, `/verification`, `/support`, and `/notifications`.
  2. Localize operator console (`/compliance`, `/corridors`, `/disputes`, `/settlements`, `/activity`, `/analytics`).
* **Validation & Exit Gate:** `npx tsc --noEmit` clean, ESLint clean, and runtime browser verification across all 5 languages.

---

## Phase 3: Offline Border-Zone PWA Engine
* **Objective:** African cross-border traders at borders like Rubavu/Goma or Busia often experience spotty 2G/3G connectivity.
* **Deliverables:**
  1. Local IndexedDB storage for offline invoice drafting, draft review, and QR generation.
  2. Auto-sync queue that triggers when the trader regains data connection.
  3. Service worker caching for complete offline shell operation.
* **Validation & Exit Gate:** Offline mode simulated in browser with network throttled to offline; draft created, saved, and synced successfully.

---

## Phase 4: Guided Simulation & Full System End-to-End Verification
* **Objective:** Complete 1-click end-to-end demonstration mode and complete test coverage so evaluators, regulators, or partners can test the live system instantly.
* **Deliverables:**
  1. "Trade Simulator" widget on the frontend: runs a live synthetic trade from Amina (Kigali, RWF) to Kethan (Nairobi, KES) through invoice $\to$ MoMo lock $\to$ escrow $\to$ fulfillment $\to$ release.
  2. End-to-end test script proving:
     * Foundry smart contracts: 100% tests pass.
     * Go engine: 100% tests pass against PostgreSQL.
     * Frontend: Vite build and Nitro SSR build 100% pass.
* **Validation & Exit Gate:** Fully automated verification script that tests every single layer and outputs a signed verification report.
