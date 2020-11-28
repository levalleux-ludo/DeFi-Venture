const bre = require("@nomiclabs/buidler");
const { expect } = require("chai");
const { BigNumber, utils } = require("ethers");
const { createGameMasterFull, registerPlayers, createGameToken, createGameAssets, createMarketplace, NULL_ADDRESS, STATUS, revertMessage, startGame } = require('./testsUtils');
const ethers = bre.ethers;

var GameMasterFactory;
var TokenFactory;
var AssetsFactory;
var MarketplaceFactory;
var TransferManagerFactory;
var avatarCount = 1;
const INITIAL_BALANCE = 200; // Reduce the initial amount to make easier to get players losing

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
        const game = await createGameMasterFull();
        gameMaster = game.gameMaster;
        token = game.token;
        assets = game.assets;
        marketplace = game.marketplace;
        console.log('gameMaster', gameMaster.address);
        await gameMaster.setInitialAmount(BigNumber.from(INITIAL_BALANCE));
        await registerPlayers(gameMaster, [addr1, addr2]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        TransferManagerFactory = await ethers.getContractFactory("TransferManager");
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
        const balance2Before = await token.balanceOf(addr2Address);
        expect(balance2Before.toNumber()).to.be.gte(90);
        await marketplace.connect(addr2).bid(1, 90);
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
        const balance2After = await token.balanceOf(addr2Address);
        expect(balance2Before.sub(balance2After).toString()).to.equal('90');

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
        const game = await createGameMasterFull();
        gameMaster = game.gameMaster;
        token = game.token;
        assets = game.assets;
        marketplace = game.marketplace;
        await gameMaster.setInitialAmount(BigNumber.from(INITIAL_BALANCE));
        await registerPlayers(gameMaster, [addr1, addr2, addr3, addr4]);
        await startGame(gameMaster);
        addr1Address = await addr1.getAddress();
        addr2Address = await addr2.getAddress();
        addr3Address = await addr3.getAddress();
        addr4Address = await addr4.getAddress();
    });
    it('Player 1 spend all his cash buying asset #1 @position 3', async() => {
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
    it('Player 2 buy asset #2 at position 4', async() => {
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr2Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr2Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr2).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr2Address, 2, 12, position);
    });
    it('Player 3 buy asset #6 at position 8', async() => {
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr3Address, 8); // ASSET id 6
        const position = await gameMaster.getPositionOf(addr3Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr3).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr3Address, 2, 12, position);
    });
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
        const productPrice = spaceDetails[3];
        const owner = await assets.ownerOf(assetId);
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr1Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(false);
        const spaceAsset1 = await gameMaster.getSpaceDetails(3);
        expect(spaceAsset1[1]).to.equal(1);
        const asset1Value = spaceAsset1[2];
        const ownerAsset1 = await assets.ownerOf(spaceAsset1[1]);
        // Player1 is not able to pay  the bill right now
        const balance1Before = await token.balanceOf(addr1Address);
        expect(balance1Before.toNumber()).to.be.lessThan(productPrice.toNumber());
        expect(balance1Before.toString()).to.equal('0');
        // Player1 owns some assets, so he will be liquidated
        const balance1AssetsBefore = await assets.balanceOf(addr1Address);
        expect(balance1AssetsBefore.toString()).to.equal('1');
        expect(ownerAsset1).to.equal(addr1Address);
        // After liquidation, player1 shall be able to pay the bill, so he wont loose
        expect((asset1Value.div(2)).toNumber()).to.be.greaterThan(productPrice.toNumber());
        const transferManagerAddress = await gameMaster.transferManagerAddress();
        const transferManager = await TransferManagerFactory.attach(transferManagerAddress);
        // Play shall raise liquidation event
        await expect(gameMaster.connect(addr1).play(4)).to.emit(transferManager, 'PlayerLiquidated').withArgs(addr1Address);
        // After liquidation, Player1 does not own any asset
        const balance1AssetsAfter = await assets.balanceOf(addr1Address);
        expect(balance1AssetsAfter.toString()).to.equal('0');
        // the bill has been paid
        const balance1After = await token.balanceOf(addr1Address);
        expect(balance1After.toString()).to.equal((asset1Value.div(2)).sub(productPrice).toString());
        // Player did not lose this time
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(false);
        expect(await gameMaster.hasPlayerLost(addr2Address)).to.equal(false);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 buy asset #9 at position 13', async() => {
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr3Address, 13); // ASSET id 9
        const position = await gameMaster.getPositionOf(addr3Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr3).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr3Address, 2, 12, position);
    });
    it('Player 4 spend all his cash buying asset #1 @position 3', async() => {
        await expect(gameMaster.connect(addr4).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr4Address, 3); // ASSET id 1
        const position = await gameMaster.getPositionOf(addr4Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetPrice = spaceDetails[2];
        console.log('assetPrice', assetPrice.toString());
        const balanceBefore = await token.balanceOf(addr4Address);
        expect(balanceBefore.sub(assetPrice).toString()).to.equal('0');
        await expect(gameMaster.connect(addr4).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr4Address, 2, 12, position);
        const balanceAfter = await token.balanceOf(addr4Address);
        console.log('balance after buy', balanceAfter.toString());
        expect(balanceAfter.toString()).to.equal('0');
    });
    it('Player 1 must pay bill with not enough cash', async() => {
        await expect(gameMaster.connect(addr1).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr1Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr1Address);
        console.log('position', position);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetId = spaceDetails[1];
        const productPrice = spaceDetails[3];
        const owner = await assets.ownerOf(assetId);
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr1Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        // Player1 has not lost (yet)
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(false);
        // Player1 is not able to pay  the bill right now
        const balance1Before = await token.balanceOf(addr1Address);
        expect(balance1Before.toNumber()).to.be.lessThan(productPrice.toNumber());
        // Player1 does not own any assets, so he can't be liquidated
        const balance1AssetsBefore = await assets.balanceOf(addr1Address);
        expect(balance1AssetsBefore.toString()).to.equal('0');
        // Play shall raise player lost event
        await expect(gameMaster.connect(addr1).play(4)).to.emit(gameMaster, 'PlayerLost').withArgs(addr1Address);
        // After losing, player1 balance has not changed
        const balance1After = await token.balanceOf(addr1Address);
        expect(balance1After.toString()).to.equal(balance1Before.toString());
        // Player did lose
        expect(await gameMaster.hasPlayerLost(addr1Address)).to.equal(true);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 buy asset #12 at position 16', async() => {
        await expect(gameMaster.connect(addr3).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr3Address, 16); // ASSET id 12
        const position = await gameMaster.getPositionOf(addr3Address);
        console.log('position', position);
        await gameMaster.setOptions(3);
        await gameMaster.setCardId(12);
        await expect(gameMaster.connect(addr3).play(2)).to.emit(gameMaster, 'PlayPerformed').withArgs(addr3Address, 2, 12, position);
    });
    it('Player 4, owning asset #1 tries buying asset #3 with no cash anymore', async() => {
        const balanceBefore = await token.balanceOf(addr4Address);
        expect(balanceBefore.toString()).to.equal('0');
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
        const transferManagerAddress = await gameMaster.transferManagerAddress();
        const transferManager = await TransferManagerFactory.attach(transferManagerAddress);
        await expect(gameMaster.connect(addr4).play(2))
            .to.emit(gameMaster, 'PlayPerformed').withArgs(addr4Address, 1, 12, position)
            .to.emit(transferManager, 'PlayerLiquidated').withArgs(addr4Address);
        // After liquidation, Player4 does not own any asset
        const balance4AssetsAfter = await assets.balanceOf(addr4Address);
        expect(balance4AssetsAfter.toString()).to.equal('0');
        // Player4 did not lose this time
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(false);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
        // Player4 gives all his cash to Player3
        let balance4Before = await token.balanceOf(addr4Address);
        await token.connect(addr4).transfer(addr3Address, balance4Before.div(2));
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
        const balance3 = await token.balanceOf(addr3Address);
        console.log('Player3 balance:', balance3.toString());
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr3).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 4 must pay bill with not enough cash', async() => {
        await expect(gameMaster.connect(addr4).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setPlayerPosition(addr4Address, 4); // ASSET id 2
        const position = await gameMaster.getPositionOf(addr4Address);
        await gameMaster.setCardId(12);
        const spaceDetails = await gameMaster.getSpaceDetails(position);
        const assetId = spaceDetails[1];
        const productPrice = spaceDetails[3];
        const owner = await assets.ownerOf(assetId);
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr4Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        // Player4 has not lost (yet)
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(false);
        // Player4 is not able to pay  the bill right now
        let balance4Before = await token.balanceOf(addr4Address);
        balance4Before = await token.balanceOf(addr4Address);
        expect(balance4Before.toNumber()).to.be.lessThan(productPrice.toNumber());
        // Player4 does not own any assets, so he can't be liquidated
        const balance4AssetsBefore = await assets.balanceOf(addr4Address);
        expect(balance4AssetsBefore.toString()).to.equal('0');
        // Play shall raise player lost event
        await expect(gameMaster.connect(addr4).play(4)).to.emit(gameMaster, 'PlayerLost').withArgs(addr4Address);
        // After losing, player4 balance has not changed
        const balance4After = await token.balanceOf(addr4Address);
        expect(balance4After.toString()).to.equal(balance4Before.toString());
        // Player did lose
        expect(await gameMaster.hasPlayerLost(addr4Address)).to.equal(true);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 must pay bill with not enough cash, hence being liquidated', async() => {
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
        const productPrice = spaceDetails[3];
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr3Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(false);
        const balance3AssetsBefore = await assets.balanceOf(addr3Address);
        console.log('Player3 owns ' + balance3AssetsBefore.toString() + ' assets');
        expect(balance3AssetsBefore.toString()).to.equal('3');
        const balance3Before = await token.balanceOf(addr3Address);
        // Play shall raise liquidation event
        const transferManagerAddress = await gameMaster.transferManagerAddress();
        const transferManager = await TransferManagerFactory.attach(transferManagerAddress);
        await expect(gameMaster.connect(addr3).play(4)).to.emit(transferManager, 'PlayerLiquidated').withArgs(addr3Address);
        // After liquidation, Player3 does not own any asset
        const balance3AssetsAfter = await assets.balanceOf(addr3Address);
        expect(balance3AssetsAfter.toString()).to.equal('0');
        // the bill has been paid
        const balance3After = await token.balanceOf(addr3Address);
        expect(balance3After.toString()).to.equal((BigNumber.from(150).div(2)).sub(productPrice).toString());
        // Player did not lose this time
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(false);
        expect(await gameMaster.getWinner()).to.equal(NULL_ADDRESS);
    });
    it('Player 2 can play', async() => {
        expect(await gameMaster.nextPlayer()).to.equal(addr2Address, "current player shall be changed");
        await expect(gameMaster.connect(addr2).rollDices()).to.emit(gameMaster, 'RolledDices');
        await gameMaster.setOptions(1); // NOTHING
        await expect(gameMaster.connect(addr2).play(1)).to.emit(gameMaster, 'PlayPerformed');
    });
    it('Player 3 must pay bill with not enough cash, hence loosing', async() => {
        const balanceBefore = await token.balanceOf(addr3Address);
        // transfer all his cash to another player
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
        const productPrice = spaceDetails[3];
        expect(owner).to.equal(addr2Address);
        const options = await gameMaster.getOptionsAt(addr3Address, position);
        expect(options).to.equal(4); // PAY_BILL
        await gameMaster.setOptions(options);
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(false);
        const balance3AssetsBefore = await assets.balanceOf(addr3Address);
        console.log('Player3 owns ' + balance3AssetsBefore.toString() + ' assets');
        expect(balance3AssetsBefore.toString()).to.equal('0');
        // Play shall raise Player lost event
        await expect(gameMaster.connect(addr3).play(4)).to.emit(gameMaster, 'PlayerLost').withArgs(addr3Address);
        // Player3 lost
        expect(await gameMaster.hasPlayerLost(addr3Address)).to.equal(true);
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