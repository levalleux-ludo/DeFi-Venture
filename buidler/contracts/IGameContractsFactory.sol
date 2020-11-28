//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IGameContractsFactory {
    function create() external returns (address gameContracts);
}