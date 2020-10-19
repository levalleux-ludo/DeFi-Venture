//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "../GameMaster.sol";

contract GameMasterForTest is GameMaster {

    constructor (
        uint8 nbMaxPlayers,
        uint8 _nbPositions,
        uint256 _initialAmount,
        bytes32 _playground,
        bytes32 _chances
        ) public GameMaster(nbMaxPlayers, _nbPositions, _initialAmount, _playground, _chances) {
    }
    function setOptions(uint8 options) public onlyOwner {
        currentOptions = options;
    }

    function setPlayerPosition(address player, uint8 newPosition) public onlyOwner {
        positions[player] = newPosition;
    }

    function setCardId(uint8 cardId) public onlyOwner {
        currentCardId = cardId;
    }


}