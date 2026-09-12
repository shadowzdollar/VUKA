// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { VukaForwarder } from "../src/VukaForwarder.sol";
import { VukaEscrow } from "../src/VukaEscrow.sol";
import { VukaEscrowFactory } from "../src/VukaEscrowFactory.sol";

contract MockTokenMeta {
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

contract VukaForwarderTest is Test {
    VukaForwarder private forwarder;
    MockTokenMeta private token;
    VukaEscrow private escrow;
    VukaEscrowFactory private factory;

    uint256 private buyerPrivateKey = 0xA11CE;
    address private buyer;
    address private supplier = address(0x5A1);
    address private arbiter = address(0xAAB);
    address private relayer = address(0x999);
    uint256 private constant AMOUNT = 500e6;

    function setUp() public {
        buyer = vm.addr(buyerPrivateKey);
        forwarder = new VukaForwarder();
        token = new MockTokenMeta();
        escrow = new VukaEscrow(address(token), arbiter, address(forwarder));
        factory = new VukaEscrowFactory(address(forwarder));

        token.mint(buyer, AMOUNT * 10);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
    }

    function _signRequest(VukaForwarder.ForwardRequest memory req, uint256 key)
        private
        view
        returns (bytes memory signature)
    {
        bytes32 typehash = keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 deadline)"
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                forwarder.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        typehash,
                        req.from,
                        req.to,
                        req.value,
                        req.gas,
                        req.nonce,
                        keccak256(req.data),
                        req.deadline
                    )
                )
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function testGaslessCreateAndLockEscrow() public {
        bytes memory createData = abi.encodeWithSelector(
            VukaEscrow.createEscrow.selector,
            supplier,
            AMOUNT,
            "INV-GASLESS-001",
            7 days
        );

        VukaForwarder.ForwardRequest memory req = VukaForwarder.ForwardRequest({
            from: buyer,
            to: address(escrow),
            value: 0,
            gas: 500000,
            nonce: forwarder.getNonce(buyer),
            data: createData,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signRequest(req, buyerPrivateKey);

        // Relayer submits transaction paying native gas on behalf of buyer
        vm.prank(relayer);
        (bool success,) = forwarder.execute(req, sig);
        assertTrue(success);

        VukaEscrow.Escrow memory item = escrow.getEscrow(0);
        assertEq(item.buyer, buyer);
        assertEq(item.supplier, supplier);
        assertEq(item.amount, AMOUNT);

        // Gasless Lock Funds
        bytes memory lockData = abi.encodeWithSelector(VukaEscrow.lockFunds.selector, 0);
        VukaForwarder.ForwardRequest memory lockReq = VukaForwarder.ForwardRequest({
            from: buyer,
            to: address(escrow),
            value: 0,
            gas: 500000,
            nonce: forwarder.getNonce(buyer),
            data: lockData,
            deadline: block.timestamp + 1 hours
        });

        bytes memory lockSig = _signRequest(lockReq, buyerPrivateKey);
        vm.prank(relayer);
        (bool lockSuccess,) = forwarder.execute(lockReq, lockSig);
        assertTrue(lockSuccess);

        assertEq(uint256(escrow.getEscrow(0).state), uint256(VukaEscrow.State.LOCKED));
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
    }

    function testReplayAttackPrevention() public {
        bytes memory createData = abi.encodeWithSelector(
            VukaEscrow.createEscrow.selector,
            supplier,
            AMOUNT,
            "INV-REPLAY",
            7 days
        );

        VukaForwarder.ForwardRequest memory req = VukaForwarder.ForwardRequest({
            from: buyer,
            to: address(escrow),
            value: 0,
            gas: 500000,
            nonce: forwarder.getNonce(buyer),
            data: createData,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signRequest(req, buyerPrivateKey);

        vm.prank(relayer);
        forwarder.execute(req, sig);

        // Replaying same signature should fail due to incremented nonce
        vm.prank(relayer);
        vm.expectRevert(VukaForwarder.InvalidSignature.selector);
        forwarder.execute(req, sig);
    }

    function testFactoryDeployment() public {
        address deployed = factory.createEscrowContract(address(token), arbiter);
        assertTrue(factory.isRegisteredEscrow(deployed));
        assertEq(factory.getDeployedCount(), 1);
    }

    function testCircuitBreakerPause() public {
        vm.prank(arbiter);
        escrow.setPaused(true);
        assertTrue(escrow.paused());

        vm.prank(buyer);
        vm.expectRevert(VukaEscrow.ContractPaused.selector);
        escrow.createEscrow(supplier, AMOUNT, "INV-PAUSED", 7 days);

        vm.prank(arbiter);
        escrow.setPaused(false);
        assertFalse(escrow.paused());
    }
}
