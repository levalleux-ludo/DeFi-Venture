//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IGameMaster} from "./IGameMaster.sol";
import {IBotPlayer} from "./IBotPlayer.sol";

contract BotPlayer is Ownable, IBotPlayer {
    constructor() public Ownable() {}

    function register(address gameMasterAddress, bytes32 username, uint8 avatar) external override onlyOwner {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        console.log('Bot: calling register ...');
        gameMaster.register(username, avatar);
    }

    function rollDices(address gameMasterAddress) external override onlyOwner {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        console.log('Bot: calling rollDices ...');
        gameMaster.rollDices();
    }

    function play(address gameMasterAddress, uint8 option) external override onlyOwner {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        console.log('Bot: calling play ...');
        gameMaster.play(option);
    }

}