// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./Inventory.sol";
import "./CardsCollection.sol";

import "openzeppelin/token/ERC721/IERC721Receiver.sol";
import "openzeppelin/access/Ownable.sol";

contract DeckAirdrop is IERC721Receiver, Ownable {

    uint256 public deckSize;
    uint256 public airdropsLeft = 2;

    Inventory inventory;
    CardsCollection cardsCollection;

    constructor(Inventory inventory_) Ownable() {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();
    }

    function mint() external onlyOwner {
        if (deckSize > 0)
            revert("already minted");

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

        // Transfer ownership back to the deployer.
        cardsCollection.transferOwnership(msg.sender);
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

    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure returns(bytes4) {
        return this.onERC721Received.selector;
    }
}