//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameToken } from './GameToken.sol';
import { IContractFactory } from "./IContractFactory.sol";

contract TokenFactory is IContractFactory {
    function create(address gameMaster) external override returns (address) {
        GameToken gameToken = new GameToken();
        gameToken.transferOwnership(address(gameMaster));

        return address(gameToken);
    }
}

