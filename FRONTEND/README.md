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

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
