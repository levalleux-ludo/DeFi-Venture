const { expect } = require("chai");
const { utils } = require("ethers");

const NB_MAX_PLAYERS = 8;

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

describe('GameScheduler', () => {
    var gameScheduler;
    var avatarCount = 1;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;
    var toto = utils.formatBytes32String('toto');
    var titi = utils.formatBytes32String('titi');
    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const factory = await ethers.getContractFactory('GameScheduler');
        gameScheduler = await factory.deploy(NB_MAX_PLAYERS);
        await gameScheduler.deployed();
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })
    it('register invalid avatar', async() => {
        await expect(gameScheduler.register(toto, 0)).to.be.revertedWith(revertMessage("INVALID_AVATAR"));
    })
    it('register invalid username', async() => {
        await expect(gameScheduler.register(utils.formatBytes32String(''), 1)).to.be.revertedWith(revertMessage("INVALID_USERNAME"));
    })
    it('register 1st user', async() => {
        await gameScheduler.connect(addr1).register(toto, 1);
        expect(await gameScheduler.isPlayerRegistered(addr1Address)).to.equal(true);
        expect(await gameScheduler.isUsernameTaken(toto)).to.equal(true);
        expect(await gameScheduler.isAvatarTaken(1)).to.equal(true);
        expect(await gameScheduler.nbPlayers()).to.equal(1);
        expect(await gameScheduler.players(addr1Address)).to.equal(1);
        expect(await gameScheduler.usernames(addr1Address)).to.equal(toto);
    })
    it('register same avatar', async() => {
        await expect(gameScheduler.register(titi, 1)).to.be.revertedWith(revertMessage("AVATAR_ALREADY_TAKEN"));
    })
    it('register same username', async() => {
        await expect(gameScheduler.register(toto, 2)).to.be.revertedWith(revertMessage("USERNAME_ALREADY_TAKEN"));
    })
    it('register same player', async() => {
        await expect(gameScheduler.connect(addr1).register(titi, 2)).to.be.revertedWith(revertMessage("PLAYER_ALREADY_REGISTERED"));
    })
    it('register 2ndt user', async() => {
        await gameScheduler.connect(addr2).register(titi, 7);
        expect(await gameScheduler.isPlayerRegistered(addr2Address)).to.equal(true);
        expect(await gameScheduler.isUsernameTaken(titi)).to.equal(true);
        expect(await gameScheduler.isAvatarTaken(7)).to.equal(true);
        expect(await gameScheduler.nbPlayers()).to.equal(2);
        expect(await gameScheduler.players(addr2Address)).to.equal(7);
        expect(await gameScheduler.usernames(addr2Address)).to.equal(titi);
    })

})