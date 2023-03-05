// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "../CardsCollection.sol";
import "../Inventory.sol";
import "../InventoryCardsCollection.sol";
import "../Game.sol";

import "forge-std/Test.sol";

contract Integration is Test {
    CardsCollection private cardsCollection;
    Inventory private inventory;
    InventoryCardsCollection private inventoryCardsCollection;
    Game private game;

    bytes32 private constant salt = bytes32(uint256(4269));
    address private constant player1 = 0x00000000000000000000000000000000DeaDBeef;
    address private constant player2 = 0x00000000000000000000000000000000deAdBAbE;

    // Placeholder for all hand roots.
    bytes32 private constant HAND_ROOT = bytes32(uint256(42));
    // Placeholder for all deck roots.
    bytes32 private constant DECK_ROOT = bytes32(uint256(42));
    // Placeholder for all proofs.
    bytes private constant PROOF = bytes("proof");

    uint8 private constant NONE = 255;


    function createDeck(uint256 start, address player) internal {
        uint256 i = 0;
        cardsCollection.mint(player, start + i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(player, start + i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(player, start + i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(player, start + i++, "Horrible Gremlin", "", "", 1, 1);
        cardsCollection.mint(player, start + i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(player, start + i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(player, start + i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(player, start + i++, "Wise Elf", "", "", 1, 3);
        cardsCollection.mint(player, start + i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(player, start + i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(player, start + i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(player, start + i++, "Fire Fighter", "", "", 2, 2);
        cardsCollection.mint(player, start + i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(player, start + i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(player, start + i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(player, start + i++, "Grave Digger", "", "", 2, 3);
        cardsCollection.mint(player, start + i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(player, start + i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(player, start + i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(player, start + i++, "Mana Fiend", "", "", 3, 1);
        cardsCollection.mint(player, start + i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(player, start + i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(player, start + i++, "Goblin Queen", "", "", 3, 2);
        cardsCollection.mint(player, start + i++, "Goblin Queen", "", "", 3, 2);

        uint256[] memory deck = new uint256[](24);

        vm.startPrank(player);
        cardsCollection.setApprovalForAll(address(inventory), true);
        for (uint256 j = 0; j < i; ++j) {
            inventory.addCard(player, start + j);
            deck[j] = start + j;
        }
        inventory.addDeck(player, Inventory.Deck(deck));
        vm.stopPrank();
    }

    function setUp() public {
        cardsCollection = new CardsCollection();
        inventory = new Inventory(salt, cardsCollection);
        inventoryCardsCollection = inventory.inventoryCardsCollection();
        game = new Game(inventory, DrawVerifier(address(0)), PlayVerifier(address(0)));

        createDeck(0,  player1);
        createDeck(24, player2);
    }

    // TODO: this uses a single deck for both players, offset all of player 2's cards by 24

    // Offset for player 2 deck IDs.
    uint8 private constant p2o = 24;

    function testGame() public {
        uint256 gameID = 0;
        // TODO
        //game.createGame(2, game.allowAnyPlayerAndDeck);
        game.createGame(2);
        inventory.getDeck(player1, 0);
        vm.prank(player1);
        game.joinGame(gameID, 0, bytes(""), HAND_ROOT, DECK_ROOT, PROOF);
        vm.prank(player2);
        game.joinGame(gameID, 0, bytes(""), HAND_ROOT, DECK_ROOT, PROOF);

        Game.PlayerData memory pdata;
        uint8[] memory size1array = new uint8[](1);
        uint8[] memory size2array = new uint8[](2);

        vm.startPrank(player1);

        // play Horrible Gremlin (0)
        game.playCard(gameID, HAND_ROOT, 0, PROOF);
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.battlefield, 1);

        // attack with Horrible Gremlin
        game.attack(0, 1, size1array);
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.attacking.length, 1);
        assertEq(pdata.attacking[0], 0);

        // player1: Horrible Gremlin (0)
        // player2: -
        changePrank(player2);

        // can't defend: take damage
        size1array[0] = NONE;
        game.defend(gameID, size1array);
        pdata = game.playerData(gameID, player2);
        assertEq(pdata.health, 19);

        // draw card then play Fire Fighter
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, PROOF);
        game.playCard(gameID, HAND_ROOT, 8, PROOF);
        pdata = game.playerData(gameID, player2);
        assertEq(pdata.battlefield, 1 << 8);

        // pass without attacking
        game.pass(gameID);

        // player1: Horrible Gremlin (0)
        // player2: Fire Fighter (8)
        changePrank(player1);

        // draw card then play Wise Elf (4)
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, PROOF);
        game.playCard(gameID, HAND_ROOT, 4, PROOF);
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.battlefield, (1 << 4) + 1);

        // attack with Wise Elf (4)
        size1array[0] = 4;
        game.attack(gameID, 1, size1array);
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.attacking.length, 1);
        assertEq(pdata.attacking[0], 4);

        // player1: Horrible Gremlin (0), Wise Elf (4)
        // player2: Fire Fighter (8)
        changePrank(player2);

        // defend with Fire Fighter (8)
        size1array[0] = 8;
        game.defend(gameID, size1array);
        pdata = game.playerData(gameID, player2);
        assertEq(pdata.battlefield, 1 << 8);
        assertEq(pdata.graveyard, 0);

        // draw card then play Mana Fiend (16)
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, PROOF);
        game.playCard(gameID, HAND_ROOT, 16, PROOF);

        // attack with Fire Fighter (8)
        size1array[0] = 8;
        game.attack(gameID, 0, size1array);

        // player1: Horrible Gremlin (0), Wise Elf (4)
        // player2: Fire Fighter (8), Mana Fiend (16)
        changePrank(player1);

        // defend with Horrible Gremlin (0)
        size1array[0] = 0;
        game.defend(gameID, size1array);

        // Horrible Gremlin destroyed
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.battlefield, 1 << 4);
        assertEq(pdata.graveyard, 1);

        // draw card then play Goblin Queen (20)
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, PROOF);
        game.playCard(gameID, HAND_ROOT, 20, PROOF);

        // attack with both Wise Elf (4) and Goblin Queen (20)
        size2array[0] = 4;
        size2array[1] = 20;
        game.attack(gameID, 1, size2array);

        // player1: Wise Elf (4), Goblin Queen (20)
        // player2: Fire Fighter (8), Mana Fiend (16)
        changePrank(player2);

        // defend against Wise Elf (4) with Mana Fiend (16), let Goblin Queen (20) pass through
        size2array[0] = 16;
        size2array[1] = NONE;
        game.defend(gameID, size2array);

        // both Wise Elf (4) and Mana Fiend (16) Destroyed
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.battlefield, 1 << 20);
        assertEq(pdata.graveyard, (1 << 4) + 1);
        pdata = game.playerData(gameID, player2);
        assertEq(pdata.battlefield, 1 << 8);
        assertEq(pdata.graveyard, 1 << 16);
        assertEq(pdata.health, 16);

        // TODO test victory
        // TODO test event emitted

        vm.stopPrank();
    }
}