//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { GameScheduler } from "./GameScheduler.sol";
import { GameMasterStorage } from "./GameMasterStorage.sol";
import { IGameMaster } from "./IGameMaster.sol";
import { IGameToken } from "./IGameToken.sol";
import { IGameAssets } from "./IGameAssets.sol";
import { IMarketplace } from "./IMarketplace.sol";
import { IPlayground } from './IPlayground.sol';
import { IPlayOptions } from './IPlayOptions.sol';
import { IChance } from './IChance.sol';
import { IRandomGenerator } from './IRandomGenerator.sol';
import { ITransferManager } from './ITransferManager.sol';
import { IGameContracts } from './IGameContracts.sol';

contract GameMaster is GameScheduler, GameMasterStorage, IGameMaster {

    event RolledDices(address indexed player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, uint8 options);
    event PlayPerformed(address indexed player, uint8 option, uint8 cardId, uint8 newPosition);

    constructor (
        uint8 nbMaxPlayers,
        uint256 _initialAmount
        ) public GameScheduler(nbMaxPlayers) {
        initialAmount = _initialAmount;
        console.log('GameMaster: constructor');
    }
    
    function getGameData() external view returns (
        uint8 _status,
        uint8 _nbPlayers,
        uint8 _nbPositions,
        address _token,
        address _assets,
        address _marketplace,
        address _nextPlayer,
        address _currentPlayer,
        uint8 _currentOptions,
        uint8 _currentCardId
    ) {
        _status = status;
        _nbPlayers = nbPlayers;
        _nbPositions = IPlayground(IGameContracts(contracts).getPlayground()).getNbPositions();
        _token = IGameContracts(contracts).getToken();
        _assets = IGameContracts(contracts).getAssets();
        _marketplace = IGameContracts(contracts).getMarketplace();
        _nextPlayer = nextPlayer;
        _currentPlayer = currentPlayer;
        _currentOptions = currentOptions;
        _currentCardId = currentCardId;
    }

    function getPlayerData(address player) external view returns (
        address _address,
        bytes32 _username,
        uint8 _avatar,
        uint8 _position,
        bool _hasLost
    ) {
        _address = player;
        _username = usernames[player];
        _avatar = players[player];
        _position = IPlayground(IGameContracts(contracts).getPlayground()).getPlayerPosition(player);
        _hasLost = lostPlayers[player];
    }

    function getPlayersPositions(address[] calldata players) external view returns (
        uint8[] memory _positions
    ) {
        _positions = new uint8[](players.length);
        for (uint i = 0; i < players.length; i++) {
            _positions[i] = IPlayground(IGameContracts(contracts).getPlayground()).getPlayerPosition(players[i]);
        }
    }

    function getPlayersData(uint8[] calldata indexes) external view returns (
        address[] memory _addresses,
        bytes32[] memory _usernames,
        uint8[] memory _avatars,
        uint8[] memory _positions,
        bool[] memory _hasLost
    ) {
        _addresses = new address[](indexes.length);
        _usernames = new bytes32[](indexes.length);
        _avatars = new uint8[](indexes.length);
        _positions = new uint8[](indexes.length);
        _hasLost = new bool[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            address player = playersSet[i];
            _addresses[i] = player;
            _usernames[i] = usernames[player];
            _avatars[i] = players[player];
            _positions[i] = IPlayground(IGameContracts(contracts).getPlayground()).getPlayerPosition(player);
            _hasLost[i] = lostPlayers[player];
        }
    }

    function getSpaceDetails(uint8 spaceId) external override view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
        return IPlayground(IGameContracts(contracts).getPlayground()).getSpaceDetails(spaceId);
    }

    function getChanceDetails(uint8 chanceId) external override view returns (uint8 chanceType, uint8 chanceParam) {
        return IChance(IGameContracts(contracts).getChances()).getChanceDetails(chanceId);
    }

    function getOptionsAt(address player, uint8 position) external override view returns (uint8 options) {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = this.getSpaceDetails(position);
        require(spaceType < 8, "SPACE_TYPE_INVALID");
        return IPlayOptions(IGameContracts(contracts).getPlayOptions()).getOptionsAt(player, spaceType, assetId, assetPrice, productPrice);
    }

    function rollDices() external override {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(currentPlayer == address(0), "NOT_AUTHORIZED");
        currentPlayer = msg.sender;
        (uint8 dice1, uint8 dice2, uint8 cardId) = IRandomGenerator(IGameContracts(contracts).getRandomGenerator()).getRandom();
        address playgroundAddress = IGameContracts(contracts).getPlayground();
        IPlayground(playgroundAddress).incrementPlayerPosition(msg.sender, dice1 + dice2);
        uint8 newPosition = IPlayground(playgroundAddress).getPlayerPosition(msg.sender);
        uint8 options = this.getOptionsAt(msg.sender, newPosition);
        currentOptions = options;
        currentCardId = cardId;
        // console.log('emit RolledDices event');
        emit RolledDices(msg.sender, dice1, dice2, cardId, newPosition, options);
    }

    function play(uint8 option) external override {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(msg.sender == currentPlayer, "NOT_AUTHORIZED");
        require((option & currentOptions) != 0, "OPTION_NOT_ALLOWED");
        require((option & currentOptions) == option, "OPTION_NOT_ALLOWED");
        address playgroundAddress = IGameContracts(contracts).getPlayground();
        performOption(IPlayground(playgroundAddress).getPlayerPosition(msg.sender), option);
        chooseNextPlayer();
        uint8 eventCardId = currentCardId;
        currentPlayer = address(0);
        currentOptions = 0;
        currentCardId = 0;
        // emit event at the end
        emit PlayPerformed(msg.sender, option, eventCardId, IPlayground(playgroundAddress).getPlayerPosition(msg.sender));
    }

    function _start() internal override {
        super._start();
        ITransferManager(IGameContracts(contracts).getTransferManager()).giveAmount(initialAmount, playersSet, nbPlayers);
    }
    function _end() internal override {
        super._end();
    }

    function _register(bytes32 username, uint8 avatar) internal override {
        ITransferManager(IGameContracts(contracts).getTransferManager()).checkAllowance(msg.sender);
        super._register(username, avatar);
    }

    function performOption(uint8 position, uint8 option) internal {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = this.getSpaceDetails(position);
        address playOptionsAddress = IGameContracts(contracts).getPlayOptions();
        return IPlayOptions(playOptionsAddress).performOption(address(this), msg.sender, spaceType, assetId, assetPrice, productPrice, option, currentCardId);
    }

}