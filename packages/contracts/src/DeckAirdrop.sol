// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./Inventory.sol";
import "./CardsCollection.sol";

import "openzeppelin/access/Ownable.sol";

// Data + logic to play a game.
contract DeckAirdrop is Ownable {

    uint256 public deckSize;
    uint256 public airdropsLeft = 0;

    Inventory inventory;
    CardsCollection cardsCollection;

    constructor(Inventory inventory_) {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();

        uint256 i = 0;
        address target = address(this);

        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);

        deckSize = i;

        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(target, i++, "Goblin Queen", "", "", 3, 2);
    }

    function claimAirdrop() external {
        if (airdropsLeft == 0)
            revert("No more airdrops");

        uint256 airdropID = 2 - airdropsLeft;
        uint256 base = airdropID * deckSize;
        for (uint256 i = base; i < base + deckSize; ++i)
            cardsCollection.safeTransferFrom(address(this), msg.sender, i);

        for (uint256 i = base; i < base + deckSize; ++i)
            inventory.addCard(msg.sender, i);

        uint256[] memory cards = new uint256[](deckSize);
        for (uint256 i = 0; i < deckSize; ++i)
            cards[i] = base + i;

        inventory.addDeck(msg.sender, Inventory.Deck(cards));

        --airdropsLeft;
    }
}