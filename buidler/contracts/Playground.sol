//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { IPlayground } from  "./IPlayground.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Playground is IPlayground, Ownable {

    struct Space {
        uint8 spaceType;
        uint8 assetId;
        uint256 assetPrice;
        uint256 productPrice;
    }

    uint8 public nbPositions;
    mapping(address => uint8) public positions;
    bytes32 public playground;
    mapping(uint8 => Space) spaces;
    mapping(uint8 => uint8) assetsPositions;

    constructor(
        uint8 _nbPositions,
        bytes32 _playground
     ) public Ownable() {
        nbPositions = _nbPositions;
        playground = _playground;
        for (uint8 spaceId = 0; spaceId < nbPositions; spaceId++) {
            uint8 spaceCode = uint8(playground[31 - spaceId]);// Important storage reverse (end-endian)
            spaces[spaceId].spaceType = spaceCode & 0x7;
            spaces[spaceId].assetId = spaceCode >> 3;
            assetsPositions[spaces[spaceId].assetId] = spaceId;
            if ((spaces[spaceId].spaceType >= 4) && (spaces[spaceId].spaceType < 8)) {
                // spaceType: 4 <=> ASSET_CLASS_1, price = 50
                // .. 
                // spaceType: 7 <=> ASSET_CLASS_4, price = 200
                uint8 assetClass = spaces[spaceId].spaceType - 3;
                spaces[spaceId].assetPrice = 50 * assetClass;
                spaces[spaceId].productPrice = 15 * assetClass;
                // TODO: get productPrice from InvestmentManager contract
            }
        }
    }

    function getSpaceDetails(uint8 spaceId) external override view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
        require(spaceId < nbPositions, "INVALID_ARGUMENT");
        spaceType = spaces[spaceId].spaceType;
        assetId = spaces[spaceId].assetId;
        assetPrice = spaces[spaceId].assetPrice;
        productPrice = spaces[spaceId].productPrice;
    }

    // function getPlayground() external override view returns (bytes32) {
    //     return playground;
    // }

    function getPlayerPosition(address player) external override view returns (uint8) {
        return positions[player];
    }

    function getNbPositions() external override view returns (uint8) {
        return nbPositions;
    }

    function setPlayerPosition(address player, uint8 newPosition) external override onlyOwner {
        _setPlayerPosition(player, newPosition);
    }

    function incrementPlayerPosition(address player, uint8 offset) external override onlyOwner {
        uint8 oldPosition = positions[player];
        _setPlayerPosition(player, (oldPosition + offset) % nbPositions);
    }

    function _setPlayerPosition(address player, uint8 newPosition) internal {
        positions[player] = newPosition;
    }

    function getAssetData(uint8 assetId) external override returns (uint256 assetPrice, uint256 productPrice) {
        uint8 spaceId = assetsPositions[assetId];
        assetPrice = spaces[spaceId].assetPrice;
        productPrice = spaces[spaceId].productPrice;
    }


}