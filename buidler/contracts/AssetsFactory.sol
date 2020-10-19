//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameAssets } from './GameAssets.sol';
import { IContractFactory } from "./IContractFactory.sol";

contract AssetsFactory is IContractFactory {
    function create(address gameMaster) external override returns (address) {
        GameAssets gameAssets = new GameAssets();
        gameAssets.transferOwnership(address(gameMaster));

        return address(gameAssets);
    }
}

