//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { ITransferManager } from './ITransferManager.sol';

import { IGameAssets } from './IGameAssets.sol';
import { IGameToken } from './IGameToken.sol';
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import { IPlayground } from './IPlayground.sol';

contract TransferManager is ITransferManager {
    uint256 constant public MAX_UINT256 = 2**256 - 1;
    address private token;
    address private assets;
    event PlayerLiquidated(address indexed player);

    function setToken(address _token) external override {
        token = _token;
    }
    function setAssets(address _assets) external override {
        assets = _assets;
    }
    function getToken() external view override returns (address) {
        return token;
    }
    function getAssets() external view override returns (address) {
        return assets;
    }
    function buyAsset(uint256 assetId, address buyer, uint256 assetPrice) external override {
        require(token != address(0), "TOKEN_NOT_DEFINED");
        require(assets != address(0), "ASSETS_NOT_DEFINED");
        console.log('mint asset');
        console.logUint(assetId);
        console.log('for player', buyer);
        IGameToken(token).burnTokensFrom(buyer, assetPrice);
        IGameAssets(assets).safeMint(buyer, assetId);
    }

    function payAssetOwner(uint256 assetId, address player, uint256 productPrice) external override {
        require(token != address(0), "TOKEN_NOT_DEFINED");
        require(assets != address(0), "ASSETS_NOT_DEFINED");
        address owner = IGameAssets(assets).ownerOf(uint256(assetId));
        IGameToken(token).transferFrom(player, owner, productPrice);
    }

    function checkAllowance(address account) external view override {
        require(token != address(0), "TOKEN_NOT_DEFINED");
        require(IGameToken(token).allowance(account, address(this)) == MAX_UINT256, "PLAYER_MUST_APPROVE_TRANSFER_MANAGER_FOR_TOKEN");
        require(assets != address(0), "ASSETS_NOT_DEFINED");
        require(IGameAssets(assets).isApprovedForAll(account, address(this)), "PLAYER_MUST_APPROVE_TRANSFER_MANAGER_FOR_ASSETS");
    }

    function giveAmount(uint256 amount, address[] calldata players, uint nbPlayers) external override {
        // require(token != address(0), "TOKEN_NOT_DEFINED");
        console.log('nb players', nbPlayers);
        for (uint i = 0; i < nbPlayers; i++) {
            address player = players[i];
            console.log('giveAmount to ', player);
            console.logUint(amount);
            if (token != address(0)) {
                IGameToken(token).mint(player, amount);
            }
        }
    }

    function liquidate(address player, uint256 assetsBalance, address playground) external override {
        console.log('liquidate player', player);
        uint256 amount = 0;
        uint256 balance = ERC721Burnable(assets).balanceOf(player);
        while (balance > 0) {
            uint256 assetId = ERC721Burnable(assets).tokenOfOwnerByIndex(player, 0);
            ERC721Burnable(assets).burn(assetId);
            (uint256 assetPrice, uint256 productPrice) = IPlayground(playground).getAssetData(uint8(assetId));
            amount += assetPrice / 2;
            balance = ERC721Burnable(assets).balanceOf(player);
        }
        IGameToken(token).mint(player, amount);
        emit PlayerLiquidated(player);
    }
}