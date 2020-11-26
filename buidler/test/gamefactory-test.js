const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { getSpaces, getChances } = require("../db/playground");
const bre = require("@nomiclabs/buidler");
const ethers = bre.ethers;

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const NB_CHANCES = 32;

const STATUS = {
    created: 0,
    started: 1,
    frozen: 2,
    ended: 3
};

// generic handlers to test exceptions
const shouldFail = {
    then: () => {
        expect(false).to.equal(true, "must fail");
    },
    catch: (e) => {
        expect(true).to.equal(true, "must fail");
    }
};

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

var gameFactory;
var GameMasterFactory;
var GameContractsFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;
var owner;
var addr1;
var addr2;
var avatarCount = 1;


async function registerPlayers(gameMaster, players) {
    let tokenContract;
    let assetsContract;
    const token = await gameMaster.tokenAddress();
    if (token !== 0) {
        tokenContract = await TokenFactory.attach(token);
        await tokenContract.deployed();
    }
    const assets = await gameMaster.assetsAddress();
    if (assets !== 0) {
        assetsContract = await AssetsFactory.attach(assets);
        await assetsContract.deployed();
    }
    const marketplaceAddr = await gameMaster.marketplaceAddress();
    const transferManagerAddress = await gameMaster.transferManagerAddress();
    for (let player of players) {
        if (tokenContract) {
            await tokenContract.connect(player).approveMax(transferManagerAddress);
            if (marketplaceAddr) {
                await tokenContract.connect(player).approveMax(marketplaceAddr);
            }
        }
        if (assetsContract && marketplaceAddr) {
            await assetsContract.connect(player).setApprovalForAll(marketplaceAddr, true);
        }
        await gameMaster.connect(player).register(utils.formatBytes32String('user' + avatarCount), avatarCount++);
    }
}

async function startGame(gameMaster) {
    await gameMaster.start();
}

describe("GameFactory", function() {
    before('before tests', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const GameFactoryFactory = await ethers.getContractFactory("GameFactory");
        const GameMasterFactoryFactory = await ethers.getContractFactory("GameMasterFactory");
        const GameContractsWrapper = await ethers.getContractFactory("GameContractsWrapper");
        const GameContractsFactoryFactory = await ethers.getContractFactory("GameContractsFactory");
        const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
        const AssetsFactoryFactory = await ethers.getContractFactory("AssetsFactory");
        const MarketplaceFactoryFactory = await ethers.getContractFactory("MarketplaceFactory");
        GameMasterFactory = await ethers.getContractFactory("GameMaster");
        GameContractsFactory = await ethers.getContractFactory("GameContracts");
        TokenFactory = await ethers.getContractFactory("GameToken");
        AssetsFactory = await ethers.getContractFactory("GameAssets");
        MarketplaceFactory = await ethers.getContractFactory("Marketplace");

        const gameMasterFactory = await GameMasterFactoryFactory.deploy();
        const gameContractsWrapper = await GameContractsWrapper.deploy();
        const gameContractsFactory = await GameContractsFactoryFactory.deploy();
        const tokenFactory = await TokenFactoryFactory.deploy();
        const assetsFactory = await AssetsFactoryFactory.deploy();
        const marketplaceFactory = await MarketplaceFactoryFactory.deploy();
        await gameMasterFactory.deployed();
        await gameContractsWrapper.deployed();
        await gameContractsFactory.deployed();
        await tokenFactory.deployed();
        await assetsFactory.deployed();
        await marketplaceFactory.deployed();
        gameFactory = await GameFactoryFactory.deploy(
            gameMasterFactory.address,
            gameContractsWrapper.address,
            gameContractsFactory.address,
            tokenFactory.address,
            assetsFactory.address,
            marketplaceFactory.address
        );
        await gameFactory.deployed();
    })
    it("No game created yet", async function() {
        const nbGames = await gameFactory.nbGames();
        console.log('nbGames', nbGames, nbGames.toString());
        expect(nbGames.toNumber()).to.equal(0);
    });
    it('Should create one game', async function() {
        const spaces = getSpaces(NB_POSITIONS);
        const chances = getChances(NB_CHANCES, NB_POSITIONS);
        await expect(gameFactory.createGameMaster(
            NB_MAX_PLAYERS,
            NB_POSITIONS,
            ethers.BigNumber.from(INITIAL_BALANCE),
            spaces,
            chances
        )).to.emit(gameFactory, 'GameCreated');
        const nbGames = await gameFactory.nbGames();
        console.log('nbGames', nbGames, nbGames.toString());
        expect(nbGames.toNumber()).to.equal(1);
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        await gameFactory.createGameContracts(
            gameMasterAddress,
            NB_MAX_PLAYERS,
            NB_POSITIONS,
            ethers.BigNumber.from(INITIAL_BALANCE),
            spaces,
            chances
        )
        console.log('contracts', await gameMaster.contracts());
        await gameFactory.createGameToken(gameMasterAddress);
        await gameFactory.createGameAssets(gameMasterAddress);
        await gameFactory.createMarketplace(gameMasterAddress);
        const ownerAddress = await owner.getAddress();
        expect(await gameMaster.owner()).to.equal(gameFactory.address);
    });
    it('Game Master Should have token contract', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const tokenAddr = await gameContracts.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = TokenFactory.attach(tokenAddr);
        await token.deployed();
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toNumber()).to.equal(0);
        expect((await token.totalSupply()).toNumber()).to.equal(0);
    });
    it('Game Master Should have assets contract', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const assetsAddr = await gameContracts.getAssets();
        expect(assetsAddr).to.not.equal(0);
        const assets = AssetsFactory.attach(assetsAddr);
        await assets.deployed();
        const addr1Address = addr1.getAddress();
        const balance1 = await assets.balanceOf(addr1Address);
        expect(balance1.toNumber()).to.equal(0);
        expect((await assets.totalSupply()).toNumber()).to.equal(0);
    });
    it('Game Master Should have marketplace contract', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const marketplaceAddr = await gameContracts.getMarketplace();
        expect(marketplaceAddr).to.not.equal(0);
        const marketplace = MarketplaceFactory.attach(marketplaceAddr);
        await marketplace.deployed();
    });
    it('Marketplace should have token and assets contract', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const marketplaceAddr = await gameContracts.getMarketplace();
        expect(marketplaceAddr).to.not.equal(0);
        const marketplace = MarketplaceFactory.attach(marketplaceAddr);
        await marketplace.deployed();
        const tokenAddr = await marketplace.tokenAddress();
        expect(tokenAddr).to.not.equal(0);
        expect(tokenAddr).to.equal(await gameContracts.getToken());
    });
    it('Registered users should have tokens when game starts', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const tokenAddr = await gameContracts.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = TokenFactory.attach(tokenAddr);
        await token.deployed();
        gameMaster.tokenAddress = () => gameContracts.getToken();
        gameMaster.assetsAddress = () => gameContracts.getAssets();
        gameMaster.marketplaceAddress = () => gameContracts.getMarketplace();
        gameMaster.transferManagerAddress = () => gameContracts.getTransferManager();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        expect((await token.totalSupply()).toString()).to.equal(BigNumber.from(INITIAL_BALANCE).mul(2).toString());
    });
    it('Players shall be able to play', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const addr1Address = addr1.getAddress();
        console.log('gameMasterAddress', gameMasterAddress);
        await gameMaster.connect(addr1).rollDices();
    });
    it('End the game shall not reset the balances', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
        await gameContracts.deployed();
        const tokenAddr = await gameContracts.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = TokenFactory.attach(tokenAddr);
        await token.deployed();
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        await gameMaster.end();
        const balance1after = await token.balanceOf(addr1Address);
        expect(balance1after.toNumber()).to.equal(balance1);
    })

});