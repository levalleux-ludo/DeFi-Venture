//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IGameContracts } from "./IGameContracts.sol";

contract GameMasterStorage is Ownable {
    address public contracts;
    uint256 public initialAmount;
    address public currentPlayer;
    uint8 public currentOptions;
    uint8 public currentCardId;

    function setContracts(address _contracts) external onlyOwner {
        contracts = _contracts;
    }
}