// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { VukaEscrowV2 } from "../src/VukaEscrowV2.sol";

/// @notice Deploys VukaEscrowV2. Every authority is an explicit environment value with NO
///         defaults, so a deployment cannot silently inherit the deployer as admin/arbiter.
///
/// Required:
///   VUKA_SETTLEMENT_TOKEN   ERC-20 settlement asset (a plain token: no fee-on-transfer/rebasing)
///   VUKA_ESCROW_ADMIN       governance address — use a multisig (Safe) behind a timelock
///   VUKA_ESCROW_GUARDIAN    address allowed to pause NEW escrows only (an on-call ops key)
///   VUKA_ESCROW_ARBITER     first arbiter — use a multisig, not an EOA
///   VUKA_ESCROW_TREASURY    protocol-fee recipient (may be zero only when the fee is 0)
/// Optional (defaults shown):
///   VUKA_ESCROW_FORWARDER   EIP-2771 forwarder for gasless UX (default: none)
///   VUKA_ESCROW_FEE_BPS     protocol fee in basis points, hard-capped at 100 (default 0)
///   VUKA_ESCROW_DISPUTE_WINDOW_SECONDS   arbiter deadline before a forced 50/50 (default 30 days, min 7 days)
///   VUKA_ESCROW_MIN_TIMEOUT_SECONDS      shortest escrow duration (default 1 day)
contract DeployVukaEscrowV2 is Script {
    function run() external returns (VukaEscrowV2 deployed) {
        address token = vm.envAddress("VUKA_SETTLEMENT_TOKEN");
        address admin = vm.envAddress("VUKA_ESCROW_ADMIN");
        address guardian = vm.envAddress("VUKA_ESCROW_GUARDIAN");
        address arbiter = vm.envAddress("VUKA_ESCROW_ARBITER");
        address treasury = vm.envAddress("VUKA_ESCROW_TREASURY");
        address forwarder = vm.envOr("VUKA_ESCROW_FORWARDER", address(0));
        uint16 feeBps = uint16(vm.envOr("VUKA_ESCROW_FEE_BPS", uint256(0)));
        uint256 window = vm.envOr("VUKA_ESCROW_DISPUTE_WINDOW_SECONDS", uint256(30 days));
        uint256 minTimeout = vm.envOr("VUKA_ESCROW_MIN_TIMEOUT_SECONDS", uint256(1 days));

        // Refuse the classic misconfiguration: the deploying key holding every power.
        require(admin != msg.sender, "admin must not be the deployer key");
        require(admin != arbiter && admin != guardian, "admin, guardian and arbiter must be distinct");

        vm.startBroadcast();
        deployed = new VukaEscrowV2(token, admin, guardian, treasury, forwarder, arbiter, feeBps, window, minTimeout);
        vm.stopBroadcast();

        console.log("VukaEscrowV2 deployed at", address(deployed));
        console.log("Set VUKA_RECONCILIATION_CONTRACT to this address and restart the engine.");
    }
}
