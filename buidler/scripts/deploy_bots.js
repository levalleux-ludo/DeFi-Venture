// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");

const fs = require('fs')

const NB_BOTS = 5;

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

    const BotPlayer = await ethers.getContractFactory("BotPlayer");
    const bots = [];
    for (let i = 0; i < NB_BOTS; i++) {
        const botPlayer = await BotPlayer.deploy();
        await botPlayer.deployed();
        bots.push({
            name: `R${i+1}D${i+1}`,
            address: botPlayer.address
        });
        console.log(`{ name: 'R${i+1}D${i+1}', address: '${botPlayer.address}'},`);
    }
    console.log(JSON.stringify({ bots }, (key, value) => `${key}: "${value}"`));
    console.log('artifacts', bre.config.paths.artifacts);
    fs.writeFileSync(bre.config.paths.artifacts + '/bots.json', JSON.stringify({ bots }), err => console.error(err));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });