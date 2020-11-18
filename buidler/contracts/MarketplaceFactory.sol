//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { Marketplace } from './Marketplace.sol';
import { IContractFactory } from "./IContractFactory.sol";

contract MarketplaceFactory is IContractFactory {
    function create(address gameMaster) external override returns (address) {
        Marketplace marketplace = new Marketplace();
        marketplace.transferOwnership(address(gameMaster));
        return address(marketplace);
    }
}

