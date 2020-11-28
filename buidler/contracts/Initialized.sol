//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

contract Initialized {
    bool internal _initialized = false;

    modifier initialized() {
        require(_initialized, "CONTRACT_NOT_INITIALIZED");
        _;
    }

    function initialize() internal virtual {
        _initialized = true;
    }
}