const { expect } = require("chai");
const { getSpaces, getChances } = require("../db/playground");

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
    const GameMaster = await ethers.getContractFactory("GameMaster");
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

async function registerPlayers(gameMaster, players) {
    for (let player of players) {
        await gameMaster.connect(player).register();
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
            await gameMaster.connect(signer).play(0);
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
        expect(await gameMaster.getNbPlayers()).to.equal(0);
    });
    it("Should allow to register", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        const addr1Address = await addr1.getAddress();
        await expect(gameMaster.connect(addr1).register()).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr1Address, 1);
        expect(await gameMaster.getNbPlayers()).to.equal(1);
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address);
        const addr2Address = await addr2.getAddress();
        await expect(gameMaster.connect(addr2).register()).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr2Address, 2);
        expect(await gameMaster.getNbPlayers()).to.equal(2);
    });
    it("Should not allow to register same player twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await gameMaster.connect(addr1).register();
        expect(await gameMaster.getNbPlayers()).to.equal(1);
        await gameMaster.connect(addr1).register().then(shouldFail.then).catch(shouldFail.catch);
    });
    it("Should not allow to start game if less than 2 players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await gameMaster.connect(owner).start().then(shouldFail.then).catch(shouldFail.catch);
        await gameMaster.connect(addr1).register();
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
        await expect(gameMaster.connect(addr1).play(0)).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
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
        await expect(gameMaster.connect(addr3).play(0)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
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
        await expect(gameMaster.connect(addr1).play(0)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
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
        await expect(gameMaster.connect(addr1).play(0)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, '0x00');
        const addr2Address = await addr2.getAddress();
        expect(await gameMaster.getNextPlayer()).to.equal(addr2Address, "next player shall be changed");
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
    //     expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr2Address, "next player shall be changed");
        newPosition = (position1 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
        newPosition = (position2 + dices[0] + dices[1]) % NB_POSITIONS;
        expect(await gameMaster.getPositionOf(addr2Address)).to.equal(newPosition);
        position2 = newPosition;
    });
    it('Check positions restarts at 0 after going over nbMaxPositions step1', async() => {
        let position1 = await gameMaster.getPositionOf(addr1Address);
        let position2 = await gameMaster.getPositionOf(addr2Address);
        let dices = [];
        let newPosition;
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
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
        expect(spaceDetails[0]).to.equal(6);
        expect(spaceDetails[1]).to.equal(0);
        spaceDetails = await gameMaster.getSpaceDetails(2);
        expect(spaceDetails[0]).to.equal(3);
        expect(spaceDetails[1]).to.equal(0);
        spaceDetails = await gameMaster.getSpaceDetails(3);
        expect(spaceDetails[0]).to.equal(7);
        expect(spaceDetails[1]).to.equal(1);
        spaceDetails = await gameMaster.getSpaceDetails(4);
        expect(spaceDetails[0]).to.equal(7);
        expect(spaceDetails[1]).to.equal(2);
    })
})

function extractSpaceCode(playground, spaceId) {
    const idxStart = playground.length - 2 * (spaceId);
    return playground.slice(idxStart - 2, idxStart);
}