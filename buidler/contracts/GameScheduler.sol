//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { IGameStatus } from  "./IGameStatus.sol";
import { IPlayground } from './IPlayground.sol';
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import {IGameScheduler} from "./IGameScheduler.sol";

contract GameScheduler is IGameStatus, Ownable, IGameScheduler {
    uint8 public status = CREATED;
    uint8 public nbPlayers = 0;
    uint8 public nextPlayerIdx = 0;
    uint16 public roundCount = 0;
    address public nextPlayer;
    mapping(address => uint8) public players;
    mapping(address => bytes32) public usernames;
    address[] public playersSet;
    uint8 public nbMaxPlayers;
    mapping (address => bool) public lostPlayers;
    
    event StatusChanged(uint8 newStatus);
    event PlayerRegistered(address newPlayer, uint8 nbPlayers);
    event PlayerLost(address indexed player);
    event PlayerWin(address indexed player);
    
    constructor(uint8 _nbMaxPlayers) public Ownable() {
        console.log('GameScheduler: constructor');
        nbMaxPlayers = _nbMaxPlayers;
        playersSet = new address[](_nbMaxPlayers);
    }

    function getStatus() view external override returns (uint8) {
        return status;
    }

    function getRoundCount() view external override returns (uint16) {
        return roundCount;
    }

    // function getNbPlayers() view external override returns (uint8) {
    //     return nbPlayers;
    // }

    // function getNextPlayer() view external override returns (address) {
    //     return nextPlayer;
    // }

    function isPlayerRegistered(address player) view external override returns (bool) {
        return (players[player] != 0);
    }

    function hasPlayerLost(address player) view external returns (bool) {
        return lostPlayers[player];
    }

    function getWinner() view external returns (address) {
        address winner = address(0);
        for (uint8 i = 0; i < nbPlayers; i++) {
            address player = playersSet[i];
            if (!lostPlayers[player]) {
                if (winner != address(0)) {
                    // mosre than 1 player has not lost yet -> no winner
                    return address(0);
                }
                winner = player;
            }
        }
        return winner;
    }

    function isAvatarTaken(uint8 avatar) view external override returns (bool) {
        for (uint8 i = 0; i < nbPlayers; i++) {
            address player = playersSet[i];
            if (players[player] == avatar) {
                return true;
            }
        }
        return false;
    }

    function isUsernameTaken(bytes32 username) view external override returns (bool) {
        for (uint8 i = 0; i < nbPlayers; i++) {
            address player = playersSet[i];
            // console.log('compare');
            // console.logBytes32(username);
            // console.log('with');
            // console.logBytes32(usernames[player]);
            if (usernames[player] == username) {
                return true;
            }
        }
        return false;
    }

    // function getPlayerAtIndex(uint8 index) view external override returns (address) {
    //     require(index <= nbPlayers, "index can not be more than the number of players");
    //     return playersSet[index];
    // }

    // function getAvatar(address player) view external override returns (uint8) {
    //     uint8 avatar = players[player];
    //     require(avatar != 0, "PLAYER_NOT_REGISTERED");
    //     return avatar;
    // }

    // function getUsername(address player) view external override returns (bytes32 username) {
    //     require(this.isPlayerRegistered(player), "PLAYER_NOT_REGISTERED");
    //     username = usernames[player];
    //     return username;
    // }

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
        setStatus(ENDED);
    }

    function setStatus(uint8 newStatus) internal {
        status = newStatus;
        emit StatusChanged(status);
    }

    function chooseNextPlayer(address playgroundAddress) internal {
        nextPlayerIdx = (nextPlayerIdx + 1) % nbPlayers;
        if (nextPlayerIdx == 0) {
            roundCount++;
            console.log('Increment RoundCount', roundCount);
        }
        nextPlayer = playersSet[nextPlayerIdx];
        if (this.hasPlayerLost(nextPlayer) || IPlayground(playgroundAddress).isInQuarantine(nextPlayer, roundCount)) {
            chooseNextPlayer(playgroundAddress);
        }
    }

   function compareStrings(string memory a, string memory b) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function playerLost(address player) external override {
        lostPlayers[player] = true;
        address winner = this.getWinner();
        emit PlayerLost(player);
        if (winner != address(0)) {
            emit PlayerWin(winner);
            _end();
        }
    }

}