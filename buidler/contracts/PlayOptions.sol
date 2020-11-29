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
    uint8 public constant OPTION_NOTHING = 1;
    uint8 public constant OPTION_BUY_ASSET = 2;
    uint8 public constant OPTION_PAY_BILL = 4;
    uint8 public constant OPTION_CHANCE = 8;
    uint8 public constant OPTION_QUARANTINE = 16;

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
            || (spaceType == 2 )// QUARANTINE
        ) {
            options = OPTION_NOTHING;
        } else if (spaceType == 1) { // COVID
            options = OPTION_QUARANTINE;
        } else if (spaceType == 3) { // CHANCE
            options = OPTION_CHANCE;
        } else { // ASSETS
            if (assetsAddress != address(0)) {
                if (IGameAssets(assetsAddress).exists(uint256(assetId))) {
                    address owner = IGameAssets(assetsAddress).ownerOf(uint256(assetId));
                    if (owner != player) {
                        options = OPTION_PAY_BILL;
                    } else {
                        options = OPTION_NOTHING;
                    }
                } else {
                    options = OPTION_BUY_ASSET | OPTION_NOTHING;
                }
            } else {
                options = OPTION_NOTHING;
            }
        }

    }

    function performOption(address gameMaster, address player, uint8 option, uint8 currentCardId) external override initialized returns (uint8 realOption, uint8 newPosition) {
        uint8 position = IPlayground(playground).getPlayerPosition(player);
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = IPlayground(playground).getSpaceDetails(position);
        realOption = option;
        newPosition = position;
        if ((option & OPTION_NOTHING) != 0) { // NOTHING

        } else if ((option & OPTION_BUY_ASSET) != 0) { // BUY_ASSET
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(gameMaster, player, assetPrice, false)) {
                    ITransferManager(transferManager).buyAsset(assetId, player, assetPrice);
                } else {
                    // real played option is NOTHING
                    realOption = OPTION_NOTHING;// NOTHING
                }
            }
        } else if ((option & OPTION_PAY_BILL) != 0) { // PAY_BILL
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(gameMaster, player, productPrice, true)) {
                    ITransferManager(transferManager).payAssetOwner(assetId, player, productPrice);
                }
            }
        } else if ((option & OPTION_CHANCE) != 0) { // CHANCE
            IChance(chancesAddress).performChance(gameMaster, player, currentCardId);
            newPosition = IPlayground(playground).getPlayerPosition(player);
        } else if ((option & OPTION_QUARANTINE) != 0) { // COVID
            IPlayground(playground).gotoQuarantine(gameMaster, player);
            newPosition = IPlayground(playground).getPlayerPosition(player);
        }
    }

    function checkBalance(address gameMaster, address player, uint256 requiredCash, bool mustContinue) internal returns(bool) {
        return ITransferManager(transferManager).checkBalance(gameMaster, player, requiredCash, mustContinue);
    }
}