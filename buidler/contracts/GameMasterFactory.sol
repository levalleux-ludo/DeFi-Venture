//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;


import { GameMaster } from './GameMaster.sol';
import { IGameMasterFactory } from  "./IGameMasterFactory.sol";

import { IGameContractsFactory } from './IGameContractsFactory.sol';

contract GameMasterFactory is IGameMasterFactory {
    function create(uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances, address _contractsFactory) external override returns (address) {
        IGameContractsFactory contractsFactory = IGameContractsFactory(_contractsFactory);
        (address playground, address chances, address randomGenerator) = contractsFactory.create(_nbPositions, _playground, _chances);
        GameMaster gameMaster = new GameMaster(_nbMaxPlayers, _initialAmount, playground, chances, randomGenerator);
        gameMaster.transferOwnership(msg.sender);
        contractsFactory.transferOwnership(address(gameMaster), playground, chances);
        return address(gameMaster);
    }

}

