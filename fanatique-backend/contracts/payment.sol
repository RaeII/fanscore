// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PaymentProcessor
 * @dev Process ERC20 token payments authorized via off-chain signatures
 *      Designed for EVM-compatible chains (e.g., Chiliz)
 */
contract PaymentProcessor is Ownable {
    using ECDSA for bytes32;

    // ERC20 token used for payments
    IERC20 public token;
    // Address authorized to sign payment orders (backend wallet)
    address public signer;
    // Address receiving the funds
    address public treasury;
    // Track used purchase IDs to prevent replay
    mapping(uint256 => bool) public usedNonces;

    // Emitted when a payment is processed
    event Payment(uint256 indexed purchaseId, address indexed buyer, uint256 amount);

    /**
     * @dev Initialize with token, signer and treasury addresses
     * @param _token ERC20 token address
     * @param _signer Backend wallet address that signs orders
     * @param _treasury Address where funds are sent
     */
    constructor(
        address _token,
        address _signer,
        address _treasury
    ) Ownable(msg.sender) {
        require(_token != address(0), "Token address zero");
        require(_signer != address(0), "Signer address zero");
        require(_treasury != address(0), "Treasury address zero");

        token = IERC20(_token);
        signer = _signer;
        treasury = _treasury;
    }

    /** Admin functions to update config **/

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Signer address zero");
        signer = _signer;
    }

    function setToken(address _token) external onlyOwner {
        require(_token != address(0), "Token address zero");
        token = IERC20(_token);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury address zero");
        treasury = _treasury;
    }

    /**
     * @dev Process a payment authorized by an off-chain signature
     * @param purchaseId Unique ID of the purchase order
     * @param amount Amount of tokens to transfer
     * @param signature Signature from `signer` over the data
     */
    function purchase(
        uint256 purchaseId,
        uint256 amount,
        bytes calldata signature
    ) external {
        require(!usedNonces[purchaseId], "Purchase already processed");

        // Compose the signed message: purchaseId, buyer, amount, contract and chain
        bytes32 message = keccak256(
            abi.encodePacked(
                purchaseId,
                msg.sender,
                amount,
                address(this),
                block.chainid
            )
        );
        // Convert to Ethereum signed message
        bytes32 ethSigned = MessageHashUtils.toEthSignedMessageHash(message);

        // Recover and verify
        address recovered = ECDSA.recover(ethSigned, signature);
        require(recovered == signer, "Invalid signature");

        // Mark nonce used
        usedNonces[purchaseId] = true;

        // Pull tokens from buyer (user must approve first)
        require(token.transferFrom(msg.sender, treasury, amount), "Transfer failed");

        emit Payment(purchaseId, msg.sender, amount);
    }
}
