// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/access/Ownable.sol";

struct Lore {
    string name;
    string flavor;
    string URL;
}

struct Stats {
    uint8 attack;
    uint8 defense;
}

struct Card {
    uint256 id;
    Lore lore;
    Stats stats;
}

contract CardsCollection is ERC721, Ownable {

    constructor() ERC721("Cards", "CARD") Ownable() {}

    mapping(uint256 => Lore) public lore;
    mapping(uint256 => Stats) private stats_;

    function mint(
            address to,
            uint256 tokenID,
            string calldata name,
            string calldata flavor,
            string calldata URL,
            uint8 attack,
            uint8 defense) external onlyOwner {
        _safeMint(to, tokenID, "");
        stats_[tokenID] = Stats(attack, defense);
        lore[tokenID] = Lore(name, flavor, URL);
    }

    function stats(uint256 card) external view returns(Stats memory) {
        return stats_[card];
    }

    // TODO - remove this function?
    function getLore (uint256 card) external view returns(Lore memory) {
        return lore[card];
    }

    function getCard(uint256 card) external view returns(Card memory) {
        return Card(card, lore[card], stats_[card]);
    }
}