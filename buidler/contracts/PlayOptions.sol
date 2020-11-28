//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { IPlayOptions } from './IPlayOptions.sol';

import { IGameAssets } from './IGameAssets.sol';

import { IChance } from './IChance.sol';

import { IGameToken } from './IGameToken.sol';

import { IGameScheduler } from './IGameScheduler.sol';

import { IGameContracts } from './IGameContracts.sol';

import { ITransferManager } from './ITransferManager.sol';
import { IPlayground } from './IPlayground.sol';
import { Initialized } from './Initialized.sol';


contract PlayOptions is IPlayOptions, Initialized {
    address public tokenAddress;
    address public assetsAddress;
    address public chancesAddress;
    address public transferManager;
    address public playground;

    constructor() public {}

    function initialize(address _tokenAddress, address _assetsAddress, address _chancesAddress, address _transferManager, address _playground) external override {
        tokenAddress = _tokenAddress;
        assetsAddress = _assetsAddress;
        chancesAddress = _chancesAddress;
        transferManager = _transferManager;
        playground = _playground;
        super.initialize();
    }

    function getOptionsAt(address player, uint8 position) external view override initialized returns (uint8 options) {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = IPlayground(playground).getSpaceDetails(position);
        options = 0;
        if (
            (spaceType == 0) // GENESIS
            || (spaceType == 2 )// LIQUIDATION
        ) {
            options = 1; // 1 = NOTHING
        } else if (spaceType == 1) { // QUARANTINE
            options = 16; // 16 = QUARANTINE
        } else if (spaceType == 3) { // CHANCE
            options = 8; // 8 = CHANCE
        } else { // ASSETS
            if (assetsAddress != address(0)) {
                if (IGameAssets(assetsAddress).exists(uint256(assetId))) {
                    address owner = IGameAssets(assetsAddress).ownerOf(uint256(assetId));
                    if (owner != player) {
                        options = 4; // 4 = PAY_BILL
                    } else {
                        options = 1; // 1 = NOTHING
                    }
                } else {
                    options = 1 + 2; // 1 + 2 = NOTHING | BUY_ASSET
                }
            } else {
                options = 1; // 1
            }
        }

    }

    function performOption(address gameMaster, address player, uint8 option, uint8 currentCardId) external override initialized returns (uint8 realOption, uint8 newPosition) {
        uint8 position = IPlayground(playground).getPlayerPosition(player);
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = IPlayground(playground).getSpaceDetails(position);
        realOption = option;
        newPosition = position;
        if ((option & 1) != 0) { // NOTHING

        } else if ((option & 2) != 0) { // BUY_ASSET
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(gameMaster, player, assetPrice, false)) {
                    ITransferManager(transferManager).buyAsset(assetId, player, assetPrice);
                } else {
                    // real played option is NOTHING
                    realOption = 1;// NOTHING
                }
            }
        } else if ((option & 4) != 0) { // PAY_BILL
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(gameMaster, player, productPrice, true)) {
                    ITransferManager(transferManager).payAssetOwner(assetId, player, productPrice);
                }
            }
        } else if ((option & 8) != 0) { // CHANCE
            // TODO: perform chance for currentCardId (delegated to ChanceContrat ?)
            IChance(chancesAddress).performChance(gameMaster, player, currentCardId);
            newPosition = IPlayground(playground).getPlayerPosition(player);
        } else if ((option & 16) != 0) { // QUARANTINE
            // TODO: set player in Quarantine
            newPosition = IPlayground(playground).getPlayerPosition(player);
        }
    }

    function checkBalance(address gameMaster, address player, uint256 requiredCash, bool mustContinue) internal returns(bool) {
        return ITransferManager(transferManager).checkBalance(gameMaster, player, requiredCash, mustContinue);
    }
}