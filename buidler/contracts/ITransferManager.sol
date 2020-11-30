//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface ITransferManager {
    function initialize(address _token, address _assets, address _playground) external;
    function getToken() external view returns (address);
    function getAssets() external view returns (address);
    function buyAsset(uint256 assetId, address buyer, uint256 assetPrice) external;
    function payAssetOwner(uint256 assetId, address player, uint256 productPrice) external;
    function checkAllowance(address account) external view;
    function giveAmount(uint256 amount, address[] calldata players, uint nbPlayers) external;
    function payAmount(address player, uint256 amount) external;
    function payAmount(address gameMaster, address player, uint256 amount) external;
    function receiveAmount(address player, uint256 amount) external;
    function payAmountPerAsset(address gameMaster, address player, uint256 amount) external;
    function receiveAmountPerAsset(address player, uint256 amount) external;
    function checkBalance(address gameMaster, address player, uint256 requiredCash, bool mustContinue) external returns(bool);
    function giveUBI(address player) external;
}
