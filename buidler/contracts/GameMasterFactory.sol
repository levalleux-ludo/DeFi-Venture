//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameMaster } from './GameMaster.sol';

import "./IGameMasterFactory.sol";

contract GameMasterFactory is IGameMasterFactory {
    function create(uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances) external override returns (address) {
        GameMaster gameMaster = new GameMaster(_nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances);
        gameMaster.transferOwnership(msg.sender);
        return address(gameMaster);
    }

}

