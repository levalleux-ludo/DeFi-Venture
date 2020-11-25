const bre = require("@nomiclabs/buidler");
// const { utils } = require("ethers");
const { getSpaces, getChances } = require("../db/playground");
const { expect } = require("chai");
const ethers = bre.ethers;
const utils = ethers.utils;
const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const PLAYGROUND = '0x0000000000000000867d776f030203645f554c01463d03342e261e170f030600';
const NB_CHANCES = 32;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
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
var avatarCount = 1;

module.exports = {
    createGameMasterBase,
    STATUS,
    PLAYGROUND,
    NB_MAX_PLAYERS,
    INITIAL_BALANCE,
    NB_POSITIONS,
    NB_CHANCES,
    NULL_ADDRESS,
    shouldFail,
    revertMessage,
    registerPlayers,
    startGame,
    checkDice,
    extractSpaceCode,
    playTurn,
    createGameToken,
    createGameAssets,
    createMarketplace,
    avatarCount
};

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

async function createGameMasterBase() {
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
    await playgroundContract.transferOwnership(gameMaster.address);
    await chance.transferOwnership(gameMaster.address);
    gameMaster.getPositionOf = (player) => playgroundContract.positions(player);
    gameMaster.getPlayground = () => playgroundContract.playground();
    gameMaster.getNbPositions = () => playgroundContract.nbPositions();
    return gameMaster;
}

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

function extractSpaceCode(playground, spaceId) {
    const idxStart = playground.length - 2 * (spaceId);
    return playground.slice(idxStart - 2, idxStart);
}

async function createGameToken(TokenFactory) {
    const gameToken = await TokenFactory.deploy();
    await gameToken.deployed();
    return gameToken;
}

async function createGameAssets(AssetsFactory) {
    const gameAssets = await AssetsFactory.deploy();
    await gameAssets.deployed();
    return gameAssets;
}

async function createMarketplace(MarketplaceFactory) {
    const marketplace = await MarketplaceFactory.deploy();
    await marketplace.deployed();
    return marketplace;
}