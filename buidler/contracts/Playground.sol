//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { IPlayground } from  "./IPlayground.sol";

contract Playground is IPlayground {

    uint8 public nbPositions;
    mapping(address => uint8) public positions;
    bytes32 public playground;

    constructor(
        uint8 _nbPositions,
        bytes32 _playground
     ) public {
        nbPositions = _nbPositions;
        playground = _playground;
    }

    function getSpaceDetails(uint8 spaceId) external override view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
        require(spaceId < nbPositions, "INVALID_ARGUMENT");
        uint8 spaceCode = uint8(playground[31 - spaceId]);// Important storage reverse (end-endian)
        spaceType = spaceCode & 0x7;
        assetId = spaceCode >> 3;
        if ((spaceType >= 4) && (spaceType < 8)) {
            // spaceType: 4 <=> ASSET_CLASS_1, price = 50
            // .. 
            // spaceType: 7 <=> ASSET_CLASS_4, price = 200
            uint8 assetClass = spaceType - 3;
            assetPrice = 50 * assetClass;
            productPrice = assetPrice / 4;
            // TODO: get productPrice from InvestmentManager contract
        }
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

    function setPlayerPosition(address player, uint8 newPosition) external override {
        positions[player] = newPosition;
    }

    function incrementPlayerPosition(address player, uint8 offset) external override {
        uint8 oldPosition = positions[player];
        this.setPlayerPosition(player, (oldPosition + offset) % nbPositions);
    }


}