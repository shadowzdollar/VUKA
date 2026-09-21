// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { VukaEscrow } from "../src/VukaEscrow.sol";

contract DeployVukaEscrow is Script {
    function run() external returns (VukaEscrow deployed) {
        address settlementToken = vm.envAddress("VUKA_SETTLEMENT_TOKEN");
        address arbiter = vm.envAddress("VUKA_ESCROW_ARBITER");
        // Optional EIP-2771 forwarder; address(0) disables meta-transactions.
        address forwarder = vm.envOr("VUKA_ESCROW_FORWARDER", address(0));

        vm.startBroadcast();
        deployed = new VukaEscrow(settlementToken, arbiter, forwarder);
        vm.stopBroadcast();
    }
}
