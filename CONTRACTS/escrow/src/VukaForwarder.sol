// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VukaForwarder
/// @notice EIP-2771 compliant minimal forwarder enabling gasless meta-transactions for VUKA SME traders.
contract VukaForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
        uint256 deadline;
    }

    bytes32 private constant TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 deadline)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    mapping(address => uint256) private _nonces;

    error InvalidSignature();
    error DeadlineExpired();
    error ExecutionFailed(bytes reason);
    error ValueMismatch();

    event TransactionForwarded(
        address indexed from, address indexed to, uint256 nonce, bool success
    );

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("VukaForwarder")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function getNonce(address from) external view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest calldata req, bytes calldata signature)
        public
        view
        returns (bool)
    {
        if (block.timestamp > req.deadline) return false;
        if (req.nonce != _nonces[req.from]) return false;

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        TYPEHASH,
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

        address signer = _recover(digest, signature);
        return signer == req.from && signer != address(0);
    }

    // `req.to`/`req.value` are attacker-influenced but bound by two checks below: `verify()`
    // requires an EIP-712 signature from `req.from` over this exact (to, value, ...) tuple, and
    // `msg.value != req.value` reverts (ValueMismatch), so the forwarder never holds or forwards
    // ETH the signer did not authorise for this exact call. See test/VukaForwarder.t.sol.
    // slither-disable-next-line arbitrary-send-eth
    function execute(ForwardRequest calldata req, bytes calldata signature)
        external
        payable
        returns (bool success, bytes memory returnData)
    {
        if (!verify(req, signature)) revert InvalidSignature();
        if (block.timestamp > req.deadline) revert DeadlineExpired();
        // The relayer must fund exactly the value the signer authorised. Without this check the
        // forwarder could accumulate a resting ETH balance (an overpayment, or ETH forced in via
        // selfdestruct) that a later, unrelated signed request could then sweep to an arbitrary
        // `req.to` — the signer of that later request never authorised spending someone else's ETH.
        if (msg.value != req.value) revert ValueMismatch();

        _nonces[req.from]++;

        // Append the user's address (20 bytes) to calldata for EIP-2771 context extraction
        bytes memory callData = abi.encodePacked(req.data, req.from);

        (success, returnData) = req.to.call{ gas: req.gas, value: req.value }(callData);
        if (!success) {
            emit TransactionForwarded(req.from, req.to, req.nonce, false);
            revert ExecutionFailed(returnData);
        }

        emit TransactionForwarded(req.from, req.to, req.nonce, true);
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E735E5C69D6838D5382607A8566) {
            return address(0);
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s);
    }
}
