//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import "./GameScheduler.sol";
import "./GameToken.sol";
import "./GameAssets.sol";
contract GameMaster is GameScheduler {
    uint256 constant public MAX_UINT256 = 2**256 - 1;

    GameToken private token;
    address private tokenAddress;
    GameAssets private assets;
    address private assetsAddress;
    uint256 initialAmount;
    address currentPlayer;
    uint256 internal nonce;
    uint8 nbPositions;
    uint8 internal currentOptions;
    uint8 internal currentCardId;
    mapping(address => uint8) internal positions;
    bytes32 private playground;
    bytes32 private chances;

    event RolledDices(address player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, uint8 options);
    event PlayPerformed(address player, uint8 option, uint8 cardId, uint8 newPosition);

    constructor (
        uint8 nbMaxPlayers,
        uint8 _nbPositions,
        uint256 _initialAmount,
        bytes32 _playground,
        bytes32 _chances
        ) public GameScheduler(nbMaxPlayers) {
        nbPositions = _nbPositions;
        initialAmount = _initialAmount;
        playground = _playground;
        chances = _chances;
    }
    
    function setToken(address _token) public onlyOwner {
        tokenAddress = _token;
        token = GameToken(_token);
    }

    function setAssets(address _assets) public onlyOwner {
        assetsAddress = _assets;
        assets = GameAssets(_assets);
    }

    function getToken() public view returns (address) {
        return tokenAddress;
    }

    function getAssets() public view returns (address) {
        return assetsAddress;
    }

    function getCurrentPlayer() public view returns (address) {
        return currentPlayer;
    }

    function getCurrentOptions() public view returns (uint8) {
        return currentOptions;
    }


    function getCurrentCardId() public view returns (uint8) {
        return currentCardId;
    }

    function getNbPositions() public view returns (uint8) {
        return nbPositions;
    }

    function getPositionOf(address player) public view returns (uint8) {
        return positions[player];
    }

    function getChances() public view returns (bytes32) {
        return chances;
    }

    function getPlayground() public view returns (bytes32) {
        return playground;
    }

     function getSpaceDetails(uint8 spaceId) public view returns (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) {
        require(spaceId < nbPositions, "INVALID_ARGUMENT");
        uint8 spaceCode = uint8(playground[31 - spaceId]);// Important storage reverse (end-endian)
        spaceType = spaceCode & 0x7;
        assetId = spaceCode >> 3;
        if ((spaceType >= 4) && (spaceType < 8)) {
            // spaceType: 4 <=> ASSET_CLASS_1, price = 50
            // .. 
            // spaceType: 7 <=> ASSET_CLASS_4, price = 200
            uint8 assetClass = spaceType - 3;
            assetPrice = 50 * assetClass;
            productPrice = assetPrice / 4;
            // TODO: get productPrice from InvestmentManager contract
        }
    }

    function getChanceDetails(uint8 chanceId) public view returns (uint8 chanceType, uint8 chanceParam) {
        require(chanceId < chances.length, "INVALID_ARGUMENT");
        uint8 chanceCode = uint8(chances[31 - chanceId]);// Important storage reverse (end-endian)
        chanceType = chanceCode & 0x7;
        chanceParam = chanceCode >> 3;
    }

    function start() public override {
        super.start();
        for (uint i = 0; i < nbPlayers; i++) {
            address player = playersSet[i];
            if (tokenAddress != address(0)) {
                token.mint(player, initialAmount);
            }
        }
    }
    function end() public override {
        super.end();
        if (tokenAddress != address(0)) {
            token.reset();
        }
    }

    function register(bytes32 username, uint8 avatar) public override payable {
        if (tokenAddress != address(0)) {
            require(token.allowance(msg.sender, address(this)) == MAX_UINT256, "SENDER_MUST_APPROVE_GAME_MASTER");
        }
        super.register(username, avatar);
    }

    function rollDices() public returns (uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, uint8 options) {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(currentPlayer == address(0), "NOT_AUTHORIZED");
        currentPlayer = msg.sender;
        uint random = random();
        uint8 oldPosition = positions[msg.sender];
        dice1 = 1 + uint8(random % 6);
        dice2 = 1 + uint8(random % 7 % 6);
        cardId = uint8(random % 47 % 32);
        newPosition = (oldPosition + dice1 + dice2) % nbPositions;
        positions[msg.sender] = newPosition;
        options = getOptionsAt(msg.sender, newPosition);
        currentOptions = options;
        currentCardId = cardId;
        emit RolledDices(msg.sender, dice1, dice2, cardId, newPosition, options);
    }

    function play(uint8 option) public {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(msg.sender == currentPlayer, "NOT_AUTHORIZED");
        require((option & currentOptions) != 0, "OPTION_NOT_ALLOWED");
        require((option & currentOptions) == option, "OPTION_NOT_ALLOWED");
        performOption(positions[msg.sender], option);
        chooseNextPlayer();
        emit PlayPerformed(msg.sender, option, currentCardId, positions[msg.sender]);
        currentPlayer = address(0);
        currentOptions = 0;
        currentCardId = 0;
    }

    function random() internal returns (uint) {
        uint _random = uint(keccak256(abi.encodePacked(now, msg.sender, nonce)));
        nonce++;
        return _random;
    }

    function bytesToUint8(bytes memory _bytes, uint256 _start) internal pure returns (uint8) {
        require(_start + 1 >= _start, "toUint8_overflow");
        require(_bytes.length >= _start + 1 , "toUint8_outOfBounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x1), _start))
        }

        return tempUint;
    }

    function getOptionsAt(address player, uint8 position) public view returns (uint8 options) {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = getSpaceDetails(position);
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
                if (assets.exists(uint256(assetId))) {
                    address owner = assets.ownerOf(uint256(assetId));
                    if (owner != msg.sender) {
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

    function performOption(uint8 position, uint8 option) internal {
        (uint8 spaceType, uint8 assetId, uint256 assetPrice, uint256 productPrice) = getSpaceDetails(position);
        console.log("getSpaceDetails");
        console.log("position");
        console.log(position);
        console.log("assetPrice");
        console.logUint(assetPrice);
        if ((option & 1) != 0) { // NOTHING

        } else if ((option & 2) != 0) { // BUY_ASSET
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                console.log("perform BUY_ASSET");
                console.log("this");
                console.logAddress(address(this));
                console.log("sender");
                console.logAddress(msg.sender);
                console.logUint(token.allowance(msg.sender, address(this)));
                token.burnFrom(msg.sender, assetPrice);
                assets.safeMint(msg.sender, assetId);
            }
        } else if ((option & 4) != 0) { // PAY_BILL
            if((tokenAddress != address(0)) && assetsAddress != address(0)) {
                address owner = assets.ownerOf(uint256(assetId));
                token.transferFrom(msg.sender, owner, productPrice);
            }
        } else if ((option & 8) != 0) { // CHANCE
            // TODO: perform chance for currentCardId (delegated to ChanceContrat ?)
            // cardId -> chanceType (Pay|Receive|Move_N ...), chanceParam
            // chanceType -> contract
        } else if ((option & 16) != 0) { // QUARANTINE
            // TODO: set player in Quarantine
        }
    }
}