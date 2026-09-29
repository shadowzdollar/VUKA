// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { StdInvariant } from "forge-std/StdInvariant.sol";
import { VukaEscrowV2 } from "../src/VukaEscrowV2.sol";

contract Token {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blacklisted;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function setBlacklisted(address who, bool value) external {
        blacklisted[who] = value;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external
        virtual
        returns (bool)
    {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    // Mimics USDC-style blacklisting: transfers to a blacklisted address revert.
    function transfer(address to, uint256 amount) external virtual returns (bool) {
        require(!blacklisted[to], "blacklisted");
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// Burns 1% on transferFrom: the escrow would receive less than it promises.
contract FeeOnTransferToken is Token {
    function transferFrom(address from, address to, uint256 amount)
        external
        override
        returns (bool)
    {
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount - amount / 100;
        return true;
    }
}

/// Tries to re-enter the escrow from inside transfer().
contract ReentrantToken is Token {
    VukaEscrowV2 public target;
    uint256 public targetId;
    bool public attempted;
    bool public reentrySucceeded;

    function arm(VukaEscrowV2 escrow, uint256 id) external {
        target = escrow;
        targetId = id;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        if (address(target) != address(0) && !attempted) {
            attempted = true;
            try target.checkTimeout(targetId) {
                reentrySucceeded = true;
            } catch { }
        }
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract VukaEscrowV2Test is Test {
    Token token;
    VukaEscrowV2 escrow;

    address admin = address(0xA11CE);
    address guardian = address(0xB0B);
    address treasury = address(0x7E45);
    address arbiter = address(0xA2B1);
    address buyer = address(0xB1);
    address supplier = address(0x51);
    address stranger = address(0xDEAD);
    address forwarder = address(0xF0F0);

    uint16 constant FEE = 50; // 0.5%
    uint256 constant AMOUNT = 1_000_000_000; // 1,000 units at 6 decimals
    uint256 constant DAY = 1 days;

    function setUp() public {
        token = new Token();
        escrow = _deploy(address(token), FEE);
        token.mint(buyer, 100 * AMOUNT);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
    }

    function _deploy(address tok, uint16 fee) internal returns (VukaEscrowV2) {
        return new VukaEscrowV2(
            tok, admin, guardian, treasury, forwarder, arbiter, fee, 14 days, 1 hours
        );
    }

    function _locked() internal returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createEscrow(supplier, AMOUNT, "INV-2026-001", 10 days);
        vm.prank(buyer);
        escrow.lockFunds(id);
    }

    function _state(uint256 id) internal view returns (VukaEscrowV2.State) {
        return escrow.getEscrow(id).state;
    }

    // ---------------------------------------------------------------- creation & validation
    function test_createLockAndBookkeeping() public {
        uint256 id = _locked();
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.LOCKED));
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
        assertEq(escrow.getEscrow(id).feeBps, FEE);
    }

    function test_createRejectsBadInputs() public {
        vm.startPrank(buyer);
        vm.expectRevert(VukaEscrowV2.InvalidAddress.selector);
        escrow.createEscrow(buyer, AMOUNT, "INV", 10 days); // self-dealing
        vm.expectRevert(VukaEscrowV2.InvalidAddress.selector);
        escrow.createEscrow(address(0), AMOUNT, "INV", 10 days);
        vm.expectRevert(VukaEscrowV2.InvalidAmount.selector);
        escrow.createEscrow(supplier, 0, "INV", 10 days);
        vm.expectRevert(VukaEscrowV2.InvalidAmount.selector);
        escrow.createEscrow(supplier, type(uint256).max, "INV", 10 days); // would overflow settlement math
        vm.expectRevert(VukaEscrowV2.InvalidTimeout.selector);
        escrow.createEscrow(supplier, AMOUNT, "INV", 30 minutes); // below minTimeout
        vm.expectRevert(VukaEscrowV2.InvalidReference.selector);
        escrow.createEscrow(supplier, AMOUNT, "", 10 days); // must be invoice-linked
        vm.expectRevert(VukaEscrowV2.InvalidReference.selector);
        escrow.createEscrow(supplier, AMOUNT, new string(129), 10 days);
        vm.stopPrank();
    }

    function test_onlyBuyerLocksAndOnlyOnce() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(supplier, AMOUNT, "INV", 10 days);
        vm.prank(stranger);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.lockFunds(id);
        vm.prank(buyer);
        escrow.lockFunds(id);
        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.lockFunds(id);
    }

    // ---------------------------------------------------------------- settlement outcomes
    function test_mutualConfirmationReleasesNetOfFee() public {
        uint256 id = _locked();
        vm.prank(buyer);
        escrow.confirmCompletion(id);
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.LOCKED));
        vm.prank(supplier);
        escrow.confirmCompletion(id);
        uint256 fee = (AMOUNT * FEE) / 10_000;
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.RELEASED));
        assertEq(token.balanceOf(supplier), AMOUNT - fee);
        assertEq(token.balanceOf(treasury), fee);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_silenceFromBothRefundsTheBuyerWithoutFee() public {
        uint256 id = _locked();
        vm.warp(block.timestamp + 10 days);
        uint256 before = token.balanceOf(buyer);
        escrow.checkTimeout(id); // anyone can trigger it
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.REFUNDED));
        assertEq(token.balanceOf(buyer), before + AMOUNT);
        assertEq(token.balanceOf(treasury), 0, "no fee on a refund");
    }

    function test_anyConfirmationLetsTimeoutReleaseToSupplier() public {
        uint256 a = _locked();
        vm.prank(supplier);
        escrow.confirmCompletion(a); // supplier says shipped; buyer silent
        uint256 b = _locked();
        vm.prank(buyer);
        escrow.confirmCompletion(b); // buyer says received; supplier silent
        vm.warp(block.timestamp + 10 days);
        escrow.checkTimeout(a);
        escrow.checkTimeout(b);
        assertEq(uint256(_state(a)), uint256(VukaEscrowV2.State.RELEASED));
        assertEq(uint256(_state(b)), uint256(VukaEscrowV2.State.RELEASED));
    }

    function test_timeoutTooEarlyAndConfirmationAfterDeadlineRevert() public {
        uint256 id = _locked();
        vm.expectRevert(VukaEscrowV2.TooEarly.selector);
        escrow.checkTimeout(id);
        vm.warp(block.timestamp + 10 days);
        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.TimeoutExpired.selector);
        escrow.confirmCompletion(id);
        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.TimeoutExpired.selector);
        escrow.raiseDispute(id, "late");
    }

    function test_cannotConfirmTwiceOrAsStranger() public {
        uint256 id = _locked();
        vm.prank(buyer);
        escrow.confirmCompletion(id);
        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.AlreadyConfirmed.selector);
        escrow.confirmCompletion(id);
        vm.prank(stranger);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.confirmCompletion(id);
    }

    // ---------------------------------------------------------------- disputes & arbitration
    function _disputed() internal returns (uint256 id) {
        id = _locked();
        vm.prank(buyer);
        escrow.raiseDispute(id, "12 of 40 tonnes short on arrival");
    }

    function test_arbiterSplitsFundsAndTakesFeeOnlyFromTheSuppliersShare() public {
        uint256 id = _disputed();
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.DISPUTED));
        vm.prank(arbiter);
        escrow.arbitrate(id, 7_000); // 70% to supplier
        uint256 gross = (AMOUNT * 7_000) / 10_000;
        uint256 fee = (gross * FEE) / 10_000;
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.SPLIT));
        assertEq(token.balanceOf(supplier), gross - fee);
        assertEq(token.balanceOf(treasury), fee);
        assertEq(token.balanceOf(buyer), 99 * AMOUNT + (AMOUNT - gross));
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_arbiterCanReleaseOrRefundInFull() public {
        uint256 a = _disputed();
        uint256 b = _disputed();
        vm.startPrank(arbiter);
        escrow.arbitrate(a, 10_000);
        escrow.arbitrate(b, 0);
        vm.stopPrank();
        assertEq(uint256(_state(a)), uint256(VukaEscrowV2.State.RELEASED));
        assertEq(uint256(_state(b)), uint256(VukaEscrowV2.State.REFUNDED));
    }

    function test_onlyArbitersResolveAndBpsIsBounded() public {
        uint256 id = _disputed();
        vm.prank(stranger);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.arbitrate(id, 5_000);
        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.arbitrate(id, 0); // a party cannot rule on their own dispute
        vm.prank(arbiter);
        vm.expectRevert(VukaEscrowV2.InvalidBps.selector);
        escrow.arbitrate(id, 10_001);
        vm.prank(arbiter);
        escrow.arbitrate(id, 5_000);
        vm.prank(arbiter);
        vm.expectRevert(VukaEscrowV2.InvalidState.selector);
        escrow.arbitrate(id, 5_000); // terminal
    }

    function test_absentArbiterCannotLockFundsForever() public {
        uint256 id = _disputed();
        vm.expectRevert(VukaEscrowV2.TooEarly.selector);
        escrow.resolveExpiredDispute(id);
        vm.warp(block.timestamp + 14 days);
        vm.prank(stranger); // permissionless
        escrow.resolveExpiredDispute(id);
        uint256 gross = AMOUNT / 2;
        uint256 fee = (gross * FEE) / 10_000;
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.SPLIT));
        assertEq(token.balanceOf(supplier), gross - fee);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    // ---------------------------------------------------------------- pause & governance
    function test_pauseStopsNewExposureButNeverSettlement() public {
        uint256 open = _locked();
        uint256 disputed = _disputed();
        vm.prank(guardian);
        escrow.pause();

        vm.prank(buyer);
        vm.expectRevert(VukaEscrowV2.ContractPaused.selector);
        escrow.createEscrow(supplier, AMOUNT, "INV", 10 days);

        // Existing escrows still settle: a pause can never freeze user funds.
        vm.prank(buyer);
        escrow.confirmCompletion(open);
        vm.prank(supplier);
        escrow.confirmCompletion(open);
        vm.prank(arbiter);
        escrow.arbitrate(disputed, 5_000);
        assertEq(uint256(_state(open)), uint256(VukaEscrowV2.State.RELEASED));
        assertEq(uint256(_state(disputed)), uint256(VukaEscrowV2.State.SPLIT));
    }

    function test_guardianCanPauseButOnlyAdminCanUnpause() public {
        vm.prank(guardian);
        escrow.pause();
        vm.prank(guardian);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.unpause();
        vm.prank(stranger);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.pause();
        vm.prank(admin);
        escrow.unpause();
        assertFalse(escrow.paused());
    }

    function test_adminTransferIsTwoStep() public {
        vm.prank(admin);
        escrow.transferAdmin(stranger);
        assertEq(escrow.admin(), admin, "not effective until accepted");
        vm.prank(guardian);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.acceptAdmin();
        vm.prank(stranger);
        escrow.acceptAdmin();
        assertEq(escrow.admin(), stranger);
        vm.prank(admin);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.setTreasury(admin);
    }

    function test_arbiterSetManagementKeepsAtLeastOne() public {
        vm.startPrank(admin);
        escrow.addArbiter(stranger);
        assertEq(escrow.arbiterCount(), 2);
        escrow.removeArbiter(arbiter);
        vm.expectRevert(VukaEscrowV2.LastArbiter.selector);
        escrow.removeArbiter(stranger);
        vm.stopPrank();
        vm.prank(arbiter);
        vm.expectRevert(VukaEscrowV2.Unauthorized.selector);
        escrow.addArbiter(arbiter);
    }

    function test_feeIsHardCappedAndSnapshottedPerEscrow() public {
        vm.prank(admin);
        vm.expectRevert(VukaEscrowV2.InvalidFee.selector);
        escrow.setFeeBps(101);

        uint256 id = _locked(); // snapshot 50 bps
        vm.prank(admin);
        escrow.setFeeBps(100);
        vm.prank(buyer);
        escrow.confirmCompletion(id);
        vm.prank(supplier);
        escrow.confirmCompletion(id);
        assertEq(
            token.balanceOf(treasury),
            (AMOUNT * FEE) / 10_000,
            "in-flight escrow keeps its original fee"
        );
    }

    function test_constructorRejectsUnsafeConfiguration() public {
        vm.expectRevert(VukaEscrowV2.InvalidFee.selector);
        new VukaEscrowV2(
            address(token), admin, guardian, treasury, forwarder, arbiter, 101, 14 days, 1 hours
        );
        vm.expectRevert(VukaEscrowV2.InvalidTimeout.selector);
        new VukaEscrowV2(
            address(token), admin, guardian, treasury, forwarder, arbiter, 50, 1 days, 1 hours
        );
        vm.expectRevert(VukaEscrowV2.InvalidAddress.selector);
        new VukaEscrowV2(
            address(0x1234), admin, guardian, treasury, forwarder, arbiter, 50, 14 days, 1 hours
        ); // not a contract
        vm.expectRevert(VukaEscrowV2.InvalidAddress.selector);
        new VukaEscrowV2(
            address(token), admin, guardian, address(0), forwarder, arbiter, 50, 14 days, 1 hours
        ); // fee needs a treasury
    }

    // ---------------------------------------------------------------- hostile tokens
    function test_feeOnTransferTokenIsRejectedAtLock() public {
        FeeOnTransferToken bad = new FeeOnTransferToken();
        VukaEscrowV2 e = _deploy(address(bad), 0);
        bad.mint(buyer, AMOUNT);
        vm.startPrank(buyer);
        bad.approve(address(e), AMOUNT);
        uint256 id = e.createEscrow(supplier, AMOUNT, "INV", 10 days);
        vm.expectRevert(VukaEscrowV2.UnsupportedToken.selector);
        e.lockFunds(id);
        vm.stopPrank();
    }

    function test_blacklistedRecipientCannotBlockSettlementAndCanWithdrawElsewhere() public {
        uint256 id = _locked();
        token.setBlacklisted(supplier, true); // e.g. token issuer freezes the supplier address
        vm.prank(buyer);
        escrow.confirmCompletion(id);
        vm.prank(supplier);
        escrow.confirmCompletion(id); // must NOT revert

        uint256 fee = (AMOUNT * FEE) / 10_000;
        assertEq(uint256(_state(id)), uint256(VukaEscrowV2.State.RELEASED));
        assertEq(escrow.claimable(supplier), AMOUNT - fee);
        assertEq(escrow.totalClaimable(), AMOUNT - fee);
        assertEq(
            token.balanceOf(treasury), fee, "the counterparty leg of the settlement still paid out"
        );

        vm.prank(stranger);
        vm.expectRevert(VukaEscrowV2.NothingToWithdraw.selector);
        escrow.withdraw(stranger);

        address fresh = address(0xFEED);
        vm.prank(supplier);
        escrow.withdraw(fresh);
        assertEq(token.balanceOf(fresh), AMOUNT - fee);
        assertEq(escrow.totalClaimable(), 0);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function test_reentrantTokenCannotDoubleSpend() public {
        ReentrantToken rt = new ReentrantToken();
        VukaEscrowV2 e = _deploy(address(rt), 0);
        rt.mint(buyer, AMOUNT);
        vm.startPrank(buyer);
        rt.approve(address(e), AMOUNT);
        uint256 id = e.createEscrow(supplier, AMOUNT, "INV", 2 hours);
        e.lockFunds(id);
        vm.stopPrank();
        rt.arm(e, id);
        vm.warp(block.timestamp + 2 hours);
        e.checkTimeout(id);
        assertTrue(rt.attempted());
        assertFalse(rt.reentrySucceeded(), "re-entry must be blocked");
        assertEq(rt.balanceOf(buyer), AMOUNT);
        assertEq(rt.balanceOf(address(e)), 0);
    }

    // ---------------------------------------------------------------- meta-transactions
    function test_gaslessCreateThroughTheTrustedForwarder() public {
        bytes memory call =
            abi.encodeCall(VukaEscrowV2.createEscrow, (supplier, AMOUNT, "INV-GASLESS", 10 days));
        vm.prank(forwarder);
        (bool ok,) = address(escrow).call(abi.encodePacked(call, buyer));
        assertTrue(ok);
        assertEq(escrow.getEscrow(0).buyer, buyer, "sender is recovered from the forwarder suffix");

        // A non-forwarder cannot spoof the suffix.
        vm.prank(stranger);
        (ok,) = address(escrow).call(abi.encodePacked(call, buyer));
        assertTrue(ok);
        assertEq(
            escrow.getEscrow(1).buyer, stranger, "suffix ignored unless the caller is the forwarder"
        );
    }

    // ---------------------------------------------------------------- fuzz: funds are conserved
    function testFuzz_splitConservesEveryUnit(uint96 amountRaw, uint16 bpsRaw, uint16 feeRaw)
        public
    {
        uint256 amount = bound(uint256(amountRaw), 1, 1e15);
        uint256 supplierBps = bound(uint256(bpsRaw), 0, 10_000);
        uint16 fee = uint16(bound(uint256(feeRaw), 0, 100));
        VukaEscrowV2 e = _deploy(address(token), fee);
        token.mint(buyer, amount);
        vm.startPrank(buyer);
        token.approve(address(e), amount);
        uint256 id = e.createEscrow(supplier, amount, "INV-FUZZ", 2 hours);
        e.lockFunds(id);
        e.raiseDispute(id, "fuzz");
        vm.stopPrank();

        uint256 supplierBefore = token.balanceOf(supplier);
        uint256 buyerBefore = token.balanceOf(buyer);
        uint256 treasuryBefore = token.balanceOf(treasury);
        vm.prank(arbiter);
        e.arbitrate(id, supplierBps);

        uint256 paidOut = (token.balanceOf(supplier) - supplierBefore)
            + (token.balanceOf(buyer) - buyerBefore) + (token.balanceOf(treasury) - treasuryBefore);
        assertEq(paidOut, amount, "every unit is paid to exactly one party");
        assertEq(token.balanceOf(address(e)), 0, "escrow retains nothing");
        uint256 gross = (amount * supplierBps) / 10_000;
        assertLe(
            token.balanceOf(treasury) - treasuryBefore,
            (gross * 100) / 10_000 + 1,
            "fee never exceeds the 1% cap of the supplier share"
        );
    }
}

/// Drives random lifecycles and checks the contract can always cover what it owes.
contract EscrowHandler is Test {
    VukaEscrowV2 public escrow;
    Token public token;
    address public buyer = address(0xB1);
    address public supplier = address(0x51);
    address public arbiter = address(0xA2B1);
    uint256 public created;
    uint256 public outstanding; // amounts currently held for LOCKED / DISPUTED escrows

    constructor(VukaEscrowV2 e, Token t) {
        escrow = e;
        token = t;
        token.mint(buyer, type(uint128).max);
        vm.prank(buyer);
        token.approve(address(e), type(uint256).max);
    }

    function create(uint256 amount) external {
        amount = bound(amount, 1, 1e12);
        vm.prank(buyer);
        escrow.createEscrow(supplier, amount, "INV", 2 hours);
        created++;
    }

    function lock(uint256 id) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        VukaEscrowV2.Escrow memory e = escrow.getEscrow(id);
        if (e.state != VukaEscrowV2.State.CREATED) return;
        vm.prank(buyer);
        escrow.lockFunds(id);
        outstanding += e.amount;
    }

    function confirmBoth(uint256 id) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        VukaEscrowV2.Escrow memory e = escrow.getEscrow(id);
        if (e.state != VukaEscrowV2.State.LOCKED || block.timestamp >= e.timeoutAt) return;
        vm.prank(buyer);
        try escrow.confirmCompletion(id) { }
        catch {
            return;
        }
        vm.prank(supplier);
        try escrow.confirmCompletion(id) {
            outstanding -= e.amount;
        } catch { }
    }

    function dispute(uint256 id) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        VukaEscrowV2.Escrow memory e = escrow.getEscrow(id);
        if (e.state != VukaEscrowV2.State.LOCKED || block.timestamp >= e.timeoutAt) return;
        vm.prank(supplier);
        escrow.raiseDispute(id, "d");
    }

    function arbitrate(uint256 id, uint256 bps) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        VukaEscrowV2.Escrow memory e = escrow.getEscrow(id);
        if (e.state != VukaEscrowV2.State.DISPUTED) return;
        vm.prank(arbiter);
        escrow.arbitrate(id, bound(bps, 0, 10_000));
        outstanding -= e.amount;
    }

    function timeout(uint256 id, uint256 jump) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        vm.warp(block.timestamp + bound(jump, 0, 30 days));
        VukaEscrowV2.Escrow memory e = escrow.getEscrow(id);
        if (e.state == VukaEscrowV2.State.LOCKED && block.timestamp >= e.timeoutAt) {
            escrow.checkTimeout(id);
            outstanding -= e.amount;
        } else if (
            e.state == VukaEscrowV2.State.DISPUTED
                && block.timestamp >= e.disputedAt + escrow.disputeWindow()
        ) {
            escrow.resolveExpiredDispute(id);
            outstanding -= e.amount;
        }
    }
}

contract VukaEscrowV2InvariantTest is StdInvariant, Test {
    VukaEscrowV2 escrow;
    Token token;
    EscrowHandler handler;

    function setUp() public {
        token = new Token();
        escrow = new VukaEscrowV2(
            address(token),
            address(0xA11CE),
            address(0xB0B),
            address(0x7E45),
            address(0),
            address(0xA2B1),
            50,
            14 days,
            1 hours
        );
        handler = new EscrowHandler(escrow, token);
        targetContract(address(handler));
    }

    /// The contract always holds exactly what it owes: unsettled escrows + deferred payouts.
    function invariant_escrowHoldsExactlyWhatItOwes() public view {
        assertEq(token.balanceOf(address(escrow)), handler.outstanding() + escrow.totalClaimable());
    }
}
