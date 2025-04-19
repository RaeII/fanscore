// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ClubManager - Gerencia a criação e informações de clubes de futebol.
/// @notice Permite criar clubes, obter informações e atualizar pontuações dos clubes.
contract ClubManager {
    uint256 public clubCount;

    /// @notice Estrutura que armazena os dados de um clube.
    struct Club {
        uint256 id;
        string name;
        uint256 totalPoints;
        address creator;
    }

    mapping(uint256 => Club) public clubs;
    uint256[] public clubIds;

    /// @notice Evento disparado quando um clube é criado.
    event ClubCreated(uint256 indexed clubId, string name, address indexed creator);

    /// @notice Cria um clube de futebol com o nome especificado.
    /// @param _name Nome do clube.
    /// @return O identificador do clube criado.
    function createClub(string memory _name) public returns (uint256) {
         clubCount++;
         clubs[clubCount] = Club(clubCount, _name, 0, msg.sender);
         clubIds.push(clubCount);
         emit ClubCreated(clubCount, _name, msg.sender);
         return clubCount;
    }

    /// @notice Retorna as informações de um clube a partir do seu id.
    /// @param _clubId Identificador do clube.
    /// @return Estrutura com as informações do clube.
    function getClub(uint256 _clubId) public view returns (Club memory) {
         require(_clubId > 0 && _clubId <= clubCount, "Clube inexistente");
         return clubs[_clubId];
    }

    /// @notice Adiciona pontos ao total de pontos do clube.
    /// @param _clubId Identificador do clube.
    /// @param _points Quantidade de pontos a adicionar.
    function addPointsToClub(uint256 _clubId, uint256 _points) internal {
         require(_clubId > 0 && _clubId <= clubCount, "Clube inexistente");
         clubs[_clubId].totalPoints += _points;
    }
    
    /// @notice Retorna um ranking dos clubes ordenado pelo total de pontos em ordem decrescente.
    /// @dev Para demonstração com poucos elementos, utiliza bubble sort. Em produção considere cálculos off-chain.
    /// @return Array com os ids dos clubes ordenados.
    function getClubRanking() public view returns (uint256[] memory) {
         uint256[] memory ranking = clubIds;
         uint256 n = ranking.length;
         for (uint256 i = 0; i < n; i++) {
             for (uint256 j = 0; j < n - i - 1; j++) {
                 if (clubs[ranking[j]].totalPoints < clubs[ranking[j+1]].totalPoints) {
                     uint256 temp = ranking[j];
                     ranking[j] = ranking[j+1];
                     ranking[j+1] = temp;
                 }
             }
         }
         return ranking;
    }
}
