const { BigNumber } = require("ethers");
const dotenv = require('dotenv');
const { resolve } = require('path');
dotenv.config({ path: resolve(__dirname, "./.env") });

const Web3 = require("web3");

const bre = require("@nomiclabs/buidler");
console.log("network", bre.network.name);
console.log("provider", bre.network.config.url);

let LINK_token_address;
let oracle;
let jobId;

switch (bre.network.name) {
    case 'mumbai':
        {
            oracle = '0x71EbC24B00F65D6cD5848CeF5971595DaB6027F9';
            jobId = '02a10564d079471d8623e555e4877166';
            LINK_token_address = '0xE053E117d372Cd7C4a42DeC0F60B59f2d524f147'; // mumbai
            break;
        }
    case 'kovan':
        {
            oracle = '0x7bfc47C0280F7F491a3118946771b7BaD6ad6808';
            jobId = '858e66b75f2940eea189bf508955f29a';
            LINK_token_address = '0xa36085F69e2889c224210F603D836748e7dC0088'; // kovan
            break;
        }
}

// Change this to use your own infura ID
const provider = new Web3.providers.HttpProvider(bre.network.config.url);

const web3 = new Web3(provider);


// A Human-Readable ABI; any supported ABI format could be used
const erc20_abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (boolean)",
];

const oracle_abi = [
    "function fulfillOracleRequest(bytes32 requestId,uint256 payment,address callbackAddress,bytes4 callbackFunctionId,uint256 expiration,bytes32 data) returns (bool)",
    "function getAuthorizationStatus(address node) view returns (bool)",
    "function setFulfillmentPermission(address node, bool allowed)",
    "function withdraw(address recipient, uint256 amount)",
    "function withdrawable() view returns (uint256)",
    "event OracleRequest( bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data )"
];

const displayBalance = async(user, address, token) => {
    const decimals = await token.decimals();
    const balance = await token.balanceOf(address);
    console.log("balance:", user, balanceToNumber(balance, decimals));
}

const balanceToNumber = (bn, decimals) => {
    return bn.div(BigNumber.from(10).pow(decimals - 2)).toNumber() / 100;
};

const f = async() => {
    const [signer] = await ethers.getSigners();
    const signer_address = await signer.getAddress();
    console.log("deployer", signer_address);
    web3.eth.defaultAccount = signer_address;
    const APIConsumer = await ethers.getContractFactory("APIConsumer");
    const jobIdAsArray = ethers.utils.toUtf8Bytes(jobId);
    const aPIConsumer = await APIConsumer.deploy(LINK_token_address, oracle, ethers.utils.hexlify(jobIdAsArray), { gasLimit: 4000000 });
    // const aPIConsumer = await APIConsumer.deploy(oracle, ethers.utils.zeroPad(ethers.utils.arrayify(jobId), 32), { gasLimit: 10000000 });
    await aPIConsumer.deployed();
    console.log("aPIConsumer deployed to:", aPIConsumer.address);
    const LINK_token = new ethers.Contract(LINK_token_address, erc20_abi, signer);
    await LINK_token.deployed();

    console.log("LINK_token attached at:", LINK_token.address);

    const Oracle = new ethers.Contract(oracle, oracle_abi, signer);
    await Oracle.deployed();

    console.log("Oracke attached at:", Oracle.address);
    Oracle.on('OracleRequest', (_specId,
        _sender,
        requestId,
        _payment,
        _callbackAddress,
        _callbackFunctionId,
        expiration,
        _dataVersion,
        _data) => {
        console.log('OracleRequest event ')
        console.log('specId', _specId);
        console.log('sender', _sender);
        console.log('requestId', requestId);
        console.log('_callbackAddress', _callbackAddress);
        console.log('_callbackFunctionId', _callbackFunctionId);
        console.log('_dataVersion', _dataVersion);
        console.log('data', _data);
    });

    const decimals = await LINK_token.decimals();
    await displayBalance('signer', signer_address, LINK_token);
    await displayBalance('contract', aPIConsumer.address, LINK_token);
    const amount = BigNumber.from(10).pow(decimals); // 1 LINK
    await LINK_token.transfer(aPIConsumer.address, amount).then(async(response) => {
        console.log('Transfer initiated');
        await response.wait().then(async(receipt) => {
            console.log('Transfer done', receipt.transactionHash);
            await displayBalance('signer', signer_address, LINK_token);
            await displayBalance('contract', aPIConsumer.address, LINK_token);

            let theRequestId;
            aPIConsumer.on('RequestAPIGet', (user, requestId) => {
                console.log('RequestAPIGet', user, requestId);
                if (user === signer_address) {
                    theRequestId = requestId;
                }
            })

            aPIConsumer.on('APIGetIssued', (requestId, price) => {
                console.log('APIGetIssued', requestId, price.toString());
                if (requestId === theRequestId) {
                    console.log('Got MATIC price = ', price.toString());
                    const val = price.toNumber() / (10 ** 8);
                    console.log('Got MATIC price = ', val);
                }
            })

            // Make call to requestPriceData()
            await aPIConsumer.requestPriceData({ gasLimit: 4000000 })
                .then(async(response2) => {
                    console.log("requestPriceData sent");
                    await response2.wait().then(async(receipt2) => {
                        console.log('requestPriceData done', receipt2.transactionHash);
                    });
                }).catch(e => console.error(e));
        }).catch(e => console.error(e));
    }).catch(e => console.error(e));

};

f().then(() => {}).catch(e => console.error(e));