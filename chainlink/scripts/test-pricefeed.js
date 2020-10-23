const Web3 = require("web3");

// Change this to use your own infura ID
// const web3 = new Web3("https://kovan.infura.io/v3/34ed41c4cf28406885f032930d670036");
// // AggregatorV3Interface ABI
// const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];
// // Price Feed Address
const aggregator_addr = "0x9326BFA02ADD2366b30bacB125260Af641031331";

// // Set up contract instance
// const priceFeed = new web3.eth.Contract(aggregatorV3InterfaceABI, addr);
// //Make call to latestRoundData()
// priceFeed.methods.latestRoundData().call()
//     .then((roundData) => {
//         // Do something with roundData
//         console.log("Latest Round Data", roundData)
//     });


const f = async() => {
    const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const priceConsumerV3 = await PriceConsumerV3.deploy(aggregator_addr);

    await priceConsumerV3.deployed();

    console.log("priceConsumerV3 deployed to:", priceConsumerV3.address);
    // console.log(priceConsumerV3);

    // Make call to getLatestPrice()
    priceConsumerV3.getLatestPrice()
        .then((price) => {
            console.log("Latest price", price);
        }).catch(e => console.error(e));
    return priceConsumerV3;
};

f().then((priceConsumerV3) => {

}).catch(e => console.error(e));