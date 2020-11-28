//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IGameContracts } from './IGameContracts.sol';
import { IMarketplace } from './IMarketplace.sol';
// import { GameMaster } from './GameMaster.sol';
import { IGameToken } from './IGameToken.sol';
import { IPlayOptions } from './IPlayOptions.sol';
import { ITransferManager } from './ITransferManager.sol';
import { IChance } from './IChance.sol';
import { Initialized } from './Initialized.sol';

contract GameContracts is IGameContracts, Initialized {
    address token;
    address assets;
    address marketplace;
    address chances;
    address randomGenerator;
    address playground;
    address playOptions;
    address transferManager;

    constructor() public {}
    function setToken(address _token) external override initialized {
        token = _token;
        console.log('gameContracts.setToken');
        if (marketplace != address(0)) {
            IMarketplace(marketplace).setToken(_token);
        }
        if (playOptions != address(0)) {
            IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
        }
        if (transferManager != address(0)) {
            ITransferManager(transferManager).initialize(token, assets, playground);
            if (Ownable(token).owner() == address(this)) {
                console.log('transfer token ownership to transferManager');
                Ownable(token).transferOwnership(transferManager);
            } else {
                console.log('gameContracts is not owner of token');
            }
        }
    }
    function setAssets(address _assets) external override initialized {
        assets = _assets;
        if (marketplace != address(0)) {
            IMarketplace(marketplace).setAssets(_assets);
        }
        if (playOptions != address(0)) {
            IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
        }
        if (transferManager != address(0)) {
            ITransferManager(transferManager).initialize(token, assets, playground);
            if (Ownable(assets).owner() == address(this)) {
                Ownable(assets).transferOwnership(transferManager);
            }
        }
    }
    function setMarketplace(address _marketplace) external override initialized {
        marketplace = _marketplace;
        IMarketplace(marketplace).setToken(token);
        IMarketplace(marketplace).setAssets(assets);
    }
    // function setChances(address _chances) external override {
    //     chances = _chances;
    //     if (playOptions != address(0)) {
    //         IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
    //         if (Ownable(chances).owner() == address(this)) {
    //             console.log('transfer chances ownership to transferManager');
    //             Ownable(chances).transferOwnership(playOptions);
    //         } else {
    //             console.log('gameContracts is not owner of chances');
    //         }
    //     }
    //     IChance(chances).initialize(transferManager, playground);
    // }
    // function setRandomGenerator(address _randomGenerator) external override {
    //     randomGenerator = _randomGenerator;
    // }
    // function setPlayground(address _playground) external override {
    //     playground = _playground;
    //     if (playOptions != address(0)) {
    //         IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
    //     }
    //     if (transferManager != address(0)) {
    //         ITransferManager(transferManager).initialize(token, assets, playground);
    //     }
    //     if (chances != address(0)) {
    //         IChance(chances).initialize(transferManager, playground);
    //     }
    // }
    // function setPlayOptions(address _playOptions) external override {
    //     playOptions = _playOptions;
    //     IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
    //     if (chances != address(0)) {
    //         if (Ownable(chances).owner() == address(this)) {
    //             console.log('transfer chances ownership to transferManager');
    //             Ownable(chances).transferOwnership(playOptions);
    //         } else {
    //             console.log('gameContracts is not owner of chances');
    //         }
    //     }
    // }
    function setTransferManager(address _transferManager) external override initialized {
        transferManager = _transferManager;
        make_dependencies();
    }

    function getToken() external view override returns (address) {
        return token;
    }
    function getAssets() external view override returns (address) {
        return assets;
    }
    function getMarketplace() external view override returns (address) {
        return marketplace;
    }
    function getChances() external view override returns (address) {
        return chances;
    }
    function getRandomGenerator() external view override returns (address) {
        return randomGenerator;
    }
    function getPlayground() external view override returns (address) {
        return playground;
    }
    function getPlayOptions() external view override returns (address) {
        return playOptions;
    }
    function getTransferManager() external view override returns (address) {
        return transferManager;
    }

    // function start(address gameMaster) external override {
    //     uint8 nbPlayers = GameMaster(gameMaster).nbPlayers();
    //     for (uint i = 0; i < nbPlayers; i++) {
    //         address player = GameMaster(gameMaster).playersSet(i);
    //         if (token != address(0)) {
    //             IGameToken(token).mint(player, GameMaster(gameMaster).initialAmount());
    //         }
    //     }

    // }

    function initialize(address _chances, address _playground, address _playOptions, address _randomGenerator) external override {
        require(Ownable(_chances).owner() == address(this), "GAME_CONTRACTS_NOT_OWNER_OF_CHANCES");
        chances = _chances;
        playground = _playground;
        playOptions = _playOptions;
        randomGenerator = _randomGenerator;

        super.initialize();
    }

    function make_dependencies() internal {
        IPlayOptions(playOptions).initialize(token, assets, chances, transferManager, playground);
        ITransferManager(transferManager).initialize(token, assets, playground);
        console.log('transfer chances ownership to transferManager');
        Ownable(chances).transferOwnership(playOptions);
        IChance(chances).initialize(transferManager, playground);
    }

}