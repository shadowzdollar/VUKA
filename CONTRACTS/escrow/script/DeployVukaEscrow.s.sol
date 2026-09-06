// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { VukaEscrow } from "../src/VukaEscrow.sol";

contract DeployVukaEscrow is Script {
    function run() external returns (VukaEscrow deployed) {
        address settlementToken = vm.envAddress("VUKA_SETTLEMENT_TOKEN");
        address arbiter = vm.envAddress("VUKA_ESCROW_ARBITER");

        vm.startBroadcast();
        deployed = new VukaEscrow(settlementToken, arbiter);
        vm.stopBroadcast();
    }
}
