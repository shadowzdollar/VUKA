// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { VukaEscrow } from "../src/VukaEscrow.sol";
import { VukaTestToken } from "../src/VukaTestToken.sol";

/// @notice Deploys the testnet-only token and escrow together.
contract DeployAmoyTestnet is Script {
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000e6;

    function run() external returns (VukaTestToken token, VukaEscrow escrow) {
        address arbiter = vm.envAddress("VUKA_ESCROW_ARBITER");

        vm.startBroadcast();
        token = new VukaTestToken(msg.sender, INITIAL_SUPPLY);
        escrow = new VukaEscrow(address(token), arbiter, address(0));
        vm.stopBroadcast();
    }
}
