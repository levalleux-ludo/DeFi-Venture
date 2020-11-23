//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IRandomGenerator {
    function getRandom() external returns (uint8 dice1, uint8 dice2, uint8 cardId);
}