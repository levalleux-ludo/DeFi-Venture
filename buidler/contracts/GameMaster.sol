//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "./IGameStatus.sol";

contract GameMaster is IGameStatus {
    uint8 constant NB_MAX_PLAYERS = 8;
    address owner;
    uint8 status = CREATED;
    uint256 nbPlayers = 0;
    address nextPlayer;
    uint256 nextPlayerIdx = 0;
    mapping(address => bool) players;
    address[NB_MAX_PLAYERS] playersSet;
    

    constructor() public {
        owner = msg.sender;
    }

    function getOwner() view public returns (address) {
        return owner;
    }

    function getStatus() view public returns (uint8) {
        return status;
    }

    function getNbPlayers() view public returns (uint256) {
        return nbPlayers;
    }

    function getNextPlayer() view public returns (address) {
        return nextPlayer;
    }

    function register() public payable {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(!players[msg.sender], "PLAYER_ALREADY_REGISTERED");
        if (nbPlayers == 0) {
            nextPlayer = msg.sender;
        }
        players[msg.sender] = true;
        playersSet[nbPlayers] = msg.sender;
        nbPlayers++;
    }

    function start() public {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(nbPlayers >= 2, "NOT_ENOUGH_PLAYERS");
        status = STARTED;
    }

    function play() public {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        performOption();
        nextPlayerIdx = (nextPlayerIdx + 1) % nbPlayers;
        nextPlayer = playersSet[nextPlayerIdx];
    }

    function performOption() internal {

    }

}