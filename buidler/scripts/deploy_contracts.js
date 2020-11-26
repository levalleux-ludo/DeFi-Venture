// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { BigNumber } = require("ethers");
const ethers = bre.ethers;
const { getSpaces, getChances } = require("../db/playground");
const { test_factory } = require('./test_factory');

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const NB_CHANCES = 32;

function getBalanceAsNumber(bn, decimals, accuracy) {
    const r1 = BigNumber.from(10).pow(decimals - accuracy);
    const r2 = bn.div(r1);
    const r3 = r2.toNumber();
    const r4 = r3 / (10 ** accuracy);
    return r4;
}

async function main() {
    // Buidler always runs the compile task when running scripts through it. 
    // If this runs in a standalone fashion you may want to call compile manually 
    // to make sure everything is compiled
    // await bre.run('compile');

    const GameFactoryFactory = await ethers.getContractFactory("GameFactory");
    const GameMasterFactoryFactory = await ethers.getContractFactory("GameMasterFactory");
    const GameContractsWrapper = await ethers.getContractFactory("GameContractsWrapper");
    const GameContractsFactoryFactory = await ethers.getContractFactory("GameContractsFactory");
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    const AssetsFactoryFactory = await ethers.getContractFactory("AssetsFactory");
    const MarketplaceFactoryFactory = await ethers.getContractFactory("MarketplaceFactory");

    const [deployer] = await ethers.getSigners();
    const balance_before = await deployer.getBalance();
    console.log('Deployer address', await deployer.getAddress(), 'balance', getBalanceAsNumber(balance_before, 18, 4));
    // return;

    console.log('deploy gameMasterFactory');
    const gameMasterFactory = await GameMasterFactoryFactory.deploy();
    await gameMasterFactory.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy gameContractsWrapper');
    const gameContractsWrapper = await GameContractsWrapper.deploy();
    await gameContractsWrapper.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy gameContractsFactory');
    const gameContractsFactory = await GameContractsFactoryFactory.deploy();
    await gameContractsFactory.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy tokenFactory');
    const tokenFactory = await TokenFactoryFactory.deploy();
    await tokenFactory.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy assetsFactory');
    const assetsFactory = await AssetsFactoryFactory.deploy();
    await assetsFactory.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy marketplaceFactory');
    const marketplaceFactory = await MarketplaceFactoryFactory.deploy();
    await marketplaceFactory.deployed();
    console.log('new balance', getBalanceAsNumber(await deployer.getBalance(), 18, 4))
    console.log('deploy gameFactory');
    gameFactory = await GameFactoryFactory.deploy(
        gameMasterFactory.address,
        gameContractsWrapper.address,
        gameContractsFactory.address,
        tokenFactory.address,
        assetsFactory.address,
        marketplaceFactory.address,
        // { gasLimit: 6700000 }
    ).catch(e => {
        // console.error(e);
        throw new Error('Unable to deploy gameFactory' + e.toString());
    });
    await gameFactory.deployed();
    console.log("gameFactory deployed to:", gameFactory.address);
    console.log('hash', gameFactory.deployTransaction.hash, 'gasLimit', gameFactory.deployTransaction.gasLimit.toString());
    const balance_after = await deployer.getBalance();
    console.log('Paid fees', getBalanceAsNumber(balance_before.sub(balance_after), 18, 4), 'new balance', getBalanceAsNumber(balance_after, 18, 4));

    return gameFactory.address;
}

async function test(factoryAddr) {

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(async(factoryAddr) => {
        if ((bre.network.name === 'ganache') || (bre.network.name === 'buidlerevm')) {
            console.log('**** local network --> TEST FACTORY ****');
            const [deployer] = await ethers.getSigners();
            const balance_before = await deployer.getBalance();
            console.log('Deployer address', await deployer.getAddress(), 'balance', getBalanceAsNumber(balance_before, 18, 4));
            test_factory(factoryAddr).then(async() => {
                const balance_after = await deployer.getBalance();
                console.log('Paid fees', getBalanceAsNumber(balance_before.sub(balance_after), 18, 4), 'new balance', getBalanceAsNumber(balance_after, 18, 4));
                process.exit(0);
            }).catch(error => {
                console.error(error);
                process.exit(1);
            });
        } else {
            process.exit(0);
        }
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });