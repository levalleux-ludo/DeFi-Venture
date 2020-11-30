//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IAssetsManager {
    function initialize(address _transferManager) external;
    function setAssetData(uint8 assetId, uint8 assetClass) external;
    function getAssetData(uint8 assetId) external view returns (uint256 assetValue, uint256 productPrice);
    function investInAsset(uint8 assetId, uint256 amount) external;

}