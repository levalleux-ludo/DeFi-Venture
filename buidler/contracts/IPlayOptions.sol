//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IPlayOptions {
    function initialize(address _tokenAddress, address _assetsAddress, address _chancesAddress, address _transferManager, address _playground) external;
    function getOptionsAt(address player, uint8 position) external view returns (uint8 options);
    function performOption(address gameMaster, address player, uint8 option, uint8 currentCardId) external returns (uint8 realOption, uint8 newPosition);
}