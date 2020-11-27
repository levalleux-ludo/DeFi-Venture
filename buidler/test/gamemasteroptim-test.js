const { expect } = require("chai");
const { utils } = require("ethers");
const { createGameMasterFull, STATUS, PLAYGROUND, NB_POSITIONS, shouldFail, revertMessage, startGame, registerPlayers, checkDice, extractSpaceCode, playTurn } = require('./testsUtils');


let GAME_DATA_FIELDS = {}; {
    let index = 0;
    let keys = [
        'status',
        'nbPlayers',
        'nbPositions',
        'token',
        'assets',
        'marketplace',
        'nextPlayer',
        'currentPlayer',
        'currentOptions',
        'currentCardId'
    ];
    for (let key of keys) {
        GAME_DATA_FIELDS[key] = index++;
    }
};

let USER_DATA_FIELDS = {}; {
    let index = 0;
    let keys = [
        'address',
        'username',
        'avatar',
        'position',
        'hasLost'
    ];
    for (let key of keys) {
        USER_DATA_FIELDS[key] = index++;
    }
}

async function createGameMaster() {
    const { gameMaster, token, assets } = await createGameMasterFull();
    gameMaster.getUsername = (player) => gameMaster.usernames(player);
    gameMaster.getAvatar = (player) => gameMaster.players(player);
    gameMaster.getCurrentOptions = () => gameMaster.currentOptions();
    gameMaster.getCurrentCardId = () => gameMaster.currentCardId();
    return { gameMaster, token, assets };
}

describe("GameMaster optimised", function() {
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
    it("Should allow to start game", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await expect(gameMaster.start()).to.emit(gameMaster, 'StatusChanged').withArgs(STATUS.started);
        expect(await gameMaster.getStatus()).to.equal(STATUS.started);
    });
    it("Should allow to rollDices the nextPlayer", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
    });
    it('Should return all game data in one call', async() => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await gameMaster.connect(addr1).rollDices();
        await gameMaster.setOptions(255);
        await gameMaster.setCardId(12);
        const status = await gameMaster.getStatus();
        const nbPlayers = await gameMaster.nbPlayers();
        const nextPlayer = await gameMaster.nextPlayer();
        const currentPlayer = await gameMaster.currentPlayer();
        const currentOptions = await gameMaster.getCurrentOptions();
        const cardId = await gameMaster.getCurrentCardId();
        const nbSpaces = await gameMaster.getNbPositions();
        const gameData = await gameMaster.getGameData();
        expect(gameData !== undefined).to.equal(true);
        expect(gameData[GAME_DATA_FIELDS.status]).to.equal(status);
        expect(gameData[GAME_DATA_FIELDS.nbPlayers]).to.equal(nbPlayers);
        expect(gameData[GAME_DATA_FIELDS.nextPlayer]).to.equal(nextPlayer);
        expect(gameData[GAME_DATA_FIELDS.currentPlayer]).to.equal(currentPlayer);
        expect(gameData[GAME_DATA_FIELDS.currentOptions]).to.equal(currentOptions);
        expect(gameData[GAME_DATA_FIELDS.currentCardId]).to.equal(cardId);
        expect(gameData[GAME_DATA_FIELDS.nbPositions]).to.equal(nbSpaces);
    })
    it("Should return player Data in one call", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        await gameMaster.connect(addr1).rollDices();
        await gameMaster.setOptions(255);
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr1Address);
        const username = await gameMaster.getUsername(addr1Address);
        const avatar = await gameMaster.getAvatar(addr1Address);
        const playerData = await gameMaster.getPlayerData(addr1Address);
        expect(playerData !== undefined).to.equal(true);
        expect(playerData[USER_DATA_FIELDS.address]).to.equal(addr1Address);
        expect(playerData[USER_DATA_FIELDS.username]).to.equal(username);
        expect(playerData[USER_DATA_FIELDS.avatar]).to.equal(avatar);
        expect(playerData[USER_DATA_FIELDS.position]).to.equal(position);
    });
    it("Should return several players positions in one call", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        await gameMaster.connect(addr1).rollDices();
        await gameMaster.setOptions(255);
        await gameMaster.setCardId(12);
        const position1 = await gameMaster.getPositionOf(addr1Address);
        const position2 = await gameMaster.getPositionOf(addr2Address);
        const playersPositions = await gameMaster.getPlayersPositions([addr1Address, addr2Address]);
        expect(playersPositions !== undefined).to.equal(true);
        expect(Array.isArray(playersPositions)).to.equal(true);
        expect(playersPositions.length).to.equal(2);
        expect(playersPositions[0]).to.equal(position1);
        expect(playersPositions[1]).to.equal(position2);
    });
    it("Should return several players data in one call", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { gameMaster } = await createGameMaster();
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        await gameMaster.connect(addr1).rollDices();
        await gameMaster.setOptions(255);
        await gameMaster.setCardId(12);
        const position1 = await gameMaster.getPositionOf(addr1Address);
        const position2 = await gameMaster.getPositionOf(addr2Address);
        const username1 = await gameMaster.getUsername(addr1Address);
        const username2 = await gameMaster.getUsername(addr2Address);
        const avatar1 = await gameMaster.getAvatar(addr1Address);
        const avatar2 = await gameMaster.getAvatar(addr2Address);
        const nbPlayers = await gameMaster.nbPlayers();
        const indexes = [];
        for (let index = 0; index < nbPlayers; index++) {
            indexes.push(index);
        }
        const playersData = await gameMaster.getPlayersData(indexes);
        expect(playersData !== undefined).to.equal(true);
        expect(Array.isArray(playersData)).to.equal(true);
        expect(playersData.length).to.equal(Object.keys(USER_DATA_FIELDS).length);
        expect(Array.isArray(playersData[USER_DATA_FIELDS.username])).to.equal(true);
        expect(playersData[USER_DATA_FIELDS.username].length).to.equal(indexes.length);
        expect(playersData[USER_DATA_FIELDS.avatar].length).to.equal(indexes.length);
        expect(playersData[USER_DATA_FIELDS.position].length).to.equal(indexes.length);
        expect(playersData[USER_DATA_FIELDS.address][0]).to.equal(addr1Address);
        expect(playersData[USER_DATA_FIELDS.address][1]).to.equal(addr2Address);
        expect(playersData[USER_DATA_FIELDS.username][0]).to.equal(username1);
        expect(playersData[USER_DATA_FIELDS.username][1]).to.equal(username2);
        expect(playersData[USER_DATA_FIELDS.avatar][0]).to.equal(avatar1);
        expect(playersData[USER_DATA_FIELDS.avatar][1]).to.equal(avatar2);
        expect(playersData[USER_DATA_FIELDS.position][0]).to.equal(position1);
        expect(playersData[USER_DATA_FIELDS.position][1]).to.equal(position2);
    });


});