//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGameToken is IERC20 {
    function approveMax(address spender) external returns (bool);
}
