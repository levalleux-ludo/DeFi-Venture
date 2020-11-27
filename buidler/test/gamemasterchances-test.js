const bre = require("@nomiclabs/buidler");
const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { createGameMasterFull, registerPlayers, createGameToken, createGameAssets, createMarketplace, NULL_ADDRESS, STATUS, revertMessage, startGame, INITIAL_BALANCE } = require('./testsUtils');
const ethers = bre.ethers;

var GameMasterFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;
var TransferManagerFactory;
var ChancesFactory;

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

    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const game = await createGameMasterFull();
        gameMaster = game.gameMaster;
        token = game.token;
        assets = game.assets;
        marketplace = game.marketplace;
        console.log('gameMaster', gameMaster.address);
        await gameMaster.setInitialAmount(BigNumber.from(INITIAL_BALANCE));
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        TransferManagerFactory = await ethers.getContractFactory("TransferManager");
        ChancesFactory = await ethers.getContractFactory("Chance");
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

    })



});