//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// import "@chainlink/contracts/src/v0.6/interfaces/LinkTokenInterface.sol";

contract LINKToken2 is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(uint256 initialSupply) ERC20("LINK Token", "LINK") public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _mint(msg.sender, initialSupply);
    }

    /**
    * @dev Creates `amount` new tokens for `to`.
    *
    * See {ERC20-_mint}.
    *
    * Requirements:
    *
    * - the caller must have the `MINTER_ROLE`.
    */
    function mint(address to, uint256 amount) public virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have minter role to mint");
        _mint(to, amount);
    }

// TODO: implements LinkTokenInterface
//       function decreaseApproval(address spender, uint256 addedValue) external returns (bool success);
//   function increaseApproval(address spender, uint256 subtractedValue) external;
//   function name() external view returns (string memory tokenName);
//   function symbol() external view returns (string memory tokenSymbol);

//   function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool success);

}
