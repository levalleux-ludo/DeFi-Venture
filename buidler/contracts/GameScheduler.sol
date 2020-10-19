//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "./IGameStatus.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameScheduler is IGameStatus, Ownable {
    uint8 status = CREATED;
    uint8 nbPlayers = 0;
    uint8 nextPlayerIdx = 0;
    address nextPlayer;
    mapping(address => bool) players;
    address[] playersSet;
    uint8 nbMaxPlayers;
    
    event StatusChanged(uint8 newStatus);
    event PlayerRegistered(address newPlayer, uint8 nbPlayers);
    
    constructor(uint8 _nbMaxPlayers) public Ownable() {
        nbMaxPlayers = _nbMaxPlayers;
        playersSet = new address[](_nbMaxPlayers);
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

    function register() public virtual payable {
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

    function end() virtual public {
        require((status == STARTED) || (status == FROZEN), "INVALID_GAME_STATE");
        // TODO: which requirements to authorize someone to stop the current game ???

        setStatus(ENDED);
    }

    function setStatus(uint8 newStatus) internal {
        status = newStatus;
        emit StatusChanged(status);
    }

    function chooseNextPlayer() internal {
        nextPlayerIdx = (nextPlayerIdx + 1) % nbPlayers;
        nextPlayer = playersSet[nextPlayerIdx];
        // TODO: if player in quarantine, step over (and remove from quarantine for next time)
    }

}