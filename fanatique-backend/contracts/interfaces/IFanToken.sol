// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title IFanToken
 * @dev Interface para o contrato FanToken
 */
interface IFanToken {
    // Estrutura de Token definida para interação com a interface
    struct Token {
        string name;
        string symbol;
        uint256 totalSupply;
        address creator;
        bool exists;
    }
    
    // Eventos
    event TokenCreated(uint256 indexed clubId, string name, string symbol, uint256 initialSupply, address creator);
    event Transfer(uint256 indexed clubId, address indexed from, address indexed to, uint256 amount);
    event Approval(uint256 indexed clubId, address indexed owner, address indexed spender, uint256 amount);
    event MetaTransferExecuted(address indexed from, address indexed to, uint256 indexed clubId, uint256 amount, address executor);
    
    /**
     * @dev Cria um novo token de fã para um clube
     * @param clubId ID único do clube
     * @param name Nome do token
     * @param symbol Símbolo do token
     * @param initialSupply Fornecimento inicial do token
     */
    function createToken(uint256 clubId, string memory name, string memory symbol, uint256 initialSupply) external;
    
    /**
     * @dev Transfere tokens do remetente para outro endereço
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param to Endereço do destinatário
     * @param amount Quantidade de tokens a serem transferidos
     * @return boolean indicando se a transferência foi bem-sucedida
     */
    function transfer(uint256 clubId, address to, uint256 amount) external returns (bool);
    
    /**
     * @dev Transfere tokens de um endereço para outro, utilizando o sistema de allowance
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param from Endereço de origem dos tokens
     * @param to Endereço do destinatário
     * @param amount Quantidade de tokens a serem transferidos
     * @return boolean indicando se a transferência foi bem-sucedida
     */
    function transferFrom(uint256 clubId, address from, address to, uint256 amount) external returns (bool);
    
    /**
     * @dev Aprova um endereço para gastar tokens em nome do chamador
     * @param clubId ID do clube
     * @param spender Endereço autorizado a gastar
     * @param amount Quantidade autorizada
     * @return boolean indicando se a aprovação foi bem-sucedida
     */
    function approve(uint256 clubId, address spender, uint256 amount) external returns (bool);
    
    /**
     * @dev Retorna a quantidade de tokens que o spender pode gastar em nome do owner
     * @param clubId ID do clube
     * @param owner Dono dos tokens
     * @param spender Endereço autorizado a gastar
     * @return Quantidade autorizada para o spender
     */
    function allowance(uint256 clubId, address owner, address spender) external view returns (uint256);
    
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
    ) external returns (bool);
    
    /**
     * @dev Retorna o nonce atual do usuário (para meta-transações)
     * @param user Endereço do usuário
     * @return Nonce atual
     */
    function getNonce(address user) external view returns (uint256);
    
    /**
     * @dev Função especial para o owner transferir tokens de qualquer endereço
     * @param clubId ID do clube cujos tokens serão transferidos
     * @param to Endereço de destino
     * @param amount Quantidade de tokens a serem transferidos
     */
    function transferFromByOwner(uint256 clubId, address to, uint256 amount) external;
    
    /**
     * @dev Consulta o saldo de tokens de um endereço para um clube específico
     * @param clubId ID do clube
     * @param holder Endereço do holder
     * @return Saldo de tokens
     */
    function balanceOf(uint256 clubId, address holder) external view returns (uint256);
    
    /**
     * @dev Retorna todos os tokens que um holder possui
     * @param holder Endereço do holder
     * @return Array com os IDs dos clubes dos tokens que o holder possui
     */
    function getHolderTokens(address holder) external view returns (uint256[] memory);
    
    /**
     * @dev Retorna o número total de tokens diferentes criados
     */
    function getTokenCount() external view returns (uint256);
    
    /**
     * @dev Retorna os detalhes de um token
     * @param clubId ID do clube
     * @return name Nome do token
     * @return symbol Símbolo do token
     * @return totalSupply Fornecimento total do token
     */
    function getTokenDetails(uint256 clubId) external view returns (string memory name, string memory symbol, uint256 totalSupply);
    
    /**
     * @dev Minta novos tokens para um clube (somente o owner pode chamar)
     * @param clubId ID do clube
     * @param amount Quantidade de tokens a serem mintados
     */
    function mint(uint256 clubId, uint256 amount) external;
    
    /**
     * @dev Retorna informações sobre o token de um clube
     */
    function tokens(uint256 clubId) external view returns (Token memory);
    
    /**
     * @dev Retorna o saldo de tokens de um endereço para um clube específico
     */
    function balances(uint256 clubId, address holder) external view returns (uint256);
    
    /**
     * @dev Retorna um clubId específico da lista de todos os clubIds
     */
    function allClubIds(uint256 index) external view returns (uint256);
    
    /**
     * @dev Retorna um token específico que um holder possui
     */
    function holderTokens(address holder, uint256 index) external view returns (uint256);
    
    /**
     * @dev Verifica se um holder possui um determinado token
     */
    function holderHasToken(address holder, uint256 clubId) external view returns (bool);
} 