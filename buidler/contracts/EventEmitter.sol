//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

contract EventEmitter {
    event Trigger(uint256 number);

    function wakeUp(uint256 payload) public {
        emit Trigger(payload);
    }
}