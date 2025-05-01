// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title Payment
 * @notice Contrato para processamento de pagamentos ERC20 com meta-transações
 * @dev Suporta dois métodos de pagamento:
 * 1. Método tradicional com approve prévio (requer duas transações)
 * 2. Método EIP-2612 Permit que permite aprovar e transferir em uma única transação
 */
contract Payment is Ownable {
    using ECDSA for bytes32;

    // Endereço recebedor dos fundos
    address public treasury;
    // Evento emitido quando um pagamento é processado
    event PaymentProcessed(uint256 indexed orderId, address indexed buyer, uint256 amount);
    // Evento emitido quando um token é aceito ou removido como método de pagamento
    event TokenStatusUpdated(address indexed tokenAddress, uint256 indexed tokenId, bool accepted);
    
    mapping(uint256 => bool) public acceptedTokens;
    // Mapeamento de ID para endereço do token
    mapping(uint256 => address) public tokenAddresses;
    // Indica se o token suporta EIP-2612 Permit
    mapping(uint256 => bool) public tokenSupportsPermit;

    // Estrutura para dados do pagamento para evitar erro "Stack too deep"
    struct PaymentData {
        uint256 orderId;
        address buyer;
        uint256 amount;
        uint256 deadline;
        uint256 erc20Id;
    }

    // Estrutura para dados do permit para evitar erro "Stack too deep"
    struct PermitData {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 deadline;
    }

    /**
     * @dev Construtor do contrato Payment
     */
    constructor(
    ) Ownable(msg.sender) {
        treasury = msg.sender;
    }

    /**
     * @dev Define o endereço do tesouro que receberá os fundos
     * @param _treasury Novo endereço do tesouro
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Endereco invalido");
        treasury = _treasury;
    }

    /**
     * @dev Adiciona ou remove um token como método de pagamento aceito
     * @param tokenId ID do token
     * @param tokenAddress Endereço do contrato do token ERC20
     * @param supportsPermit Se o token suporta a interface EIP-2612 Permit
     * @param accepted Status de aceitação do token
     */
    function setAcceptedToken(uint256 tokenId, address tokenAddress, bool supportsPermit, bool accepted) external onlyOwner {
        require(tokenId > 0, "TokenId invalido");
        require(tokenAddress != address(0), "Endereco de token invalido");
        
        acceptedTokens[tokenId] = accepted;
        tokenAddresses[tokenId] = tokenAddress;
        tokenSupportsPermit[tokenId] = supportsPermit;
        
        emit TokenStatusUpdated(tokenAddress, tokenId, accepted);
    }

    /**
     * @dev Verifica a assinatura da ordem
     * @param paymentData Dados do pagamento
     * @param orderSignature Assinatura do comprador
     * @return true se a assinatura for válida
     */
    function _verifyOrderSignature(
        PaymentData memory paymentData, 
        bytes calldata orderSignature
    ) internal view returns (bool) {
        bytes32 orderMessage = keccak256(
            abi.encodePacked(
                paymentData.orderId,
                paymentData.buyer,
                paymentData.amount,
                address(this),
                block.chainid
            )
        );
        
        bytes32 orderEthSigned = MessageHashUtils.toEthSignedMessageHash(orderMessage);
        address recoveredSigner = ECDSA.recover(orderEthSigned, orderSignature);
        return recoveredSigner == paymentData.buyer;
    }

    /**
     * @dev Transfere tokens usando permit e emite evento
     * @param paymentData Dados do pagamento
     * @param permitData Dados da permissão (assinatura EIP-2612)
     */
    function _transferWithPermit(
        PaymentData memory paymentData,
        PermitData memory permitData
    ) internal {
        // Obter endereço do token
        address tokenAddress = tokenAddresses[paymentData.erc20Id];
        require(tokenAddress != address(0), "Token nao configurado");
        
        // Executar permit
        IERC20Permit permitToken = IERC20Permit(tokenAddress);
        permitToken.permit(
            paymentData.buyer, 
            address(this), 
            paymentData.amount, 
            permitData.deadline, 
            permitData.v, 
            permitData.r, 
            permitData.s
        );
        
        // Transferir tokens
        IERC20 token = IERC20(tokenAddress);
        bool success = token.transferFrom(paymentData.buyer, treasury, paymentData.amount);
        require(success, "Falha na transferencia de token");
        
        // Emitir evento
        emit PaymentProcessed(
            paymentData.orderId, 
            paymentData.buyer, 
            paymentData.amount
        );
    }

    /**
     * @dev Processa um pagamento utilizando o método permit (EIP-2612)
     * @param payment Estrutura contendo dados do pagamento
     * @param orderSignature Assinatura do comprador
     * @param permit Estrutura contendo dados do permit
     * @notice Este método permite aprovar e transferir em uma única transação para tokens
     * que implementam a interface EIP-2612 Permit.
     */
    function orderPaymentWithPermit(
        PaymentData calldata payment,
        bytes calldata orderSignature,
        PermitData calldata permit
    ) external {
        require(block.timestamp <= payment.deadline, "transacao expirada");
        require(block.timestamp <= permit.deadline, "permit expirado");
        require(payment.erc20Id > 0, "TokenId invalido");
        require(acceptedTokens[payment.erc20Id], "Token nao aceito para pagamento");
        require(tokenSupportsPermit[payment.erc20Id], "Token nao suporta permit");

        // Verificar assinatura da ordem
        require(_verifyOrderSignature(payment, orderSignature), "Assinatura de ordem invalida");
        
        // Executar transferência com permit
        _transferWithPermit(payment, permit);
    }

    /**
     * @dev Permite que o proprietário do contrato retire tokens ERC20 enviados acidentalmente
     * @param tokenAddress Endereço do contrato do token
     * @param amount Quantidade a ser retirada
     */
    function rescueTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        bool success = token.transfer(treasury, amount);
        require(success, "Falha no resgate de tokens");
    }
}
