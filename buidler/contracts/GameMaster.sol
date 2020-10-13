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
}