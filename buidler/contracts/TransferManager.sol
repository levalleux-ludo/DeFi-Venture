//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { ITransferManager } from './ITransferManager.sol';

import { IGameAssets } from './IGameAssets.sol';
import { IGameToken } from './IGameToken.sol';
import { IGameScheduler } from './IGameScheduler.sol';
import { IPlayground } from './IPlayground.sol';
import { Initialized } from './Initialized.sol';

contract TransferManager is ITransferManager, Initialized {
    uint256 constant public MAX_UINT256 = 2**256 - 1;
    uint256 public ubiAmount;
    address private token;
    address private assets;
    address public playground;

    event PlayerLiquidated(address indexed player);

    constructor(uint256 _ubiAmount) public {
        ubiAmount = _ubiAmount;
    }

    function initialize(address _token, address _assets, address _playground) external override {
        token = _token;
        assets = _assets;
        playground = _playground;
        super.initialize();
    }
    function getToken() external view override returns (address) {
        return token;
    }
    function getAssets() external view override returns (address) {
        return assets;
    }
    function buyAsset(uint256 assetId, address buyer, uint256 assetPrice) external override initialized {
        console.log('mint asset');
        console.logUint(assetId);
        console.log('for player', buyer);
        IGameToken(token).burnTokensFrom(buyer, assetPrice);
        IGameAssets(assets).safeMint(buyer, assetId);
    }

    function payAssetOwner(uint256 assetId, address player, uint256 productPrice) external override initialized {
        address owner = IGameAssets(assets).ownerOf(uint256(assetId));
        IGameToken(token).transferFrom(player, owner, productPrice);
    }

    function checkAllowance(address account) external view override initialized {
        require(IGameToken(token).allowance(account, address(this)) == MAX_UINT256, "PLAYER_MUST_APPROVE_TRANSFER_MANAGER_FOR_TOKEN");
        require(IGameAssets(assets).isApprovedForAll(account, address(this)), "PLAYER_MUST_APPROVE_TRANSFER_MANAGER_FOR_ASSETS");
    }

    function giveAmount(uint256 amount, address[] calldata players, uint nbPlayers) external override initialized {
        for (uint i = 0; i < nbPlayers; i++) {
            address player = players[i];
            this.receiveAmount(player, amount);
        }
    }

    function liquidate(address player, uint256 assetsBalance) external override initialized {
        uint256 amount = 0;
        uint256 balance = IGameAssets(assets).balanceOf(player);
        while (balance > 0) {
            uint256 assetId = IGameAssets(assets).tokenOfOwnerByIndex(player, 0);
            IGameAssets(assets).burn(assetId);
            // TODO: call AssetManager instead of playground to get dynamic assetPrice
            (uint256 assetPrice, uint256 productPrice) = IPlayground(playground).getAssetData(uint8(assetId));
            amount += assetPrice / 2;
            balance = IGameAssets(assets).balanceOf(player);
        }
        IGameToken(token).mint(player, amount);
        emit PlayerLiquidated(player);
    }

    function payAmount(address gameMaster, address player, uint256 amount) external override initialized {
        if (this.checkBalance(gameMaster, player, amount, true)) {
            IGameToken(token).burnTokensFrom(player, amount);
        }
    }

    function receiveAmount(address player, uint256 amount) external override initialized {
        IGameToken(token).mint(player, amount);
    }

    function payAmountPerAsset(address gameMaster, address player, uint256 amount) external override initialized {
        uint256 balance = IGameAssets(assets).balanceOf(player);
        this.payAmount(gameMaster, player, amount * balance);
    }

    function receiveAmountPerAsset(address player, uint256 amount) external override initialized {
        uint256 balance = IGameAssets(assets).balanceOf(player);
        this.receiveAmount(player, amount * balance);
    }

    function checkBalance(address gameMaster, address player, uint256 requiredCash, bool mustContinue) external override initialized returns(bool) {
        if (IGameToken(token).balanceOf(player) < requiredCash) {
            // if the player owns some assets, liquidate them and check again
            uint256 assetsBalance = IGameAssets(assets).balanceOf(player);
            if (assetsBalance > 0) {
                this.liquidate(player, assetsBalance);
                // if the play action must continue after liquidation, recheck to see if balance is now enough to pay requiredCash
                return mustContinue && this.checkBalance(gameMaster, player, requiredCash, mustContinue);
            } else {
                IGameScheduler(gameMaster).playerLost(player);
            }
            return false;
        }
        return true;
    }

    function giveUBI(address player) external override initialized {
        this.receiveAmount(player, ubiAmount);
    }


}