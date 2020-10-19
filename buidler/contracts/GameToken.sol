//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract GameToken is ERC20Burnable, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private accountsSet;
    uint256 constant public MAX_UINT256 = 2**256 - 1;

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
    
    function burnFrom(address account, uint256 amount) public override {
        console.log('allowance');
        console.log("account");
        console.logAddress(account);
        console.log("sender");
        console.logAddress(_msgSender());
        console.logUint(allowance(account, _msgSender()));
        console.logUint(allowance(_msgSender(), account));
        super.burnFrom(account, amount);
    }

    function approveMax(address spender) external returns (bool) {
        approve(spender, MAX_UINT256);
    }


}
