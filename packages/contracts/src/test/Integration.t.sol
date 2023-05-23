// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "../CardsCollection.sol";
import "../Inventory.sol";
import "../InventoryCardsCollection.sol";
import "../Game.sol";

import "forge-std/Test.sol";
import "../deploy/Deploy.s.sol";

contract Integration is Test {
    Deploy private deployment;
    CardsCollection private cardsCollection;
    Inventory private inventory;
    InventoryCardsCollection private inventoryCardsCollection;
    Game private game;
    DeckAirdrop private airdrop;

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

    // =============================================================================================

    function setUp() public {
        deployment = new Deploy();
        deployment.dontLog();
        deployment.run();

        cardsCollection = deployment.cardsCollection();
        inventory = deployment.inventory();
        inventoryCardsCollection = deployment.inventoryCardsCollection();
        game = deployment.game();
        airdrop = deployment.airdrop();

        vm.prank(player1);
        airdrop.claimAirdrop();
        vm.prank(player2);
        airdrop.claimAirdrop();
    }

    function testGame() public {
        uint256 gameID = 1;
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
        game.attack(gameID, 1, size1array);
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