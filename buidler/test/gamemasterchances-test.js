const bre = require("@nomiclabs/buidler");
const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { NB_CHANCES, NB_SPACES } = require("../db/playground");
const { eOption, createGameMasterFull, registerPlayers, createGameToken, createGameAssets, createMarketplace, GAME_DATA_FIELDS, USER_DATA_FIELDS, NULL_ADDRESS, STATUS, revertMessage, startGame, INITIAL_BALANCE } = require('./testsUtils');
const ethers = bre.ethers;

var GameMasterFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;
var TransferManagerFactory;
var ChancesFactory;

async function verifyChance(chances, chanceId, expectedType, expectedParam) {
    const chanceData = await chances.getChanceDetails(chanceId);
    expect(chanceData[0]).to.equal(expectedType);
    expect(chanceData[1]).to.equal(expectedParam);
}

const eChanceType = {
    INVALID: 0,
    PAY: 1,
    RECEIVE: 2,
    MOVE_N_SPACES_FWD: 3,
    MOVE_N_SPACES_BCK: 4,
    GOTO_SPACE: 5,
    IMMUNITY: 6,
    GO_TO_QUARANTINE: 7,
    PAY_PER_ASSET: 8,
    RECEIVE_PER_ASSET: 9
}

describe('Game play with chances', () => {
    var gameMaster;
    var token;
    var assets;
    var marketplace;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;
    var addr3;
    var addr3Address;
    var chances;

    before('before', async() => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const game = await createGameMasterFull();
        gameMaster = game.gameMaster;
        token = game.token;
        assets = game.assets;
        marketplace = game.marketplace;
        console.log('gameMaster', gameMaster.address);
        await gameMaster.setInitialAmount(BigNumber.from(INITIAL_BALANCE));
        await registerPlayers(gameMaster, [addr1, addr2, addr3]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        addr3Address = await addr3.getAddress();
        TransferManagerFactory = await ethers.getContractFactory("TransferManager");
        ChancesFactory = await ethers.getContractFactory("Chance");
        const chancesAddress = await gameMaster.chancesAddress();
        chances = ChancesFactory.attach(chancesAddress);
    });
    it('verify initial conditions', async() => {
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        const balance2 = await token.balanceOf(addr2Address);
        expect(balance2.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        const assets1 = await assets.balanceOf(addr1Address);
        expect(assets1.toString()).to.equal('0');
        const assets2 = await assets.balanceOf(addr2Address);
        expect(assets2.toString()).to.equal('0');
        await verifyChance(chances, 0, eChanceType.PAY_PER_ASSET, 15);
        await verifyChance(chances, 2, eChanceType.RECEIVE, 100);
        await verifyChance(chances, 4, eChanceType.PAY, 100);
        await verifyChance(chances, 6, eChanceType.GO_TO_QUARANTINE, 0);
        await verifyChance(chances, 8, eChanceType.RECEIVE_PER_ASSET, 10);
        await verifyChance(chances, 9, eChanceType.GOTO_SPACE, 14);
        await verifyChance(chances, 14, eChanceType.MOVE_N_SPACES_BCK, 3);
        await verifyChance(chances, 15, eChanceType.IMMUNITY, 0);
    });
    it('Player 1 play chance #9 GOTO_SPACE', async() => {
        await verifyChance(chances, 9, eChanceType.GOTO_SPACE, 14);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        const positionBefore = await gameMaster.getPositionOf(addr1Address);
        expect(positionBefore).to.not.equal(14);
        await gameMaster.setCardId(9);
        await gameMaster.setOptions(8); // CHANCE
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const positionAfter = await gameMaster.getPositionOf(addr1Address);
        expect(positionAfter).to.equal(14);
    });
    it('Player 2 buy asset #6 at position 8', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr2Address, 8); // ASSET id 6
        const position = await gameMaster.getPositionOf(addr2Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr2).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 2, 12, position);
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #14 MOVE_N_SPACES_BCK', async() => {
        await verifyChance(chances, 14, eChanceType.MOVE_N_SPACES_BCK, 3);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        const positionBefore = await gameMaster.getPositionOf(addr1Address);
        let expectedPosition = positionBefore - 3;
        if (expectedPosition < 0) {
            expectedPosition += NB_SPACES;
        }
        await gameMaster.setCardId(14);
        await gameMaster.setOptions(8); // CHANCE
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const positionAfter = await gameMaster.getPositionOf(addr1Address);
        expect(positionAfter).to.equal(expectedPosition);
    });
    it('Player 2 buy asset #9 at position 13', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr2Address, 13); // ASSET id 9
        const position = await gameMaster.getPositionOf(addr2Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr2).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 2, 12, position);
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #4 PAY', async() => {
        await verifyChance(chances, 4, eChanceType.PAY, 100);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(4);
        await gameMaster.setOptions(8); // CHANCE
        const balanceBefore = await token.balanceOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr1Address);
        expect(balanceBefore.sub(balanceAfter).toString()).to.equal('100');
    });
    it('Player 2 play chance #2 RECEIVE', async() => {
        await verifyChance(chances, 2, eChanceType.RECEIVE, 100);
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(2);
        await gameMaster.setOptions(8); // CHANCE
        const balanceBefore = await token.balanceOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr2Address);
        expect(balanceAfter.sub(balanceBefore).toString()).to.equal('100');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #0 PAY_PER_ASSET with no assets', async() => {
        await verifyChance(chances, 0, eChanceType.PAY_PER_ASSET, 15);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(0);
        await gameMaster.setOptions(8); // CHANCE
        // Player1 does not own any asset, so he wont pay anything
        const balance1AssetsBefore = await assets.balanceOf(addr1Address);
        expect(balance1AssetsBefore.toString()).to.equal('0');
        const balanceBefore = await token.balanceOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr1Address);
        expect(balanceAfter.toString()).to.equal(balanceBefore.toString());
    });
    it('Player 2 play chance #0 PAY_PER_ASSET with some assets', async() => {
        await verifyChance(chances, 0, eChanceType.PAY_PER_ASSET, 15);
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(0);
        await gameMaster.setOptions(8); // CHANCE
        // Player1 does not own any asset, so he wont pay anything
        const balanceAssetsBefore = await assets.balanceOf(addr2Address);
        expect(balanceAssetsBefore.toString()).to.equal('2');
        const balanceBefore = await token.balanceOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr2Address);
        expect(balanceBefore.sub(balanceAfter).toString()).to.equal((2 * 15).toString());
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #8 RECEIVE_PER_ASSET with no assets', async() => {
        await verifyChance(chances, 8, eChanceType.RECEIVE_PER_ASSET, 10);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(8);
        await gameMaster.setOptions(8); // CHANCE
        // Player1 does not own any asset, so he wont pay anything
        const balance1AssetsBefore = await assets.balanceOf(addr1Address);
        expect(balance1AssetsBefore.toString()).to.equal('0');
        const balanceBefore = await token.balanceOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr1Address);
        expect(balanceAfter.toString()).to.equal(balanceBefore.toString());
    });
    it('Player 2 play chance #8 RECEIVE_PER_ASSET with some assets', async() => {
        await verifyChance(chances, 8, eChanceType.RECEIVE_PER_ASSET, 10);
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(8);
        await gameMaster.setOptions(8); // CHANCE
        // Player1 does not own any asset, so he wont pay anything
        const balanceAssetsBefore = await assets.balanceOf(addr2Address);
        expect(balanceAssetsBefore.toString()).to.equal('2');
        const balanceBefore = await token.balanceOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const balanceAfter = await token.balanceOf(addr2Address);
        expect(balanceAfter.sub(balanceBefore).toString()).to.equal((2 * 10).toString());
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #15 IMMUNITY', async() => {
        await verifyChance(chances, 15, eChanceType.IMMUNITY, 0);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(15);
        await gameMaster.setOptions(8); // CHANCE
        const playerDataBefore = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataBefore[USER_DATA_FIELDS.hasImmunity]).to.equal(false);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed');
        const playerDataAfter = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataAfter[USER_DATA_FIELDS.hasImmunity]).to.equal(true);
    });
    it('Player 2 play chance #6 GO_TO_QUARANTINE', async() => {
        await verifyChance(chances, 6, eChanceType.GO_TO_QUARANTINE, 0);
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(6);
        await gameMaster.setOptions(8); // CHANCE
        const quarantinePosition = await gameMaster.getQuarantinePosition()
        const playerDataBefore = await gameMaster.getPlayerData(addr2Address);
        expect(playerDataBefore[USER_DATA_FIELDS.hasImmunity]).to.equal(false);
        expect(playerDataBefore[USER_DATA_FIELDS.isInQuarantine]).to.equal(false);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 8, 6, quarantinePosition);
        const playerDataAfter = await gameMaster.getPlayerData(addr2Address);
        expect(playerDataAfter[USER_DATA_FIELDS.isInQuarantine]).to.equal(true);
        expect(playerDataAfter[USER_DATA_FIELDS.position]).to.equal(quarantinePosition);
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #6 GO_TO_QUARANTINE with immunity', async() => {
        await verifyChance(chances, 6, eChanceType.GO_TO_QUARANTINE, 0);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(6);
        await gameMaster.setOptions(8); // CHANCE
        const playerDataBefore = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataBefore[USER_DATA_FIELDS.hasImmunity]).to.equal(true);
        expect(playerDataBefore[USER_DATA_FIELDS.isInQuarantine]).to.equal(false);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 8, 6, playerDataBefore[USER_DATA_FIELDS.position]);
        const playerDataAfter = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataAfter[USER_DATA_FIELDS.hasImmunity]).to.equal(false);
        expect(playerDataAfter[USER_DATA_FIELDS.isInQuarantine]).to.equal(false);
    });
    it('Player 2 can not play (quarantine 1st round))', async() => {
        expect(await gameMaster.nextPlayer()).to.not.equal(addr2Address, "current player shall be changed");
        const playerData = await gameMaster.getPlayerData(addr2Address);
        expect(playerData[USER_DATA_FIELDS.isInQuarantine]).to.equal(true);
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 play chance #6 GO_TO_QUARANTINE with no immunity anymore', async() => {
        await verifyChance(chances, 6, eChanceType.GO_TO_QUARANTINE, 0);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setCardId(6);
        await gameMaster.setOptions(8); // CHANCE
        const quarantinePosition = await gameMaster.getQuarantinePosition()
        const playerDataBefore = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataBefore[USER_DATA_FIELDS.hasImmunity]).to.equal(false);
        expect(playerDataBefore[USER_DATA_FIELDS.isInQuarantine]).to.equal(false);
        await expect(gameMaster.connect(addr1).play(8)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 8, 6, quarantinePosition);
        const playerDataAfter = await gameMaster.getPlayerData(addr1Address);
        expect(playerDataAfter[USER_DATA_FIELDS.hasImmunity]).to.equal(false);
        expect(playerDataAfter[USER_DATA_FIELDS.isInQuarantine]).to.equal(true);
        expect(playerDataAfter[USER_DATA_FIELDS.position]).to.equal(quarantinePosition);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 can not play (quarantine 1st round))', async() => {
        expect(await gameMaster.nextPlayer()).to.not.equal(addr1Address, "current player shall be changed");
        const playerData = await gameMaster.getPlayerData(addr1Address);
        expect(playerData[USER_DATA_FIELDS.isInQuarantine]).to.equal(true);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 1 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "current player shall be changed");
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(eOption.NOTHING); // NOTHING
        await expect(gameMaster.connect(addr1).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });

});