//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

// import "@nomiclabs/buidler/console.sol";

import { GameScheduler } from "./GameScheduler.sol";
import { GameMasterStorage } from "./GameMasterStorage.sol";
import { IGameMaster } from "./IGameMaster.sol";
import { IGameToken } from "./IGameToken.sol";
import { IGameAssets } from "./IGameAssets.sol";
import { IMarketplace } from "./IMarketplace.sol";
import { IPlayground } from './IPlayground.sol';
import { IChance } from './IChance.sol';
import { IRandomGenerator } from './IRandomGenerator.sol';

contract GameMaster is GameScheduler, GameMasterStorage, IGameMaster {
    uint256 constant public MAX_UINT256 = 2**256 - 1;
    address public playgroundAddress;
    address public chancesAddress;
    address randomGeneratorAddress;

    event RolledDices(address indexed player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, uint8 options);
    event PlayPerformed(address indexed player, uint8 option, uint8 cardId, uint8 newPosition);

    constructor (
        uint8 nbMaxPlayers,
        uint256 _initialAmount,
        address _playground,
        address _chances,
        address _randomGenerator
        ) public GameScheduler(nbMaxPlayers) {
        initialAmount = _initialAmount;
        playgroundAddress = _playground;
        // playground = IPlayground(_playground);
        chancesAddress = _chances;
        // chances = IChance(_chances);
        randomGeneratorAddress = _randomGenerator;
    }
    
    // function getToken() external override view returns (address) {
    //     return tokenAddress;
    // }

    // function getAssets() external override view returns (address) {
    //     return assetsAddress;
    // }

    // function getMarketplace() external override view returns (address) {
    //     return marketplaceAddress;
    // }

    // function getCurrentPlayer() external override view returns (address) {
    //     return currentPlayer;
    // }

    // function getCurrentOptions() external override view returns (uint8) {
    //     return currentOptions;
    // }


    // function getCurrentCardId() external override view returns (uint8) {
    //     return currentCardId;
    // }

    // function getNbPositions() external override view returns (uint8) {
    //     return nbPositions;
    // }

    // function getPositionOf(address player) external override view returns (uint8) {
    //     return positions[player];
    // }

    // function getChances() external override view returns (bytes32) {
    //     return chances;
    // }

    // function getPlayground() external override view returns (bytes32) {
    //     return playground;
    // }

    function getGameData() external view returns (
        uint8 _status,
        uint8 _nbPlayers,
        uint8 _nbPositions,
        address _token,
        address _assets,
        address _marketplace,
        address _nextPlayer,
        address _currentPlayer,
        uint8 _currentOptions,
        uint8 _currentCardId
    ) {
        _status = status;
        _nbPlayers = nbPlayers;
        _nbPositions = IPlayground(playgroundAddress).getNbPositions();
        _token = tokenAddress;
        _assets = assetsAddress;
        _marketplace = marketplaceAddress;
        _nextPlayer = nextPlayer;
        _currentPlayer = currentPlayer;
        _currentOptions = currentOptions;
        _currentCardId = currentCardId;
    }

    function getPlayerData(address player) external view returns (
        address _address,
        bytes32 _username,
        uint8 _avatar,
        uint8 _position,
        bool _hasLost
    ) {
        _address = player;
        _username = usernames[player];
        _avatar = players[player];
        _position = IPlayground(playgroundAddress).getPlayerPosition(player);
        _hasLost = lostPlayers[player];
    }

    function getPlayersPositions(address[] calldata players) external view returns (
        uint8[] memory _positions
    ) {
        _positions = new uint8[](players.length);
        for (uint i = 0; i < players.length; i++) {
            _positions[i] = IPlayground(playgroundAddress).getPlayerPosition(players[i]);
        }
    }

    function getPlayersData(uint8[] calldata indexes) external view returns (
        address[] memory _addresses,
        bytes32[] memory _usernames,
        uint8[] memory _avatars,
        uint8[] memory _positions,
        bool[] memory _hasLost
    ) {
        _addresses = new address[](indexes.length);
        _usernames = new bytes32[](indexes.length);
        _avatars = new uint8[](indexes.length);
        _positions = new uint8[](indexes.length);
        _hasLost = new bool[](indexes.length);
        for (uint i = 0; i < indexes.length; i++) {
            address player = playersSet[i];
            _addresses[i] = player;
            _usernames[i] = usernames[player];
            _avatars[i] = players[player];
            _positions[i] = IPlayground(playgroundAddress).getPlayerPosition(player);
            _hasLost[i] = lostPlayers[player];
        }
    }

    function getSpaceDetails(uint8 spaceId) external override view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
        return IPlayground(playgroundAddress).getSpaceDetails(spaceId);
    }
    // function getSpaceDetails(uint8 spaceId) external override view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
    //     require(spaceId < nbPositions, "INVALID_ARGUMENT");
    //     uint8 spaceCode = uint8(playground[31 - spaceId]);// Important storage reverse (end-endian)
    //     spaceType = spaceCode & 0x7;
    //     assetId = spaceCode >> 3;
    //     if ((spaceType >= 4) && (spaceType < 8)) {
    //         // spaceType: 4 <=> ASSET_CLASS_1, price = 50
    //         // .. 
    //         // spaceType: 7 <=> ASSET_CLASS_4, price = 200
    //         uint8 assetClass = spaceType - 3;
    //         assetPrice = 50 * assetClass;
    //         productPrice = assetPrice / 4;
    //         // TODO: get productPrice from InvestmentManager contract
    //     }
    // }

    function getChanceDetails(uint8 chanceId) external override view returns (uint8 chanceType, uint8 chanceParam) {
        return IChance(chancesAddress).getChanceDetails(chanceId);
    }

    function getOptionsAt(address player, uint8 position) external override view returns (uint8 options) {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = this.getSpaceDetails(position);
        require(spaceType < 8, "SPACE_TYPE_INVALID");
        options = 0;
        if (
            (spaceType == 0) // GENESIS
            || (spaceType == 2 )// LIQUIDATION
        ) {
            options = 1; // 1 = NOTHING
        } else if (spaceType == 1) { // QUARANTINE
            options = 16; // 16 = QUARANTINE
        } else if (spaceType == 3) { // CHANCE
            options = 8; // 8 = CHANCE
        } else { // ASSETS
            if (assetsAddress != address(0)) {
                if (IGameAssets(assetsAddress).exists(uint256(assetId))) {
                    address owner = IGameAssets(assetsAddress).ownerOf(uint256(assetId));
                    if (owner != player) {
                        options = 4; // 4 = PAY_BILL
                    } else {
                        options = 1; // 1 = NOTHING
                    }
                } else {
                    options = 1 + 2; // 1 + 2 = NOTHING | BUY_ASSET
                }
            } else {
                options = 1; // 1
            }
        }
    }

    function rollDices() external override {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(currentPlayer == address(0), "NOT_AUTHORIZED");
        currentPlayer = msg.sender;
        (uint8 dice1, uint8 dice2, uint8 cardId) = IRandomGenerator(randomGeneratorAddress).getRandom();
        IPlayground(playgroundAddress).incrementPlayerPosition(msg.sender, dice1 + dice2);
        uint8 newPosition = IPlayground(playgroundAddress).getPlayerPosition(msg.sender);
        uint8 options = this.getOptionsAt(msg.sender, newPosition);
        currentOptions = options;
        currentCardId = cardId;
        // console.log('emit RolledDices event');
        emit RolledDices(msg.sender, dice1, dice2, cardId, newPosition, options);
    }

    function play(uint8 option) external override {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(msg.sender == currentPlayer, "NOT_AUTHORIZED");
        require((option & currentOptions) != 0, "OPTION_NOT_ALLOWED");
        require((option & currentOptions) == option, "OPTION_NOT_ALLOWED");
        performOption(IPlayground(playgroundAddress).getPlayerPosition(msg.sender), option);
        chooseNextPlayer();
        uint8 eventCardId = currentCardId;
        currentPlayer = address(0);
        currentOptions = 0;
        currentCardId = 0;
        // emit event at the end
        emit PlayPerformed(msg.sender, option, eventCardId, IPlayground(playgroundAddress).getPlayerPosition(msg.sender));
    }


    function _start() internal override {
        super._start();
        for (uint i = 0; i < nbPlayers; i++) {
            address player = playersSet[i];
            if (tokenAddress != address(0)) {
                IGameToken(tokenAddress).mint(player, initialAmount);
            }
        }
    }
    function _end() internal override {
        super._end();
    }

    function _register(bytes32 username, uint8 avatar) internal override {
        if (tokenAddress != address(0)) {
            require(IGameToken(tokenAddress).allowance(msg.sender, address(this)) == MAX_UINT256, "SENDER_MUST_APPROVE_GAME_MASTER");
        }
        super._register(username, avatar);
    }


    // function random() internal returns (uint) {
    //     uint _random = uint(keccak256(abi.encodePacked(now, msg.sender, nonce)));
    //     nonce++;
    //     return _random;
    // }

    // function bytesToUint8(bytes memory _bytes, uint256 _startIndex) internal pure returns (uint8) {
    //     require(_startIndex + 1 >= _startIndex, "toUint8_overflow");
    //     require(_bytes.length >= _startIndex + 1 , "toUint8_outOfBounds");
    //     uint8 tempUint;

    //     assembly {
    //         tempUint := mload(add(add(_bytes, 0x1), _startIndex))
    //     }

    //     return tempUint;
    // }

    function performOption(uint8 position, uint8 option) internal {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = this.getSpaceDetails(position);
        // console.log("getSpaceDetails");
        // console.log("position");
        // console.log(position);
        // console.log("assetPrice");
        // console.logUint(assetPrice);
        if ((option & 1) != 0) { // NOTHING

        } else if ((option & 2) != 0) { // BUY_ASSET
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(assetPrice)) {
                    // console.log("perform BUY_ASSET");
                    // console.log("this");
                    // console.logAddress(address(this));
                    // console.log("sender");
                    // console.logAddress(msg.sender);
                    // console.logUint(IGameToken(tokenAddress).allowance(msg.sender, address(this)));
                    IGameToken(tokenAddress).burnTokensFrom(msg.sender, assetPrice);
                    IGameAssets(assetsAddress).safeMint(msg.sender, assetId);
                }
            }
        } else if ((option & 4) != 0) { // PAY_BILL
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                if (checkBalance(productPrice)) {
                    address owner = IGameAssets(assetsAddress).ownerOf(uint256(assetId));
                    IGameToken(tokenAddress).transferFrom(msg.sender, owner, productPrice);
                }
            }
        } else if ((option & 8) != 0) { // CHANCE
            // TODO: perform chance for currentCardId (delegated to ChanceContrat ?)
            IChance(chancesAddress).performChance(currentCardId);
        } else if ((option & 16) != 0) { // QUARANTINE
            // TODO: set player in Quarantine
        }
    }

    // function performChance(uint8 cardId) internal {
        // TODO: compute requiredCash (if chance means paying something)
        // if (checkBalance(requiredCash)) {
            // cardId -> chanceType (Pay|Receive|Move_N ...), chanceParam
            // chanceType -> contract
    // }

    function checkBalance(uint256 requiredCash) internal returns(bool) {
        if (IGameToken(tokenAddress).balanceOf(msg.sender) < requiredCash) {
            _playerLost(msg.sender);
            return false;
        }
        return true;
    }
}