// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./Inventory.sol";
import "./CardsCollection.sol";

import "openzeppelin/access/Ownable.sol";

error AlreadyClaimed();

contract DeckAirdrop is Ownable {

    uint256 public deckSize;

    Inventory public inventory;
    CardsCollection public cardsCollection;

    mapping(address => bool) public claimed;

    constructor(Inventory inventory_) Ownable() {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();
    }

    function claimAirdrop() external {
        if (claimed[msg.sender])
            revert AlreadyClaimed();
        address target = msg.sender;
        uint256 first =
        cardsCollection.mint(target, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, "Goblin Queen", "", "", 3, 2);
        uint256 last =
        cardsCollection.mint(target, "Goblin Queen", "", "", 3, 2);

        for (uint256 i = first; i <= last; ++i)
            inventory.addCard(msg.sender, i);

        uint256 numCards = last - first + 1;
        uint256[] memory cards = new uint256[](numCards);
        for (uint256 i = 0; i < numCards; ++i)
            cards[i] = first + i;

        inventory.addDeck(msg.sender, Inventory.Deck(cards));
    }
}