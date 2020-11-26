//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { IGameMaster } from './IGameMaster.sol';
import { GameMasterStorage } from './GameMasterStorage.sol';
// import { GameToken } from './GameToken.sol';
// import { GameAssets } from './GameAssets.sol';
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IGameStatus.sol";

import { IContractFactory } from "./IContractFactory.sol";
import { IMarketplace } from "./IMarketplace.sol";
import { IGameMasterFactory } from "./IGameMasterFactory.sol";

import { IGameContractsFactory } from "./IGameContractsFactory.sol";
import { IGameContractsWrapper } from './IGameContractsWrapper.sol';
import { IGameContracts } from './IGameContracts.sol';

contract GameFactory is IGameStatus {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    address gameMasterFactory;
    address gameContractsWrapper;
    address gameContractsFactory;
    address tokenFactory;
    address assetsFactory;
    address marketplaceFactory;
    EnumerableSet.AddressSet private gamesSet;

    event GameCreated(address gameMasterAddress, uint index);

    constructor (address _gameMasterFactory, address _gameContractsWrapper, address _gameContractsFactory, address _tokenFactory, address _assetsFactory, address _marketplaceFactory) public {
        gameMasterFactory = _gameMasterFactory;
        gameContractsWrapper = _gameContractsWrapper;
        gameContractsFactory = _gameContractsFactory;
        tokenFactory = _tokenFactory;
        assetsFactory = _assetsFactory;
        marketplaceFactory = _marketplaceFactory;
    }

    /**
    - factory to create new game contracts
       */
    function createGameMaster(uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances) public {
        require(gameMasterFactory != address(0), "GAME_MASTER_FACTORY_NOT_DEFINED");
        require(assetsFactory != address(0), "ASSETS_FACTORY_NOT_DEFINED");
        require(marketplaceFactory != address(0), "MARKETPLACE_FACTORY_NOT_DEFINED");

        address gameMasterAddress = IGameMasterFactory(gameMasterFactory).create(_nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances);
        // store gameMaster address in createdGameSet
        gamesSet.add(gameMasterAddress);
        emit GameCreated(gameMasterAddress, gamesSet.length() - 1);
    }

    function createGameContracts(address gameMasterAddress, uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances) external {
        require(gameContractsWrapper != address(0), "GAME_CONTRACTS_WRAPPER_NOT_DEFINED");
        require(gameContractsFactory != address(0), "GAME_CONTRACTS_FACTORY_NOT_DEFINED");
        address gameContractsAddr = IGameContractsWrapper(gameContractsWrapper).create();
        IGameContractsFactory contractsFactory = IGameContractsFactory(gameContractsFactory);
        (address contracts) = contractsFactory.create(gameContractsAddr, _nbPositions, _playground, _chances);
        console.log('created contracts', contracts, gameContractsAddr);
        contractsFactory.transferOwnership(gameMasterAddress, IGameContracts(contracts).getPlayground());
        GameMasterStorage(gameMasterAddress).setContracts(gameContractsAddr);
    }

    function createGameToken(address gameMasterAddress) external {
        require(tokenFactory != address(0), "TOKEN_FACTORY_NOT_DEFINED");
        GameMasterStorage gameMaster = GameMasterStorage(gameMasterAddress);
        require(IGameContracts(gameMaster.contracts()).getToken() == address(0), "GAME_TOKEN_ALREADY_DEFINED");
        address tokenAddress = IContractFactory(tokenFactory).create(gameMaster.contracts());
        IGameContracts(gameMaster.contracts()).setToken(tokenAddress);
    }

    function createGameAssets(address gameMasterAddress) external {
        GameMasterStorage gameMaster = GameMasterStorage(gameMasterAddress);
        require(IGameContracts(gameMaster.contracts()).getAssets() == address(0), "GAME_ASSETS_ALREADY_DEFINED");
        address assetsAddress = IContractFactory(assetsFactory).create(gameMaster.contracts());
        IGameContracts(gameMaster.contracts()).setAssets(assetsAddress);
    }

    function createMarketplace(address gameMasterAddress) external {
        GameMasterStorage gameMaster = GameMasterStorage(gameMasterAddress);
        require(IGameContracts(gameMaster.contracts()).getMarketplace() == address(0), "MARKETPLACE_ALREADY_DEFINED");
        address marketplaceAddress = IContractFactory(marketplaceFactory).create(gameMaster.contracts());
        // IMarketplace marketplace = IMarketplace(marketplaceAddress);
        // marketplace.setToken(gameMaster.getToken());
        // marketplace.setAssets(gameMaster.getAssets());
        IGameContracts(gameMaster.contracts()).setMarketplace(marketplaceAddress);
    }

    // function assignContracts(address gameMaster, address token, address assets) public {
    //     GameMasterStorage(gameMaster).setToken(token);
    //     GameMasterStorage(gameMaster).setAssets(assets);
    // }

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