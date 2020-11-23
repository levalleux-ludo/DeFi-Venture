//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import { GameMaster } from "../GameMaster.sol";
import { IPlayground } from '../IPlayground.sol';

contract GameMasterForTest is GameMaster {

    constructor (
        uint8 nbMaxPlayers,
        uint256 _initialAmount,
        address _playground,
        address _chances,
        address _randomGenerator
        ) public GameMaster(nbMaxPlayers, _initialAmount, _playground, _chances, _randomGenerator) {
    }
    function setOptions(uint8 options) public onlyOwner {
        currentOptions = options;
    }

    function setPlayerPosition(address player, uint8 newPosition) public onlyOwner {
        IPlayground(playgroundAddress).setPlayerPosition(player, newPosition);
    }

    function setCardId(uint8 cardId) public onlyOwner {
        currentCardId = cardId;
    }


}