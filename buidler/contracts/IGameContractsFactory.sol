//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IGameContractsFactory {
    function create(address gameMaster) external returns (address gameContracts);
}