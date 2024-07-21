// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PlayerHandle.sol";

contract MockENSResolver is IENSResolver {
    mapping(bytes32 => string) public names;

    function setName(bytes32 node, string memory _name) public {
        names[node] = _name;
    }

    function name(bytes32 node) external view override returns (string memory) {
        return names[node];
    }
}
