const { expect } = require("chai");
const { utils, BigNumber } = require("ethers");


function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

async function createGameToken(accounts, marketplaceAddress) {
    const TokenFactory = await ethers.getContractFactory("GameToken");
    const gameToken = await TokenFactory.deploy();
    await gameToken.deployed();
    for (const account of accounts) {
        const address = await account.getAddress();
        await gameToken.mint(address, 1000);
        await gameToken.connect(account).approveMax(marketplaceAddress);
    }
    return gameToken;
}

async function createGameAssets(initialOwner, nbAssets, marketplaceAddress) {
    const AssetsFactory = await ethers.getContractFactory("GameAssets");
    const gameAssets = await AssetsFactory.deploy();
    await gameAssets.deployed();
    for (let i = 0; i < nbAssets; i++) {
        const address = await initialOwner.getAddress();
        gameAssets.safeMint(address, i);
        await gameAssets.connect(initialOwner).setApprovalForAll(marketplaceAddress, true);
    }
    return gameAssets;
}


describe('Marketplace', () => {
    var marketplace;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;
    var tokenContract;
    var assetsContract;
    var balance1;
    var balance2;
    before('before', async() => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const factory = await ethers.getContractFactory('Marketplace');
        marketplace = await factory.deploy();
        await marketplace.deployed();
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
    })
    beforeEach('before each', async() => {
        if (tokenContract) {
            balance1 = await tokenContract.balanceOf(addr1Address);
            balance2 = await tokenContract.balanceOf(addr2Address);
        }
    });
    it('marketplace is deployed', async() => {
        expect(await marketplace.getNbSales()).to.equal(0);
        tokenContract = await createGameToken([addr1, addr2], marketplace.address);
        await marketplace.setToken(tokenContract.address);
        balance1 = await tokenContract.balanceOf(addr1Address);
        balance2 = await tokenContract.balanceOf(addr2Address);
        assetsContract = await createGameAssets(addr1, 6, marketplace.address);
        await marketplace.setAssets(assetsContract.address);
    })
    it('sell asset 0', async() => {
        const assetId = BigNumber.from(0);
        const fairPrice = BigNumber.from(100);
        const minPrice = BigNumber.from(75);
        await expect(marketplace.connect(addr1).sell(assetId, fairPrice, minPrice)).to.emit(marketplace, 'AssetForSale').withArgs(assetId, fairPrice);
        expect(await marketplace.getNbSales()).to.equal(1);
    })
    it('sell asset 1', async() => {
        const assetId = BigNumber.from(1);
        const fairPrice = BigNumber.from(100);
        const minPrice = BigNumber.from(75);
        await expect(marketplace.connect(addr1).sell(assetId, fairPrice, minPrice)).to.emit(marketplace, 'AssetForSale').withArgs(assetId, fairPrice);
        expect(await marketplace.getNbSales()).to.equal(2);
    })
    it('sell asset 2', async() => {
        const assetId = BigNumber.from(2);
        const fairPrice = BigNumber.from(100);
        const minPrice = BigNumber.from(75);
        await expect(marketplace.connect(addr1).sell(assetId, fairPrice, minPrice)).to.emit(marketplace, 'AssetForSale').withArgs(assetId, fairPrice);
        expect(await marketplace.getNbSales()).to.equal(3);
    })
    it('sell asset 3', async() => {
        const assetId = BigNumber.from(3);
        const fairPrice = BigNumber.from(100);
        const minPrice = BigNumber.from(75);
        await expect(marketplace.connect(addr1).sell(assetId, fairPrice, minPrice)).to.emit(marketplace, 'AssetForSale').withArgs(assetId, fairPrice);
        expect(await marketplace.getNbSales()).to.equal(4);
    })
    it('bid with too low price', async() => {
        const assetId = BigNumber.from(0);
        const price = BigNumber.from(50);
        await expect(marketplace.connect(addr2).bid(assetId, price)).to.be.revertedWith(revertMessage('BID_REJECTED'));
        expect(await assetsContract.ownerOf(assetId)).to.equal(addr1Address);
        expect((await tokenContract.balanceOf(addr1Address)).toString()).to.equal(balance1.toString());
        expect((await tokenContract.balanceOf(addr2Address)).toString()).to.equal(balance2.toString());
    })
    it('bid at min price', async() => {
        const assetId = BigNumber.from(0);
        const price = BigNumber.from(75);
        await marketplace.connect(addr2).bid(assetId, price);
        expect(await marketplace.getNbSales()).to.equal(3);
        expect(await assetsContract.ownerOf(assetId)).to.equal(addr2Address);
        expect((await tokenContract.balanceOf(addr1Address)).toString()).to.equal(balance1.add(price).toString());
        expect((await tokenContract.balanceOf(addr2Address)).toString()).to.equal(balance2.sub(price).toString());
    })
    it('bid at fair price', async() => {
        const assetId = BigNumber.from(1);
        const price = BigNumber.from(100);
        await marketplace.connect(addr2).bid(assetId, price);
        expect(await marketplace.getNbSales()).to.equal(2);
        expect(await assetsContract.ownerOf(assetId)).to.equal(addr2Address);
        expect((await tokenContract.balanceOf(addr1Address)).toString()).to.equal(balance1.add(price).toString());
        expect((await tokenContract.balanceOf(addr2Address)).toString()).to.equal(balance2.sub(price).toString());
    })
    it('bid at upper price', async() => {
        const assetId = BigNumber.from(2);
        const price = BigNumber.from(125);
        await marketplace.connect(addr2).bid(assetId, price);
        expect(await marketplace.getNbSales()).to.equal(1);
        expect(await assetsContract.ownerOf(assetId)).to.equal(addr2Address);
        expect((await tokenContract.balanceOf(addr1Address)).toString()).to.equal(balance1.add(100).toString());
        expect((await tokenContract.balanceOf(addr2Address)).toString()).to.equal(balance2.sub(100).toString());
    })
    it('bid at medium price', async() => {
        const assetId = BigNumber.from(3);
        const price = BigNumber.from(85);
        await marketplace.connect(addr2).bid(assetId, price);
        expect(await marketplace.getNbSales()).to.equal(0);
        expect(await assetsContract.ownerOf(assetId)).to.equal(addr2Address);
        expect((await tokenContract.balanceOf(addr1Address)).toString()).to.equal(balance1.add(price).toString());
        expect((await tokenContract.balanceOf(addr2Address)).toString()).to.equal(balance2.sub(price).toString());
    })
})