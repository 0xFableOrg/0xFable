// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "openzeppelin/access/Ownable.sol";
import {Strings} from "openzeppelin/utils/Strings.sol";

interface IENSResolver {
    function getEnsName(address addr) external view returns (string memory);
}

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
        require(checkHandleValidity(handle), "Invalid handle");
        require(handleOwners[handle] == address(0), "Handle already taken");
        require(checkPlayerEligibility(msg.sender), "Player not eligible");

        if (bytes(handles[msg.sender]).length > 0) {
            handleOwners[handles[msg.sender]] = address(0);
        }

        handles[msg.sender] = handle;
        handleOwners[handle] = msg.sender;

        emit HandleRegistered(msg.sender, handle);
    }

    function changeHandle(string memory newHandle) external {
        require(checkHandleValidity(newHandle), "Invalid handle");
        require(handleOwners[newHandle] == address(0), "Handle already taken");

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
            string memory ensName = ensResolver.getEnsName(player);
            if (bytes(ensName).length > 0) {
                return ensName;
            }
        }
        return handles[player];
    }

    function checkHandleValidity(string memory handle) public pure returns (bool) {
        bytes memory b = bytes(handle);
        if (b.length < 5) return false;
        for (uint256 i; i < b.length; i++) {
            bytes1 char = b[i];
            if (char < 0x20 || char > 0x7E || char == 0x2E) {
                return false;
            }
        }
        return true;
    }

    function checkPlayerEligibility(address player) public pure returns (bool) {
        return true;
    }
}
