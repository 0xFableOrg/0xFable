// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/access/Ownable.sol";

struct Stats {
    uint8 attack;
    uint8 defense;
}

contract CardsCollection is ERC721, Ownable {
    constructor() ERC721("Cards", "CARD") Ownable() {}

    mapping(uint256 => Stats) private stats_;

    function stats(uint256 card) external view returns(Stats memory) {
        return stats_[card];
    }
}
