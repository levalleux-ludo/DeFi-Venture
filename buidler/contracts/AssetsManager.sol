//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { Initialized } from './Initialized.sol';
import { ITransferManager } from './ITransferManager.sol';
import { IAssetsManager } from './IAssetsManager.sol';


contract AssetsManager is IAssetsManager, Initialized {
    struct AssetData {
        uint8 class; // 1, 2, 3 or 4
        uint256 assetValue;
        uint256 productPrice;
    }
    
    uint8 private constant ROI_CLASS_1 = 50;// % ROI on invest amounts
    uint8 private constant ROI_CLASS_2 = 60;// % ROI on invest amounts
    uint8 private constant ROI_CLASS_3 = 75;// % ROI on invest amounts
    uint8 private constant ROI_CLASS_4 = 100;// % ROI on invest amounts
    uint8[4] public ROI = [
        ROI_CLASS_1,
        ROI_CLASS_2,
        ROI_CLASS_3,
        ROI_CLASS_4
    ];

    address private transferManager;
    mapping(uint8 => AssetData) public assetDatas;

    function initialize(address _transferManager) external override {
        transferManager = _transferManager;
        super.initialize();
    }

    function setAssetData(uint8 assetId, uint8 assetClass) external override {
        require((assetClass >= 1) && (assetClass <= 4), "INALID_ASSET_CLASS");
        assetDatas[assetId].class = assetClass;
        assetDatas[assetId].assetValue = 50 * assetClass;
        assetDatas[assetId].productPrice = 15 * assetClass; // start with 30% ROI
    }

    function getAssetData(uint8 assetId) external view override returns (uint256 assetValue, uint256 productPrice) {
        require(assetDatas[assetId].class != 0, "INVALID_ASSET_ID");
        assetValue = assetDatas[assetId].assetValue;
        productPrice = assetDatas[assetId].productPrice;
    }

    function investInAsset(uint8 assetId, uint256 amount) external override initialized {
        ITransferManager(transferManager).payAmount(msg.sender, amount);
        assetDatas[assetId].assetValue += amount;
        uint256 roi = amount * ROI[assetDatas[assetId].class - 1] / 100;
        assetDatas[assetId].productPrice += roi;
    }

}