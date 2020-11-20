//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { IGameMaster } from './IGameMaster.sol';
// import { GameToken } from './GameToken.sol';
// import { GameAssets } from './GameAssets.sol';
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IGameStatus.sol";

import { IContractFactory } from "./IContractFactory.sol";
import { IMarketplace } from "./IMarketplace.sol";
import { IGameMasterFactory } from "./IGameMasterFactory.sol";

contract GameFactory is IGameStatus {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    address gameMasterFactory;
    address tokenFactory;
    address assetsFactory;
    address marketplaceFactory;
    EnumerableSet.AddressSet private gamesSet;

    event GameCreated(address gameMasterAddress, uint index);

    constructor (address _gameMasterFactory, address _tokenFactory, address _assetsFactory, address _marketplaceFactory) public {
        gameMasterFactory = _gameMasterFactory;
        tokenFactory = _tokenFactory;
        assetsFactory = _assetsFactory;
        marketplaceFactory = _marketplaceFactory;
    }

    /**
    - factory to create new game contracts
       */
    function createGameMaster(uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances) public returns (address) {
        require(gameMasterFactory != address(0), "GAME_MASTER_FACTORY_NOT_DEFINED");
        require(tokenFactory != address(0), "TOKEN_FACTORY_NOT_DEFINED");
        require(assetsFactory != address(0), "ASSETS_FACTORY_NOT_DEFINED");
        require(marketplaceFactory != address(0), "MARKETPLACE_FACTORY_NOT_DEFINED");

        // GameToken gameToken = new GameToken();
        // GameAssets gameAssets = new GameAssets();
        address gameMasterAddress = IGameMasterFactory(gameMasterFactory).create(_nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances);
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        // GameMaster gameMaster = new GameMaster(_nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances);
        // address tokenAddress = IContractFactory(tokenFactory).create(gameMasterAddress);
        // gameMaster.setToken(tokenAddress);
        // address assetsAddress = IContractFactory(assetsFactory).create(gameMasterAddress);
        // gameMaster.setAssets(assetsAddress);

        // store gameMaster address in createdGameSet
        gamesSet.add(gameMasterAddress);
        emit GameCreated(gameMasterAddress, gamesSet.length() - 1);
        return gameMasterAddress;
    }

    function createGameToken(address gameMasterAddress) external {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        require(gameMaster.getToken() == address(0), "GAME_TOKEN_ALREADY_DEFINED");
        address tokenAddress = IContractFactory(tokenFactory).create(gameMasterAddress);
        gameMaster.setToken(tokenAddress);
    }

    function createGameAssets(address gameMasterAddress) external {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        require(gameMaster.getAssets() == address(0), "GAME_ASSETS_ALREADY_DEFINED");
        address assetsAddress = IContractFactory(assetsFactory).create(gameMasterAddress);
        gameMaster.setAssets(assetsAddress);
    }

    function createMarketplace(address gameMasterAddress) external {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        require(gameMaster.getMarketplace() == address(0), "MARKETPLACE_ALREADY_DEFINED");
        address marketplaceAddress = IContractFactory(marketplaceFactory).create(gameMasterAddress);
        // IMarketplace marketplace = IMarketplace(marketplaceAddress);
        // marketplace.setToken(gameMaster.getToken());
        // marketplace.setAssets(gameMaster.getAssets());
        gameMaster.setMarketplace(marketplaceAddress);
    }

    function assignContracts(address gameMaster, address token, address assets) public {
        IGameMaster(gameMaster).setToken(token);
        IGameMaster(gameMaster).setAssets(assets);
    }

    function cleanEndedGames() public {
        // for each game in gamesSet, check status. If ended, remove from createdGamesSet
        uint _nbGames = gamesSet.length();
        address[] memory toRemove = new address[](_nbGames);
        uint indexToRemove = 0;
        for (uint i = 0; i < _nbGames; i++) {
            address gameMasterAddr = gamesSet.at(i);
            uint8 gameStatus = IGameMaster(gameMasterAddr).getStatus();
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