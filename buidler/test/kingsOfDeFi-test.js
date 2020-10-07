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

async function createKingsOfDeFi() {
    const KingsOfDeFi = await ethers.getContractFactory("KingsOfDeFi");
    const kingsOfDeFi = await KingsOfDeFi.deploy();
    await kingsOfDeFi.deployed();
    return kingsOfDeFi;
}

async function registerPlayers(kingsOfDeFi, players) {
    for (let player of players) {
        await kingsOfDeFi.connect(player).register();
    }
}

async function startGame(kingsOfDeFi) {
    await kingsOfDeFi.start();
}

describe("KingsOfDeFi", function() {
    it("Should return the address of the contract's creator", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        const ownerAddress = await owner.getAddress();
        expect(await kingsOfDeFi.getOwner()).to.equal(ownerAddress);
    });
    it("Should be in status 'created' and no players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        expect(await kingsOfDeFi.getStatus()).to.equal(STATUS.created);
        expect(await kingsOfDeFi.getNbPlayers()).to.equal(0);
    });
    it("Should allow to register", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await kingsOfDeFi.connect(addr1).register();
        expect(await kingsOfDeFi.getNbPlayers()).to.equal(1);
        const addr1Address = await addr1.getAddress();
        expect(await kingsOfDeFi.getNextPlayer()).to.equal(addr1Address);
        await kingsOfDeFi.connect(addr2).register();
        expect(await kingsOfDeFi.getNbPlayers()).to.equal(2);
    });
    it("Should not allow to register same player twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await kingsOfDeFi.connect(addr1).register();
        expect(await kingsOfDeFi.getNbPlayers()).to.equal(1);
        await kingsOfDeFi.connect(addr1).register().then(shouldFail.then).catch(shouldFail.catch);
    });
    it("Should not allow to start game if less than 2 players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await kingsOfDeFi.connect(owner).start().then(shouldFail.then).catch(shouldFail.catch);
        await kingsOfDeFi.connect(addr1).register();
        expect(kingsOfDeFi.connect(owner).start()).to.be.revertedWith(revertMessage("NOT_ENOUGH_PLAYERS"));
    });
    it("Should allow to start game", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        expect(await kingsOfDeFi.getStatus()).to.equal(STATUS.started);
    });
    it("Should not allow to start game if already started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        expect(await kingsOfDeFi.getStatus()).to.equal(STATUS.started);
        expect(kingsOfDeFi.connect(owner).start()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        expect(kingsOfDeFi.connect(addr1).play()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        expect(kingsOfDeFi.connect(addr3).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play if not nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        expect(kingsOfDeFi.connect(addr2).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to play the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        await kingsOfDeFi.connect(addr1).play();
        const addr2Address = await addr2.getAddress();
        expect(await kingsOfDeFi.getNextPlayer()).to.equal(addr2Address, "next player shall be changed");
    });
    it("Should not allow someone else than the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const kingsOfDeFi = await createKingsOfDeFi();
        await registerPlayers(kingsOfDeFi, [addr1, addr2]);
        await startGame(kingsOfDeFi);
        await kingsOfDeFi.connect(addr1).play();
        expect(kingsOfDeFi.connect(addr1).play()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
        await kingsOfDeFi.connect(addr2).play();
        const addr1Address = await addr1.getAddress();
        expect(await kingsOfDeFi.getNextPlayer()).to.equal(addr1Address, "next player shall be changed");
    });

});