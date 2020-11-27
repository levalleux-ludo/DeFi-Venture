const { expect } = require("chai");
const { utils } = require("ethers");
const bre = require("@nomiclabs/buidler");
const { SPACES, NB_SPACES, CHANCES, NB_CHANCES } = require("../db/playground");
const { createGameMasterFull, STATUS, shouldFail, revertMessage, startGame, registerPlayers, checkDice, extractSpaceCode, playTurn } = require('./testsUtils');
const ethers = bre.ethers;

async function createGameMaster() {
    return await createGameMasterFull();
}

describe("GameMaster", function() {
    it("Should return the address of the contract's creator", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        const ownerAddress = await owner.getAddress();
        expect(await gameMaster.owner()).to.equal(ownerAddress);
    });
    it("Should be in status 'created' and no players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        expect(await gameMaster.getStatus()).to.equal(STATUS.created);
        expect(await gameMaster.nbPlayers()).to.equal(0);
    });
    it("Should not allow to register if no allowance to transferManager contract", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster, token } = await createGameMaster();
        const addr1Address = await addr1.getAddress();
        const allowance = await token.allowance(addr1Address, gameMaster.transferManagerAddress());
        expect(allowance.toString()).to.equal('0');
        expect(await gameMaster.nbPlayers()).to.equal(0);
        await expect(gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1)).to.be.revertedWith(revertMessage("PLAYER_MUST_APPROVE_TRANSFER_MANAGER_FOR_TOKEN"));
    });
    it("Should allow to register", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster, token, assets } = await createGameMaster();
        const addr1Address = await addr1.getAddress();
        await token.connect(addr1).approveMax(gameMaster.transferManagerAddress());
        await assets.connect(addr1).setApprovalForAll(gameMaster.transferManagerAddress(), true);
        await expect(gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1)).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr1Address, 1);
        expect(await gameMaster.nbPlayers()).to.equal(1);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address);
        const addr2Address = await addr2.getAddress();
        await token.connect(addr2).approveMax(gameMaster.transferManagerAddress());
        await assets.connect(addr2).setApprovalForAll(gameMaster.transferManagerAddress(), true);
        await expect(gameMaster.connect(addr2).register(utils.formatBytes32String('titi'), 2)).to.emit(gameMaster, 'PlayerRegistered').withArgs(addr2Address, 2);
        expect(await gameMaster.nbPlayers()).to.equal(2);
    });
    it("Should not allow to register same player twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster, token, assets } = await createGameMaster();
        await token.connect(addr1).approveMax(gameMaster.transferManagerAddress());
        await assets.connect(addr1).setApprovalForAll(gameMaster.transferManagerAddress(), true);
        await gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1);
        expect(await gameMaster.nbPlayers()).to.equal(1);
        await gameMaster.connect(addr1).register(utils.formatBytes32String('titi'), 2).then(shouldFail.then).catch(shouldFail.catch);
    });
    it("Should not allow to start game if less than 2 players", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster, token, assets } = await createGameMaster();
        await token.connect(addr1).approveMax(gameMaster.transferManagerAddress());
        await assets.connect(addr1).setApprovalForAll(gameMaster.transferManagerAddress(), true);
        await gameMaster.connect(owner).start().then(shouldFail.then).catch(shouldFail.catch);
        await gameMaster.connect(addr1).register(utils.formatBytes32String('toto'), 1);
        await expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("NOT_ENOUGH_PLAYERS"));
    });
    it("Should allow to start game", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await expect(gameMaster.start()).to.emit(gameMaster, 'StatusChanged').withArgs(STATUS.started);
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
    });
    it("Should not allow to start game if already started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await gameMaster.start()
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
        await expect(gameMaster.connect(owner).start()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to rollDices if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await expect(gameMaster.connect(addr1).rollDices()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to play if not started", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr1).play(1)).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    });
    it("Should not allow to rollDices if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr3).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play if not registered", async function() {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr3).play(1)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to rollDices if not nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr2).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should not allow to play the nextPlayer before rolling dices", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await gameMaster.setOptions(255);
        await expect(gameMaster.connect(addr1).play(1)).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to rollDices the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
    });
    it("Should not allow to rollDices the nextPlayer twice", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await expect(gameMaster.connect(addr1).rollDices()).to.be.revertedWith(revertMessage("NOT_AUTHORIZED"));
    });
    it("Should allow to play the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
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
    //     const { gameMaster } = await createGameMaster();
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
        gameMaster = (await createGameMaster()).gameMaster;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        expect(await gameMaster.nextPlayer()).to.equal(addr1Address, "next player shall be changed");
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        newPosition = (position1 + dices[0] + dices[1]) % NB_SPACES;
        expect(await gameMaster.getPositionOf(addr1Address)).to.equal(newPosition);
        position1 = newPosition;
        console.log('Player1 moves at', position1);
        dices = await playTurn(gameMaster, addr2);
        checkDice(dices[0]);
        checkDice(dices[1]);
        newPosition = (position2 + dices[0] + dices[1]) % NB_SPACES;
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
        gameMaster = (await createGameMaster()).gameMaster;
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    });
    it('getPlayground', async() => {
        const playground = await gameMaster.getPlayground();
        expect(playground).to.equal(SPACES, 'Playground is wrong');
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
        gameMaster = (await createGameMaster()).gameMaster;
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
        expect(options).to.equal(3, 'options at Asset should be NOTHING(1) | BUY_ASSET(2)'); // NOTHING (only because token is not set in gameMAster contract)
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