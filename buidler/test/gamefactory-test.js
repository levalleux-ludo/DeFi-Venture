const { expect } = require("chai");
const { BigNumber } = require("ethers");

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

var GameFactoryFactory;
var gameFactory;
var GameMasterFactory;
var GameTokenFactory;
var owner;
var addr1;
var addr2;


async function registerPlayers(gameMaster, players) {
    for (let player of players) {
        await gameMaster.connect(player).register();
    }
}

async function startGame(gameMaster) {
    await gameMaster.start();
}

describe("GameFactory", function() {
    before('', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        GameFactoryFactory = await ethers.getContractFactory("GameFactory");
        GameMasterFactory = await ethers.getContractFactory("GameMaster");
        GameTokenFactory = await ethers.getContractFactory("GameToken");
        gameFactory = await GameFactoryFactory.deploy();
        await gameFactory.deployed();
    })
    it("No game created yet", async function() {
        const nbGames = await gameFactory.nbGames();
        console.log('nbGames', nbGames, nbGames.toString());
        expect(nbGames.toNumber()).to.equal(0);
    });
    it('Should create one game', async function() {
        await gameFactory.create();
        const nbGames = await gameFactory.nbGames();
        console.log('nbGames', nbGames, nbGames.toString());
        expect(nbGames.toNumber()).to.equal(1);
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const ownerAddress = await owner.getAddress();
        expect(await gameMaster.owner()).to.equal(gameFactory.address);
    });
    it('Game Master Should have token contract', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const tokenAddr = await gameMaster.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = GameTokenFactory.attach(tokenAddr);
        await token.deployed();
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toNumber()).to.equal(0);
        expect((await token.totalSupply()).toNumber()).to.equal(0);
    });
    it('Registered users should have tokens when game starts', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const tokenAddr = await gameMaster.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = GameTokenFactory.attach(tokenAddr);
        await token.deployed();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(10).pow(18).mul(1000).toString());
        expect((await token.totalSupply()).toString()).to.equal(BigNumber.from(10).pow(18).mul(1000).mul(2).toString());
    });
    it('End the game shall reset the balances', async function() {
        const gameMasterAddress = await gameFactory.getGameAt(0);
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        const tokenAddr = await gameMaster.getToken();
        expect(tokenAddr).to.not.equal(0);
        const token = GameTokenFactory.attach(tokenAddr);
        await token.deployed();
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
        const addr1Address = addr1.getAddress();
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(10).pow(18).mul(1000).toString());
        await gameMaster.end();
        const balance1after = await token.balanceOf(addr1Address);
        expect(balance1after.toNumber()).to.equal(0);
        expect((await token.totalSupply()).toNumber()).to.equal(0);
    })

});