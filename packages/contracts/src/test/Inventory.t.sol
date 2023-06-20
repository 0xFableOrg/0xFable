// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "../CardsCollection.sol";
import "../Inventory.sol";
import "../InventoryCardsCollection.sol";
import "../Game.sol";

import "forge-std/Test.sol";
import "../deploy/Deploy.s.sol";

import "openzeppelin/token/ERC721/utils/ERC721Holder.sol";

contract InventoryTest is Test, ERC721Holder {
    Deploy private deployment;
    CardsCollection private cardsCollection;
    Inventory private inventory;
    DeckAirdrop private airdrop;

    address private constant player1 = 0x00000000000000000000000000000000DeaDBeef;
    address private constant player2 = 0x00000000000000000000000000000000deAdBAbE;

    function setUp() public {
        deployment = new Deploy();
        deployment.dontLog();
        deployment.run();

        cardsCollection = deployment.cardsCollection();
        inventory = deployment.inventory();
        airdrop = deployment.airdrop();

        vm.prank(player1);
        airdrop.claimAirdrop();
    }

    // expect revert if player's deck contains a card with more than `MAX_CARD_COPY` copies
    function testCheckDeckExceedsMaxCopy() public {
        uint8 deckId = 0;
        uint256 randomCard = inventory.getDeck(player1, deckId)[2];

        // increase card `randomCard` copy to 4
        vm.startPrank(player1);
        inventory.addCardToDeck(player1, deckId, randomCard);
        inventory.addCardToDeck(player1, deckId, randomCard);
        inventory.addCardToDeck(player1, deckId, randomCard);

        vm.expectRevert(
            abi.encodeWithSelector(Inventory.CardExceedsMaxCopy.selector, randomCard)
        );

        inventory.checkDeck(player1, deckId);
    }

    // expect revert if player's deck contains a card they don't own
    function testCheckDeckOnlyInventoryCards() public {
        
        // mint card `randomMint` to player2
        vm.startPrank(cardsCollection.airdrop());
        uint256 randomMint = cardsCollection.mint(player2, "Horrible Gremlin", "", "", 1, 1);

        // add card `randomMint` to inventory
        changePrank(player2);
        inventory.addCard(player2, randomMint);

        uint8 deckId = 0;

        // add card `randomMint` to player2's deck
        changePrank(player1);
        inventory.addCardToDeck(player1, deckId, randomMint);

        vm.expectRevert(
            abi.encodeWithSelector(Inventory.CardNotInInventory.selector, randomMint)
        );

        inventory.checkDeck(player1, deckId);
    }
}