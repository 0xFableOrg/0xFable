// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./CardsCollection.sol";
import "./InventoryCardsCollection.sol";

import "openzeppelin/access/Ownable.sol";
import "forge-std/console.sol";

contract Inventory {

    // =============================================================================================
    // ERRORS

    // Deck size is below MIN_DECK_SIZE.
    error SmallDeckEnergy();

    // Deck size exceeds MAX_DECK_SIZE.
    error BigDeckEnergy();

    // The user has attributed all consecutive deck IDs. However, it is possible that there exists
    // empty deck IDs that can be used via `replaceDeck`.
    error OutOfDeckIDs();

    // Using an unknown deck ID.
    error DeckDoesNotExist(address player, uint8 deckID);

    // Trying to perform an action on behalf of a player without delegation.
    error PlayerNotDelegatedToSender();

    // A deck contains a card that the player hasn't transferred to the inventory.
    error CardNotInInventory(uint256 cardID);

    // =============================================================================================
    // EVENTS

    // A player added a card to the inventory.
    event CardAdded(address indexed player, uint256 indexed cardID);

    // A player removed a card from the inventory.
    event CardRemoved(address indexed player, uint256 indexed cardID);

    event DeckAdded(address indexed player, uint8 deckID);

    event DeckRemoved(address indexed player, uint8 indexed deckID);

    event CardAddedToDeck(uint8 indexed deckID, uint256 indexed cardID);

    event CardRemovedFromDeck(uint8 indexed deckID, uint256 indexed cardID);

    // =============================================================================================
    // CONSTANTS

    // Max number of decks that each player can have.
    uint256 constant MAX_DECKS = 256;

    // Min number of cards in a deck.
    uint256 constant MIN_DECK_SIZE = 10;

    // Max number of cards in a deck.
    uint256 constant MAX_DECK_SIZE = 40;

    // =============================================================================================
    // TYPES

    // We need a struct because Solidity is unable to copy an array from memory to storage
    // directly, but can do it when the array is embedded in a struct.
    struct Deck {
        uint256[] cards;
    }

    // =============================================================================================
    // FIELDS

    // Maps a player to list of their decks.
    mapping(address => Deck[]) private decks;

    // Map a player to whether he's currently engaged in a game (in which case he cannot remove
    // cards from the inventory).
    mapping(address => bool) inGame;

    // Maps keccak256(delegate, player) to true if the player delegated to the delegate.
    mapping(bytes32 => bool) delegations;

    // The NFT collection that contains all admissible cards for use with this inventory contract.
    // This can't be called `cardsCollection` because it would cause a naming conflict with
    // the InventoryCardsCollection contract when generating hooks with wagmi.
    CardsCollection public originalCardsCollection;

    // The NFT collection that contains soulbound tokens matching cards transferred to the inventory
    // by a player.
    InventoryCardsCollection public inventoryCardsCollection;

    // =============================================================================================

    // Checks that the message sender has a deck with the given ID.
    modifier exists(address player, uint8 deckID) {
        if (deckID >= decks[player].length || decks[player][deckID].cards.length == 0)
            revert DeckDoesNotExist(player, deckID);
        _;
    }

    // ---------------------------------------------------------------------------------------------

    // Checks that the player has delegated to the message sender.
    modifier delegated(address player) {
        if (msg.sender != player && !delegations[keccak256(abi.encodePacked(msg.sender, player))])
            revert PlayerNotDelegatedToSender();
        _;
    }

    // =============================================================================================

    // deploySalt is the CREATE2 salt used to deplay the InventoryCardsCollection.
    constructor(bytes32 deploySalt, CardsCollection cardsCollection_) {
        originalCardsCollection = cardsCollection_;
        inventoryCardsCollection = new InventoryCardsCollection{salt: deploySalt}(cardsCollection_);
    }

    // =============================================================================================
    // FUNCTIONS

    // Lets the delegate perform actions on behalf of the message sender (player).
    function setDelegation(address delegate, bool isDelegated) external {
        delegations[keccak256(abi.encodePacked(delegate, msg.sender))] = isDelegated;
    }

    // ---------------------------------------------------------------------------------------------

    // Transfers a card of the sender to the inventory, mints a soulbound inventory card to the
    // sender in return.
    function addCard(address player, uint256 cardID) external delegated(player) {
        originalCardsCollection.transferFrom(player, address(this), cardID);
        inventoryCardsCollection.mint(player, cardID);
        emit CardAdded(player, cardID);
    }

    // ---------------------------------------------------------------------------------------------

    // Burns the sender's inventory card and transfers the card back to him.
    function removeCard(address player, uint256 cardID) external delegated(player) {
        inventoryCardsCollection.burn(cardID);
        originalCardsCollection.transferFrom(address(this), player, cardID);
        emit CardRemoved(player, cardID);
    }

    // ---------------------------------------------------------------------------------------------

    function checkDeckSize(Deck storage deck) internal view {
        if (deck.cards.length > MAX_DECK_SIZE)
            revert BigDeckEnergy();
    }

    // ---------------------------------------------------------------------------------------------

    function _addDeck(address player, uint8 deckID, Deck calldata deck) internal {
        if (deck.cards.length < MIN_DECK_SIZE)
            revert SmallDeckEnergy();
        if (deck.cards.length > MAX_DECK_SIZE)
            revert BigDeckEnergy();
        decks[player][deckID] = deck;
    }

    // ---------------------------------------------------------------------------------------------

    // Adds a new deck with the given cards for the sender. The player does not need to have the
    // cards in the inventory to do this (however, if he does not, the deck will not be playable).
    function addDeck(address player, Deck calldata deck)
            external delegated(player) returns(uint8 deckID) {
        uint256 longDeckID = decks[player].length;
        if (longDeckID >= MAX_DECKS)
            revert OutOfDeckIDs();
        deckID = uint8(longDeckID);
        decks[player].push();
        _addDeck(player, deckID, deck);
        emit DeckAdded(player, deckID);
    }

    // ---------------------------------------------------------------------------------------------

    // Remove the given deck for the sender, leaving the deck at the given ID empty.
    function removeDeck(address player, uint8 deckID) external delegated(player) exists(player, deckID) {
        delete decks[player][deckID];
        emit DeckRemoved(player, deckID);
    }

    // ---------------------------------------------------------------------------------------------

    // Replace the deck with the given ID. This can be a deck that was previously removed, granted
    // that there exists a deck with a higher ID. Emits events for deck removal and adding.
    function replaceDeck(address player, uint8 deckID, Deck calldata deck)
            external delegated(player) exists(player, deckID) {
        _addDeck(player, deckID, deck);
        emit DeckRemoved(player, deckID);
        emit DeckAdded(player, deckID);
    }

    // ---------------------------------------------------------------------------------------------

    // Add the given card to the given deck. The player does not need to have the card in the
    // inventory to do this (however, if he does not, the deck will not be playable).
    // You can't remove a card from a deck if it would bring the size to above the maximum size.
    function addCardToDeck(address player, uint8 deckID, uint256 cardID)
            external delegated(player) exists(player, deckID) {
        Deck storage deck = decks[player][deckID];
        if (deck.cards.length == MAX_DECK_SIZE)
            revert BigDeckEnergy();
        deck.cards.push(cardID);
        emit CardAddedToDeck(deckID, cardID);
    }

    // ---------------------------------------------------------------------------------------------

    // Remove the card a the given index in the given deck.
    // You can't remove a card from a deck if it would bring the size to below the minimum size.
    function removeCardFromDeck(address player, uint8 deckID, uint8 index)
            external delegated(player) exists(player, deckID) {
        Deck storage deck = decks[player][deckID];
        if (deck.cards.length == MIN_DECK_SIZE)
            revert BigDeckEnergy();
        uint256 cardID = deck.cards[index];
        deck.cards[index] = deck.cards[deck.cards.length - 1];
        deck.cards.pop();
        emit CardRemovedFromDeck(deckID, cardID);
    }

    // ---------------------------------------------------------------------------------------------

    // Checks that the player has all the cards in the given deck in the inventory.
    function checkDeck(address player, uint8 deckID) external view exists(player, deckID) {
        Deck storage deck = decks[player][deckID];
        for (uint256 i = 0; i < deck.cards.length ; ++i) {
            uint256 cardID = deck.cards[i];
            if (inventoryCardsCollection.ownerOf(cardID) != player)
                revert CardNotInInventory(cardID);
        }
        // NOTE(norswap): Deck size is implicitly checked when updating the deck.
        // TODO(LATER): check that each card does not exceed its maximum amount of copies
    }

    // ---------------------------------------------------------------------------------------------

    // Return the list of cards in the given deck of the given player.
    function getDeck(address player, uint8 deckID) external view
            exists(player, deckID) returns(uint256[] memory deckCards) {
        return decks[player][deckID].cards;
    }
}
