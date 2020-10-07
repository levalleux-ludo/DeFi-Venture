//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

contract IGameStatus {
    uint8 public constant CREATED = 0;
    uint8 public constant STARTED = 1;
    uint8 public constant FROZEN = 2;
    uint8 public constant ENDED = 3;
}