const { expect } = require("chai");

describe("EventEmitter", function() {
    it("Should raise event", async function() {
        const EventEmitter = await ethers.getContractFactory("EventEmitter");
        const eventEmitter = await EventEmitter.deploy();

        await eventEmitter.deployed();
        await expect(eventEmitter.wakeUp(12)).to.emit(eventEmitter, 'Trigger').withArgs(12)
    });
});