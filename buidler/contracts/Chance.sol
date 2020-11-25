//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { IChance } from './IChance.sol';

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Chance is IChance, Ownable {
    bytes32 public chances;

    constructor(
        bytes32 _chances
    ) public Ownable() {
        _chances = chances;
    }

    function getChanceDetails(uint8 chanceId) external view override returns (uint8 chanceType, uint8 chanceParam) {
        require(chanceId < chances.length, "INVALID_ARGUMENT");
        uint8 chanceCode = uint8(chances[31 - chanceId]);// Important storage reverse (end-endian)
        chanceType = chanceCode & 0x7;
        chanceParam = chanceCode >> 3;
    }

    function performChance(uint8 cardId) external override onlyOwner {
        // TODO
    }

}