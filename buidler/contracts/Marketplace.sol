//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract Marketplace is Ownable {
    using EnumerableSet for EnumerableSet.UintSet;

    struct Asset {
        uint256 id;
        uint256 fairPrice;
        uint256 minPrice;
    }

    mapping (uint256 => Asset) private assetsPerId;
    uint256[] public assetsForSale;
    EnumerableSet.UintSet private assetsSet;

    event AssetForSale(uint256 assetId, uint256 fairPrice);

    constructor() public Ownable() {
    }

    function bidAttempt(uint256 assetId, uint256 bidPrice) public view returns (bool accepted) {
        require(isAssetForSale(assetId), "ASSET_IS_NOT_FOR_SALE");
        Asset storage asset = assetsPerId[assetId];
        accepted = (asset.minPrice <= bidPrice);
    }
    function getNbSales() public view returns (uint256) {
        return assetsSet.length();
    }

    function getSaleAtIndex(uint256 index) public view returns (uint256) {
        return assetsSet.at(index);
    }

    function isAssetForSale(uint256 assetId) public view returns (bool) {
        return (assetsSet.contains(assetId));
    }

    function bid(uint256 assetId, uint256 bidPrice) public {
        require(bidAttempt(assetId, bidPrice), "BID_REJECTED");
        // TODO: get current owner
        // TODO: transfer token from buyer to owner
        // TODO: transfer asset from owner to buyer
        delete assetsPerId[assetId];
        assetsSet.remove(assetId);
    }

    function sell(uint256 assetId, uint256 fairPrice, uint256 minPrice) public {
        // TODO: check msg.sender is the owner of asset
        Asset memory asset = Asset(assetId, fairPrice, minPrice);
        assetsPerId[assetId] = asset;
        assetsSet.add(assetId);
        emit AssetForSale(assetId, fairPrice);
    }


}
