// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { BigNumber } = require("ethers");
const LINK_token_address = '0xE053E117d372Cd7C4a42DeC0F60B59f2d524f147'; // mumbai
// A Human-Readable ABI; any supported ABI format could be used
const erc20_abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (boolean)",
];

async function main() {
    // Buidler always runs the compile task when running scripts through it. 
    // If this runs in a standalone fashion you may want to call compile manually 
    // to make sure everything is compiled
    // await bre.run('compile');
    const [deployer] = await ethers.getSigners();

    const LINK_token = new ethers.Contract(LINK_token_address, erc20_abi, deployer);
    await LINK_token.deployed();
    console.log("LINK_token attached at:", LINK_token.address);

    const BlockhashStore = await ethers.getContractFactory("BlockhashStore");
    const blockhashStore = await BlockhashStore.deploy();
    await blockhashStore.deployed();
    console.log("BlockhashStore deployed to:", blockhashStore.address);

    const VRFCoordinator = await ethers.getContractFactory("VRFCoordinator");
    const vRFCoordinator = await VRFCoordinator.deploy(LINK_token.address, blockhashStore.address);
    await vRFCoordinator.deployed();
    console.log("VRFCoordinator deployed to:", vRFCoordinator.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });