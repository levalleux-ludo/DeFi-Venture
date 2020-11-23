const { expect } = require("chai");
const { utils } = require("ethers");
const { getSpaces, getChances } = require("../db/playground");
const bre = require("@nomiclabs/buidler");
const playground = require("../db/playground");
const ethers = bre.ethers;

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const PLAYGROUND = '0x0000000000000000867d776f030203645f554c01463d03342e261e170f030600';
const NB_CHANCES = 32;
const CHANCES = '0x1305169c190e120508051c05201e1034543a0520055c1e1118b4181c052643bc';


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

async function createGameMaster() {
    const GameMaster = await ethers.getContractFactory("GameMasterForTest");
    const Playground = await ethers.getContractFactory("Playground");
    const playgroundContract = await Playground.deploy(NB_POSITIONS, PLAYGROUND);
    await playgroundContract.deployed();
    const Chance = await ethers.getContractFactory("Chance");
    const chance = await Chance.deploy(getChances(NB_CHANCES, NB_POSITIONS));
    await chance.deployed();
    const RandomGenerator = await ethers.getContractFactory('RandomGenerator');
    const randomContract = await RandomGenerator.deploy();
    await randomContract.deployed();
    const gameMaster = await GameMaster.deploy(
        NB_MAX_PLAYERS,
        ethers.BigNumber.from(INITIAL_BALANCE),
        playgroundContract.address,
        chance.address,
        randomContract.address
    );
    await gameMaster.deployed();
    gameMaster.getPositionOf = (player) => playgroundContract.positions(player);
    gameMaster.getPlayground = () => playgroundContract.playground();
    return gameMaster;
}

var avatarCount = 1;

async function registerPlayers(gameMaster, players) {
    for (let player of players) {
        await gameMaster.connect(player).register(utils.formatBytes32String('user' + avatarCount), avatarCount++);
    }
}

async function startGame(gameMaster) {
    await gameMaster.start();
}


async function playTurn(gameMaster, signer) {
    return new Promise(async(resolve) => {
        let filter = gameMaster.filters.RolledDices(signer.address);
        gameMaster.once(filter, async(player, dice1, dice2, cardId, newPosition, options) => {
            console.log('RolledDices', player, dice1, dice2, cardId, newPosition, options);
            await gameMaster.setOptions(255);
            await gameMaster.connect(signer).play(1);
            resolve([dice1, dice2]);
        });
        await gameMaster.connect(signer).rollDices();
    });
}

function checkDice(dice) {
    expect(dice).to.be.lessThan(7, 'dices cannot exceed 6');
    expect(dice).to.be.greaterThan(0, 'dices cannot be under 1');
}

describe("GameMaster", function() {
    it("Should return the address of the contract's creator", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        const ownerAddress = await owner.getAddress();
        expect(await gameMaster.owner()).to.equal(ownerAddress);
    });
    it("Should be in status 'created' and no players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        expect(await gameMaster.getStatus()).to.equal(STATUS.created);
        expect(await gameMaster.nbPlayers()).to.equal(0);
    });
    it("Should allow to register", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        const addr1Address = await addr1.getAddress();
        await expect(gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1)).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr1Address, 1);
        expect(await gameMaster.nbPlayers()).to.equal(1);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address);
        const addr2Address = await addr2.getAddress();
        await expect(gameMaster.connect(addr2).register(utils.formatBytes32String('titi'), 2)).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr2Address, 2);
        expect(await gameMaster.nbPlayers()).to.equal(2);
    });
    it("Should not allow to register same player twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1);
        expect(await gameMaster.nbPlayers()).to.equal(1);
        await gameMaster.connect(addr1).register(utils.formatBytes32String('titi'), 2).then(shouldFail.then).catch(shouldFail.catch);
    });
    it("Should not allow to start game if less than 2 players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await gameMaster.connect(owner).start().then(shouldFail.then).catch(shouldFail.catch);
        await gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1);
        await expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("NOT_ENOUGH_PLAYERS"));
    });
    it("Should allow to start game", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await expect(gameMaster.start()).to.emit(gameMaster, 'StatusChanged').withArgs(STATUS.started);
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
    });
    it("Should not allow to start game if already started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await gameMaster.start()
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
        await expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to rollDices if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await expect(gameMaster.connect(addr1).rollDices()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr1).play(1)).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to rollDices if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr3).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr3).play(1)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to rollDices if not nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr2).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play the nextPlayer before rolling dices", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr1).play(1)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to rollDices the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
    });
    it("Should not allow to rollDices the nextPlayer twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await expect(gameMaster.connect(addr1).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to play the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await gameMaster.connect(addr1).rollDices();
        await gameMaster.setOptions(255);
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(1)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 1, 12, position);
        const addr2Address = await addr2.getAddress();
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "next player shall be changed");
    });
    // it("Should not allow someone else than the nextPlayer", async function() {
    //     const [owner, addr1, addr2] = await ethers.getSigners();
    //     const gameMaster = await createGameMaster();
    //     await registerPlayers(gameMaster, [addr1, addr2]);
    //     await startGame(gameMaster);
    //     await gameMaster.connect(addr1).play();
    //     await expect(gameMaster.connect(addr1).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    //     await gameMaster.connect(addr2).play();
    //     const addr1Address = await addr1.getAddress();
    //     expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
    // });

});


describe('GameMaster play phases', () => {
    var gameMaster;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;

    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    });
    it('Check positions start at 0', async() => {
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(0);
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(0);
    });
    it('Check positions increment as expected', async() => {
        let position1 = 0;
        let position2 = 0;
        let dices = 0;
        let newPosition;
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "next player shall be changed");
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step1', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step2', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step3', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step4', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step5', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step6', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        dices = await playTurn(gameMaster, addr1);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
        console.log('Player2 moves at', position2);
    });
})
describe('GameMaster Playground', () => {
    var gameMaster;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;

    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    });
    it('getPlayground', async() => {
        const playground = await gameMaster.getPlayground();
        expect(playground).to.equal(PLAYGROUND, 'Playground is wrong');
    });
    it('check Genesis code', async() => {
        const playground = await gameMaster.getPlayground();
        const spaceCode0 = extractSpaceCode(playground, 0);
        expect(spaceCode0).to.equal('00');
    })
    it('check some spaces', async() => {
        const playground = await gameMaster.getPlayground();
        expect(extractSpaceCode(playground, 1)).to.equal('06');
        expect(extractSpaceCode(playground, 2)).to.equal('03');
        expect(extractSpaceCode(playground, 3)).to.equal('0f');
        expect(extractSpaceCode(playground, 4)).to.equal('17');
    })
    it('check Genesis code from contract', async() => {
        const playground = await gameMaster.getPlayground();
        const spaceDetails = await gameMaster.getSpaceDetails(0);
        expect(spaceDetails[0]).to.equal(0);
        expect(spaceDetails[1]).to.equal(0);
    })
    it('check some spaces from contract', async() => {
        const playground = await gameMaster.getPlayground();
        let spaceDetails;
        spaceDetails = await gameMaster.getSpaceDetails(1);
        expect(spaceDetails[0]).to.equal(6); // ASSET_CLASS_3
        expect(spaceDetails[1]).to.equal(0); // assetId
        spaceDetails = await gameMaster.getSpaceDetails(2);
        expect(spaceDetails[0]).to.equal(3); // CHANCE
        expect(spaceDetails[1]).to.equal(0);
        spaceDetails = await gameMaster.getSpaceDetails(3);
        expect(spaceDetails[0]).to.equal(7); // ASSET_CLASS_4
        expect(spaceDetails[1]).to.equal(1); // assetId
        spaceDetails = await gameMaster.getSpaceDetails(4);
        expect(spaceDetails[0]).to.equal(7); // ASSET_CLASS_4
        expect(spaceDetails[1]).to.equal(2); // assetId
    })
})

describe('Game play options', () => {
    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    });
    it('check options at beginning', async() => {
        let options;
        options = await gameMaster.getOptionsAt(addr1Address, 0); // GENESIS
        expect(options).to.equal(1, 'options at Genesis should be NOTHING'); // NOTHING
        options = await gameMaster.getOptionsAt(addr1Address, 1); // ASSET
        expect(options).to.equal(1, 'options at Asset should be NOTHING'); // NOTHING (only because token is not set in gameMAster contract)
        options = await gameMaster.getOptionsAt(addr1Address, 2); // CHANCE
        expect(options).to.equal(8, 'options at Chance should be CHANCE'); // CHANCE
    });
    it('play at GENESIS', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr1Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr1Address, 0); // GENESIS
        await gameMaster.setOptions(1);
        await expect(gameMaster.connect(addr1).play(0)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(2)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(4)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(8)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(16)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(0xFF & ~1)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(1)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 1, 12, position);
    })
    it('play NOTHING at ASSET 0', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr2Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr2Address, 1); // ASSET id 0
        await gameMaster.setOptions(3);
        await expect(gameMaster.connect(addr2).play(0)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(4)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(8)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(16)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(0xFF & ~3)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 1, 12, position);
    })
    it('play BUY_ASSET at ASSET 1', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr1Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr1Address, 3); // ASSET id 1
        await gameMaster.setOptions(3);
        await expect(gameMaster.connect(addr1).play(0)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(4)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(8)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(16)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr1).play(0xFF & ~3)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr1Address);
        await expect(gameMaster.connect(addr1).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 2, 12, position);
    })
    it('play CHANCE', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr2Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr2Address, 2); // CHANCE
        await gameMaster.setOptions(8);
        await expect(gameMaster.connect(addr2).play(0)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(2)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(4)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(16)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(0xFF & ~8)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 8, 12, position);
    })
})

function extractSpaceCode(playground, spaceId) {
    const idxStart = playground.length - 2 * (spaceId);
    return playground.slice(idxStart - 2, idxStart);
}