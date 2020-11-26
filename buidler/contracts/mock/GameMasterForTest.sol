//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameMaster } from "../GameMaster.sol";
import { IGameContracts } from '../IGameContracts.sol';
import { IPlayground } from '../IPlayground.sol';

contract GameMasterForTest is GameMaster {

    constructor (
        uint8 nbMaxPlayers,
        uint256 _initialAmount
        ) public GameMaster(nbMaxPlayers, _initialAmount) {
    }
    function setOptions(uint8 options) public onlyOwner {
        currentOptions = options;
    }

    function setPlayerPosition(address player, uint8 newPosition) public onlyOwner {
        address playgroundAddress = IGameContracts(contracts).getPlayground();
        IPlayground(playgroundAddress).setPlayerPosition(player, newPosition);
    }

    function setCardId(uint8 cardId) public onlyOwner {
        currentCardId = cardId;
    }

    function setInitialAmount(uint256 _initialAmount) public onlyOwner {
        initialAmount = _initialAmount;
    }


}