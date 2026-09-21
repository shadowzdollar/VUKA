# Vuka Trade Trust

Build VUKA ('Rise & Cross Over'), the enterprise pan-African trade-trust settlement platform for East African SME cross-border commerce (Rwanda RWF ↔ Kenya KES corridor and beyond).

Design & Aesthetic:
- Strict, high-contrast monochrome enterprise theme: pure deep black (#000000 / #09090b), crisp white (#ffffff), surgical slate/zinc borders and muted backgrounds (#18181b, #27272a, #71717a).
- Institutional, investor-ready density: sharp typography, monospaced figures for financial numbers/hashes/timestamps, clean architectural status chips, and comprehensive data tables without generic fluff.

Core Multi-Page Architecture & Screens:
1. Executive Operations Cockpit (/):
   - Continental corridor overview (Kigali ↔ Nairobi corridor metrics, active volumes, 24h settlement volume).
   - Global settlement metrics: Escrow locked vs. released vs. refunded vs. disputed.
   - Double-entry ledger health: atomic balance reconciliation status (`SUM(debits) - SUM(credits) = 0`).
   - Global emergency kill-switch and pilot observation controls.

2. Wallet & Double-Entry Ledger Engine (/wallets):
   - Strict separation of accounts: Personal MoMo, Business Trade Wallet, ESCROW_HELD, Settlement Account, and Fee Account.
   - Dynamic balance calculation showing that balances are strictly derived from double-entry ledger entries.
   - Comprehensive immutable ledger stream with debit/credit indicators, transaction references, timestamps, and exportable ledger audit records.

3. Invoices & Smart Escrow Flow (/escrow):
   - Invoice-linked escrow creator (cryptographic binding of invoice number to smart contract).
   - Full lifecycle visualization: CREATED → LOCKED (USDC on Polygon with MoMo/M-Pesa on/off-ramp abstraction) → RELEASED / REFUNDED / DISPUTED.
   - Mutual confirmation actions (buyer & supplier sign-off), 10-day configurable timeout countdown auto-release trigger, and dispute initiation.
   - Interactive modal to lock funds, test simulated MTN MoMo / Safaricom M-Pesa rails, and confirm releases.

4. Algorithmic Trust & Credit Score Engine (/trust-score):
   - Algorithmic score calculated strictly from settlement outcomes (completed cycles, % mutual release, arbitration record, volume progression, counterparty diversity).
   - Transparent breakdown of score factors (no black-box AI or identity bias).
   - Exportable trade-credit certificate for lenders and banks.

5. Dispute Tribunal & Arbitration Center (/disputes):
   - Active disputes queue with frozen escrow asset tags.
   - Evidence locker (bills of lading, delivery logs, communication transcripts).
   - Arbiter verdict interface with permanent immutable resolution recording.

6. Compliance & Tiered KYC Gateway (/compliance):
   - Tier 0 (unverified browsing), Tier 1 (phone + national ID check for new counterparties), Tier 2 (cross-border volume threshold, business registration, sanctions screening).
   - Trader verification status, risk flags, and explainable compliance decision logs.

7. Corridor Operations & ISO 20022 Gateway (/corridors):
   - RWF/KES corridor rates, FX quotes, transaction fee schedules, and simulated telecom adapters.
   - Interactive ISO 20022 pacs.008 XML message viewer and schema validator showing the translation of Vuka trade payments into central banking standards.

Ensure rich mock data across all East African corridors, full interactive modals and filters, and a production-grade enterprise navigation layout.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vuka-trade-trust.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e7c60906-9f18-41ec-b3f6-dfaa57b76458).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Backend integration

The UI talks to the Go engine in `ENGINE/go-bridge-core` (contract: `ENGINE/go-bridge-core/API.md`).
There are two independent sign-ins, each with its own HttpOnly cookie, and the navigation and pages adapt:

| Identity | Sign in with | Sees |
| --- | --- | --- |
| Trader | mobile number + password | overview, wallets & ledger, send payment, invoices, trust score, corridors, support |
| Operator / arbiter | email + password | cockpit, escrow register, disputes, compliance, providers, settlements & pilots, activity log |

Traders can self-register at `/register`. Operators are provisioned by the platform team.

```
src/lib/api/client.ts      fetch wrapper: cookies, error envelope, Idempotency-Key, downloads
src/lib/api/types.ts       wire types mirroring the engine's JSON
src/lib/api/endpoints.ts   one typed function per engine endpoint, grouped by surface
src/lib/session.tsx        trader/operator session context + logout
src/lib/trust.ts           trust score computed from the trader's own ledger history
```

### Run it locally

```sh
# 1. database + engine (from ENGINE/)
cp deploy/.env.example deploy/.env      # set POSTGRES_PASSWORD etc.
make up && make demo-seed               # Postgres on :5433 + demo traders
# run the engine with the dev settings the demo uses:
set -a; . deploy/.env; set +a
cd go-bridge-core
VUKA_FX_RWF_KES=9.5 MTN_SIM_MODE=success VUKA_CORS_ORIGINS=http://localhost:5173 go run ./cmd

# 2. the UI
cd FRONTEND && npm i && npm run dev     # http://localhost:5173
```

Demo traders (password `vuka-demo-2026`): `+250700000991` (Amina, RWF), `+254700000882` (Kethan, KES),
`+250700000773` (Jean-Paul, RWF). Operator credentials are `VUKA_OPERATOR_EMAIL` / `VUKA_OPERATOR_PASSWORD`;
`make seed-dispute` adds an arbiter, an approver and a synthetic dispute.

Dev requests to `/api` and `/healthz` are proxied to the engine so cookies stay same-origin. See `.env.example`
for the variables.

> Never point the Go test suite at your dev database: its helpers `TRUNCATE` tables. Use a separate
> `vuka_test` database.

### Things the engine does not provide (and how the UI copes)

- **Escrow contract address.** Escrow, dispute and reconciliation reads need `?contract=`; operators enter it once
  (or set `VITE_ESCROW_CONTRACT`). Without `VUKA_RECONCILIATION_ENABLED` on the engine those pages say so.
- **Trust score.** No endpoint; computed client-side from transfers and invoices.
- **Trader KYC submission.** Operator-only in the engine; traders see their status and can raise a support ticket.
- **Kill switches.** Deployment configuration, shown read-only.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
