const { expect } = require("chai");

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
    const gameMaster = await GameMaster.deploy();
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

describe("GameMaster", function() {
    it("Should return the address of the contract's creator", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        const ownerAddress = await owner.getAddress();
        expect(await gameMaster.getOwner()).to.equal(ownerAddress);
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
        await gameMaster.connect(addr1).register();
        expect(await gameMaster.getNbPlayers()).to.equal(1);
        const addr1Address = await addr1.getAddress();
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address);
        await gameMaster.connect(addr2).register();
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
        expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("NOT_ENOUGH_PLAYERS"));
    });
    it("Should allow to start game", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
    });
    it("Should not allow to start game if already started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
        expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        expect(gameMaster.connect(addr1).play()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        expect(gameMaster.connect(addr3).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play if not nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        expect(gameMaster.connect(addr2).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to play the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.connect(addr1).play();
        const addr2Address = await addr2.getAddress();
        expect(await gameMaster.getNextPlayer()).to.equal(addr2Address, "next player shall be changed");
    });
    it("Should not allow someone else than the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const gameMaster = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.connect(addr1).play();
        expect(gameMaster.connect(addr1).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
        await gameMaster.connect(addr2).play();
        const addr1Address = await addr1.getAddress();
        expect(await gameMaster.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
    });

});