// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { VukaEscrow } from "../src/VukaEscrow.sol";

contract MockToken {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract VukaEscrowTest is Test {
    MockToken private token;
    VukaEscrow private escrow;
    address private buyer = address(0xB0B);
    address private supplier = address(0x5A1);
    address private arbiter = address(0xAAB);
    uint256 private constant AMOUNT = 1_000e6;

    function setUp() public {
        token = new MockToken();
        escrow = new VukaEscrow(address(token), arbiter);
        token.mint(buyer, AMOUNT * 3);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
    }

    function _createAndLock(uint256 timeout) private returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createEscrow(supplier, AMOUNT, "INV-001", timeout);
        vm.prank(buyer);
        escrow.lockFunds(id);
    }

    function testLocksFundsAndReleasesAfterBothConfirm() public {
        uint256 id = _createAndLock(7 days);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);

        vm.prank(buyer);
        escrow.confirmCompletion(id);
        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.LOCKED));

        vm.prank(supplier);
        escrow.confirmCompletion(id);
        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.RELEASED));
        assertEq(token.balanceOf(supplier), AMOUNT);
    }

    function testTimeoutReleasesFundsToSupplier() public {
        uint256 id = _createAndLock(1 days);
        vm.warp(block.timestamp + 1 days);
        escrow.checkTimeout(id);

        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.RELEASED));
        assertEq(token.balanceOf(supplier), AMOUNT);
    }

    function testDisputeCanBeArbitratedToRefund() public {
        uint256 id = _createAndLock(7 days);
        vm.prank(supplier);
        escrow.raiseDispute(id, "Goods damaged");
        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.DISPUTED));

        vm.prank(arbiter);
        escrow.arbitrate(id, false);
        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.REFUNDED));
        assertEq(token.balanceOf(buyer), AMOUNT * 3);
    }

    function testOnlyParticipantsCanConfirmAndArbiterCanResolve() public {
        uint256 id = _createAndLock(7 days);
        vm.expectRevert(VukaEscrow.Unauthorized.selector);
        escrow.confirmCompletion(id);

        vm.prank(buyer);
        escrow.confirmCompletion(id);
        vm.prank(supplier);
        escrow.raiseDispute(id, "Dispute");

        vm.expectRevert(VukaEscrow.Unauthorized.selector);
        escrow.arbitrate(id, true);
    }

    function testCannotTimeoutBeforeDeadlineOrDisputeAfterDeadline() public {
        uint256 id = _createAndLock(1 days);
        vm.expectRevert(VukaEscrow.TooEarly.selector);
        escrow.checkTimeout(id);

        vm.warp(block.timestamp + 1 days);
        vm.expectRevert(VukaEscrow.TimeoutExpired.selector);
        vm.prank(buyer);
        escrow.raiseDispute(id, "Too late");
    }

    function testFinalStateCannotBeChanged() public {
        uint256 id = _createAndLock(1 days);
        vm.warp(block.timestamp + 1 days);
        escrow.checkTimeout(id);

        vm.expectRevert(VukaEscrow.InvalidState.selector);
        vm.prank(supplier);
        escrow.confirmCompletion(id);
    }

    function testFuzzCreateAndLock(uint128 amount, uint64 timeoutSeconds) public {
        vm.assume(amount > 0);
        vm.assume(timeoutSeconds > 0);

        token.mint(buyer, amount);
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(supplier, amount, "FUZZ-LOCK", timeoutSeconds);

        vm.prank(buyer);
        escrow.lockFunds(id);

        VukaEscrow.Escrow memory created = escrow.getEscrow(id);
        assertEq(created.amount, amount);
        assertEq(uint256(created.state), uint256(VukaEscrow.State.LOCKED));
        assertEq(token.balanceOf(address(escrow)), amount);
    }

    function testFuzzTimeoutAlwaysReleases(uint128 amount, uint64 timeoutSeconds) public {
        vm.assume(amount > 0);
        vm.assume(timeoutSeconds > 0);

        token.mint(buyer, amount);
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(supplier, amount, "FUZZ-TIMEOUT", timeoutSeconds);
        vm.prank(buyer);
        escrow.lockFunds(id);

        VukaEscrow.Escrow memory created = escrow.getEscrow(id);
        vm.warp(created.timeoutAt);
        escrow.checkTimeout(id);

        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.RELEASED));
        assertEq(token.balanceOf(supplier), amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testFuzzBothConfirmRelease(bool buyerFirst) public {
        uint256 id = _createAndLock(7 days);

        if (buyerFirst) {
            vm.prank(buyer);
            escrow.confirmCompletion(id);
            vm.prank(supplier);
            escrow.confirmCompletion(id);
        } else {
            vm.prank(supplier);
            escrow.confirmCompletion(id);
            vm.prank(buyer);
            escrow.confirmCompletion(id);
        }

        assertEq(uint256(escrow.getEscrow(id).state), uint256(VukaEscrow.State.RELEASED));
        assertEq(token.balanceOf(supplier), AMOUNT);
        assertEq(token.balanceOf(address(escrow)), 0);
    }
}

contract VukaEscrowInvariantTest is Test {
    MockToken private token;
    VukaEscrow private escrow;
    address private buyer = address(0xB0B);
    address private supplier = address(0x5A1);
    address private arbiter = address(0xAAB);
    uint256 private constant AMOUNT = 1_000e6;

    function setUp() public {
        token = new MockToken();
        escrow = new VukaEscrow(address(token), arbiter);
        token.mint(buyer, AMOUNT);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(supplier, AMOUNT, "INV-INVARIANT", 7 days);
        vm.prank(buyer);
        escrow.lockFunds(id);
        targetContract(address(escrow));
    }

    function invariantLockedEscrowCoversTheRecordedFunds() public view {
        VukaEscrow.Escrow memory item = escrow.getEscrow(0);
        if (item.state == VukaEscrow.State.LOCKED) {
            // ERC-20 tokens can be sent directly to the contract, so surplus
            // balance is possible even though the escrow never creates funds.
            assertGe(token.balanceOf(address(escrow)), item.amount);
        }
    }

    function invariantEscrowStateIsValid() public view {
        uint256 state = uint256(escrow.getEscrow(0).state);
        assertTrue(state <= uint256(VukaEscrow.State.DISPUTED));
    }
}
