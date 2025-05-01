// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Payment.sol";

/// @title Fanatique - Contrato principal que integra o gerenciamento de clubes e torcedores.
/// @notice Unifica as funcionalidades de ClubManager e FanManager para fornecer uma solução completa.
contract Fanatique is Payment {
    constructor(
        address _treasury
    ) {
        treasury = _treasury;
    }
}
