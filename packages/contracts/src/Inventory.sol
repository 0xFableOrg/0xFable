// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./CardsCollection.sol";
import "./InventoryCardsCollection.sol";

import "openzeppelin/access/Ownable.sol";

// TODO
// - player must stake cards in singleton contract to play (transfer ownership)
// - list all staked cards per player
// - deck lists: uint16 into list of staked cards (max 65k cards staked per player)
// - cards in deck mapping: uint256 bitfields, one bit per deck (max 256 decks)

contract Inventory {
    error BigDeckEnergy();
    error DeckDoesNotExist();
    error CardNotOwned(uint256 id);

    struct Deck {
        // index into the `cards` mapping
        uint16[] cards;
    }

    // Max number of cards that can be staked in the inventory for each player.
    uint256 constant MAX_STAKED_CARDS = type(uint16).max;

    // Max number of decks that each player can have.
    uint256 constant MAX_DECKS = 256;

    InventoryCardsCollection public inventoryCardsCollection;

    // player to list of cards
    mapping(address => uint256[]) private cards;

    // player to list of their decks
    mapping(address => Deck[]) private decks;

    // player to a list of bitfields
    // - each bitfield represents the cards at the same index in `cards`
    // - in each bitfield, a bit is 1 if the deck at the corresponding index has the card
    mapping(address => uint256[]) private cardsInDecks;

    // The NFT collection that contains all admissible cards for use with this inventory contract.
    CardsCollection public cardsCollection;

    constructor(bytes32 deploySalt, CardsCollection cardsCollection_) {
        cardsCollection = cardsCollection_;
        inventoryCardsCollection = new InventoryCardsCollection{salt: deploySalt}(cardsCollection);
    }

    function addCard(uint256 cardID) public {
        cardsCollection.transferFrom(msg.sender, address(this), cardID);
        cards[msg.sender].push(cardID);
    }

    function checkDeck(address player, uint8 deckID) public view {
        Deck storage deck = decks[player][deckID];
        for (uint256 i = 0; i < deck.cards.length ; ++i) {
            uint16 playerCardID = deck.cards[i];
            uint256 cardID = cards[player][playerCardID];
            if (cardsCollection.ownerOf(cardID) != player)
                revert CardNotOwned(cardID);
        }
    }

    function addDeck(Deck calldata deck) public returns (uint8 deckID) {
        if (deck.cards.length > 60)
            revert BigDeckEnergy();
        decks[msg.sender].push(deck);
        deckID = uint8(decks[msg.sender].length - 1);
    }

    function addCardToDeck(uint8 deckID, uint16 playerCardID) public {
        Deck storage deck = decks[msg.sender][deckID];
        if (deck.cards.length == 60)
            revert BigDeckEnergy();
        deck.cards.push(playerCardID);
    }

    function removeCardFromDeck(uint8 deckID, uint8 index) public {
        Deck storage deck = decks[msg.sender][deckID];
        deck.cards[index] = deck.cards[deck.cards.length - 1];
        deck.cards.pop();
    }

    function removeDeck(uint8 deckID) public {
        delete decks[msg.sender][deckID];
    }

    function replaceDeck(uint8 deckID, Deck calldata deck) public {
        Deck[] storage playerDecks = decks[msg.sender];
        if (deckID >= playerDecks.length)
            revert DeckDoesNotExist();
        if (deck.cards.length > 60)
            revert BigDeckEnergy();
        playerDecks[deckID] = deck;
    }

    function getCards(address player, uint8 deckID) public view returns (uint256[] memory deckCards) {
        Deck storage deck = decks[player][deckID];
        deckCards = new uint256[](deck.cards.length);
        for (uint256 i = 0; i < deck.cards.length; ++i) {
            deckCards[i] = cards[player][deck.cards[i]];
        }
    }
}
