//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IGameMaster} from "./IGameMaster.sol";
import {IGameToken} from "./IGameToken.sol";
import {IBotPlayer} from "./IBotPlayer.sol";

contract BotPlayer is Ownable, IBotPlayer, IERC721Receiver {
    constructor() public Ownable() {}

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function register(address gameMasterAddress, bytes32 username, uint8 avatar) external override onlyOwner {
        IGameMaster gameMaster = IGameMaster(gameMasterAddress);
        address tokenAddress = gameMaster.getToken();
        if (tokenAddress != address(0)) {
            IGameToken token = IGameToken(tokenAddress);
            token.approveMax(gameMasterAddress);
        }
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