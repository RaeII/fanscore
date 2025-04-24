// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract FanToken is Ownable {
    using Strings for uint256;

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
    
    // Array para rastrear todos os clubIds criados
    uint256[] public allClubIds;
    
    // Mapeamento para rastrear quais tokens um endereço possui
    mapping(address => uint256[]) public holderTokens;
    
    // Mapeamento para verificar se um holder possui um determinado token
    mapping(address => mapping(uint256 => bool)) public holderHasToken;
    
    // Eventos
    event TokenCreated(uint256 indexed clubId, string name, string symbol, uint256 initialSupply, address creator);
    event Transfer(uint256 indexed clubId, address indexed from, address indexed to, uint256 amount);
    
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
     * @dev Transfere tokens de um endereço para outro
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param to Endereço do destinatário
     * @param amount Quantidade de tokens a serem transferidos
     */
    function transferFrom(uint256 clubId, address to, uint256 amount) external {
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
     * @dev Função especial para o owner transferir tokens de qualquer endereço
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param from Endereço de origem
     * @param to Endereço de destino
     * @param amount Quantidade de tokens a serem transferidos
     */
    function transferFromByOwner(uint256 clubId, address from, address to, uint256 amount) external onlyOwner {
        require(tokens[clubId].exists, "Token nao existe");
        require(to != address(0), "Transferencia para o endereco zero nao permitida");
        require(balances[clubId][from] >= amount, "Saldo insuficiente");
        
        balances[clubId][from] -= amount;
        balances[clubId][to] += amount;
        
        // Registra que o destinatário possui este token, se ainda não estiver registrado
        if (!holderHasToken[to][clubId]) {
            holderTokens[to].push(clubId);
            holderHasToken[to][clubId] = true;
        }
        
        emit Transfer(clubId, from, to, amount);
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
}

