// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {DeckAirdrop} from "./DeckAirdrop.sol";
import {Inventory} from "./Inventory.sol";

import {ERC721} from "openzeppelin/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";

struct Lore {
    string name;
    string flavor;
    string URL; // solhint-disable-line
}

struct Stats {
    uint8 attack;
    uint8 defense;
}

struct Card {
    uint256 id;
    Lore lore;
    Stats stats;
    uint32 cardTypeID;
}

error Unauthorized();

contract CardsCollection is ERC721, Ownable {
    Inventory public inventory;

    // Let's skip 0 to catch bugs due to default values.
    uint256 private nextID = 1;

    constructor() ERC721("Cards", "CARD") Ownable() {}

    mapping(uint256 => Lore) public lore;
    mapping(uint256 => Stats) private stats_;
    mapping(uint256 => uint32) public cardType;

    // Airdrop manager.
    address public airdrop;

    function setInventory(Inventory inventory_) external onlyOwner {
        inventory = inventory_;
    }

    function setAirdrop(DeckAirdrop airdrop_) external onlyOwner {
        airdrop = address(airdrop_);
    }

    // Authorize the inventory contract to transfer cards.
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view override returns (bool) {
        return spender == address(inventory) || super._isApprovedOrOwner(spender, tokenId);
    }

    function mint(
        address to,
        string calldata name,
        string calldata flavor,
        string calldata URL, // solhint-disable-line
        uint8 attack,
        uint8 defense
    ) external returns (uint256 tokenID) {
        if (msg.sender != owner() && msg.sender != airdrop) {
            revert Unauthorized();
        }

        tokenID = nextID++;
        _safeMint(to, tokenID, "");
        stats_[tokenID] = Stats(attack, defense);
        lore[tokenID] = Lore(name, flavor, URL);
        // NOTE(nonso): `tokenID` serves as a placeholder for the cardType ID
        cardType[tokenID] = uint32(tokenID);
    }

    function stats(uint256 card) external view returns (Stats memory) {
        return stats_[card];
    }

    // TODO - remove this function?
    function getLore(uint256 card) external view returns (Lore memory) {
        return lore[card];
    }

    function getCard(uint256 card) external view returns (Card memory) {
        return Card(card, lore[card], stats_[card], cardType[card]);
    }
 
    function getCardType(uint256 card) external view returns(uint32){
        return cardType[card];
    }
}
