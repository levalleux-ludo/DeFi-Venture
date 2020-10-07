const dotenvConfig = require('dotenv').config;
// import { config as dotenvConfig } from "dotenv";
const resolve = require('path').resolve;
// import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

usePlugin("@nomiclabs/buidler-waffle");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async() => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(await account.getAddress());
    }
});

/**
 * @dev You must have a `.env` file. Follow the example in `.env.example`.
 * @param {string} network The name of the testnet
 * @returns { accounts: HDAccountsConfig; url: string | undefined }
 */
function createNetworkConfig(network) {
    if (!process.env.MNEMONIC) {
        throw new Error("Please set your MNEMONIC in a .env file");
    }

    if (!process.env.INFURA_API_KEY) {
        throw new Error("Please set your INFURA_API_KEY");
    }

    return {
        accounts: {
            count: 10,
            initialIndex: 0,
            mnemonic: process.env.MNEMONIC,
            path: "m/44'/60'/0'/0",
        },
        url: network ? `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}` : undefined,
    };
}


// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
    defaultNetwork: "buidlerevm",
    networks: {
        buidlerevm: {
            chainId: 31337,
        },
        ganache: {
            url: "http://127.0.0.1:7545",
        },
        goerli: {
            ...createNetworkConfig("goerli"),
            chainId: 5,
        },
        kovan: {
            ...createNetworkConfig("kovan"),
            chainId: 42,
        },
        rinkeby: {
            ...createNetworkConfig("rinkeby"),
            chainId: 4,
        },
        ropsten: {
            ...createNetworkConfig("ropsten"),
            chainId: 3,
        },
    },
    // This is a sample solc configuration that specifies which version of solc to use
    solc: {
        version: "0.6.8",
    },
};