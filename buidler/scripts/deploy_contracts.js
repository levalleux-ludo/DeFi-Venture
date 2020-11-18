// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { getSpaces, getChances } = require("../db/playground");

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const NB_CHANCES = 32;

async function main() {
    // Buidler always runs the compile task when running scripts through it. 
    // If this runs in a standalone fashion you may want to call compile manually 
    // to make sure everything is compiled
    // await bre.run('compile');

    // We get the contract to deploy
    // const Greeter = await ethers.getContractFactory("Greeter");
    // const greeter = await Greeter.deploy("Hello, Buidler!");
    // await greeter.deployed();
    // console.log("Greeter deployed to:", greeter.address);

    const GameFactoryFactory = await ethers.getContractFactory("GameFactory");
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    const AssetsFactoryFactory = await ethers.getContractFactory("AssetsFactory");
    const MarketplaceFactoryFactory = await ethers.getContractFactory("MarketplaceFactory");

    const tokenFactory = await TokenFactoryFactory.deploy();
    const assetsFactory = await AssetsFactoryFactory.deploy();
    const marketplaceFactory = await MarketplaceFactoryFactory.deploy();
    await tokenFactory.deployed();
    await assetsFactory.deployed();
    await marketplaceFactory.deployed();
    gameFactory = await GameFactoryFactory.deploy(
        tokenFactory.address,
        assetsFactory.address,
        marketplaceFactory.address
    );
    await gameFactory.deployed();
    console.log("gameFactory deployed to:", gameFactory.address);

    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy('Contract deployed on ' + bre.network.name);
    await greeter.deployed();
    console.log("greeter deployed to:", greeter.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });