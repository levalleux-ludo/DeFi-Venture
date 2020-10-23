const { ethers } = require("ethers");

const types = [{
        "name": "_requestId",
        "type": "bytes32"
    },
    {
        "name": "_payment",
        "type": "uint256"
    },
    {
        "name": "_callbackAddress",
        "type": "address"
    },
    {
        "name": "_callbackFunctionId",
        "type": "bytes4"
    },
    {
        "name": "_expiration",
        "type": "uint256"
    },
    {
        "name": "_data",
        "type": "bytes32"
    }
];
// const data = '0x4ded75e65f2bd652742a5b2a430b151f313adee185e07e2c0348f15ef6a64c570000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000089dfd79fd54177e8c1ad140a2307e12f945c3b594357855e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f84642000000000000000000000000000000000000000000000000000000000001bc93f';
const data = '0x433f0b858a185dba3c154b9d5ae78baef233282cacd53e3572cdda4dbe0fdba80000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000058a6b35c7dad4672f341acb436866d7bbca84d64357855e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f8582d500000000000000000000000000000000000000000000000000000000001b3b25';
const coder = ethers.utils.defaultAbiCoder;
const result = coder.decode(types, data);
console.log(result);
console.log('payment', result[1].toString());
console.log('expiration', result[4].toString());

const jobId = 'e381cc48bd43447bbc6ee73bd4546ab7';
const jobIdAsArray = ethers.utils.toUtf8Bytes(jobId);
console.log('hexlify', ethers.utils.hexlify(jobIdAsArray));