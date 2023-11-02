// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection} from "../CardsCollection.sol";
import {DeckAirdrop} from "../DeckAirdrop.sol";
import {Inventory} from "../Inventory.sol";
import {InventoryCardsCollection} from "../InventoryCardsCollection.sol";
import {Game} from "../Game.sol";

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../deploy/Deploy.s.sol";

contract Integration is Test {
    Deploy private deployment;
    CardsCollection private cardsCollection;
    Inventory private inventory;
    InventoryCardsCollection private inventoryCardsCollection;
    Game private game;
    DeckAirdrop private airdrop;

    address private constant player1 = 0x00000000000000000000000000000000DeaDBeef;
    address private constant player2 = 0x00000000000000000000000000000000deAdBAbE;

    // Placeholder for all hand roots.
    bytes32 private constant HAND_ROOT = bytes32(uint256(0x647d));

    // Placeholder for all deck roots.
    bytes32 private constant DECK_ROOT = bytes32(uint256(0xdecc));

    // Placeholder for the salt hash (hash of salt 42)
    uint256 private constant SALT_HASH = 10644022205700269842939357604110603061463166818082702766765548366499887869490;

    // Placeholder for join data
    bytes private constant JOIN_DATA = bytes("");

    // Deck ID (we always use deck 0 for all players)
    uint8 private constant DECK_ID = 0;

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
        uint256[24] memory proof;

        // don't check zk proofs
        vm.prank(address(0));
        game.toggleCheckProofs();

        uint256 gameID = 1;
        game.createGame(2);

        // IDs don't start at 1 because the deploy script currently airdrops some addresses, might change.
        inventory.getDeck(player2, 0); // player1 has card id of 49-72 inclusive
        inventory.getDeck(player2, 0); // player2 has card id of 73-96 inclusive

        vm.startPrank(player1);
        game.joinGame(gameID, DECK_ID, SALT_HASH, JOIN_DATA);
        game.drawInitialHand(gameID, HAND_ROOT, DECK_ROOT, proof);
        vm.stopPrank();

        vm.startPrank(player2);
        game.joinGame(gameID, DECK_ID, SALT_HASH, JOIN_DATA);
        game.drawInitialHand(gameID, HAND_ROOT, DECK_ROOT, proof);
        vm.stopPrank();

        Game.PlayerData memory pdata;
        uint8[] memory size1array = new uint8[](1);
        uint8[] memory size2array = new uint8[](2);

        vm.startPrank(player1);

        // NOTE: For all calls to play card, we use 0 as the value of `cardIndexInHand`.
        // Since we don't check proof, we can pretend we have whatever in the hand.
        // (In these tests we don't event generate a hand.)
        // The value of `cardIndex` (and in parens next to card names) is the index in the cards
        // array.

        // TODO: These index are thoroughly incorrect, as we use the 0-23 range for both players,
        //       instead of the 0-23 range for player1 and 24-47 range for player2.
        // The test are still correct as expected, because the stat lookups can be done correctly,
        // and we don't check the proofs which would detect this index error.

        // play Horrible Gremlin (0)
        game.playCard(gameID, HAND_ROOT, 0, 0, proof);
        pdata = game.playerData(gameID, player1);
        assertEq(pdata.battlefield, 1);

        // attack with Horrible Gremlin (0)
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

        // draw card then play Fire Fighter (8)
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, proof);
        game.playCard(gameID, HAND_ROOT, 0, 8, proof);
        pdata = game.playerData(gameID, player2);
        assertEq(pdata.battlefield, 1 << 8);

        // pass without attacking
        game.pass(gameID);

        // player1: Horrible Gremlin (0)
        // player2: Fire Fighter (8)
        changePrank(player1);

        // draw card then play Wise Elf (4)
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, proof);
        game.playCard(gameID, HAND_ROOT, 0, 4, proof);
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
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, proof);
        game.playCard(gameID, HAND_ROOT, 0, 16, proof);

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
        game.drawCard(gameID, HAND_ROOT, DECK_ROOT, proof);
        game.playCard(gameID, HAND_ROOT, 0, 20, proof);

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
