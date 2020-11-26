//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IChance {
    function getChanceDetails(uint8 chanceId) external view returns (uint8 chanceType, uint8 chanceParam);
    function performChance(uint8 cardId) external;
}