// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20V2 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title VUKA Escrow V2
/// @notice Invoice-linked ERC-20 escrow for cross-border trade between African SMEs.
///
/// Design goals, in priority order:
///  1. Funds can never be permanently stuck. Pausing never blocks settlement; a
///     disputed escrow whose arbiters are absent resolves 50/50 after a fixed window;
///     a recipient the token refuses to pay (blacklist) is credited for pull-withdrawal.
///  2. Outcomes are fair and explicit. Arbitration may split funds by basis points.
///     When nobody confirmed anything before the deadline the buyer is refunded;
///     any confirmation releases to the supplier.
///  3. Authority is separable and bounded. Admin (intended: a multisig behind a
///     timelock), a guardian that can only pause NEW exposure, and an arbiter set
///     replace V1's single immutable arbiter. The protocol fee is hard-capped in code.
///  4. Indexer compatibility. V1 event signatures are preserved for the shared
///     lifecycle; new outcomes add EscrowSplit / ProtocolFeeCollected / PayoutDeferred.
///
/// Supports EIP-2771 meta-transactions (gasless UX) through one trusted forwarder.
/// Only the settlement token given at construction is ever held; it must be a plain
/// ERC-20 (fee-on-transfer and rebasing tokens are rejected at lock time).
contract VukaEscrowV2 {
    // First five values match V1 so external decoders keep working; SPLIT is new.
    enum State {
        CREATED,
        LOCKED,
        RELEASED,
        REFUNDED,
        DISPUTED,
        SPLIT
    }

    struct Escrow {
        address buyer;
        address supplier;
        uint256 amount;
        uint256 timeoutAt;
        uint256 buyerConfirmedAt;
        uint256 supplierConfirmedAt;
        uint256 disputedAt;
        uint16 feeBps; // snapshot at creation: later fee changes never touch in-flight escrows
        State state;
        string invoiceRef;
    }

    uint256 public constant BPS = 10_000;
    /// @notice Hard ceiling on the protocol fee (1%). Cannot be raised by anyone.
    uint256 public constant MAX_FEE_BPS = 100;
    uint256 public constant MIN_DISPUTE_WINDOW = 7 days;
    uint256 public constant MAX_INVOICE_REF_LENGTH = 128;
    uint256 public constant MAX_REASON_LENGTH = 512;

    IERC20V2 public immutable settlementToken;
    address public immutable trustedForwarder;
    /// @notice Seconds after a dispute is raised after which anyone may force a 50/50 split.
    uint256 public immutable disputeWindow;
    /// @notice Shortest allowed escrow duration.
    uint256 public immutable minTimeout;

    address public admin;
    address public pendingAdmin;
    address public guardian;
    address public treasury;
    uint16 public feeBps;
    bool public paused;
    uint256 public nextEscrowId;
    uint256 public arbiterCount;

    mapping(address => bool) public isArbiter;
    /// @notice Amounts the token refused to pay out, held for pull-withdrawal.
    mapping(address => uint256) public claimable;
    /// @dev Sum of `claimable`, used by the solvency invariant.
    uint256 public totalClaimable;

    mapping(uint256 => Escrow) private escrows;
    uint256 private _lock = 1;

    error InvalidAddress();
    error InvalidAmount();
    error InvalidTimeout();
    error InvalidFee();
    error InvalidBps();
    error InvalidReference();
    error UnknownEscrow();
    error InvalidState();
    error Unauthorized();
    error TransferFailed();
    error UnsupportedToken();
    error TooEarly();
    error TimeoutExpired();
    error AlreadyConfirmed();
    error EmptyReason();
    error ContractPaused();
    error Reentrancy();
    error LastArbiter();
    error NothingToWithdraw();

    // ---- V1-compatible lifecycle events (signatures unchanged) -------------------------
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

    // ---- V2 additions ------------------------------------------------------------------
    /// @notice Partial settlement. supplierAmount is net of fee; the three sum to the escrow amount.
    event EscrowSplit(
        uint256 indexed escrowId, uint256 supplierAmount, uint256 buyerAmount, uint256 feeAmount
    );
    event ProtocolFeeCollected(uint256 indexed escrowId, address indexed treasury, uint256 amount);
    event PayoutDeferred(uint256 indexed escrowId, address indexed beneficiary, uint256 amount);
    event Withdrawn(address indexed beneficiary, address indexed to, uint256 amount);
    event PauseToggled(bool isPaused);
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event GuardianUpdated(address indexed guardian);
    event TreasuryUpdated(address indexed treasury);
    event FeeUpdated(uint16 feeBps);
    event ArbiterAdded(address indexed arbiter);
    event ArbiterRemoved(address indexed arbiter);

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    modifier onlyAdmin() {
        if (_msgSender() != admin) revert Unauthorized();
        _;
    }

    constructor(
        address token,
        address initialAdmin,
        address initialGuardian,
        address initialTreasury,
        address forwarder,
        address initialArbiter,
        uint16 initialFeeBps,
        uint256 disputeWindowSeconds,
        uint256 minTimeoutSeconds
    ) {
        if (token == address(0) || token.code.length == 0) revert InvalidAddress();
        if (initialAdmin == address(0) || initialGuardian == address(0)) revert InvalidAddress();
        if (initialArbiter == address(0)) revert InvalidAddress();
        if (initialFeeBps > MAX_FEE_BPS) revert InvalidFee();
        if (initialFeeBps > 0 && initialTreasury == address(0)) revert InvalidAddress();
        if (disputeWindowSeconds < MIN_DISPUTE_WINDOW) revert InvalidTimeout();
        if (minTimeoutSeconds == 0) revert InvalidTimeout();

        settlementToken = IERC20V2(token);
        trustedForwarder = forwarder;
        disputeWindow = disputeWindowSeconds;
        minTimeout = minTimeoutSeconds;
        admin = initialAdmin;
        guardian = initialGuardian;
        treasury = initialTreasury;
        feeBps = initialFeeBps;
        isArbiter[initialArbiter] = true;
        arbiterCount = 1;
        emit AdminTransferred(address(0), initialAdmin);
        emit GuardianUpdated(initialGuardian);
        emit TreasuryUpdated(initialTreasury);
        emit FeeUpdated(initialFeeBps);
        emit ArbiterAdded(initialArbiter);
    }

    // ---- EIP-2771 -----------------------------------------------------------------------
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

    // ---- Governance ------------------------------------------------------------------------
    /// @notice Guardian or admin may pause NEW exposure (createEscrow, lockFunds). Settlement of
    ///         existing escrows is never paused, so a pause can never freeze user funds.
    function pause() external {
        address sender = _msgSender();
        if (sender != guardian && sender != admin) revert Unauthorized();
        paused = true;
        emit PauseToggled(true);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit PauseToggled(false);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (_msgSender() != pendingAdmin) revert Unauthorized();
        emit AdminTransferred(admin, pendingAdmin);
        admin = pendingAdmin;
        pendingAdmin = address(0);
    }

    function setGuardian(address newGuardian) external onlyAdmin {
        if (newGuardian == address(0)) revert InvalidAddress();
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }

    function setTreasury(address newTreasury) external onlyAdmin {
        if (newTreasury == address(0)) revert InvalidAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /// @notice Applies to escrows created AFTER this call; in-flight escrows keep their snapshot.
    function setFeeBps(uint16 newFeeBps) external onlyAdmin {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();
        if (newFeeBps > 0 && treasury == address(0)) revert InvalidAddress();
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function addArbiter(address arbiter) external onlyAdmin {
        if (arbiter == address(0)) revert InvalidAddress();
        if (!isArbiter[arbiter]) {
            isArbiter[arbiter] = true;
            arbiterCount += 1;
            emit ArbiterAdded(arbiter);
        }
    }

    /// @notice The last arbiter cannot be removed; disputes always have someone to resolve them.
    function removeArbiter(address arbiter) external onlyAdmin {
        if (!isArbiter[arbiter]) revert Unauthorized();
        if (arbiterCount == 1) revert LastArbiter();
        isArbiter[arbiter] = false;
        arbiterCount -= 1;
        emit ArbiterRemoved(arbiter);
    }

    // ---- Escrow lifecycle ------------------------------------------------------------------
    function createEscrow(
        address supplier,
        uint256 amount,
        string calldata invoiceRef,
        uint256 timeoutSeconds
    ) external whenNotPaused nonReentrant returns (uint256 escrowId) {
        address sender = _msgSender();
        if (supplier == address(0) || supplier == sender) revert InvalidAddress();
        // amount * BPS must not overflow when settling.
        if (amount == 0 || amount > type(uint256).max / BPS) revert InvalidAmount();
        if (timeoutSeconds < minTimeout) revert InvalidTimeout();
        uint256 refLength = bytes(invoiceRef).length;
        if (refLength == 0 || refLength > MAX_INVOICE_REF_LENGTH) revert InvalidReference();

        escrowId = nextEscrowId++;
        uint256 timeoutAt = block.timestamp + timeoutSeconds;
        escrows[escrowId] = Escrow({
            buyer: sender,
            supplier: supplier,
            amount: amount,
            timeoutAt: timeoutAt,
            buyerConfirmedAt: 0,
            supplierConfirmedAt: 0,
            disputedAt: 0,
            feeBps: feeBps,
            state: State.CREATED,
            invoiceRef: invoiceRef
        });
        emit EscrowCreated(escrowId, sender, supplier, amount, timeoutAt, invoiceRef);
    }

    function lockFunds(uint256 escrowId) external whenNotPaused nonReentrant {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (sender != escrow.buyer || escrow.state != State.CREATED) revert Unauthorized();

        escrow.state = State.LOCKED;
        uint256 before = settlementToken.balanceOf(address(this));
        _safeTransferFrom(sender, address(this), escrow.amount);
        // Reject fee-on-transfer / deflationary tokens: the escrow must hold exactly what it promises.
        if (settlementToken.balanceOf(address(this)) - before != escrow.amount) {
            revert UnsupportedToken();
        }
        emit FundsLocked(escrowId);
    }

    function confirmCompletion(uint256 escrowId) external nonReentrant {
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
            _settle(escrowId, escrow, BPS);
        }
    }

    function raiseDispute(uint256 escrowId, string calldata reason) external nonReentrant {
        address sender = _msgSender();
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (sender != escrow.buyer && sender != escrow.supplier) revert Unauthorized();
        uint256 length = bytes(reason).length;
        if (length == 0 || length > MAX_REASON_LENGTH) revert EmptyReason();
        if (block.timestamp >= escrow.timeoutAt) revert TimeoutExpired();

        escrow.state = State.DISPUTED;
        escrow.disputedAt = block.timestamp;
        emit DisputeRaised(escrowId, sender, reason);
    }

    /// @notice An arbiter resolves a dispute, giving `supplierBps` (0..10000) of the escrow to the
    ///         supplier (before protocol fee) and the remainder to the buyer.
    function arbitrate(uint256 escrowId, uint256 supplierBps) external nonReentrant {
        Escrow storage escrow = _escrow(escrowId);
        if (!isArbiter[_msgSender()]) revert Unauthorized();
        if (escrow.state != State.DISPUTED) revert InvalidState();
        if (supplierBps > BPS) revert InvalidBps();
        _settle(escrowId, escrow, supplierBps);
        emit DisputeResolved(escrowId, supplierBps >= BPS / 2);
    }

    /// @notice If no arbiter acts within `disputeWindow`, anyone may force an even split, so an
    ///         absent or compromised arbiter set cannot lock funds indefinitely.
    function resolveExpiredDispute(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.DISPUTED) revert InvalidState();
        if (block.timestamp < escrow.disputedAt + disputeWindow) revert TooEarly();
        _settle(escrowId, escrow, BPS / 2);
        emit DisputeResolved(escrowId, true);
    }

    /// @notice After the deadline (and absent a dispute): release to the supplier if either party
    ///         confirmed anything, otherwise refund the buyer — silence from both is not delivery.
    function checkTimeout(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _escrow(escrowId);
        if (escrow.state != State.LOCKED) revert InvalidState();
        if (block.timestamp < escrow.timeoutAt) revert TooEarly();
        bool anyConfirmation = escrow.buyerConfirmedAt != 0 || escrow.supplierConfirmedAt != 0;
        _settle(escrowId, escrow, anyConfirmation ? BPS : 0);
    }

    /// @notice Pull a deferred payout. `to` lets a beneficiary whose address the token refuses
    ///         (e.g. blacklisted) redirect it; only the credited beneficiary can call this.
    function withdraw(address to) external nonReentrant {
        address sender = _msgSender();
        if (to == address(0)) revert InvalidAddress();
        uint256 amount = claimable[sender];
        if (amount == 0) revert NothingToWithdraw();
        claimable[sender] = 0;
        totalClaimable -= amount;
        _safeTransfer(to, amount);
        emit Withdrawn(sender, to, amount);
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return _escrow(escrowId);
    }

    // ---- Internals --------------------------------------------------------------------------
    /// @dev State first, external calls last (checks-effects-interactions). Pure outcomes emit the
    ///      V1 events; partial outcomes emit EscrowSplit. The fee is taken from the supplier's share only.
    function _settle(uint256 escrowId, Escrow storage escrow, uint256 supplierBps) private {
        uint256 amount = escrow.amount;
        uint256 supplierGross = (amount * supplierBps) / BPS;
        uint256 buyerAmount = amount - supplierGross;
        uint256 fee = (supplierGross * escrow.feeBps) / BPS;
        uint256 supplierNet = supplierGross - fee;
        address supplier = escrow.supplier;
        address buyer = escrow.buyer;
        address feeTo = treasury;

        if (supplierBps == BPS) {
            escrow.state = State.RELEASED;
            emit EscrowReleased(escrowId, supplier);
        } else if (supplierBps == 0) {
            escrow.state = State.REFUNDED;
            emit EscrowRefunded(escrowId, buyer);
        } else {
            escrow.state = State.SPLIT;
            emit EscrowSplit(escrowId, supplierNet, buyerAmount, fee);
        }

        if (supplierNet > 0) _payout(escrowId, supplier, supplierNet);
        if (fee > 0) {
            emit ProtocolFeeCollected(escrowId, feeTo, fee);
            _payout(escrowId, feeTo, fee);
        }
        if (buyerAmount > 0) _payout(escrowId, buyer, buyerAmount);
    }

    /// @dev Never reverts on a token refusal: an unpayable recipient must not be able to block the
    ///      counterparty's settlement. The amount is credited for pull-withdrawal instead.
    function _payout(uint256 escrowId, address to, uint256 amount) private {
        (bool ok, bytes memory data) =
            address(settlementToken).call(abi.encodeWithSelector(IERC20V2.transfer.selector, to, amount));
        bool success = ok && (data.length == 0 || (data.length >= 32 && abi.decode(data, (bool))));
        if (!success) {
            claimable[to] += amount;
            totalClaimable += amount;
            emit PayoutDeferred(escrowId, to, amount);
        }
    }

    function _safeTransfer(address to, uint256 amount) private {
        (bool ok, bytes memory data) =
            address(settlementToken).call(abi.encodeWithSelector(IERC20V2.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && (data.length < 32 || !abi.decode(data, (bool))))) {
            revert TransferFailed();
        }
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        (bool ok, bytes memory data) = address(settlementToken)
            .call(abi.encodeWithSelector(IERC20V2.transferFrom.selector, from, to, amount));
        if (!ok || (data.length != 0 && (data.length < 32 || !abi.decode(data, (bool))))) {
            revert TransferFailed();
        }
    }

    function _escrow(uint256 escrowId) private view returns (Escrow storage escrow) {
        if (escrowId >= nextEscrowId) revert UnknownEscrow();
        escrow = escrows[escrowId];
    }
}
