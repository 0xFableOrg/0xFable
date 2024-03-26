// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection} from "../CardsCollection.sol";
import {DeckAirdrop} from "../DeckAirdrop.sol";
import {Inventory} from "../Inventory.sol";

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../deploy/Deploy.s.sol";

contract InventoryTest is Test {
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

    // expect revert if player's deck contains a card with more than `MAX_CARD_COPY` copies.
    function testCheckDeckExceedsMaxCopy() public {
        uint8 deckId = 0;
        uint256 randomCard = inventory.getDeckCards(player1, deckId)[2];

        // increase card `randomCard` copies to 4
        vm.startPrank(player1);
        inventory.addCardToDeck(player1, deckId, randomCard);
        inventory.addCardToDeck(player1, deckId, randomCard);
        inventory.addCardToDeck(player1, deckId, randomCard);

        vm.expectRevert(abi.encodeWithSelector(Inventory.CardExceedsMaxCopy.selector, randomCard));

        inventory.checkDeck(player1, deckId);
    }

    // expect revert if player's deck contains a card they don't own.
    function testCheckDeckOnlyInventoryCards() public {
        // mint card `randomMint` to player2.
        vm.startPrank(cardsCollection.airdrop());
        uint256 randomMint = cardsCollection.mint(player2, "Horrible Gremlin", "", "", 1, 1);

        uint8 deckId = 0;

        // scenario 1: Add Non-Inventory card to deck.
        // player1 adds a card that has has not being staked in the inventory to its deck
        changePrank(player1);
        // add card `randomMint` to inventory.
        inventory.addCardToDeck(player1, deckId, randomMint);
        vm.expectRevert("ERC721: invalid token ID");
        inventory.checkDeck(player1, deckId);

        // scenario 2: Add Inventory card to deck.
        // player1 adds a card that has being staked in the inventory to their deck but
        // they don't own it.
        changePrank(player2);
        // add card `randomMint` to inventory.
        inventory.addCard(player2, randomMint);

        changePrank(player1);
        // add card `randomMint` to player1's deck.
        inventory.addCardToDeck(player1, deckId, randomMint);
        vm.expectRevert(abi.encodeWithSelector(Inventory.CardNotInInventory.selector, randomMint));
        inventory.checkDeck(player1, deckId);
    }
}
