// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VUKA Escrow
/// @notice Holds an ERC-20 settlement asset until confirmation, timeout, or
///         arbitration decides the supplier's outcome. Supports EIP-2771 meta-transactions for gasless UX.
// slither-disable-next-line erc20-interface
interface IERC20 {
    // Deliberately non-standard: every call goes through a low-level `.call` with manual, tolerant
    // ABI decoding (see _safeTransfer/_safeTransferFrom below) so both bool-returning and
    // void-returning tokens work. This interface is only a selector source, never called typed.
    function transferFrom(address from, address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external;
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
    address public immutable trustedForwarder;
    uint256 public nextEscrowId;
    bool public paused;

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
    error ContractPaused();

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
    event PauseToggled(bool isPaused);

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    constructor(address token, address escrowArbiter, address forwarder) {
        if (token == address(0) || escrowArbiter == address(0)) revert InvalidAddress();
        settlementToken = IERC20(token);
        arbiter = escrowArbiter;
        trustedForwarder = forwarder;
    }

    function isTrustedForwarder(address forwarder) public view returns (bool) {
        return trustedForwarder != address(0) && forwarder == trustedForwarder;
    }

    function _msgSender() internal view returns (address sender) {
        if (isTrustedForwarder(msg.sender) && msg.data.length >= 20) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }

    function setPaused(bool _paused) external {
        if (_msgSender() != arbiter) revert Unauthorized();
        paused = _paused;
        emit PauseToggled(_paused);
    }

    function createEscrow(
        address supplier,
        uint256 amount,
        string calldata invoiceRef,
        uint256 timeoutSeconds
    ) external whenNotPaused returns (uint256 escrowId) {
        address sender = _msgSender();
        if (supplier == address(0) || supplier == sender) {
            revert InvalidAddress();
        }
        if (amount == 0) revert InvalidAmount();
        if (timeoutSeconds == 0) revert InvalidTimeout();

        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            buyer: sender,
            supplier: supplier,
            amount: amount,
            timeoutAt: block.timestamp + timeoutSeconds,
            buyerConfirmedAt: 0,
            supplierConfirmedAt: 0,
            state: State.CREATED,
            invoiceRef: invoiceRef
        });

        emit EscrowCreated(
            escrowId, sender, supplier, amount, block.timestamp + timeoutSeconds, invoiceRef
        );
    }

    function lockFunds(uint256 escrowId) external whenNotPaused {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (sender != escrow.buyer || escrow.state != State.CREATED) {
            revert Unauthorized();
        }

        escrow.state = State.LOCKED;
        _safeTransferFrom(sender, address(this), escrow.amount);
        emit FundsLocked(escrowId);
    }

    function confirmCompletion(uint256 escrowId) external whenNotPaused {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (sender != escrow.buyer && sender != escrow.supplier) revert Unauthorized();
        if (block.timestamp >= escrow.timeoutAt) revert TimeoutExpired();

        if (sender == escrow.buyer) {
            if (escrow.buyerConfirmedAt != 0) revert AlreadyConfirmed();
            escrow.buyerConfirmedAt = block.timestamp;
        } else {
            if (escrow.supplierConfirmedAt != 0) revert AlreadyConfirmed();
            escrow.supplierConfirmedAt = block.timestamp;
        }
        emit CompletionConfirmed(escrowId, sender);

        if (escrow.buyerConfirmedAt != 0 && escrow.supplierConfirmedAt != 0) {
            _release(escrowId, escrow);
        }
    }

    function raiseDispute(uint256 escrowId, string calldata reason) external whenNotPaused {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (sender != escrow.buyer && sender != escrow.supplier) revert Unauthorized();
        if (bytes(reason).length == 0) revert EmptyReason();
        if (block.timestamp >= escrow.timeoutAt) revert TimeoutExpired();

        escrow.state = State.DISPUTED;
        emit DisputeRaised(escrowId, sender, reason);
    }

    function arbitrate(uint256 escrowId, bool releaseToSupplier) external whenNotPaused {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (sender != arbiter) revert Unauthorized();
        if (escrow.state != State.DISPUTED) revert InvalidState();

        if (releaseToSupplier) {
            _release(escrowId, escrow);
        } else {
            _refund(escrowId, escrow);
        }
        emit DisputeResolved(escrowId, releaseToSupplier);
    }

    function checkTimeout(uint256 escrowId) external whenNotPaused {
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
        _safeTransfer(escrow.supplier, escrow.amount);
        emit EscrowReleased(escrowId, escrow.supplier);
    }

    function _refund(uint256 escrowId, Escrow storage escrow) private {
        escrow.state = State.REFUNDED;
        _safeTransfer(escrow.buyer, escrow.amount);
        emit EscrowRefunded(escrowId, escrow.buyer);
    }

    function _safeTransfer(address to, uint256 amount) private {
        (bool ok, bytes memory data) = address(settlementToken)
            .call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        (bool ok, bytes memory data) = address(settlementToken)
            .call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _escrow(uint256 escrowId) private view returns (Escrow storage escrow) {
        if (escrowId >= nextEscrowId) revert UnknownEscrow();
        escrow = escrows[escrowId];
    }
}
