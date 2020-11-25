const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { createGameMasterBase, createGameToken, createGameAssets, createMarketplace, NULL_ADDRESS, STATUS, revertMessage, startGame } = require('./testsUtils');

var GameMasterFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;
var avatarCount = 1;
const INITIAL_BALANCE = 200; // Reduce the initial amount to make easier to get players losing

async function createGameMaster(token, assets, marketplace) {
    const gameMaster = await createGameMasterBase();
    await gameMaster.setInitialAmount(BigNumber.from(INITIAL_BALANCE));
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

async function registerPlayers(gameMaster, players) {
    let tokenContract;
    let assetsContract;
    const token = await gameMaster.tokenAddress();
    if (token !== 0) {
        tokenContract = await TokenFactory.attach(token);
        await tokenContract.deployed();
    }
    const assets = await gameMaster.assetsAddress();
    if (assets !== 0) {
        assetsContract = await AssetsFactory.attach(assets);
        await assetsContract.deployed();
    }
    const marketplaceAddr = await gameMaster.marketplaceAddress();
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

describe('Game play with token and assets', () => {
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
        TokenFactory = await ethers.getContractFactory("GameToken");
        token = await createGameToken(TokenFactory);
        console.log('token', token.address);
        AssetsFactory = await ethers.getContractFactory("GameAssets");
        assets = await createGameAssets(AssetsFactory);
        console.log('assets', assets.address);
        MarketplaceFactory = await ethers.getContractFactory("Marketplace");
        marketplace = await createMarketplace(MarketplaceFactory);
        console.log('marketplace', marketplace.address);
        gameMaster = await createGameMaster(token, assets, marketplace);
        console.log('gameMaster', gameMaster.address);
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
        expect(await gameMaster.currentPlayer()).to.equal(addr1Address, "current player shall be changed");
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
        expect(await gameMaster.currentPlayer()).to.equal(addr2Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr2Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr2Address);
        const options = await gameMaster.getOptionsAt(addr2Address, position);
        await gameMaster.setOptions(options);
        await gameMaster.setCardId(12);
        expect(await gameMaster.currentOptions()).to.equal(4); // PAY_BILL
        await expect(gameMaster.connect(addr2).play(2)).to.be.revertedWith(revertMessage("OPTION_NOT_ALLOWED"));
        await expect(gameMaster.connect(addr2).play(4)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 4, 12, position);
    })
    it('option PAY_BILL shall NOT be available if asset owned by same player', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr1Address, "current player shall be changed");
        await gameMaster.setPlayerPosition(addr1Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr1Address);
        const options = await gameMaster.getOptionsAt(addr1Address, position);
        expect(options).to.equal(1);
        await gameMaster.setOptions(options);
        await gameMaster.setCardId(12);
        expect(await gameMaster.currentOptions()).to.equal(1); // NOTHING
        await expect(gameMaster.connect(addr1).play(1)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 1, 12, position);
    })
    it('play CHANCE', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        expect(await gameMaster.currentPlayer()).to.equal(addr2Address, "current player shall be changed");
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

describe('Losing player', () => {
    var gameMaster;
    var token;
    var assets;
    var marketplace;
    var owner;
    var addr1;
    var addr1Address;
    var addr2;
    var addr2Address;
    var addr3;
    var addr3Address;
    var addr4;
    var addr4Address;

    before('before', async() => {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        TokenFactory = await ethers.getContractFactory("GameToken");
        token = await createGameToken(TokenFactory);
        AssetsFactory = await ethers.getContractFactory("GameAssets");
        assets = await createGameAssets(AssetsFactory);
        MarketplaceFactory = await ethers.getContractFactory("Marketplace");
        marketplace = await createMarketplace(MarketplaceFactory);
        gameMaster = await createGameMaster(token, assets, marketplace);
        await registerPlayers(gameMaster, [addr1, addr2, addr3, addr4]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        addr3Address = await addr3.getAddress();
        addr4Address = await addr4.getAddress();
    });
    it('Player 1 spend all his cash', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr1Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr1Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetPrice = spaceDetails[2];
        console.log('assetPrice', assetPrice.toString());
        const balanceBefore = await token.balanceOf(addr1Address);
        expect(balanceBefore.sub(assetPrice).toString()).to.equal('0');
        await expect(gameMaster.connect(addr1).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr1Address, 2, 12, position);
        const balanceAfter = await token.balanceOf(addr1Address);
        console.log('balance after buy', balanceAfter.toString());
        expect(balanceAfter.toString()).to.equal('0');
    });
    it('Player 2 buy asset #2', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr2Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr2Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr2).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 2, 12, position);
    });
    it('Player 3 play nothing', async() => {
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    })
    it('Player 4 play nothing', async() => {
        await expect(gameMaster.connect(addr4).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr4).play(1)).to.emit(gameMaster, 'PlayPerformed');
    })
    it('Player 1 must pay bill with not enough cash', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr1Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr1Address);
        console.log('position', position);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetId = spaceDetails[1];
        const owner = await assets.ownerOf(assetId);
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr1Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(false);
        await expect(gameMaster.connect(addr1).play(4)).to.emit(gameMaster, 'PlayerLost').withArgs(addr1Address);
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(true);
        expect(await gameMaster.hasPlayerLost(addr2Address)).to.equal(false);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 4 play nothing', async() => {
        await expect(gameMaster.connect(addr4).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr4).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 4 transfer all his cash to player 2 and try buying asset #3', async() => {
        const balanceBefore = await token.balanceOf(addr4Address);
        console.log('balance addr4', balanceBefore.toString());
        await token.connect(addr4).transfer(addr2Address, balanceBefore);
        const balanceAfter = await token.balanceOf(addr4Address);
        expect(balanceAfter.toString()).to.equal('0');
        await expect(gameMaster.connect(addr4).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr4Address, 5); // ASSET id 3
        const position = await gameMaster.getPositionOf(addr4Address);
        console.log('position', position);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetId = spaceDetails[5];
        const options = await gameMaster.getOptionsAt(addr4Address, position);
        expect(options).to.equal(3); // BUY_ASSET | NOTHING
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(false);
        await expect(gameMaster.connect(addr4).play(2)).to.emit(gameMaster, 'PlayerLost').withArgs(addr4Address);
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(true);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr3Address, "current player shall be changed");
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 must pay bill with not enough cash', async() => {
        const balanceBefore = await token.balanceOf(addr3Address);
        await token.connect(addr3).transfer(addr2Address, balanceBefore);
        const balanceAfter = await token.balanceOf(addr3Address);
        expect(balanceAfter.toString()).to.equal('0');
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr3Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr3Address);
        console.log('position', position);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetId = spaceDetails[1];
        const owner = await assets.ownerOf(assetId);
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr3Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(false);
        await expect(gameMaster.connect(addr3).play(4)).to.emit(gameMaster, 'PlayerLost').withArgs(addr3Address);
    });
    it('Player 2 is the winner', async() => {
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(true);
        expect(await gameMaster.hasPlayerLost(addr2Address)).to.equal(false);
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(true);
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(true);
        expect(await gameMaster.getWinner()).to.equal(addr2Address);
        expect(await gameMaster.status()).to.equal(STATUS.ended);
        await expect(gameMaster.connect(addr2).rollDices()).to.be.revertedWith(revertMessage("INVALID_GAME_STATE"));
    })


});