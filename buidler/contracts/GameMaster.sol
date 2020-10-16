//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import "./GameScheduler.sol";
import "./GameToken.sol";
contract GameMaster is GameScheduler {
    GameToken private token;
    address private tokenAddress;
    uint256 constant public initialAmount = 1000 * 10**18; // 1 LOUIS
    
    function setToken(address _token) public onlyOwner {
        tokenAddress = _token;
        token = GameToken(_token);
    }

    function getToken() public view returns (address) {
        return tokenAddress;
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

    // TODO: get random value https://ethereum.stackexchange.com/questions/60684/i-want-get-random-number-between-100-999-as-follows
    //TODO: function rollDices -> emit RolledDices(address player, uint8 dice1, uint8 dice2, uint8 cardId, uint8 newPosition, byte optionsMask)
    // TODO: function play(byte option) --> check option is valid for player.newPosition, then perform chosen option
    // TODO: bytes32 private gameboard: 1 byte per board space, define its type
    // TODO: bytes32 private options: 1 byte per board space, define the available options per space ????

}