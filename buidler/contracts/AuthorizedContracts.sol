//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthorizedContracts is Ownable {
    uint8 constant public NB_CONTRACTS = 7;
    enum eContracts {
        Invalid, // 0 value
        GameMaster,
        GameContracts,
        Playground,
        PlayOptions,
        Chances,
        TransferManager,
        AssetsManager
    }
    address[NB_CONTRACTS + 1] contracts;
    modifier authorized(uint8 mask) {
        if (msg.sender != address(this)) {
            console.log('mask', mask);
            bool isAuthorized = false;
            for (uint8 i = 1; i <= NB_CONTRACTS; i++) {
                if (((mask & i) != 0) && (msg.sender == contracts[i])) {
                    console.log('authorized granted for i:', i);
                    isAuthorized = true;
                    break;
                }
            }
            require (isAuthorized, "NOT_AUTHORIZED");
        }
        _;
    }
    constructor() public Ownable() {
    }
    // function setAuthorizedContracts(address _gameMaster, address _gameContracts, address _playgroud, address _playOptions, address _chances, address _transferManager, address _assetsManager) external onlyOwner {
    //     contracts[uint8(eContracts.GameMaster)] = _gameMaster;
    //     contracts[uint8(eContracts.GameContracts)] = _gameContracts;
    //     contracts[uint8(eContracts.Playground)] = _playgroud;
    //     contracts[uint8(eContracts.PlayOptions)] = _playOptions;
    //     contracts[uint8(eContracts.Chances)] = _chances;
    //     contracts[uint8(eContracts.TransferManager)] = _transferManager;
    //     contracts[uint8(eContracts.AssetsManager)] = _assetsManager;
    // }
    function setAuthorizedContract(eContracts contractType, address contractAddress) external onlyOwner {
        contracts[uint8(contractType)] = contractAddress;
    }
}