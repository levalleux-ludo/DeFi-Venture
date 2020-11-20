//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IGameAssets is IERC721 {
    function exists(uint256 tokenId) external view returns (bool);
    function safeMint(address to, uint256 tokenId) external;
    function reset() external;
}
