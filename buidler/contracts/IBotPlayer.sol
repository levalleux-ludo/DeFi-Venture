//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IBotPlayer {
    function register(address gameMasterAddress, bytes32 username, uint8 avatar) external;
    function rollDices(address gameMasterAddress) external;
    function play(address gameMasterAddress, uint8 option) external;
}