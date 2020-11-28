//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameContracts } from './GameContracts.sol';

import { IGameContractsFactory } from './IGameContractsFactory.sol';

contract GameContractsFactory is IGameContractsFactory {
    function create() external override returns (address) {
        GameContracts gameContracts = new GameContracts();
        return address(gameContracts);
    }
}