const bre = require("@nomiclabs/buidler");

const greeterContract = {
    5: '0x98897Bad75F2Fc3D172F3c52FDb87f69580f01Fa', // goerli
    80001: '0x200E5295fEC37B4410E6688a94de22C9d4C6DDbb' // mumbai
}
async function main() {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeterAddress = greeterContract[bre.network.config.chainId];
    const greeter = await Greeter.attach(greeterAddress);
    await greeter.deployed();
    console.log("greeter deployed to:", greeter.address);
    const message = await greeter.greet();
    console.log('message', message);
    await greeter.estimateGas.setGreeting(message + "!").then((gas) => {
        console.log('estimatedGas:', gas.toString());
    })
    await greeter.setGreeting(message + "!").then(async(response) => {
        console.log('Tx sent', response.hash);
        await response.wait().then(async(receipt) => {
            console.log('Tx validated', receipt.transactionHash);
            console.log('gas used', receipt.gasUsed.toString());
            const newmessage = await greeter.greet();
            console.log('newmessage', newmessage);
        }).catch(e => console.error(e));
    }).catch(e => console.error(e));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });