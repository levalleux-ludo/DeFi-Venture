//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { GameMaster } from './GameMaster.sol';
import { GameToken } from './GameToken.sol';
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IGameStatus.sol";

contract GameFactory is IGameStatus {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;
    uint8 nbMaxPlayers;
    uint256 initialAmount;
    uint8 nbPositions;
    EnumerableSet.AddressSet private gamesSet;
    bytes32 private playground;
    bytes32 private chances;

    constructor (uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances ) public {
        nbMaxPlayers = _nbMaxPlayers;
        nbPositions = _nbPositions;
        initialAmount = _initialAmount;
        playground = _playground;
        chances = _chances;
    }

    /**
    - factory to create new game contracts
       */
    function create() public returns (address) {
        GameToken gameToken = new GameToken();
        GameMaster gameMaster = new GameMaster(nbMaxPlayers, nbPositions, initialAmount, playground, chances);
        gameMaster.setToken(address(gameToken));
        gameToken.transferOwnership(address(gameMaster));

        // store gameMaster address in createdGameSet
        gamesSet.add(address(gameMaster));
        return address(gameMaster);
    }

    function cleanEndedGames() public {
        // for each game in gamesSet, check status. If ended, remove from createdGamesSet
        uint _nbGames = gamesSet.length();
        address[] memory toRemove = new address[](_nbGames);
        uint indexToRemove = 0;
        for (uint i = 0; i < _nbGames; i++) {
            address gameMasterAddr = gamesSet.at(i);
            uint8 gameStatus = GameMaster(gameMasterAddr).getStatus();
            if (gameStatus == ENDED) {
                toRemove[indexToRemove] = gameMasterAddr;
                indexToRemove++;
            }
        }
        for (uint i = 0; i < indexToRemove; i++) {
            gamesSet.remove(toRemove[i]);
        }
    }

    function nbGames() public view returns (uint256) {
        return gamesSet.length();
    }

    function getGameAt(uint index) public view returns (address) {
        return gamesSet.at(index);
    }



}