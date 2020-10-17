//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import "./GameScheduler.sol";
import "./GameToken.sol";
contract GameMaster is GameScheduler {
    GameToken private token;
    address private tokenAddress;
    uint256 initialAmount;
    address currentPlayer;
    uint256 nonce;
    uint8 nbPositions;
    byte currentOptions;
    mapping(address => uint8) private positions;
    bytes32 private playground;
    bytes32 private chances;

    event RolledDices(address player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, byte options);
    event PlayPerformed(address player, byte option);

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

    function getToken() public view returns (address) {
        return tokenAddress;
    }

    function getCurrentPlayer() public view returns (address) {
        return currentPlayer;
    }

    function getCurrentOptions() public view returns (byte) {
        return currentOptions;
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

    function getSpaceDetails(uint8 spaceId) public view returns (uint8 spaceType, uint8 assetId) {
        require(spaceId < nbPositions, "INVALID_ARGUMENT");
        uint8 spaceCode = uint8(playground[31 - spaceId]);// Important storage reverse (end-endian)
        spaceType = spaceCode & 0x7;
        assetId = spaceCode >> 3;
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

    function rollDices() public returns (uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, byte options) {
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
        options = 0;
        emit RolledDices(msg.sender, dice1, dice2, cardId, newPosition, options);
    }

    function random() internal returns (uint) {
        uint _random = uint(keccak256(abi.encodePacked(now, msg.sender, nonce)));
        nonce++;
        return _random;
    }

    function play(byte option) public {
        require(status == STARTED, "INVALID_GAME_STATE");
        require(msg.sender == nextPlayer, "NOT_AUTHORIZED");
        require(msg.sender == currentPlayer, "NOT_AUTHORIZED");
        currentPlayer = address(0);
        // TODO: check option is allowed 
        // TODO: perform option
        chooseNextPlayer();
        emit PlayPerformed(msg.sender, option);
    }

    // TODO: get random value https://ethereum.stackexchange.com/questions/60684/i-want-get-random-number-between-100-999-as-follows
    //TODO: function rollDices -> emit RolledDices(address player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, byte optionsMask)
    // TODO: function play(byte option) --> check option is valid for player.newPosition, then perform chosen option
    // TODO: bytes32 private gameboard: 1 byte per board space, define its type
    // TODO: bytes32 private options: 1 byte per board space, define the available options per space ????

    function bytesToUint8(bytes memory _bytes, uint256 _start) internal pure returns (uint8) {
        require(_start + 1 >= _start, "toUint8_overflow");
        require(_bytes.length >= _start + 1 , "toUint8_outOfBounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x1), _start))
        }

        return tempUint;
    }
}