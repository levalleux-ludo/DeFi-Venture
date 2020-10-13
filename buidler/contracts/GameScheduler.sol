//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "./IGameStatus.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameScheduler is IGameStatus, Ownable {
    uint8 constant NB_MAX_PLAYERS = 8;
    uint8 status = CREATED;
    uint8 nbPlayers = 0;
    uint8 nextPlayerIdx = 0;
    address nextPlayer;
    mapping(address => bool) players;
    address[NB_MAX_PLAYERS] playersSet;
    
    event StatusChanged(uint8 newStatus);
    event PlayerRegistered(address newPlayer, uint8 nbPlayers);
    event PlayPerformed(address player);
    
    constructor() public Ownable() {
    }

    function getStatus() view public returns (uint8) {
        return status;
    }

    function getNbPlayers() view public returns (uint8) {
        return nbPlayers;
    }

    function getNextPlayer() view public returns (address) {
        return nextPlayer;
    }

    function isPlayerRegistered(address player) view public returns (bool) {
        return players[player];
    }

    function getPlayerAtIndex(uint8 index) view public returns (address) {
        require(index <= nbPlayers, "index can not be more than the nimber of players");
        return playersSet[index];
    }

    function register() public payable {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(!isPlayerRegistered(msg.sender), "PLAYER_ALREADY_REGISTERED");
        if (nbPlayers == 0) {
            nextPlayer = msg.sender;
        }
        players[msg.sender] = true;
        playersSet[nbPlayers] = msg.sender;
        nbPlayers++;
        emit PlayerRegistered(msg.sender, nbPlayers);
    }

    function start() virtual public {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(nbPlayers >= 2, "NOT_ENOUGH_PLAYERS");
        setStatus(STARTED);
    }

    function play() public {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        performOption();
        chooseNextPlayer();
        emit PlayPerformed(msg.sender);
    }

    function end() virtual public {
        require((status == STARTED) || (status == FROZEN), "INVALID_GAME_STATE");
        // TODO: which requirements to authorize someone to stop the current game ???

        setStatus(ENDED);
    }

    function setStatus(uint8 newStatus) internal {
        status = newStatus;
        emit StatusChanged(status);
    }

    function performOption() internal {

    }

    function chooseNextPlayer() internal {
        nextPlayerIdx = (nextPlayerIdx + 1) % nbPlayers;
        nextPlayer = playersSet[nextPlayerIdx];
    }

}