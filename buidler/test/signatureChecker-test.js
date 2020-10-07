const { expect } = require("chai");

async function createContract() {
    const Factory = await ethers.getContractFactory("SignatureChecker");
    const contract = await Factory.deploy();
    await contract.deployed();
    return contract;
}


describe("SignatureChecker", function() {
    it("Well signed text message", async function() {
        const signatureChecker = await createContract();
        const [owner, addr1, addr2] = await ethers.getSigners();
        const message = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hello World"));
        const message2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hello World 2"));
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        const signature1 = await addr1.signMessage(message);
        const signature2 = await addr2.signMessage(message);
        const signature1_2 = await addr1.signMessage(message2);
        const signature2_2 = await addr2.signMessage(message2);
        expect(await signatureChecker.verifyString(message, signature1) == addr1Address).to.equal(true, "Signature does not match signer");
        // expect(await signatureChecker.checkSignature(message, signature1, addr1Address)).to.equal(true, "Signature does not match signer");
        expect(await signatureChecker.verifyString(message, signature2) == addr2Address).to.equal(true, "Signature does not match signer");
        expect(await signatureChecker.verifyString(message2, signature1_2) == addr1Address).to.equal(true, "Signature does not match signer");
        expect(await signatureChecker.verifyString(message2, signature2_2) == addr2Address).to.equal(true, "Signature does not match signer");
    });
    it("Wrong signed text message", async function() {
        const signatureChecker = await createContract();
        const [owner, addr1, addr2] = await ethers.getSigners();
        const message = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hello World"));
        const message2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Hello World 2"));
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        const signature1 = await addr1.signMessage(message);
        const signature2 = await addr2.signMessage(message);
        const signature1_2 = await addr1.signMessage(message2);
        const signature2_2 = await addr2.signMessage(message2);
        expect(await signatureChecker.verifyString(message, signature1) == addr2Address).to.equal(false, "Signature should not match signer");
        expect(await signatureChecker.verifyString(message, signature1_2) == addr1Address).to.equal(false, "Signature should not match signer");
        expect(await signatureChecker.verifyString(message2, signature1) == addr1Address).to.equal(false, "Signature should not match signer");
        expect(await signatureChecker.verifyString(message, signature2) == addr1Address).to.equal(false, "Signature should not match signer");
        expect(await signatureChecker.verifyString(message, signature2_2) == addr2Address).to.equal(false, "Signature should not match signer");
        expect(await signatureChecker.verifyString(message2, signature2) == addr2Address).to.equal(false, "Signature should not match signer");
    });
    // it("Well signed payload", async function() {
    //     const signatureChecker = await createContract();
    //     const [owner, addr1, addr2] = await ethers.getSigners();
    //     const payload = ethers.utils.keccak256([
    //         [1, 5],
    //         [
    //             12,
    //             'ASSET',
    //             ""
    //         ],
    //         [
    //             "option1",
    //             "option2"
    //         ]
    //     ]);
    //     const payload2 = ethers.utils.keccak256([
    //         [1, 5],
    //         [
    //             12,
    //             'ASSET',
    //             ""
    //         ],
    //         [
    //             "option1",
    //             "option3"
    //         ]
    //     ]);
    //     const addr1Address = await addr1.getAddress();
    //     const addr2Address = await addr2.getAddress();
    //     const signature1 = await addr1.signMessage(payload);
    //     const signature2 = await addr2.signMessage(payload);
    //     const signature1_2 = await addr1.signMessage(payload2);
    //     const signature2_2 = await addr2.signMessage(payload2);
    //     expect(await signatureChecker.verifyString(payload, signature1) == addr1Address).to.equal(true, "Signature does not match signer");
    //     expect(await signatureChecker.verifyString(payload, signature2) == addr2Address).to.equal(true, "Signature does not match signer");
    //     expect(await signatureChecker.verifyString(payload2, signature1_2) == addr1Address).to.equal(true, "Signature does not match signer");
    //     expect(await signatureChecker.verifyString(payload2, signature2_2) == addr2Address).to.equal(true, "Signature does not match signer");
    // });
    // it("Wrong signed payload", async function() {
    //     const signatureChecker = await createContract();
    //     const [owner, addr1, addr2] = await ethers.getSigners();
    //     const payload = ethers.utils.keccak256(ethers.utils.RLP.encode([
    //         [1, 5],
    //         [
    //             12,
    //             'ASSET',
    //             ""
    //         ],
    //         [
    //             "option1",
    //             "option2"
    //         ]
    //     ]));
    //     const payload2 = ethers.utils.keccak256(ethers.utils.RLP.encode([
    //         [1, 5],
    //         [
    //             12,
    //             'ASSET',
    //             ""
    //         ],
    //         [
    //             "option1",
    //             "option3"
    //         ]
    //     ]));
    //     const addr1Address = await addr1.getAddress();
    //     const addr2Address = await addr2.getAddress();
    //     const signature1 = await addr1.signMessage(payload);
    //     const signature2 = await addr2.signMessage(payload);
    //     const signature1_2 = await addr1.signMessage(payload2);
    //     const signature2_2 = await addr2.signMessage(payload2);
    //     expect(await signatureChecker.verifyString(payload, signature1) == addr2Address).to.equal(false, "Signature should not match signer");
    //     expect(await signatureChecker.verifyString(payload, signature1_2) == addr1Address).to.equal(false, "Signature should not match signer");
    //     expect(await signatureChecker.verifyString(payload2, signature1) == addr1Address).to.equal(false, "Signature should not match signer");
    //     expect(await signatureChecker.verifyString(payload, signature2) == addr1Address).to.equal(false, "Signature should not match signer");
    //     expect(await signatureChecker.verifyString(payload, signature2_2) == addr2Address).to.equal(false, "Signature should not match signer");
    //     expect(await signatureChecker.verifyString(payload2, signature2) == addr2Address).to.equal(false, "Signature should not match signer");
    // });
    it("Well signed payload", async function() {
        const signatureChecker = await createContract();
        const [owner, addr1, addr2] = await ethers.getSigners();
        const dices = [1, 5];
        const spaceId = 12;
        console.log("compute options hashes");
        const options = [
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes('option1')),
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes('option2'))
        ];
        // const payload = ethers.utils.defaultAbiCoder.encode();
        console.log("serialize payload");
        const payload = ethers.utils.solidityPack([
            "uint8", "uint8", // dices
            "uint8", // spaceId
            "bytes32", "bytes32" // options
        ], [
            dices[0], dices[1],
            spaceId,
            options[0], options[1]
        ]);
        console.log('payload', payload);
        const addr1Address = await addr1.getAddress();
        const signature1 = await addr1.signMessage(payload);
        console.log('signature', signature1);
        expect(await signatureChecker.verifyPayload(dices, spaceId, options, signature1) == addr1Address).to.equal(true, "Signature does not match signer");
    });
});