//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IOtherContractsFactory } from './IOtherContractsFactory.sol';
import { Playground } from './Playground.sol';
import { Chance } from './Chance.sol';
import { RandomGenerator } from './RandomGenerator.sol';
import { PlayOptions } from './PlayOptions.sol';
import { IGameContracts } from './IGameContracts.sol';

contract OtherContractsFactory is IOtherContractsFactory {
    function create(address gameContracts, uint8 _nbPositions, bytes32 _playground, uint8 _nbChances, bytes32 _chances) external override 
        returns (address contractsAddress) {
        IGameContracts contracts = IGameContracts(gameContracts);
        Playground playground = new Playground(_nbPositions, _playground);
        Chance chances = new Chance(_chances);
        console.log('give chances ownership to gameContracts');
        chances.transferOwnership(gameContracts);
        RandomGenerator randomGenerator = new RandomGenerator(_nbChances);
        PlayOptions playOptions = new PlayOptions();
        contracts.initialize(
            address(chances),
            address(playground),
            address(playOptions),
            address(randomGenerator)
        );
        contractsAddress = address(contracts);
    }

    function transferOwnership(address newOwner, address theContract) external override {
        Ownable(theContract).transferOwnership(newOwner);
        // Chance(IGameContracts(contracts).getChances()).transferOwnership(newOwner);
    }
}

