//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPlayground } from  "./IPlayground.sol";
import { IGameScheduler } from './IGameScheduler.sol';

contract Playground is IPlayground, Ownable {

    struct Space {
        uint8 spaceType;
        uint8 assetId;
        uint256 assetPrice;
        uint256 productPrice;
    }

    uint16 internal constant FIRST_ROUND = 1; // do not start at 0 because its the inital value
    uint16 internal constant NB_ROUND_IN_QUARANTINE = 1; 
    uint8 public nbPositions;
    mapping(address => uint8) public positions;
    bytes32 public playground;
    mapping(uint8 => Space) spaces;
    mapping(uint8 => uint8) assetsPositions;
    mapping(address => bool) immunity;
    mapping(address => uint16) inQuarantine;

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

    function setPlayerPosition(address player, uint8 newPosition) external override {
        _setPlayerPosition(player, newPosition);
    }

    function incrementPlayerPosition(address player, int8 offset) external override {
        require(offset < int8(nbPositions), "OFFSET_OUT_OF_BOUNDS");
        require(offset > -int8(nbPositions), "OFFSET_OUT_OF_BOUNDS");
        uint8 oldPosition = positions[player];
        int8 newPosition = int8(oldPosition) + offset;
        if (newPosition < 0) {
            newPosition += int8(nbPositions);
        }
        _setPlayerPosition(player, uint8(newPosition) % nbPositions);
    }

    function _setPlayerPosition(address player, uint8 newPosition) internal {
        positions[player] = newPosition;
    }

    function getAssetData(uint8 assetId) external view override returns (uint256 assetPrice, uint256 productPrice) {
        uint8 spaceId = assetsPositions[assetId];
        assetPrice = spaces[spaceId].assetPrice;
        productPrice = spaces[spaceId].productPrice;
    }

    function giveImmunity(address player) external override {
        console.log('Playground: set immunity', player);
        immunity[player] = true;
    }

    function gotoQuarantine(address gameMaster, address player) external override {
        console.log('Playground: gotoQuarantine', player);
        uint16 roundCount = IGameScheduler(gameMaster).getRoundCount();
        if (!immunity[player]) {
            inQuarantine[player] = FIRST_ROUND + roundCount + NB_ROUND_IN_QUARANTINE;
        } else {
            console.log('Playground: reset immunity', player);
            immunity[player] = false; // works only once
        }
    }

    function hasImmunity(address player) external view override returns (bool) {
        console.log('Playground: get immunity', player, immunity[player]);
        return immunity[player];
    }
 
    function isInQuarantine(address player, uint16 roundCount)  external view override returns (bool) {
        console.log('Test isInQuarantine', player, roundCount);
        console.log(inQuarantine[player]);
        return (inQuarantine[player] >= FIRST_ROUND + roundCount);
    }


}