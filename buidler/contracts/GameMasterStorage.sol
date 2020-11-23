//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./IGameToken.sol";
import "./IGameAssets.sol";
import "./IMarketplace.sol";
import "./IGameMaster.sol";

contract GameMasterStorage is Ownable {
    IGameToken internal token;
    address public tokenAddress;
    IGameAssets internal assets;
    address public assetsAddress;
    IMarketplace internal marketplace;
    address public marketplaceAddress;
    uint256 public initialAmount;
    address public currentPlayer;
    // uint8 public nbPositions;
    uint8 public currentOptions;
    uint8 public currentCardId;
    // mapping(address => uint8) public positions;
    // bytes32 public playground;
    // bytes32 public chances;

    function setToken(address _token) external onlyOwner {
        tokenAddress = _token;
        token = IGameToken(_token);
        if (marketplaceAddress != address(0)) {
            marketplace.setToken(_token);
        }
    }

    function setAssets(address _assets) external onlyOwner {
        assetsAddress = _assets;
        assets = IGameAssets(_assets);
        if (marketplaceAddress != address(0)) {
            marketplace.setAssets(_assets);
        }
    }

    function setMarketplace(address _marketplace) external onlyOwner {
        marketplaceAddress = _marketplace;
        marketplace = IMarketplace(_marketplace);
        marketplace.setToken(tokenAddress);
        marketplace.setAssets(assetsAddress);
    }

}