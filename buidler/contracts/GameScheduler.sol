//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "./IGameStatus.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import {IGameScheduler} from "./IGameScheduler.sol";

contract GameScheduler is IGameStatus, Ownable, IGameScheduler {
    uint8 status = CREATED;
    uint8 nbPlayers = 0;
    uint8 nextPlayerIdx = 0;
    address nextPlayer;
    mapping(address => uint8) players;
    mapping(address => bytes32) usernames;
    address[] playersSet;
    uint8 nbMaxPlayers;
    
    event StatusChanged(uint8 newStatus);
    event PlayerRegistered(address newPlayer, uint8 nbPlayers);
    
    constructor(uint8 _nbMaxPlayers) public Ownable() {
        nbMaxPlayers = _nbMaxPlayers;
        playersSet = new address[](_nbMaxPlayers);
    }

    function getStatus() view external override returns (uint8) {
        return status;
    }

    function getNbPlayers() view external override returns (uint8) {
        return nbPlayers;
    }

    function getNextPlayer() view external override returns (address) {
        return nextPlayer;
    }

    function isPlayerRegistered(address player) view external override returns (bool) {
        return (players[player] != 0);
    }

    function isAvatarTaken(uint8 avatar) view external override returns (bool) {
        for (uint8 i = 0; i < nbPlayers; i++) {
            address player = this.getPlayerAtIndex(i);
            if (players[player] == avatar) {
                return true;
            }
        }
        return false;
    }

    function isUsernameTaken(bytes32 username) view external override returns (bool) {
        for (uint8 i = 0; i < nbPlayers; i++) {
            address player = this.getPlayerAtIndex(i);
            console.log('compare');
            console.logBytes32(username);
            console.log('with');
            console.logBytes32(usernames[player]);
            if (usernames[player] == username) {
                return true;
            }
        }
        return false;
    }

    function getPlayerAtIndex(uint8 index) view external override returns (address) {
        require(index <= nbPlayers, "index can not be more than the number of players");
        return playersSet[index];
    }

    function getAvatar(address player) view external override returns (uint8) {
        uint8 avatar = players[player];
        require(avatar != 0, "PLAYER_NOT_REGISTERED");
        return avatar;
    }

    function getUsername(address player) view external override returns (bytes32 username) {
        require(this.isPlayerRegistered(player), "PLAYER_NOT_REGISTERED");
        username = usernames[player];
        return username;
    }

    function register(bytes32 username, uint8 avatar) external override payable {
        // TODO: deal with msg.value if not null
        _register(username, avatar);
    }

    function start() external override {
        _start();
    }

    function end() external override {
        _end();
    }

    function _register(bytes32 username, uint8 avatar) internal virtual {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(!this.isPlayerRegistered(msg.sender), "PLAYER_ALREADY_REGISTERED");
        require(avatar != 0, "INVALID_AVATAR");
        require(username != bytes32(""), "INVALID_USERNAME");
        require(!this.isUsernameTaken(username), "USERNAME_ALREADY_TAKEN");
        require(!this.isAvatarTaken(avatar), "AVATAR_ALREADY_TAKEN");
        if (nbPlayers == 0) {
            nextPlayer = msg.sender;
        }
        players[msg.sender] = avatar;
        usernames[msg.sender] = username;
        playersSet[nbPlayers] = msg.sender;
        nbPlayers++;
        emit PlayerRegistered(msg.sender, nbPlayers);
    }

    function _start() internal virtual {
        require(status == CREATED, "INVALID_GAME_STATE");
        require(nbPlayers >= 2, "NOT_ENOUGH_PLAYERS");
        setStatus(STARTED);
    }

    function _end() internal virtual {
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

   function compareStrings(string memory a, string memory b) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }


}