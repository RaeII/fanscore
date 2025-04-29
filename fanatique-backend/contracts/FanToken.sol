// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract FanToken is Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    // Constants para o meta-transações (EIP-712)
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant TRANSFER_TYPEHASH = keccak256("Transfer(uint256 clubId,address from,address to,uint256 amount,uint256 nonce,uint256 deadline)");
    
    // Nome e versão para assinatura EIP-712
    string public constant DOMAIN_NAME = "Fanatique Token";
    string public constant DOMAIN_VERSION = "1";
    
    // Mapeamento para armazenar nonces de cada usuário para evitar replay attacks
    mapping(address => uint256) public nonces;

    struct Token {
        string name;
        string symbol;
        uint256 totalSupply;
        address creator;
        bool exists;
    }

    // Mapeamento de clubId para informações do token
    mapping(uint256 => Token) public tokens;
    
    // Mapeamento duplo para controlar saldos: clubId => address => balance
    mapping(uint256 => mapping(address => uint256)) public balances;
    
    // Mapeamento triplo para controlar allowances: clubId => owner => spender => amount
    mapping(uint256 => mapping(address => mapping(address => uint256))) public allowances;
    
    // Array para rastrear todos os clubIds criados
    uint256[] public allClubIds;
    
    // Mapeamento para rastrear quais tokens um endereço possui
    mapping(address => uint256[]) public holderTokens;
    
    // Mapeamento para verificar se um holder possui um determinado token
    mapping(address => mapping(uint256 => bool)) public holderHasToken;
    
    // Eventos
    event TokenCreated(uint256 indexed clubId, string name, string symbol, uint256 initialSupply, address creator);
    event Transfer(uint256 indexed clubId, address indexed from, address indexed to, uint256 amount);
    event Approval(uint256 indexed clubId, address indexed owner, address indexed spender, uint256 amount);
    event MetaTransferExecuted(address indexed from, address indexed to, uint256 indexed clubId, uint256 amount, address executor);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Cria um novo token de fã para um clube
     * @param clubId ID único do clube
     * @param name Nome do token
     * @param symbol Símbolo do token
     * @param initialSupply Fornecimento inicial do token
     */
    function createToken(uint256 clubId, string memory name, string memory symbol, uint256 initialSupply) external onlyOwner {
        require(!tokens[clubId].exists, "Token para este clube ja existe");
        
        tokens[clubId] = Token({
            name: name,
            symbol: symbol,
            totalSupply: initialSupply,
            creator: msg.sender,
            exists: true
        });
        
        // Atribui o saldo inicial ao criador (carteira dona)
        balances[clubId][owner()] = initialSupply;
        
        // Adiciona o clubId ao array de clubes
        allClubIds.push(clubId);
        
        // Registra que o dono possui este token
        if (!holderHasToken[owner()][clubId]) {
            holderTokens[owner()].push(clubId);
            holderHasToken[owner()][clubId] = true;
        }
        
        emit TokenCreated(clubId, name, symbol, initialSupply, msg.sender);
    }
    
    /**
     * @dev Transfere tokens do remetente para outro endereço
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param to Endereço do destinatário
     * @param amount Quantidade de tokens a serem transferidos
     * @return boolean indicando se a transferência foi bem-sucedida
     */
    function transfer(uint256 clubId, address to, uint256 amount) external returns (bool) {
        require(tokens[clubId].exists, "Token nao existe");
        require(to != address(0), "Transferencia para o endereco zero nao permitida");
        require(balances[clubId][msg.sender] >= amount, "Saldo insuficiente");
        
        balances[clubId][msg.sender] -= amount;
        balances[clubId][to] += amount;
        
        // Registra que o destinatário possui este token, se ainda não estiver registrado
        if (!holderHasToken[to][clubId]) {
            holderTokens[to].push(clubId);
            holderHasToken[to][clubId] = true;
        }
        
        emit Transfer(clubId, msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Transfere tokens de um endereço para outro, utilizando o sistema de allowance
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param from Endereço de origem dos tokens
     * @param to Endereço do destinatário
     * @param amount Quantidade de tokens a serem transferidos
     * @return boolean indicando se a transferência foi bem-sucedida
     */
    function transferFrom(uint256 clubId, address from, address to, uint256 amount) external returns (bool) {
        require(tokens[clubId].exists, "Token nao existe");
        require(to != address(0), "Transferencia para o endereco zero nao permitida");
        
        address spender = msg.sender;
        _spendAllowance(clubId, from, spender, amount);
        
        require(balances[clubId][from] >= amount, "Saldo insuficiente");
        
        balances[clubId][from] -= amount;
        balances[clubId][to] += amount;
        
        // Registra que o destinatário possui este token, se ainda não estiver registrado
        if (!holderHasToken[to][clubId]) {
            holderTokens[to].push(clubId);
            holderHasToken[to][clubId] = true;
        }
        
        emit Transfer(clubId, from, to, amount);
        return true;
    }
    
    /**
     * @dev Função interna para gastar o allowance
     * @param clubId ID do clube
     * @param owner Dono dos tokens
     * @param spender Endereço autorizado a gastar
     * @param amount Quantidade a ser gasta
     */
    function _spendAllowance(uint256 clubId, address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowances[clubId][owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "Allowance insuficiente");
            allowances[clubId][owner][spender] = currentAllowance - amount;
        }
    }
    
    /**
     * @dev Aprova um endereço para gastar tokens em nome do chamador
     * @param clubId ID do clube
     * @param spender Endereço autorizado a gastar
     * @param amount Quantidade autorizada
     * @return boolean indicando se a aprovação foi bem-sucedida
     */
    function approve(uint256 clubId, address spender, uint256 amount) external returns (bool) {
        require(tokens[clubId].exists, "Token nao existe");
        require(spender != address(0), "Aprovacao para o endereco zero nao permitida");
        
        allowances[clubId][msg.sender][spender] = amount;
        emit Approval(clubId, msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Retorna a quantidade de tokens que o spender pode gastar em nome do owner
     * @param clubId ID do clube
     * @param owner Dono dos tokens
     * @param spender Endereço autorizado a gastar
     * @return Quantidade autorizada para o spender
     */
    function allowance(uint256 clubId, address owner, address spender) external view returns (uint256) {
        require(tokens[clubId].exists, "Token nao existe");
        return allowances[clubId][owner][spender];
    }
    
    /**
     * @dev Função especial para o owner transferir tokens de qualquer endereço
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param to Endereço de destino
     * @param amount Quantidade de tokens a serem transferidos
     */
    function transferFromByOwner(uint256 clubId, address to, uint256 amount) external onlyOwner {
        require(tokens[clubId].exists, "Token nao existe");
        require(to != address(0), "Transferencia para o endereco zero nao permitida");
        require(balances[clubId][msg.sender] >= amount, "Saldo insuficiente");
        
        balances[clubId][msg.sender] -= amount;
        balances[clubId][to] += amount;
        
        // Registra que o destinatário possui este token, se ainda não estiver registrado
        if (!holderHasToken[to][clubId]) {
            holderTokens[to].push(clubId);
            holderHasToken[to][clubId] = true;
        }
        
        emit Transfer(clubId, msg.sender, to, amount);
    }
    
    /**
     * @dev Consulta o saldo de tokens de um endereço para um clube específico
     * @param clubId ID do clube
     * @param holder Endereço do holder
     * @return Saldo de tokens
     */
    function balanceOf(uint256 clubId, address holder) external view returns (uint256) {
        require(tokens[clubId].exists, "Token nao existe");
        return balances[clubId][holder];
    }
    
    /**
     * @dev Retorna todos os tokens que um holder possui
     * @param holder Endereço do holder
     * @return Array com os IDs dos clubes dos tokens que o holder possui
     */
    function getHolderTokens(address holder) external view returns (uint256[] memory) {
        return holderTokens[holder];
    }
    
    /**
     * @dev Retorna o número total de tokens diferentes criados
     */
    function getTokenCount() external view returns (uint256) {
        return allClubIds.length;
    }
    
    /**
     * @dev Retorna os detalhes de um token
     * @param clubId ID do clube
     * @return name Nome do token
     * @return symbol Símbolo do token
     * @return totalSupply Fornecimento total do token
     */
    function getTokenDetails(uint256 clubId) external view returns (string memory name, string memory symbol, uint256 totalSupply) {
        require(tokens[clubId].exists, "Token nao existe");
        Token memory token = tokens[clubId];
        return (token.name, token.symbol, token.totalSupply);
    }
    
    /**
     * @dev Minta novos tokens para um clube (somente o owner pode chamar)
     * @param clubId ID do clube
     * @param amount Quantidade de tokens a serem mintados
     */
    function mint(uint256 clubId, uint256 amount) external onlyOwner {
        require(tokens[clubId].exists, "Token nao existe");
        
        tokens[clubId].totalSupply += amount;
        balances[clubId][owner()] += amount;
    }
    
    /**
     * @dev Retorna o nonce atual do usuário (para meta-transações)
     * @param user Endereço do usuário
     * @return Nonce atual
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
    
    /**
     * @dev Gera o hash de domínio para uso nas assinaturas EIP-712
     * @return Hash do domínio
     */
    function _getDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(DOMAIN_NAME)),
                keccak256(bytes(DOMAIN_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * @dev Verifica a assinatura de meta-transação
     * @param clubId ID do clube
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade a ser transferida
     * @param deadline Prazo de expiração da assinatura
     * @param currentNonce Nonce atual do usuário
     * @param v Componente v da assinatura
     * @param r Componente r da assinatura
     * @param s Componente s da assinatura
     * @return Verdadeiro se a assinatura for válida
     */
    function _verifyMetaSignature(
        uint256 clubId,
        address from,
        address to,
        uint256 amount,
        uint256 deadline,
        uint256 currentNonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        bytes32 domainSeparator = _getDomainSeparator();
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_TYPEHASH,
                clubId,
                from,
                to,
                amount,
                currentNonce,
                deadline
            )
        );
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                structHash
            )
        );
        
        address signer = ecrecover(digest, v, r, s);
        console.log("\n\nsigner:", signer);
        console.log("from:", from);
        return signer == from;
    }
    
    /**
     * @dev Executa uma transferência baseada em uma assinatura (meta-transação)
     * @param clubId ID do clube
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade a ser transferida
     * @param deadline Prazo de expiração da assinatura
     * @param v Componente v da assinatura
     * @param r Componente r da assinatura
     * @param s Componente s da assinatura
     * @return Boolean indicando se a transferência foi bem-sucedida
     */
    function metaTransfer(
        uint256 clubId,
        address from,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool) {
        require(block.timestamp <= deadline, "Meta-transferencia expirada");
        require(tokens[clubId].exists, "Token nao existe");
        require(to != address(0), "Transferencia para o endereco zero nao permitida");
        
        // Obter o nonce atual
        uint256 currentNonce = nonces[from];
        
        // Verificar a assinatura
        require(_verifyMetaSignature(clubId, from, to, amount, deadline, currentNonce, v, r, s), "Assinatura invalida");
        
        // Verificar se o remetente tem saldo suficiente
        require(balances[clubId][from] >= amount, "Saldo insuficiente");
        
        // Incrementar o nonce após a verificação
        nonces[from] = currentNonce + 1;
        
        // Executar a transferência
        _executeTransfer(clubId, from, to, amount);
        
        emit MetaTransferExecuted(from, to, clubId, amount, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Executa a transferência interna de tokens
     * @param clubId ID do clube
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade a ser transferida
     */
    function _executeTransfer(uint256 clubId, address from, address to, uint256 amount) internal {
        // Executa a transferência
        balances[clubId][from] -= amount;
        balances[clubId][to] += amount;
        
        // Registra que o destinatário possui este token, se ainda não estiver registrado
        if (!holderHasToken[to][clubId]) {
            holderTokens[to].push(clubId);
            holderHasToken[to][clubId] = true;
        }
        
        emit Transfer(clubId, from, to, amount);
    }
}

