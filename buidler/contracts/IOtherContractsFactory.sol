//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IOtherContractsFactory {
    function create(address gameContracts, uint8 _nbPositions, bytes32 _playground, bytes32 _chances) external returns (address contracts);
    function transferOwnership(address newOwner, address theContract) external;
}

