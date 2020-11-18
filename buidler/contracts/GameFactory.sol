//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import { GameMaster } from './GameMaster.sol';
// import { GameToken } from './GameToken.sol';
// import { GameAssets } from './GameAssets.sol';
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IGameStatus.sol";

import { IContractFactory } from "./IContractFactory.sol";
import { IMarketplace } from "./IMarketplace.sol";

contract GameFactory is IGameStatus {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    address tokenFactory;
    address assetsFactory;
    address marketplaceFactory;
    EnumerableSet.AddressSet private gamesSet;

    event GameCreated(address gameMasterAddress, uint index);

    constructor (address _tokenFactory, address _assetsFactory, address _marketplaceFactory) public {
        tokenFactory = _tokenFactory;
        assetsFactory = _assetsFactory;
        marketplaceFactory = _marketplaceFactory;
    }

    /**
    - factory to create new game contracts
       */
    function create(uint8 _nbMaxPlayers, uint8 _nbPositions, uint256 _initialAmount, bytes32 _playground, bytes32 _chances) public returns (address) {

        // GameToken gameToken = new GameToken();
        // GameAssets gameAssets = new GameAssets();
        GameMaster gameMaster = new GameMaster(_nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances);
        address tokenAddress = IContractFactory(tokenFactory).create(address(gameMaster));
        gameMaster.setToken(tokenAddress);
        address assetsAddress = IContractFactory(assetsFactory).create(address(gameMaster));
        gameMaster.setAssets(assetsAddress);

        // store gameMaster address in createdGameSet
        gamesSet.add(address(gameMaster));
        emit GameCreated(address(gameMaster), gamesSet.length() - 1);
        return address(gameMaster);
    }

    function createMarketplace(address gameMasterAddress) external {
        GameMaster gameMaster = GameMaster(gameMasterAddress);
        address marketplaceAddress = IContractFactory(marketplaceFactory).create(gameMasterAddress);
        IMarketplace marketplace = IMarketplace(marketplaceAddress);
        // marketplace.setToken(gameMaster.getToken());
        // marketplace.setAssets(gameMaster.getAssets());
        gameMaster.setMarketplace(marketplaceAddress);
    }

    function assignContracts(address gameMaster, address token, address assets) public {
        GameMaster(gameMaster).setToken(token);
        GameMaster(gameMaster).setAssets(assets);
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