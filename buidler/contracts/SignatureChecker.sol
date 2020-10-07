//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.7.0;
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

import "@nomiclabs/buidler/console.sol";

contract SignatureChecker {

    using ECDSA for bytes32;

    // source: https://docs.openzeppelin.com/contracts/2.x/utilities#cryptography
    function checkSignature(bytes memory data, bytes memory signature, address signer) pure public returns (bool) {
        return (
            keccak256(data).toEthSignedMessageHash().recover(signature)
             == signer);
        // return (
        //     keccak256(data).recover(signature)
        //      == signer);
    }

    // TODO :to export in inherited contract
    function verifyPayload(uint8[] memory dices, uint8 spaceId, bytes32[] memory options, bytes memory signature) public view returns (address signer) {
        console.log("verifyPayload dices", dices[0], dices[1]);
        console.log("spaceId", spaceId);
        console.log("options");
        console.logBytes32(options[0]);
        console.logBytes32(options[1]);
        console.log("signature");
        console.logBytes(signature);
        // bytes memory payload = abi.encodePacked(dices, spaceId, options);
        bytes memory payload = abi.encodePacked(dices[0], dices[1], spaceId, options[0], options[1]);
        console.log("payload");
        console.logBytes(payload);
        // return keccak256(payload).toEthSignedMessageHash().recover(signature);
        // return keccak256(payload).recover(signature);
        return verifyString(string(payload), signature);
    }

    // Returns the address that signed a given string message
    // source: https://docs.ethers.io/ethers.js/v5-beta/cookbook-signing.html
    function verifyString(string memory message, bytes memory signature) public view returns (address signer) {

        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("ECDSA: invalid signature 's' value");
        }

        if (v != 27 && v != 28) {
            revert("ECDSA: invalid signature 'v' value");
        }

        // The message header; we will fill in the length next
        string memory header = "\x19Ethereum Signed Message:\n000000";

        uint256 lengthOffset;
        uint256 length;
        assembly {
            // The first word of a string is its length
            length := mload(message)
            // The beginning of the base-10 message length in the prefix
            lengthOffset := add(header, 57)
        }

        console.log("length", length);
        console.log("lengthOffset", lengthOffset);

        // Maximum length we support
        require(length <= 999999);

        // The length of the message's length in base-10
        uint256 lengthLength = 0;

        // The divisor to get the next left-most message length digit
        uint256 divisor = 100000;

        // Move one digit of the message length to the right at a time
        while (divisor != 0) {

            // The place value at the divisor
            uint256 digit = length / divisor;
            if (digit == 0) {
                // Skip leading zeros
                if (lengthLength == 0) {
                    divisor /= 10;
                    continue;
                }
            }

            // Found a non-zero digit or non-leading zero digit
            lengthLength++;

            // Remove this digit from the message length's current value
            length -= digit * divisor;

            // Shift our base-10 divisor over
            divisor /= 10;

            // Convert the digit to its ASCII representation (man ascii)
            digit += 0x30;
            // Move to the next character and write the digit
            lengthOffset++;

            assembly {
                mstore8(lengthOffset, digit)
            }
        }

        console.log("length", length);
        console.log("lengthOffset", lengthOffset);
        console.log("lengthLength", lengthLength);

        // The null string requires exactly 1 zero (unskip 1 leading 0)
        if (lengthLength == 0) {
            lengthLength = 1 + 0x19 + 1;
        } else {
            lengthLength += 1 + 0x19;
        }

        // Truncate the tailing zeros from the header
        assembly {
            mstore(header, lengthLength)
        }

        console.log('header', header);

        // Perform the elliptic curve recover operation
        bytes32 check = keccak256(abi.encodePacked(header, message));

        return ecrecover(check, v, r, s);
    }
}