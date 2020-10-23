// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { BigNumber } = require("ethers");

const LINK_token_address = '0xE053E117d372Cd7C4a42DeC0F60B59f2d524f147'; // mumbai
const NODE_address = '0xE7E2bc5e15ef1db1079863fbB551b98fb7e58CDe';

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

    const [deployer] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory("Oracle");
    // const oracle = await Oracle.deploy(ethers.BigNumber.from(10).pow(18).mul(1000));
    const oracle = await Oracle.deploy(LINK_token_address);
    await oracle.deployed();
    console.log("Oracle deployed to:", oracle.address, "with LINK_token", LINK_token_address);

    await oracle.setFulfillmentPermission(NODE_address, true);
    console.log('setFulfillmentPermission for node', NODE_address);

    // await oracle.mint(deployer_addr, BigNumber.from(10).pow(decimals).mul(1000)); // +1000 LINK
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });