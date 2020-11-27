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

contract PlayOptions is IPlayOptions {
    address public tokenAddress;
    address public assetsAddress;
    address public chancesAddress;
    address public transferManager;
    address public playground;

    modifier initialized() {
        require(tokenAddress != address(0), "TOKEN_CONTRACT_NOT_DEFINED");
        require(assetsAddress != address(0), "ASSETS_CONTRACT_NOT_DEFINED");
        require(chancesAddress != address(0), "CHANCES_CONTRACT_NOT_DEFINED");
        _;
    }
    constructor() public {}

    function initialize(address _tokenAddress, address _assetsAddress, address _chancesAddress, address _transferManager, address _playground) external override {
        tokenAddress = _tokenAddress;
        assetsAddress = _assetsAddress;
        chancesAddress = _chancesAddress;
        transferManager = _transferManager;
        playground = _playground;
    }

    function getOptionsAt(address player, uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) external view override initialized returns (uint8 options) {
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

    function performOption(address gameMaster, address player, uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice, uint8 option, uint8 currentCardId) external override initialized returns (uint8 realOption) {
        realOption = option;
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
            IChance(chancesAddress).performChance(currentCardId);
        } else if ((option & 16) != 0) { // QUARANTINE
            // TODO: set player in Quarantine
        }
    }

    function checkBalance(address gameMaster, address player, uint256 requiredCash, bool mustContinue) internal returns(bool) {
        if (IGameToken(tokenAddress).balanceOf(player) < requiredCash) {
            console.log('checkBalance: NOK');
            console.logUint(requiredCash);
            // if the player owns some assets, liquidate them and check again
            uint256 assetsBalance = IGameAssets(assetsAddress).balanceOf(player);
            if (assetsBalance > 0) {
               console.log('checkBalance: perform liquidation');
                ITransferManager(transferManager).liquidate(player, assetsBalance, playground);
                // if the play action must continue after liquidation, recheck to see if balance is now enough to pay requiredCash
                return mustContinue && checkBalance(gameMaster, player, requiredCash, mustContinue);
            } else {
                console.log('checkBalance: perform play lost');
                IGameScheduler(gameMaster).playerLost(player);
            }
            return false;
        }
        console.log('checkBalance: OK');
        return true;
    }
}