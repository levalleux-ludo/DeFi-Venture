//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { IRandomGenerator } from './IRandomGenerator.sol';

contract RandomGenerator is IRandomGenerator {

    uint256 internal nonce;

    function getRandom() external override returns (uint8 dice1, uint8 dice2, uint8 cardId) {
        uint random = uint(keccak256(abi.encodePacked(now, msg.sender, nonce)));
        nonce++;
        dice1 = 1 + uint8(random % 6);
        dice2 = 1 + uint8(random % 7 % 6);
        cardId = uint8(random % 47 % 32);
    }
}