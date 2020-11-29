//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameMaster } from "../GameMaster.sol";
import { IGameContracts } from '../IGameContracts.sol';
import { IPlayground } from '../IPlayground.sol';

contract GameMasterForTest is GameMaster {

    constructor (
        uint8 nbMaxPlayers,
        uint256 _initialAmount
        ) public GameMaster(nbMaxPlayers, _initialAmount) {
    }
    function setOptions(uint8 options) public onlyOwner {
        currentOptions = options;
    }

    function setPlayerPosition(address player, uint8 newPosition) public onlyOwner {
        address playgroundAddress = IGameContracts(contracts).getPlayground();
        IPlayground(playgroundAddress).setPlayerPosition(player, newPosition);
    }

    function setCardId(uint8 cardId) public onlyOwner {
        currentCardId = cardId;
    }

    function setInitialAmount(uint256 _initialAmount) public onlyOwner {
        initialAmount = _initialAmount;
    }

    function getPlayerData(address player) external view returns (
        address _address,
        bytes32 _username,
        uint8 _avatar,
        uint8 _position,
        bool _hasLost,
        bool _hasImmunity,
        bool _isInQuarantine
    ) {
        _address = player;
        _username = usernames[player];
        _avatar = players[player];
        _position = IPlayground(IGameContracts(contracts).getPlayground()).getPlayerPosition(player);
        _hasLost = lostPlayers[player];
        _hasImmunity = IPlayground(IGameContracts(contracts).getPlayground()).hasImmunity(player);
        _isInQuarantine = IPlayground(IGameContracts(contracts).getPlayground()).isInQuarantine(player, roundCount);
    }

    function getPlayersPositions(address[] calldata players) external view returns (
        uint8[] memory _positions
    ) {
        _positions = new uint8[](players.length);
        for (uint i = 0; i < players.length; i++) {
            _positions[i] = IPlayground(IGameContracts(contracts).getPlayground()).getPlayerPosition(players[i]);
        }
    }

}