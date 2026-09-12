// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { VukaEscrow } from "./VukaEscrow.sol";

/// @title VukaEscrowFactory
/// @notice Deploys and manages registered VukaEscrow contracts across multiple token pools and corridors.
contract VukaEscrowFactory {
    address public owner;
    address public trustedForwarder;
    address[] public deployedEscrows;
    mapping(address => bool) public isRegisteredEscrow;

    error Unauthorized();
    error InvalidAddress();

    event EscrowDeployed(
        address indexed escrowAddress,
        address indexed token,
        address indexed arbiter,
        address forwarder
    );
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _forwarder) {
        owner = msg.sender;
        trustedForwarder = _forwarder;
    }

    function createEscrowContract(address token, address arbiter)
        external
        onlyOwner
        returns (address escrowAddress)
    {
        if (token == address(0) || arbiter == address(0)) revert InvalidAddress();

        VukaEscrow newEscrow = new VukaEscrow(token, arbiter, trustedForwarder);
        escrowAddress = address(newEscrow);

        deployedEscrows.push(escrowAddress);
        isRegisteredEscrow[escrowAddress] = true;

        emit EscrowDeployed(escrowAddress, token, arbiter, trustedForwarder);
    }

    function getDeployedEscrows() external view returns (address[] memory) {
        return deployedEscrows;
    }

    function getDeployedCount() external view returns (uint256) {
        return deployedEscrows.length;
    }

    function setOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setTrustedForwarder(address newForwarder) external onlyOwner {
        trustedForwarder = newForwarder;
    }
}
