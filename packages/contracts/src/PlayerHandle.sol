// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IENSResolver {
    function name(bytes32 node) external view returns (string memory);
}

error InvalidHandle();
error HandleAlreadyTaken();
error PlayerNotEligible();

contract PlayerHandle is Ownable {
    using Strings for uint256;

    IENSResolver public ensResolver;
    mapping(address => string) private handles;
    mapping(string => address) private handleOwners;
    mapping(address => bool) private useEns;

    event HandleRegistered(address indexed player, string handle);
    event HandleChanged(address indexed player, string newHandle);
    event UseEnsSet(address indexed player, bool useEns);

    constructor(address _ensResolver) {
        ensResolver = IENSResolver(_ensResolver);
    }

    function registerHandle(string memory handle) external {
        if (!checkHandleValidity(handle)) {
            revert InvalidHandle();
        }
        if (handleOwners[handle] != address(0)) {
            revert HandleAlreadyTaken();
        }
        if (!checkPlayerEligibility(msg.sender)) {
            revert PlayerNotEligible();
        }

        if (bytes(handles[msg.sender]).length > 0) {
            handleOwners[handles[msg.sender]] = address(0);
        }

        handles[msg.sender] = handle;
        handleOwners[handle] = msg.sender;

        emit HandleRegistered(msg.sender, handle);
    }

    function changeHandle(string memory newHandle) external {
        if (!checkHandleValidity(newHandle)) {
            revert InvalidHandle();
        }

        if (handleOwners[newHandle] != address(0)) {
            revert HandleAlreadyTaken();
        }

        string memory oldHandle = handles[msg.sender];
        handles[msg.sender] = newHandle;
        handleOwners[newHandle] = msg.sender;
        handleOwners[oldHandle] = address(0);

        emit HandleChanged(msg.sender, newHandle);
    }

    function setUseEns(bool _useEns) external {
        useEns[msg.sender] = _useEns;
        emit UseEnsSet(msg.sender, _useEns);
    }

    function getPlayerHandle(address player) external view returns (string memory) {
        if (useEns[player]) {
            bytes32 node = keccak256(abi.encodePacked(addressToBytes32(player)));
            string memory ensName = ensResolver.name(node);
            if (bytes(ensName).length > 0) {
                return ensName;
            }
        }
        return handles[player];
    }

    function checkHandleValidity(string memory handle) public pure returns (bool) {
        bytes memory b = bytes(handle);
        if (b.length < 5 || b.length > 15) {
            return false;
        }
        for (uint256 i; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(char >= 0x30 && char <= 0x39) && !(char >= 0x41 && char <= 0x5A) && !(char >= 0x61 && char <= 0x7A)) {
                return false;
            }
        }
        return true;
    }

    function checkPlayerEligibility(address player) public pure returns (bool) {
        return true; // Placeholder function; implement eligibility logic as needed
    }

    function addressToBytes32(address addr) private pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
