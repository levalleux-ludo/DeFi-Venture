//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract GameToken is ERC20, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private accountsSet;

    constructor() ERC20("Louis", "LOUIS") public Ownable() {
    }

    /**
    * @dev Creates `amount` new tokens for `to`.
    *
    * See {ERC20-_mint}.
    *
    * Requirements:
    *
    * - the caller must have the `MINTER_ROLE`.
    */
    function mint(address to, uint256 amount) public onlyOwner  {
        _mint(to, amount);
    }

    function reset() public onlyOwner {
        for (uint i = 0; i < accountsSet.length(); i++) {
            address account = accountsSet.at(i);
            uint256 balance = balanceOf(account);
            _burn(account, balance);
        }
        assert(totalSupply() == 0);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) override internal  { 
        if (to != address(0)) {
            accountsSet.add(to);
        }
    }


}
