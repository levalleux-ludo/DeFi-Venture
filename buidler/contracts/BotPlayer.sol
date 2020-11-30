//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {GameMaster} from "./GameMaster.sol";
import {IGameToken} from "./IGameToken.sol";
import { IGameAssets } from './IGameAssets.sol';
import {IBotPlayer} from "./IBotPlayer.sol";
import { IGameContracts } from './IGameContracts.sol';

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
        GameMaster gameMaster = GameMaster(gameMasterAddress);
        address tokenAddress = IGameContracts(gameMaster.contracts()).getToken();
        address assetsAddress = IGameContracts(gameMaster.contracts()).getAssets();
        address transferManagerAddress = IGameContracts(gameMaster.contracts()).getTransferManager();
        if (tokenAddress != address(0)) {
            IGameToken token = IGameToken(tokenAddress);
            token.approveMax(transferManagerAddress);
        }
        if (assetsAddress != address(0)) {
            IGameAssets assets = IGameAssets(assetsAddress);
            assets.setApprovalForAll(transferManagerAddress, true);
        }
        console.log('Bot: calling register ...');
        gameMaster.register(username, avatar);
    }

    function rollDices(address gameMasterAddress) external override onlyOwner {
        GameMaster gameMaster = GameMaster(gameMasterAddress);
        console.log('Bot: calling rollDices ...');
        gameMaster.rollDices();
    }

    function play(address gameMasterAddress, uint8 option) external override onlyOwner {
        GameMaster gameMaster = GameMaster(gameMasterAddress);
        console.log('Bot: calling play ...');
        gameMaster.play(option);
    }

}