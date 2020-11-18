//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;
interface IMarketplace {
    event AssetForSale(uint256 assetId, uint256 fairPrice);
    function setToken(address _token) external;
    function setAssets(address _assets) external;
    function getToken() external view returns (address);
    function getAssets() external view returns (address);
    function bidAttempt(uint256 assetId, uint256 bidPrice) external view returns (bool accepted);
    function getNbSales() external view returns (uint256);
    function getSaleAtIndex(uint256 index) external view returns (uint256);
    function isAssetForSale(uint256 assetId) external view returns (bool);
    function bid(uint256 assetId, uint256 bidPrice) external;
    function sell(uint256 assetId, uint256 fairPrice, uint256 minPrice) external;
}