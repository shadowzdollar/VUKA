// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VUKA escrow
/// @notice Holds an ERC-20 settlement asset until confirmation, timeout, or
///         arbitration decides the supplier's outcome.
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract VukaEscrow {
    enum State {
        CREATED,
        LOCKED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct Escrow {
        address buyer;
        address supplier;
        uint256 amount;
        uint256 timeoutAt;
        uint256 buyerConfirmedAt;
        uint256 supplierConfirmedAt;
        State state;
        string invoiceRef;
    }

    IERC20 public immutable settlementToken;
    address public immutable arbiter;
    uint256 public nextEscrowId;

    mapping(uint256 => Escrow) private escrows;

    error InvalidAddress();
    error InvalidAmount();
    error InvalidTimeout();
    error UnknownEscrow();
    error InvalidState();
    error Unauthorized();
    error TransferFailed();
    error TooEarly();
    error TimeoutExpired();
    error AlreadyConfirmed();
    error EmptyReason();

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed supplier,
        uint256 amount,
        uint256 timeoutAt,
        string invoiceRef
    );
    event FundsLocked(uint256 indexed escrowId);
    event EscrowReleased(uint256 indexed escrowId, address indexed to);
    event EscrowRefunded(uint256 indexed escrowId, address indexed to);
    event DisputeRaised(uint256 indexed escrowId, address indexed by, string reason);
    event DisputeResolved(uint256 indexed escrowId, bool releasedToSupplier);
    event CompletionConfirmed(uint256 indexed escrowId, address indexed by);

    constructor(address token, address escrowArbiter) {
        if (token == address(0) || escrowArbiter == address(0)) revert InvalidAddress();
        settlementToken = IERC20(token);
        arbiter = escrowArbiter;
    }

    function createEscrow(
        address supplier,
        uint256 amount,
        string calldata invoiceRef,
        uint256 timeoutSeconds
    ) external returns (uint256 escrowId) {
        if (supplier == address(0) || supplier == msg.sender) {
            revert InvalidAddress();
        }
        if (amount == 0) revert InvalidAmount();
        if (timeoutSeconds == 0) revert InvalidTimeout();

        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            supplier: supplier,
            amount: amount,
            timeoutAt: block.timestamp + timeoutSeconds,
            buyerConfirmedAt: 0,
            supplierConfirmedAt: 0,
            state: State.CREATED,
            invoiceRef: invoiceRef
        });

        emit EscrowCreated(escrowId, msg.sender, supplier, amount, block.timestamp + timeoutSeconds, invoiceRef);
    }

    function lockFunds(uint256 escrowId) external {
        Escrow storage escrow = _escrow(escrowId);
        if (msg.sender != escrow.buyer || escrow.state != State.CREATED) {
            revert Unauthorized();
        }

        escrow.state = State.LOCKED;
        if (!settlementToken.transferFrom(msg.sender, address(this), escrow.amount)) {
            revert TransferFailed();
        }
        emit FundsLocked(escrowId);
    }

    function confirmCompletion(uint256 escrowId) external {
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (msg.sender != escrow.buyer && msg.sender != escrow.supplier) revert Unauthorized();
        if (block.timestamp >= escrow.timeoutAt) revert TimeoutExpired();

        if (msg.sender == escrow.buyer) {
            if (escrow.buyerConfirmedAt != 0) revert AlreadyConfirmed();
            escrow.buyerConfirmedAt = block.timestamp;
        } else {
            if (escrow.supplierConfirmedAt != 0) revert AlreadyConfirmed();
            escrow.supplierConfirmedAt = block.timestamp;
        }
        emit CompletionConfirmed(escrowId, msg.sender);

        if (escrow.buyerConfirmedAt != 0 && escrow.supplierConfirmedAt != 0) {
            _release(escrowId, escrow);
        }
    }

    function raiseDispute(uint256 escrowId, string calldata reason) external {
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (msg.sender != escrow.buyer && msg.sender != escrow.supplier) revert Unauthorized();
        if (bytes(reason).length == 0) revert EmptyReason();
        if (block.timestamp >= escrow.timeoutAt) revert TimeoutExpired();

        escrow.state = State.DISPUTED;
        emit DisputeRaised(escrowId, msg.sender, reason);
    }

    function arbitrate(uint256 escrowId, bool releaseToSupplier) external {
        Escrow storage escrow = _escrow(escrowId);
        if (msg.sender != arbiter) revert Unauthorized();
        if (escrow.state != State.DISPUTED) revert InvalidState();

        if (releaseToSupplier) {
            _release(escrowId, escrow);
        } else {
            _refund(escrowId, escrow);
        }
        emit DisputeResolved(escrowId, releaseToSupplier);
    }

    function checkTimeout(uint256 escrowId) external {
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (block.timestamp < escrow.timeoutAt) revert TooEarly();
        _release(escrowId, escrow);
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return _escrow(escrowId);
    }

    function _release(uint256 escrowId, Escrow storage escrow) private {
        escrow.state = State.RELEASED;
        if (!settlementToken.transfer(escrow.supplier, escrow.amount)) revert TransferFailed();
        emit EscrowReleased(escrowId, escrow.supplier);
    }

    function _refund(uint256 escrowId, Escrow storage escrow) private {
        escrow.state = State.REFUNDED;
        if (!settlementToken.transfer(escrow.buyer, escrow.amount)) revert TransferFailed();
        emit EscrowRefunded(escrowId, escrow.buyer);
    }

    function _escrow(uint256 escrowId) private view returns (Escrow storage escrow) {
        if (escrowId >= nextEscrowId) revert UnknownEscrow();
        escrow = escrows[escrowId];
    }
}
