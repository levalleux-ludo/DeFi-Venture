//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./GameToken.sol";
import "./GameAssets.sol";

import { IMarketplace } from "./IMarketplace.sol";

contract Marketplace is Ownable, IMarketplace {
    using EnumerableSet for EnumerableSet.UintSet;

    struct Asset {
        uint256 id;
        uint256 fairPrice;
        uint256 minPrice;
    }

    mapping (uint256 => Asset) public assetsPerId;
    uint256[] public assetsForSale;
    EnumerableSet.UintSet private assetsSet;
    GameToken private token;
    address public tokenAddress;
    GameAssets private assets;
    address public assetsAddress;

    event AssetForSale(uint256 assetId, uint256 fairPrice);

    constructor() public Ownable() {
    }

    function setToken(address _token) external override onlyOwner {
        tokenAddress = _token;
        token = GameToken(_token);
    }

    function setAssets(address _assets) external override onlyOwner {
        assetsAddress = _assets;
        assets = GameAssets(_assets);
    }

    // function getToken() external override view returns (address) {
    //     return tokenAddress;
    // }

    // function getAssets() external override view returns (address) {
    //     return assetsAddress;
    // }

    function bidAttempt(uint256 assetId, uint256 bidPrice) external override view returns (bool accepted) {
        require(this.isAssetForSale(assetId), "ASSET_IS_NOT_FOR_SALE");
        Asset storage asset = assetsPerId[assetId];
        accepted = (asset.minPrice <= bidPrice);
    }
    function getNbSales() external override view returns (uint256) {
        console.log('getNbSales');
        console.log(assetsSet.length());
        return assetsSet.length();
    }

    function getSaleAtIndex(uint256 index) external override view returns (uint256) {
        return assetsSet.at(index);
    }

    function isAssetForSale(uint256 assetId) external override view returns (bool) {
        return (assetsSet.contains(assetId));
    }

    function bid(uint256 assetId, uint256 bidPrice) external override {
        require(this.bidAttempt(assetId, bidPrice), "BID_REJECTED");
        if (assetsAddress != address(0)) {
            address owner = assets.ownerOf(assetId);
            uint256 price = _computePrice(assetId, bidPrice);
            _performTransfer(assetId, price, owner, msg.sender);
        }
        delete assetsPerId[assetId];
        assetsSet.remove(assetId);
        console.log('nbSales');
        console.log(assetsSet.length());
    }

    function sell(uint256 assetId, uint256 fairPrice, uint256 minPrice) external override {
        if (assetsAddress != address(0)) {
            require(assets.ownerOf(assetId) == msg.sender, "ONLY_ASSET_OWNER_CAN_SELL");
        }
        Asset memory asset = Asset(assetId, fairPrice, minPrice);
        assetsPerId[assetId] = asset;
        assetsSet.add(assetId);
        emit AssetForSale(assetId, fairPrice);
    }

    function _performTransfer(uint256 assetId, uint256 price, address seller, address buyer) internal {
        if((tokenAddress != address(0)) && assetsAddress != address(0)) {
            console.log("perform asset transfer");
            console.log("this");
            console.logAddress(address(this));
            console.log("sender");
            console.logAddress(msg.sender);
            console.logUint(token.allowance(msg.sender, address(this)));
            token.transferFrom(buyer, seller, price);
            assets.safeTransferFrom(seller, buyer, assetId);
        }
    }

    function _computePrice(uint256 assetId, uint256 bidPrice) internal returns(uint256) {
        Asset storage asset = assetsPerId[assetId];
        if (bidPrice >= asset.fairPrice) {
            return asset.fairPrice;
        }
        return bidPrice;
    }


}
