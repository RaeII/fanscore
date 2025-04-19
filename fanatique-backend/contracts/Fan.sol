// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title FanManager - Gerencia o cadastro e pontuação dos torcedores.
/// @notice Permite o registro de torcedores, adição de pontos e consulta de informações.
contract Fan {
    /// @notice Estrutura que armazena os dados de um torcedor.
    struct FanData {
        address fanAddress;
        uint256 clubId;
        uint256 points;
    }

    mapping(address => FanData) public fans;
    address[] public fanAddresses;

    /// @notice Evento disparado quando um torcedor é registrado.
    event FanRegistered(address indexed fanAddress, uint256 clubId);

    /// @notice Evento disparado quando os pontos do torcedor são atualizados.
    event FanPointsUpdated(address indexed fanAddress, uint256 newPoints);

    /// @notice Registra um torcedor associando-o a um clube.
    /// @param _clubId Identificador do clube ao qual o torcedor será vinculado.
    function registerFan(uint256 _clubId) public {
         require(fans[msg.sender].fanAddress == address(0), "Torcedor ja registrado");
         fans[msg.sender] = FanData(msg.sender, _clubId, 0);
         fanAddresses.push(msg.sender);
         emit FanRegistered(msg.sender, _clubId);
    }

    /// @notice Adiciona pontos ao torcedor.
    /// @dev Função interna chamada para atualizar a pontuação do torcedor.
    /// @param _fanAddress Endereço do torcedor.
    /// @param _points Quantidade de pontos a adicionar.
    function addPoints(address _fanAddress, uint256 _points) internal {
         require(fans[_fanAddress].fanAddress != address(0), "Torcedor nao registrado");
         fans[_fanAddress].points += _points;
         emit FanPointsUpdated(_fanAddress, fans[_fanAddress].points);
    }

    /// @notice Retorna as informações de um torcedor a partir do seu endereço.
    /// @param _fanAddress Endereço do torcedor.
    /// @return Estrutura com as informações do torcedor.
    function getFan(address _fanAddress) public view returns (FanData memory) {
         require(fans[_fanAddress].fanAddress != address(0), "Torcedor nao registrado");
         return fans[_fanAddress];
    }

    /// @notice Retorna um ranking dos torcedores ordenado pelo total de pontos em ordem decrescente.
    /// @dev Para demonstração com poucos elementos, utiliza bubble sort. Em produção considere cálculos off-chain.
    /// @return Array com os endereços dos torcedores ordenados.
    function getFanRanking() public view returns (address[] memory) {
         address[] memory ranking = fanAddresses;
         uint256 n = ranking.length;
         for (uint256 i = 0; i < n; i++) {
             for (uint256 j = 0; j < n - i - 1; j++) {
                 if (fans[ranking[j]].points < fans[ranking[j+1]].points) {
                     address temp = ranking[j];
                     ranking[j] = ranking[j+1];
                     ranking[j+1] = temp;
                 }
             }
         }
         return ranking;
    }
}
