// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFanToken.sol";
import "hardhat/console.sol";

/**
 * @title PaymentProcessor
 * @dev Processa pagamentos utilizando FanToken autorizado via assinaturas off-chain
 *      Projetado para chains compatíveis com EVM (ex: Chiliz)
 *      Suporta pagamentos com qualquer token de clube disponível no contrato FanToken
 */
contract Payment is Ownable {
    using ECDSA for bytes32;

    // Interface do token de fã usado para pagamentos
    IFanToken public fanToken;
    // Endereço autorizado a assinar ordens de pagamento (carteira backend)
    address public signer;
    // Endereço recebedor dos fundos
    address public treasury;
    // Rastreia nonces usados para prevenir replay
    mapping(uint256 => bool) public usedNonces;
    // Mapping para armazenar quais clubIds são aceitos como pagamento
    mapping(uint256 => bool) public acceptedTokens;
    // Array de todos os clubIds aceitos para pagamento
    uint256[] public allAcceptedClubIds;

    // Emitido quando um pagamento é processado
    event PaymentProcessed(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 clubId);
    // Emitido quando um token é aceito ou removido como método de pagamento
    event TokenAcceptanceChanged(uint256 indexed clubId, bool accepted);
    // Emitido quando um pagamento gasless é processado
    event GaslessPaymentProcessed(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 clubId, address relayer);

    /**
     * @dev Inicializa com endereços do token, do assinante e da tesouraria
     * @param _fanToken Endereço do contrato FanToken
     */
    constructor(
        address _fanToken
      
    ) Ownable(msg.sender) {
        require(_fanToken != address(0), "FanToken address zero");

        fanToken = IFanToken(_fanToken);
        signer = msg.sender;
        treasury = msg.sender;
    }

    /** Funções admin para atualizar configurações **/

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Signer address zero");
        signer = _signer;
    }

    function setFanToken(address _fanToken) external onlyOwner {
        require(_fanToken != address(0), "Token address zero");
        fanToken = IFanToken(_fanToken);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury address zero");
        treasury = _treasury;
    }
    
    /**
     * @dev Adiciona ou remove um token de clube como método de pagamento aceito
     * @param clubId ID do clube cujo token será aceito ou não
     * @param accepted Se true, o token é aceito como pagamento; se false, não é aceito
     */
    function setTokenAcceptance(uint256 clubId, bool accepted) external onlyOwner {
        // Verifica se o token existe no contrato FanToken
        (string memory name, , ) = fanToken.getTokenDetails(clubId);
        require(bytes(name).length > 0, "Token nao existe");
        
        // Se já está no estado desejado, não faz nada
        if (acceptedTokens[clubId] == accepted) return;
        
        acceptedTokens[clubId] = accepted;
        
        // Se está adicionando, adiciona ao array de tokens aceitos
        if (accepted) {
            allAcceptedClubIds.push(clubId);
        } else {
            // Se está removendo, remove do array
            for (uint256 i = 0; i < allAcceptedClubIds.length; i++) {
                if (allAcceptedClubIds[i] == clubId) {
                    // Move o último elemento para a posição atual e reduz o tamanho do array
                    allAcceptedClubIds[i] = allAcceptedClubIds[allAcceptedClubIds.length - 1];
                    allAcceptedClubIds.pop();
                    break;
                }
            }
        }
        
        emit TokenAcceptanceChanged(clubId, accepted);
    }
    
    /**
     * @dev Retorna todos os IDs de clube aceitos como método de pagamento
     * @return Array com todos os clubIds aceitos
     */
    function getAllAcceptedTokens() external view returns (uint256[] memory) {
        return allAcceptedClubIds;
    }

    /**
     * @dev Processa um pagamento autorizado por uma assinatura off-chain
     * @param orderId ID único da ordem de compra
     * @param clubId ID do clube cujo token será usado para pagamento
     * @param amount Quantidade de tokens a serem transferidos
     * @param signature Assinatura do `signer` sobre os dados
     */
    function orderPayment(
        uint256 orderId,
        uint256 clubId,
        uint256 amount,
        bytes calldata signature
    ) external {
        require(!usedNonces[orderId], "Purchase already processed");
        require(acceptedTokens[clubId], "Token nao aceito para pagamento");

        console.log("\nCONTRACT PAYMENT\n");
        console.log("OrderId:", orderId);
        console.log("Buyer:", msg.sender);
        console.log("ClubId:", clubId);
        console.log("Amount:", amount);
        console.log("Contract Address:", address(this));
        console.log("ChainId:", block.chainid);
        console.log("Signer Address:", signer);
        console.log("\n========================================\n");

        // Compõe a mensagem assinada: orderId, comprador, clubId, amount, contrato e chain
        bytes32 message = keccak256(
            abi.encodePacked(
                orderId,
                msg.sender,
                clubId,
                amount,
                address(this),
                block.chainid
            )
        );
        
        // Converte para Ethereum signed message
        bytes32 ethSigned = MessageHashUtils.toEthSignedMessageHash(message);

        // Recupera e verifica
        address recovered = ECDSA.recover(ethSigned, signature);
        require(recovered == signer, "Invalid signature");

        // Marca nonce como usado
        usedNonces[orderId] = true;

        // Transfere tokens do comprador para a tesouraria
        // O usuário precisa aprovar primeiro chamando a função transferFrom do IFanToken
        fanToken.transferFrom(clubId, msg.sender, treasury, amount);

        emit PaymentProcessed(orderId, msg.sender, amount, clubId);
    }

    /**
     * @dev Processa um pagamento usando meta-transação (sem gas para o usuário)
     * @param orderId ID único da ordem de compra
     * @param buyer Endereço do comprador
     * @param clubId ID do clube cujo token será usado
     * @param amount Quantidade de tokens
     * @param deadline Prazo limite para a meta-transação
     * @param orderSignature Assinatura do signer sobre a ordem
     * @param v Componente v da assinatura do usuário para a meta-transação
     * @param r Componente r da assinatura do usuário para a meta-transação
     * @param s Componente s da assinatura do usuário para a meta-transação
     */
    function gaslessOrderPayment(
        uint256 orderId,
        address buyer,
        uint256 clubId,
        uint256 amount,
        uint256 deadline,
        bytes calldata orderSignature,
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external {
        require(!usedNonces[orderId], "Purchase already processed");
        require(acceptedTokens[clubId], "Token nao aceito para pagamento");
        require(block.timestamp <= deadline, "Meta-transacao expirada");

        console.log("\nCONTRACT GASLESS PAYMENT\n");
        console.log("OrderId:", orderId);
        console.log("Buyer:", buyer);
        console.log("ClubId:", clubId);
        console.log("Amount:", amount);
        console.log("Relayer:", msg.sender);
        console.log("Deadline:", deadline);
        console.log("\n========================================\n");

        // 1. Verificar assinatura da ordem (pelo backend)
        bytes32 orderMessage = keccak256(
            abi.encodePacked(
                orderId,
                buyer,
                clubId,
                amount,
                address(this),
                block.chainid
            )
        );
        
        bytes32 orderEthSigned = MessageHashUtils.toEthSignedMessageHash(orderMessage);
        address recoveredSigner = ECDSA.recover(orderEthSigned, orderSignature);
        require(recoveredSigner == signer, "Invalid order signature");

        // 2. Executar a meta-transação (o usuário não paga gas)
        // O usuário precisa ter assinado uma mensagem permitindo esta transferência
        fanToken.metaTransfer(
            clubId,
            buyer,
            treasury,
            amount,
            deadline,
            v,
            r,
            s
        );

        // Marca nonce como usado
        usedNonces[orderId] = true;

        emit GaslessPaymentProcessed(orderId, buyer, amount, clubId, msg.sender);
    }

    /**
     * @dev Permite ao usuário fazer um pagamento direto sem assinatura
     * @param clubId ID do clube cujo token será usado para pagamento
     * @param amount Quantidade de tokens a serem transferidos
     */
    function directPurchase(uint256 clubId, uint256 amount) external {
        require(acceptedTokens[clubId], "Token nao aceito para pagamento");
        
        // O usuário deve ter aprovado a transferência anteriormente
        fanToken.transferFrom(clubId, msg.sender, treasury, amount);
        
        emit PaymentProcessed(0, msg.sender, amount, clubId);
    }
    
    /**
     * @dev Retorna o saldo de tokens de um endereço para um clube específico
     * @param clubId ID do clube
     * @param holder Endereço do holder
     * @return Saldo de tokens
     */
    function balanceOf(uint256 clubId, address holder) external view returns (uint256) {
        return fanToken.balanceOf(clubId, holder);
    }
    
    /**
     * @dev Verifica se um token de clube é aceito como método de pagamento
     * @param clubId ID do clube
     * @return true se o token é aceito, false caso contrário
     */
    function isTokenAccepted(uint256 clubId) external view returns (bool) {
        return acceptedTokens[clubId];
    }
}
