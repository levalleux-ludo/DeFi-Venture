//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { ITransferManagerFactory } from './ITransferManagerFactory.sol';
import { IGameContracts } from './IGameContracts.sol';
import { TransferManager } from './TransferManager.sol';

contract TransferManagerFactory is ITransferManagerFactory {
    function create(address gameContracts, uint256 ubiAmount) external override returns (address contractsAddress) {
        IGameContracts contracts = IGameContracts(gameContracts);
        TransferManager transferManager = new TransferManager( ubiAmount);
        contracts.setTransferManager(
            address(transferManager)
        );
        contractsAddress = address(contracts);
    }

}