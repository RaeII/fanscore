// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Club.sol";
import "./Fan.sol";

/// @title FanScore - Contrato principal que integra o gerenciamento de clubes e torcedores.
/// @notice Unifica as funcionalidades de ClubManager e FanManager para fornecer uma solução completa.
contract FanScore is ClubManager, Fan {

     /// @notice Registra um torcedor a um clube existente.
     /// @param _clubId Identificador do clube ao qual o torcedor será vinculado.
     function registerFanToClub(uint256 _clubId) public {
          // Verifica se o clube existe.
          require(_clubId > 0 && _clubId <= clubCount, "Clube inexistente");
          registerFan(_clubId);
     }

    /// @notice Adiciona pontos ao torcedor e atualiza a pontuação do clube correspondente.
    /// @param _fanAddress Endereço do torcedor.
    /// @param _points Quantidade de pontos a adicionar.
     function addFanPoints(address _fanAddress, uint256 _points) public {
          // Recupera os dados do torcedor para identificar o clube associado.
          FanData memory fanData = getFan(_fanAddress);
          // Adiciona pontos ao torcedor.
          addPoints(_fanAddress, _points);
          // Atualiza a pontuação total do clube vinculado ao torcedor.
          addPointsToClub(fanData.clubId, _points);
     }
}
