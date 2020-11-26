//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import {IGameScheduler} from './IGameScheduler.sol';
interface IGameMaster is IGameScheduler {
    event RolledDices(address indexed player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, uint8 options);
    event PlayPerformed(address indexed player, uint8 option, uint8 cardId, uint8 newPosition);
    // function setToken(address _token) external;
    // function setAssets(address _assets) external;
    // function setMarketplace(address _marketplace) external;
    // function getToken() external view returns (address);
    // function getAssets() external view returns (address);
    // function getMarketplace() external view returns (address);
    // function getCurrentPlayer() external view returns (address);
    // function getCurrentOptions() external view returns (uint8);
    // function getCurrentCardId() external view returns (uint8);
    // function getNbPositions() external view returns (uint8);
    // function getPositionOf(address player) external view returns (uint8);
    // function getChances() external view returns (bytes32);
    // function getPlayground() external view returns (bytes32);
    function getSpaceDetails(uint8 spaceId) external view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice);
    function getChanceDetails(uint8 chanceId) external view returns (uint8 chanceType, uint8 chanceParam);
    function getOptionsAt(address player, uint8 position) external view returns (uint8 options);
    function rollDices() external;
    function play(uint8 option) external;
    // function setContracts(address gameContractsAddr) external;
}