//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

interface IGameContracts {
    function setToken(address _token) external;
    function setAssets(address _assets) external;
    function setMarketplace(address _marketplace) external;
    function setChances(address _chances) external;
    function setRandomGenerator(address _radomGenerator) external;
    function setPlayground(address _playground) external;
    function setPlayOptions(address _playOptions) external;
    function setTransferManager(address _transferManager) external;
    function getToken() external view returns (address);
    function getAssets() external view returns (address);
    function getMarketplace() external view returns (address);
    function getChances() external view returns (address);
    function getRandomGenerator() external view returns (address);
    function getPlayground() external view returns (address);
    function getPlayOptions() external view returns (address);
    function getTransferManager() external view returns (address);
}