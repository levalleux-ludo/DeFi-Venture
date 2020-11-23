//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IGameContractsFactory {
    function create(uint8 _nbPositions, bytes32 _playground, bytes32 _chances) external returns (address playground, address chances, address randomGenerator);
}

