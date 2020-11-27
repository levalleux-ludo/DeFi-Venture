//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import { IGameAssets } from "./IGameAssets.sol";

contract GameAssets is ERC721Burnable, Ownable, IGameAssets {
    using EnumerableSet for EnumerableSet.UintSet;

    EnumerableSet.UintSet private tokenIdsSet;

    constructor() ERC721("Startups", "AST") public Ownable() {
    }

    function exists(uint256 tokenId) external override view returns (bool) {
        return _exists(tokenId);
    }

    /**
    * @dev Safely mints tokenId and transfers it to to.
    *
    * Requirements:
    *
    * - d* - tokenId must not exist
    */
    function safeMint(address to, uint256 tokenId) external override onlyOwner  {
        _safeMint(to, tokenId);
        tokenIdsSet.add(tokenId);
    }

    function reset() external override onlyOwner {
        uint256 totalTokens = totalSupply();
        for (uint i = 0; i < totalTokens; i++) {
            uint256 tokenId = tokenByIndex(i);
            _burn(tokenId);
        }
        assert(totalSupply() == 0);
    }

}
