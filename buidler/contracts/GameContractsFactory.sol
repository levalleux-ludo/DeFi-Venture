//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

// import "@nomiclabs/buidler/console.sol";

import { IGameContractsFactory } from './IGameContractsFactory.sol';

import { Playground } from './Playground.sol';

import { Chance } from './Chance.sol';

import { RandomGenerator } from './RandomGenerator.sol';

contract GameContractsFactory is IGameContractsFactory {
    function create(uint8 _nbPositions, bytes32 _playground, bytes32 _chances) external override 
        returns (address playground, address chances, address randomGenerator) {
        Playground playgroundContract = new Playground(_nbPositions, _playground);
        Chance chancesContract = new Chance(_chances);
        RandomGenerator randomGeneratorContract = new RandomGenerator();
        playground = address(playgroundContract);
        chances = address(chancesContract);
        randomGenerator = address(randomGeneratorContract);
    }

    function transferOwnership(address newOwner, address playground, address chances) external override {
        Playground(playground).transferOwnership(newOwner);
        Chance(chances).transferOwnership(newOwner);
    }
}

