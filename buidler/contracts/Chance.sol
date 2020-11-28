//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IChance } from './IChance.sol';
import { IPlayground } from './IPlayground.sol';
import { ITransferManager } from './ITransferManager.sol';
import { Initialized } from './Initialized.sol';


contract Chance is IChance, Ownable, Initialized {
    uint8 public constant PAY = 1;
    uint8 public constant RECEIVE = 2;
    uint8 public constant MOVE_N_SPACES_FWD = 3;
    uint8 public constant MOVE_N_SPACES_BCK = 4;
    uint8 public constant GOTO_SPACE = 5;
    uint8 public constant IMMUNITY = 6;
    uint8 public constant GO_TO_QUARANTINE = 7;
    uint8 public constant PAY_PER_ASSET = 8;
    uint8 public constant RECEIVE_PER_ASSET = 9;

    bytes32 public chances;

    address playground;
    address transferManager;

    constructor(
        bytes32 _chances
    ) public Ownable() {
        chances = _chances;
    }

    function initialize(address _transferManager, address _playground) external override {
        transferManager = _transferManager;
        playground = _playground;
        super.initialize();
    }

    function getChanceDetails(uint8 chanceId) external view override returns (uint8 chanceType, uint8 chanceParam) {
        require(chanceId < chances.length, "INVALID_ARGUMENT");
        console.log('getChanceDetails', chanceId);
        console.logBytes32(chances);
        chanceType = uint8(chances[31 - (2 * chanceId)]);// Important storage reverse (end-endian)
        console.log('type', chanceType);
        chanceParam = uint8(chances[31 - (1 + 2 * chanceId)]);// Important storage reverse (end-endian)
        console.log('param', chanceParam);
    }

    function performChance(address gameMaster, address player, uint8 cardId) external override onlyOwner initialized {
        console.log('performChance', cardId);
        (uint8 chanceType, uint8 chanceParam) = this.getChanceDetails(cardId);
        if (chanceType == GOTO_SPACE) {
            IPlayground(playground).setPlayerPosition(player, chanceParam);
        } else if (chanceType == MOVE_N_SPACES_BCK) {
            int8 move = -int8(chanceParam);
            IPlayground(playground).incrementPlayerPosition(player, move);
        } else if (chanceType == MOVE_N_SPACES_FWD) {
            int8 move = int8(chanceParam);
            IPlayground(playground).incrementPlayerPosition(player, move);
        } else if (chanceType == PAY) {
            uint256 amount = chanceParam;
            ITransferManager(transferManager).payAmount(gameMaster, player, amount);
        } else if (chanceType == RECEIVE) {
            uint256 amount = chanceParam;
            ITransferManager(transferManager).receiveAmount(player, amount);
        } else if (chanceType == PAY_PER_ASSET) {
            uint256 amount = chanceParam;
            ITransferManager(transferManager).payAmountPerAsset(gameMaster, player, amount);
        } else if (chanceType == RECEIVE_PER_ASSET) {
            uint256 amount = chanceParam;
            ITransferManager(transferManager).receiveAmountPerAsset(player, amount);
        } else if (chanceType == IMMUNITY) {
            IPlayground(playground).giveImmunity(player);
        } else if (chanceType == GO_TO_QUARANTINE) {
            console.log('Chance: gotoQuarantine');
            IPlayground(playground).gotoQuarantine(player);
        }
    }

}