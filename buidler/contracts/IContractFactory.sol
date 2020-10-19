//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameToken } from './GameToken.sol';

interface IContractFactory {
    function create(address gameMaster) external returns (address);
}

