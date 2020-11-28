//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";

interface IGameAssets is IERC721Enumerable {
    function exists(uint256 tokenId) external view returns (bool);
    function safeMint(address to, uint256 tokenId) external;
    function burn(uint256 tokenId) external;
    function reset() external;
}
