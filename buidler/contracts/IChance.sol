//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IChance {
    function initialize(address _transferManager, address _playground) external;
    function getChanceDetails(uint8 chanceId) external view returns (uint8 chanceType, uint8 chanceParam);
    function performChance(address gameMaster, address player, uint8 cardId) external;
}