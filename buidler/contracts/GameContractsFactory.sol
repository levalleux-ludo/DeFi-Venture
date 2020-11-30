//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameContracts } from './GameContracts.sol';

import { IGameContractsFactory } from './IGameContractsFactory.sol';

contract GameContractsFactory is IGameContractsFactory {
    function create(address gameMaster) external override returns (address) {
        GameContracts gameContracts = new GameContracts(gameMaster);
        return address(gameContracts);
    }
}