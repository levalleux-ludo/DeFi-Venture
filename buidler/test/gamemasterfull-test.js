const { expect } = require("chai");
const { getSpaces, getChances } = require("../db/playground");
const { BigNumber, utils } = require("ethers");

const NB_MAX_PLAYERS = 8;
const INITIAL_BALANCE = 1000;
const NB_POSITIONS = 24;
const PLAYGROUND = '0x0000000000000000867d776f030203645f554c01463d03342e261e170f030600';
const NB_CHANCES = 32;
const CHANCES = '0x1305169c190e120508051c05201e1034543a0520055c1e1118b4181c052643bc';


const STATUS = {
    created: 0,
    started: 1,
    frozen: 2,
    ended: 3
};

var GameMasterFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;

// generic handlers to test exceptions
const shouldFail = {
    then: () => {
        expect(false).to.equal(true, "must fail");
    },
    catch: (e) => {
        expect(true).to.equal(true, "must fail");
    }
};

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

async function createGameToken() {
    TokenFactory = await ethers.getContractFactory("GameToken");
    const gameToken = await TokenFactory.deploy();
    await gameToken.deployed();
    return gameToken;
}

async function createGameAssets() {
    AssetsFactory = await ethers.getContractFactory("GameAssets");
    const gameAssets = await AssetsFactory.deploy();
    await gameAssets.deployed();
    return gameAssets;
}

async function createMarketplace() {
    MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    const marketplace = await MarketplaceFactory.deploy();
    await marketplace.deployed();
    return marketplace;
}


async function createGameMaster(token, assets, marketplace) {
    GameMasterFactory = await ethers.getContractFactory("GameMasterForTest");
    const gameMaster = await GameMasterFactory.deploy(
        NB_MAX_PLAYERS,
        NB_POSITIONS,
        ethers.BigNumber.from(INITIAL_BALANCE),
        // getSpaces(NB_POSITIONS),
        PLAYGROUND,
        getChances(NB_CHANCES, NB_POSITIONS)
    );
    await gameMaster.deployed();
    await token.transferOwnership(gameMaster.address);
    await assets.transferOwnership(gameMaster.address);
    await gameMaster.setToken(token.address);
    await gameMaster.setAssets(assets.address);
    // await marketplace.setToken(token.address);
    // await marketplace.setAssets(assets.address);
    await marketplace.transferOwnership(gameMaster.address);
    await gameMaster.setMarketplace(marketplace.address);
    return gameMaster;
}
var avatarCount = 1;

async function registerPlayers(gameMaster, players) {
    let tokenContract;
    let assetsContract;
    const token = await gameMaster.getToken();
    if (token !== 0) {
        tokenContract = await TokenFactory.attach(token);
        await tokenContract.deployed();
    }
    const assets = await gameMaster.getAssets();
    if (assets !== 0) {
        assetsContract = await AssetsFactory.attach(assets);
        await assetsContract.deployed();
    }
    const marketplaceAddr = await gameMaster.getMarketplace();
    for (let player of players) {
        if (tokenContract) {
            await tokenContract.connect(player).approveMax(gameMaster.address);
            if (marketplaceAddr) {
                await tokenContract.connect(player).approveMax(marketplaceAddr);
            }
        }
        if (assetsContract && marketplaceAddr) {
            await assetsContract.connect(player).setApprovalForAll(marketplaceAddr, true);
        }
        await gameMaster.connect(player).register(utils.formatBytes32String('user' + avatarCount), avatarCount++);
    }
}

async function startGame(gameMaster) {
    await gameMaster.start();
}


async function playTurn(gameMaster, signer) {
    return new Promise(async(resolve) => {
        let filter = gameMaster.filters.RolledDices(signer.address);
        gameMaster.once(filter, async(player, dice1, dice2, cardId, newPosition, options) => {
            console.log('RolledDices', player, dice1, dice2, cardId, newPosition, options);
            await gameMaster.setOptions(255);
            await gameMaster.connect(signer).play(1);
            resolve([dice1, dice2]);
        });
        await gameMaster.connect(signer).rollDices();
    });
}

function checkDice(dice) {
    expect(dice).to.be.lessThan(7, 'dices cannot exceed 6');
    expect(dice).to.be.greaterThan(0, 'dices cannot be under 1');
}

describe('Game play <ith token and assets', () => {
    var gameMaster;
    var token;
    var assets;
    var marketplace;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;

    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        token = await createGameToken();
        assets = await createGameAssets();
        marketplace = await createMarketplace();
        gameMaster = await createGameMaster(token, assets, marketplace);
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    });
    it('verify initial conditions', async() => {
        const balance1 = await token.balanceOf(addr1Address);
        expect(balance1.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        const balance2 = await token.balanceOf(addr2Address);
        expect(balance2.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).toString());
        const assets1 = await assets.balanceOf(addr1Address);
        expect(assets1.toString()).to.equal('0');
        const assets2 = await assets.balanceOf(addr2Address);
        expect(assets2.toString()).to.equal('0');

    })
    it('play BUY_ASSET at ASSET 1', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.getCurrentPlayer()).to.equal(addr1Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr1Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr1Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(3);
        const assetPrice = spaceDetails[2];
        console.log('assetPrice', assetPrice.toString());
        // await token.connect(addr1).increaseAllowance(gameMaster.address, assetPrice);
        await expect(gameMaster.connect(addr1).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 2, 12, position);
        const balanceCash = await token.balanceOf(addr1Address);
        expect(balanceCash.toString()).to.equal(BigNumber.from(INITIAL_BALANCE).sub(assetPrice).toString());
        const assets1 = await assets.balanceOf(addr1Address);
        expect(assets1.toString()).to.equal('1');
        const assetId1 = await assets.tokenOfOwnerByIndex(addr1Address, 0);
        expect(assetId1.toString()).to.equal('1');
    })
    it('option PAY_BILL shall be available if asset owned by another player', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.getCurrentPlayer()).to.equal(addr2Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr2Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr2Address);
        const options = await gameMaster.getOptionsAt(addr2Address, position);
        await gameMaster.setOptions(options);
        await gameMaster.setCardId(12);
        expect(await gameMaster.getCurrentOptions()).to.equal(4); // PAY_BILL
        await expect(gameMaster.connect(addr2).play(2)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(4)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 4, 12, position);
    })
    it('option PAY_BILL shall NOT be available if asset owned by same player', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.getCurrentPlayer()).to.equal(addr1Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr1Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr1Address);
        const options = await gameMaster.getOptionsAt(addr1Address, position);
        expect(options).to.equal(1);
        await gameMaster.setOptions(options);
        await gameMaster.setCardId(12);
        expect(await gameMaster.getCurrentOptions()).to.equal(1); // NOTHING
        await expect(gameMaster.connect(addr1).play(1)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 1, 12, position);
    })
    it('play CHANCE', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.getCurrentPlayer()).to.equal(addr2Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr2Address, 2); // CHANCE
        await gameMaster.setOptions(8);
        await expect(gameMaster.connect(addr2).play(0)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(2)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(4)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(16)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(0xFF & ~8)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await gameMaster.setCardId(12);
        const position = await gameMaster.getPositionOf(addr2Address);
        await expect(gameMaster.connect(addr2).play(8)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 8, 12, position);
    })
    it('exchange asset via marketplace', async() => {
        // before transfer
        {
            const assets1 = await assets.balanceOf(addr1Address);
            expect(assets1.toString()).to.equal('1');
            const assetId1 = await assets.tokenOfOwnerByIndex(addr1Address, 0);
            expect(assetId1.toString()).to.equal('1');
            const assets2 = await assets.balanceOf(addr2Address);
            expect(assets2.toString()).to.equal('0');
        }
        await marketplace.connect(addr1).sell(1, 100, 75);
        expect((await marketplace.getNbSales()).toString()).to.equal('1');
        await marketplace.connect(addr2).bid(1, 100);
        const nbSales = await marketplace.getNbSales();
        await expect(nbSales.toString()).to.equal('0');

        // after transfer
        {
            const assets1 = await assets.balanceOf(addr1Address);
            expect(assets1.toString()).to.equal('0');
            const assets2 = await assets.balanceOf(addr2Address);
            await expect(assets2.toString()).to.equal('1');
            const assetId2 = await assets.tokenOfOwnerByIndex(addr2Address, 0);
            await expect(assetId2.toString()).to.equal('1');
        }
    })
})

function extractSpaceCode(playground, spaceId) {
    const idxStart = playground.length - 2 * (spaceId);
    return playground.slice(idxStart - 2, idxStart);
}