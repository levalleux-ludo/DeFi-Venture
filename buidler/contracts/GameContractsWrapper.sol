//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameContracts } from './GameContracts.sol';

import { IGameContractsWrapper } from './IGameContractsWrapper.sol';

contract GameContractsWrapper is IGameContractsWrapper {
    function create() external override returns (address) {
        GameContracts gameContracts = new GameContracts();
        return address(gameContracts);
    }
}