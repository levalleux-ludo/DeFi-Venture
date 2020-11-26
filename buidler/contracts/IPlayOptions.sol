//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IPlayOptions {
    function initialize(address _tokenAddress, address _assetsAddress, address _chancesAddress, address _transferManager) external;
    function getOptionsAt(address player, uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) external view returns (uint8 options);
    function performOption(address gameMaster, address player, uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice, uint8 option, uint8 currentCardId) external;
}