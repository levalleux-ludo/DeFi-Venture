//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface ITransferManager {
    function setToken(address _token) external;
    function setAssets(address _assets) external;
    function getToken() external view returns (address);
    function getAssets() external view returns (address);
    function buyAsset(uint256 assetId, address buyer, uint256 assetPrice) external;
    function payAssetOwner(uint256 assetId, address player, uint256 productPrice) external;
    function checkAllowance(address account) external view;
    function giveAmount(uint256 amount, address[] calldata players, uint nbPlayers) external;
    function liquidate(address player, uint256 assetsBalance, address playground) external;
}