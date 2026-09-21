# VukaEscrowV2 — specification, threat model and audit scope

`src/VukaEscrowV2.sol` supersedes V1 for new deployments. **V1 is unchanged** so its
Polygon Amoy evidence (`PHASE*_EVIDENCE.md`) stays valid; V2 is a new contract with a new address.

## What changed and why

| Concern in V1 | V2 behaviour |
|---|---|
| One immutable arbiter EOA: lost key ⇒ disputed funds locked forever | Arbiter **set** managed by an admin; the last arbiter cannot be removed; arbiters can be a multisig |
| `pause` (by the arbiter) blocked settlement, freezing funds | Pause stops **new** `createEscrow` / `lockFunds` only. Confirm, dispute, arbitrate, timeout and withdrawals always work |
| Arbiter absence ⇒ dispute never ends | After `disputeWindow` (≥ 7 days) **anyone** may force a 50/50 split |
| Only release-all or refund-all | `arbitrate(id, supplierBps)` splits by basis points (state `SPLIT`) |
| Timeout always paid the supplier, even with no evidence of delivery | Timeout: **any** confirmation ⇒ release; silence from both ⇒ **refund the buyer** |
| A recipient the token refuses (blacklist) reverts the whole settlement | Failed payouts are credited to `claimable` and pulled with `withdraw(to)`; the counterparty is still paid |
| Fee-on-transfer / rebasing tokens under-fund the escrow | `lockFunds` measures the balance delta and reverts `UnsupportedToken` |
| No revenue mechanism | Protocol fee on the **supplier's share only**, hard-capped at 1% in code, snapshotted per escrow |
| No reentrancy guard | `nonReentrant` on every state-changing entry point |

The lifecycle events keep V1's exact signatures (`EscrowCreated`, `FundsLocked`, `CompletionConfirmed`,
`DisputeRaised`, `EscrowReleased`, `EscrowRefunded`, `DisputeResolved`) so the Go reconciler needs no
changes for the shared flow. New: `EscrowSplit`, `ProtocolFeeCollected`, `PayoutDeferred` (the engine's
decoder, state machine and `escrows.state` constraint handle them; a unit test pins every topic hash to
`keccak256(signature)`).

## Authority model

| Role | Can | Cannot |
|---|---|---|
| **Admin** (multisig + timelock recommended) | add/remove arbiters, set guardian/treasury, set fee ≤ 1% (new escrows only), unpause, two-step transfer admin | move escrowed funds, change an in-flight escrow's fee, remove the last arbiter |
| **Guardian** (ops key) | `pause()` new exposure | unpause, touch funds, change anything else |
| **Arbiter(s)** | resolve `DISPUTED` escrows (split by bps) | act on non-disputed escrows, rule on their own dispute as a party |
| **Buyer / supplier** | create, lock (buyer), confirm, dispute (before deadline) | settle unilaterally |
| **Anyone** | `checkTimeout`, `resolveExpiredDispute` (permissionless, deadline-gated) | — |

`script/DeployVukaEscrowV2.s.sol` has **no defaults** for authorities and refuses a deployment where the
deployer key is the admin or where admin/guardian/arbiter coincide.

## Invariants (tested)

1. **Solvency** — `token.balanceOf(escrow) == Σ unsettled escrow amounts + totalClaimable` after any sequence of
   create / lock / confirm / dispute / arbitrate / timeout / expired-dispute (stateful invariant test, 128k calls).
2. **Conservation** — for any amount, split and fee: supplier + buyer + treasury payouts == escrow amount, escrow keeps 0 (256-run fuzz).
3. **Fee ceiling** — fee never exceeds 1% of the supplier's share.
4. **Terminality** — RELEASED / REFUNDED / SPLIT escrows never change state again.
5. **Pause safety** — no settlement path is gated by `paused`.

## Threats considered

| Threat | Mitigation |
|---|---|
| Malicious/compromised arbiter | Arbiter is a multisig; admin can rotate; 50/50 fallback bounds the damage of *inaction*; a rogue arbiter can still mis-split *disputed* funds — this is the residual trust assumption (mirrors a court) |
| Admin key theft | Fee hard-capped; admin cannot reach funds; two-step handover; run admin behind a timelock and Safe |
| Guardian griefing (pause spam) | Only blocks *new* escrows; admin unpauses |
| Reentrancy via ERC-777-style token hooks | `nonReentrant`; checks-effects-interactions; tested with a re-entering token |
| Token blacklist of a party | Pull-payment fallback; `withdraw(to)` redirects |
| Fee-on-transfer token | Rejected at lock |
| Arithmetic overflow in bps math | `amount ≤ max/10_000` enforced at creation; Solidity 0.8 checked math |
| Forwarder spoofing (EIP-2771) | Suffix honoured only when `msg.sender == trustedForwarder`; tested |
| Front-running `lockFunds` | Only the buyer can lock; nothing to gain by front-running |
| Unbounded strings (gas grief) | `invoiceRef` ≤ 128 bytes, dispute reason ≤ 512 |
| Upgradeability risk | **None by design** — the contract is immutable; a fix means a new deployment and migration |

## Known limitations (state these to reviewers)

* **Not independently audited.** The test suite is strong but is not a substitute; commission an external audit before mainnet value.
* The settlement token is a trust dependency (issuer can freeze or de-peg). Choose it with compliance; the contract cannot fix that.
* A dispute resolves by arbiter judgement; there is no on-chain evidence verification (evidence hashes live in the engine).
* Timeouts use `block.timestamp` (miner-influenceable by seconds only); the 1-hour minimum escrow duration makes this immaterial.
* No native-asset (ETH/MATIC) escrow and no multi-token per contract; deploy one contract per settlement token (factory pattern).
* `VukaEscrowFactory` still deploys V1. A V2 factory is a follow-up once the V2 parameters are final.

## Audit scope suggestion

`src/VukaEscrowV2.sol` (≈ 400 lines, no dependencies), the forwarder integration, and the deploy script.
Focus: `_settle` / `_payout` arithmetic and event ordering, the pull-payment accounting (`totalClaimable`),
role transitions, and reentrancy across `withdraw` and the settlement entry points.

## Deploy

```sh
cd CONTRACTS/escrow && cp .env.example .env   # fill EVERY authority; use multisigs
forge test                                     # 47 tests must pass
forge script script/DeployVukaEscrowV2.s.sol:DeployVukaEscrowV2 --rpc-url "$POLYGON_AMOY_RPC_URL" --broadcast
# then set VUKA_RECONCILIATION_CONTRACT to the printed address and restart the engine
```
