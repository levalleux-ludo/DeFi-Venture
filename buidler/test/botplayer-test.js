const { expect } = require("chai");
const { utils } = require("ethers");
const { getSpaces, getChances } = require("../db/playground");

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const PLAYGROUND = '0x0000000000000000867d776f030203645f554c01463d03342e261e170f030600';
const NB_CHANCES = 32;
const CHANCES = '0x1305169c190e120508051c05201e1034543a0520055c1e1118b4181c052643bc';

const OWNABLE_ERROR = 'Ownable: caller is not the owner';

const STATUS = {
    created: 0,
    started: 1,
    frozen: 2,
    ended: 3
};

var botPlayerFactory;
var owner, addr1, addr2;
var botPlayer1, botPlayer2;
var gameMaster1, gameMaster2;
var token1, token2;
var ownerAddress, addr1Address, addr1Address;

async function createGameMaster() {
    const GameMaster = await ethers.getContractFactory("GameMasterForTest");
    const gameMaster = await GameMaster.deploy(
        NB_MAX_PLAYERS,
        NB_POSITIONS,
        ethers.BigNumber.from(INITIAL_BALANCE),
        // getSpaces(NB_POSITIONS),
        PLAYGROUND,
        getChances(NB_CHANCES, NB_POSITIONS)
    );
    await gameMaster.deployed();
    return gameMaster;
}

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

async function playTurn(botPlayer, gameMaster, signer) {
    return new Promise(async(resolve) => {
        let filter = gameMaster.filters.RolledDices(botPlayer.address);
        gameMaster.once(filter, async(player, dice1, dice2, cardId, newPosition, options) => {
            console.log('RolledDices', player, dice1, dice2, cardId, newPosition, options);
            await gameMaster.setOptions(255);
            await botPlayer.connect(signer).play(gameMaster.address, 1);
            resolve([dice1, dice2]);
        });
        await botPlayer.connect(signer).rollDices(gameMaster.address);
    });
}

describe('BotPlayer', () => {
    before('before tests', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();

        botPlayerFactory = await ethers.getContractFactory("BotPlayer");
        const gameMasterFactory = await ethers.getContractFactory("GameMaster");
        const tokenFactory = await ethers.getContractFactory("GameToken");

        gameMaster1 = await createGameMaster();
        gameMaster1Addr = await gameMaster1.address;
        gameMaster2 = await createGameMaster();
        gameMaster2Addr = await gameMaster2.address;

        token1 = await tokenFactory.deploy();
        await token1.transferOwnership(gameMaster1.address);
        await gameMaster1.setToken(token1.address);
        token2 = await tokenFactory.deploy();
        await token2.transferOwnership(gameMaster2.address);
        await gameMaster2.setToken(token2.address);

    })
    it('Create 2 bots', async() => {
        botPlayer1 = await botPlayerFactory.deploy();
        expect(await botPlayer1.deployed()).to.equal(botPlayer1);
        botPlayer2 = await botPlayerFactory.deploy();
        expect(await botPlayer2.deployed()).to.equal(botPlayer2);
    })
    it('Register Bot1 to Game1', async() => {
        expect(await gameMaster1.isPlayerRegistered(botPlayer1.address)).to.equal(false);
        await expect(
            botPlayer1.connect(owner).register(gameMaster1.address, utils.formatBytes32String('R1D1'), 1)
        ).to.emit(gameMaster1, 'PlayerRegistered').withArgs(botPlayer1.address, 1);
        expect(await gameMaster1.isPlayerRegistered(botPlayer1.address)).to.equal(true);
        expect(await gameMaster1.getNbPlayers()).to.equal(1);
    })
    it('Should not allow to register if not called by owner', async() => {
        expect(await gameMaster2.isPlayerRegistered(botPlayer1.address)).to.equal(false);
        await expect(
            botPlayer1.connect(addr1).register(gameMaster2.address, utils.formatBytes32String('R1D1'), 1)
        ).to.be.revertedWith(revertMessage(OWNABLE_ERROR));
        expect(await gameMaster2.isPlayerRegistered(botPlayer1.address)).to.equal(false);
    })
    it('Register Bot1 to Game2', async() => {
        expect(await gameMaster2.isPlayerRegistered(botPlayer1.address)).to.equal(false);
        await expect(
            botPlayer1.connect(owner).register(gameMaster2.address, utils.formatBytes32String('R1D1'), 1)
        ).to.emit(gameMaster2, 'PlayerRegistered').withArgs(botPlayer1.address, 1);
        expect(await gameMaster2.isPlayerRegistered(botPlayer1.address)).to.equal(true);
        expect(await gameMaster2.getNbPlayers()).to.equal(1);
    })
    it('Register Bot2 to Game1 and Game2', async() => {
        expect(await gameMaster1.isPlayerRegistered(botPlayer2.address)).to.equal(false);
        expect(await gameMaster2.isPlayerRegistered(botPlayer2.address)).to.equal(false);
        await expect(
            botPlayer2.connect(owner).register(gameMaster1.address, utils.formatBytes32String('R2D2'), 2)
        ).to.emit(gameMaster1, 'PlayerRegistered').withArgs(botPlayer2.address, 2);
        await expect(
            botPlayer2.connect(owner).register(gameMaster2.address, utils.formatBytes32String('R2D2'), 2)
        ).to.emit(gameMaster2, 'PlayerRegistered').withArgs(botPlayer2.address, 2);
        expect(await gameMaster1.isPlayerRegistered(botPlayer2.address)).to.equal(true);
        expect(await gameMaster2.isPlayerRegistered(botPlayer2.address)).to.equal(true);
        expect(await gameMaster1.getNbPlayers()).to.equal(2);
        expect(await gameMaster2.getNbPlayers()).to.equal(2);
    })
    it('Start games', async() => {
        expect(await gameMaster1.getStatus()).to.equal(STATUS.created);
        await expect(gameMaster1.start()).to.emit(gameMaster1, 'StatusChanged').withArgs(STATUS.started);
        expect(await gameMaster1.getStatus()).to.equal(STATUS.started);
        expect(await gameMaster2.getStatus()).to.equal(STATUS.created);
        await expect(gameMaster2.start()).to.emit(gameMaster2, 'StatusChanged').withArgs(STATUS.started);
        expect(await gameMaster2.getStatus()).to.equal(STATUS.started);
    })
    it('Bot1 plays on both games', async() => {
        await playTurn(botPlayer1, gameMaster1, owner);
        expect(await gameMaster1.getNextPlayer()).to.equal(botPlayer2.address, "next player shall be changed");
        await playTurn(botPlayer1, gameMaster2, owner);
        expect(await gameMaster2.getNextPlayer()).to.equal(botPlayer2.address, "next player shall be changed");
    })
    it('Bot2 plays on both games', async() => {
        await playTurn(botPlayer2, gameMaster1, owner);
        expect(await gameMaster1.getNextPlayer()).to.equal(botPlayer1.address, "next player shall be changed");
        await playTurn(botPlayer2, gameMaster2, owner);
        expect(await gameMaster2.getNextPlayer()).to.equal(botPlayer1.address, "next player shall be changed");
    })

})