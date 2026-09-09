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
