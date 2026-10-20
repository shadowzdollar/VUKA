# VUKA Escrow Contract

This package contains the first v2 money-movement component: an ERC-20 escrow
contract with explicit lifecycle states, mutual completion confirmation,
timeout release, and arbiter-controlled dispute resolution.

The contract is intentionally isolated from the legacy `ENGINE/` prototype.
It must be compiled and tested with a pinned Solidity toolchain before any
testnet deployment. The Go service will later reconcile these emitted events
into the off-chain ledger; it must not invent escrow state independently.

Phase 2 validation evidence is tracked in
`PHASE2_TESTNET_EVIDENCE.md`. It records contract, reconciliation, recovery,
and safety-gate status without authorizing deployment.

`EscrowCreated` emits the absolute Unix timestamp `timeoutAt` alongside the
amount and invoice reference. Reconciliation persists this deadline as
canonical chain truth, and completion confirmation is rejected at or after the
deadline even if timeout processing has not yet been called.

Each participant may confirm completion only once. If both confirmations are
recorded before the deadline, funds are released to the supplier. If the
deadline is reached while the escrow remains locked, `checkTimeout` releases
the funds to the supplier; disputed escrows must instead be resolved by the
arbiter and cannot be changed after a terminal outcome.

## Polygon Amoy preparation

The first public-network target is Polygon Amoy. Deployment is intentionally
not automatic and requires local environment variables:

```bash
cp .env.example .env
# Fill the values locally; do not commit .env.
set -a
. ./.env
set +a

forge script script/DeployVukaEscrow.s.sol:DeployVukaEscrow \
  --rpc-url "$POLYGON_AMOY_RPC_URL" \
  --broadcast
```

Before running this command, use a dedicated testnet deployer, confirm the
settlement token address and arbiter address, and fund the deployer with
Polygon Amoy gas. Source verification can be added after the first controlled
deployment.

### Testnet settlement token

Do not use a real production stablecoin for the first deployment. The
repository includes `VukaTestToken`, a deliberately labeled testnet-only
ERC-20 with 6 decimals. Deploy it together with the escrow contract:

```bash
forge script script/DeployAmoyTestnet.s.sol:DeployAmoyTestnet \
  --rpc-url "$POLYGON_AMOY_RPC_URL" \
  --broadcast
```

Record the emitted token and escrow addresses locally. The test token starts
with its supply assigned to the deployer and can mint only from that deployer
address. It is not backed by fiat, is not USDC, and must never be used for a
production deployment.

## Deploying VukaEscrowV2 (the current target)

`DeployVukaEscrow.s.sol` above deploys the original V1 contract. The roadmap
target is **V2** (`VukaEscrowV2`), which adds distinct admin/guardian/
treasury roles instead of one key holding every power. Deploy in two steps:

```bash
# 1. Get a settlement token address on Amoy. If you don't have one yet, the
#    AmoyTestnet script above deploys VukaTestToken alongside a V1 escrow you
#    can ignore — copy the printed "VukaTestToken deployed at" address.

# 2. Deploy V2 against that token. VUKA_ESCROW_ADMIN, _GUARDIAN and _ARBITER
#    must be three DISTINCT addresses, and none may equal the deployer key —
#    the script refuses to deploy otherwise (see script/DeployVukaEscrowV2.s.sol).
#    Use separate testnet wallets for each; a multisig for admin/arbiter is
#    the real-world recommendation but any distinct funded EOA works for a
#    sandbox/demo deployment.
export VUKA_SETTLEMENT_TOKEN=0x...   # from step 1
export VUKA_ESCROW_ADMIN=0x...
export VUKA_ESCROW_GUARDIAN=0x...
export VUKA_ESCROW_ARBITER=0x...
export VUKA_ESCROW_TREASURY=0x...    # may equal admin; zero only if FEE_BPS=0

forge script script/DeployVukaEscrowV2.s.sol:DeployVukaEscrowV2 \
  --rpc-url "$POLYGON_AMOY_RPC_URL" \
  --broadcast
```

The script logs the deployed address. Wire it up:

- **Frontend (Vercel):** set `VITE_ESCROW_CONTRACT` to this address and
  `VITE_ESCROW_CHAIN_ID=80002` — see `FRONTEND/VERCEL_DEPLOY.md`.
- **Engine (Render), optional:** set `VUKA_RECONCILIATION_ENABLED=true`,
  `VUKA_RECONCILIATION_CONTRACT` to this address, and
  `VUKA_RECONCILIATION_RPC_URL` to an Amoy RPC endpoint, so the engine
  reconciles on-chain escrow events into the off-chain ledger — see
  `ENGINE/deploy/RENDER_DEPLOY_RUNBOOK.md`. The platform works without this
  (traders can still create escrows on-chain through their own wallet), but
  the engine won't reflect on-chain state until reconciliation is on.

Fund the deployer (and the admin/guardian/arbiter wallets you plan to use
for day-to-day operation) with Amoy test POL from a public faucet before
running either script — a real transaction, costs real testnet gas, cannot
be done on the user's behalf without their own wallet/key.
