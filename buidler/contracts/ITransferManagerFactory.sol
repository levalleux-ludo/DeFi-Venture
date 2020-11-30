//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface ITransferManagerFactory {
    function create(address gameContracts, uint256 ubiAmount) external returns (address contractsAddress);

}