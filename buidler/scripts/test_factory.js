const commandLineArgs = require('command-line-args')
const { getSpaces, getChances } = require("../db/playground");

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

const bre = require("@nomiclabs/buidler");
const ethers = bre.ethers;

// const options = commandLineArgs([
//     { name: 'factory', alias: 'f', type: String },
//     { name: 'network', alias: 'n', type: String }
// ])
// if (options.factory === undefined) {
//     console.error('"--factory" argument is required');
//     return;
// }
// if (options.network !== undefined) {
//     process.env.BUIDLER_NETWORK = options.network;
// }
// console.log('Use factory adress: ', options.factory);

const test_factory = async(gameFactoryAddr, standalone) => {
    console.log('Use factory adress: ', gameFactoryAddr);
    const GameFactoryFactory = await ethers.getContractFactory("GameFactory");
    const GameContractsFactory = await ethers.getContractFactory("GameContracts");
    const gameFactory = GameFactoryFactory.attach(gameFactoryAddr);
    await gameFactory.deployed();
    const nbGames = await gameFactory.nbGames();
    console.log('nbGames', nbGames.toString());
    const spaces = getSpaces(NB_POSITIONS);
    const chances = getChances(NB_CHANCES, NB_POSITIONS);
    const waitCreatedGameMaster = new Promise((resolve, reject) => {
        gameFactory.once('GameMasterCreated', (gameMasterAddress) => {
            console.log('gameMaster created:', gameMasterAddress);
            resolve(gameMasterAddress);
        });
    });
    const waitCreatedGameContracts = new Promise((resolve, reject) => {
        gameFactory.once('GameContractsCreated', (gameContractsAddress) => {
            console.log('gameContracts created:', gameContractsAddress);
            resolve(gameContractsAddress);
        });
    });
    gameFactory.createGameMaster(
        NB_MAX_PLAYERS,
        NB_POSITIONS,
        ethers.BigNumber.from(INITIAL_BALANCE),
        spaces,
        chances
    );
    await waitCreatedGameMaster.then(async(gameMasterAddress) => {
        const GameMasterFactory = await ethers.getContractFactory("GameMaster");
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        await gameMaster.deployed();
        gameFactory.createGameContracts(
            gameMasterAddress,
            NB_MAX_PLAYERS,
            NB_POSITIONS,
            ethers.BigNumber.from(INITIAL_BALANCE),
            spaces,
            chances
        );
        await waitCreatedGameContracts.then(async(gameContractsAddress) => {
            console.log('contracts', await gameMaster.contracts());
            console.log('game created:', gameMasterAddress);
            await gameFactory.createGameToken(gameMasterAddress);
            await gameFactory.createGameAssets(gameMasterAddress);
            await gameFactory.createMarketplace(gameMasterAddress);
            const gameContracts = GameContractsFactory.attach(gameMaster.contracts());
            await gameContracts.deployed();
            const token = await gameContracts.getToken();
            console.log('token', token);
            const assets = await gameContracts.getAssets();
            console.log('assets', assets);
            const marketplace = await gameContracts.getMarketplace();
            console.log('marketplace', marketplace);
        });
    });
}

// test_factory(options.factory)
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });

module.exports = {
    test_factory
}