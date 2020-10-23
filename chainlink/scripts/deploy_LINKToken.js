// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { BigNumber } = require("ethers");

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

    const LINKToken = await ethers.getContractFactory("LinkToken");
    // const lINKToken = await LINKToken.deploy(ethers.BigNumber.from(10).pow(18).mul(1000));
    const lINKToken = await LINKToken.deploy();
    await lINKToken.deployed();
    console.log("LINKToken deployed to:", lINKToken.address);
    const deployer_addr = await deployer.getAddress();
    const decimals = await lINKToken.decimals();
    const balance = await lINKToken.balanceOf(deployer_addr);
    console.log("deployer's balance", balance.toString());
    // await lINKToken.mint(deployer_addr, BigNumber.from(10).pow(decimals).mul(1000)); // +1000 LINK
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });