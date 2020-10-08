//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("USDC", "USDC") public {
        _mint(msg.sender, initialSupply);
    }
}
