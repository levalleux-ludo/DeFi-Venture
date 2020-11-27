//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IPlayground {
    function getSpaceDetails(uint8 spaceId) external view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice);
    // function getPlayground() external view returns (bytes32);
    function getPlayerPosition(address player) external view returns (uint8);
    function getNbPositions() external view returns (uint8);
    function setPlayerPosition(address player, uint8 newPosition) external;
    function incrementPlayerPosition(address player, uint8 offset) external;
    function getAssetData(uint8 assetId) external returns (uint256 assetPrice, uint256 productPrice);
}