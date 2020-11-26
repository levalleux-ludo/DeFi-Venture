//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IGameContractsFactory } from './IGameContractsFactory.sol';
import { Playground } from './Playground.sol';
import { Chance } from './Chance.sol';
import { RandomGenerator } from './RandomGenerator.sol';
import { PlayOptions } from './PlayOptions.sol';
import { TransferManager } from './TransferManager.sol';
import { IGameContracts } from './IGameContracts.sol';

contract GameContractsFactory is IGameContractsFactory {
    function create(address gameContracts, uint8 _nbPositions, bytes32 _playground, bytes32 _chances) external override 
        returns (address contractsAddress) {
        IGameContracts contracts = IGameContracts(gameContracts);
        Playground playground = new Playground(_nbPositions, _playground);
        contracts.setPlayground(address(playground));
        Chance chances = new Chance(_chances);
        console.log('give chances ownership to gameContracts');
        chances.transferOwnership(gameContracts);
        contracts.setChances(address(chances));
        RandomGenerator randomGenerator = new RandomGenerator();
        contracts.setRandomGenerator(address(randomGenerator));
        PlayOptions playOptions = new PlayOptions();
        contracts.setPlayOptions((address(playOptions)));
        TransferManager transferManager = new TransferManager();
        contracts.setTransferManager(address(transferManager));
        contractsAddress = address(contracts);
    }

    function transferOwnership(address newOwner, address theContract) external override {
        Ownable(theContract).transferOwnership(newOwner);
        // Chance(IGameContracts(contracts).getChances()).transferOwnership(newOwner);
    }
}

