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


const options = commandLineArgs([
    { name: 'factory', alias: 'f', type: String },
    { name: 'network', alias: 'n', type: String }
])
if (options.factory === undefined) {
    console.error('"--factory" argument is required');
    return;
}

async function main() {
    if (options.network !== undefined) {
        process.env.BUIDLER_NETWORK = options.network;
    }
    const bre = require("@nomiclabs/buidler");
    const ethers = bre.ethers;
    console.log('Use factory adress: ', options.factory);
    const GameFactoryFactory = await ethers.getContractFactory("GameFactory");
    const gameFactory = GameFactoryFactory.attach(options.factory);
    await gameFactory.deployed();
    const nbGames = await gameFactory.nbGames();
    console.log('nbGames', nbGames.toString());
    const spaces = getSpaces(NB_POSITIONS);
    const chances = getChances(NB_CHANCES, NB_POSITIONS);
    const waitCreatedGame = new Promise((resolve, reject) => {
        gameFactory.once('GameCreated', (gameMasterAddress, index) => {
            console.log('game created:', gameMasterAddress);
            resolve(gameMasterAddress);
        });
    });
    gameFactory.createGameMaster(
        NB_MAX_PLAYERS,
        NB_POSITIONS,
        ethers.BigNumber.from(INITIAL_BALANCE),
        spaces,
        chances
    );
    await waitCreatedGame.then(async(gameMasterAddress) => {
        await gameFactory.createGameToken(gameMasterAddress);
        await gameFactory.createGameAssets(gameMasterAddress);
        await gameFactory.createMarketplace(gameMasterAddress);
        const GameMasterFactory = await ethers.getContractFactory("GameMaster");
        const gameMaster = GameMasterFactory.attach(gameMasterAddress);
        const token = await gameMaster.getToken();
        console.log('token', token);
        const assets = await gameMaster.getAssets();
        console.log('assets', assets);
        const marketplace = await gameMaster.getMarketplace();
        console.log('marketplace', marketplace);
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });