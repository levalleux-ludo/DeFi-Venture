//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IPlayground {
    function initialize(address _transferManager) external;
    function getSpaceDetails(uint8 spaceId) external view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice);
    // function getPlayground() external view returns (bytes32);
    function getPlayerPosition(address player) external view returns (uint8);
    function getNbPositions() external view returns (uint8);
    function setPlayerPosition(address player, uint8 newPosition, bool giveUBI) external;
    function incrementPlayerPosition(address player, int8 offset) external;
    function getAssetData(uint8 assetId) external view returns (uint256 assetPrice, uint256 productPrice);
    function giveImmunity(address player) external;
    function hasImmunity(address player) external view returns (bool);
    function gotoQuarantine(address gameMaster, address player) external;
    function isInQuarantine(address player, uint16 roundCount)  external view returns (bool);
}