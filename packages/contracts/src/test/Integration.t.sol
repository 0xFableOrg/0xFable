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

    bytes32 private constant salt = bytes32(uint256(4269));
    address private constant player1 = 0x00000000000000000000000000000000DeaDBeef;
    address private constant player2 = 0x00000000000000000000000000000000deAdBAbE;

    // Placeholder for all hand roots.
    bytes32 private constant HAND_ROOT = 
        bytes32(uint256(1167599355309313438987124081993443230371736953958095893438648826994677577159));
    // Placeholder for all deck roots.
    bytes32 private constant DECK_ROOT = 
        bytes32(uint256(19109610845475038736354839752971502755972005872701840193667937795583479074137));
    // Placeholder for committed salt
    uint256 private constant COMMITTED_SALT = 
        10644022205700269842939357604110603061463166818082702766765548366499887869490; // preimage is 42
    // Placeholder for all proofs.
    bytes private constant PROOF = bytes("proof");

    uint8 private constant NONE = 255;

    // =============================================================================================

    function generateProof() public pure returns(uint256[24] memory proof) {
        // NOTE: We need the proof in memory, not in storage, so we can't use the `proof` variable
        proof = [
            uint256(0x22006d88bd4e10d883049ad04bb664927923a5d812d2168157962e2aab09c57e), 
            uint256(0x15084daf6e655066adf20c4115be89c892ee6c02be4fb46c68312a850ae20037),
            uint256(0x12850ede4337f205f39cd5c985b8bc42603702d51cc0f18b7e3a462b077a9246),
            uint256(0x19b4df2f6c63b1b8f2f1bfe984357a9130122adf880f70128299d230f612f179),
            uint256(0x1d61e62c8322980d9865f0a5b24e5f75b019af645fe43ec64997524b8e8d68ab),
            uint256(0x03172089b12dfeba6184d8a87c841416300e65bce13fe690032a2c39fb01ca4b),
            uint256(0x0d53092aed6623e361b3cc9923bdb78fc238eb171dff41502a8a0c1ee37a778b),
            uint256(0x2d32f91f02f9bee7d45da1d9f0d138acfbccd567b268fade889ddbc75ecf28fe),
            uint256(0x140231e0932c25e61f084951bd52845834b33eed5f960ceded31206f3e49e6b7),
            uint256(0x192a4b7615df1254f1ac1d9b4577571d20c4e29db40727e8d1c47e0be1687366),
            uint256(0x0d3092e57c9a08fbd5601d968062c3581ead20c74667e273e6dc74e87d89b349),
            uint256(0x2214d96c378c03394c12c5b96d8865224f09ca800bafb681163c90ad36b6abf5),
            uint256(0x229acc49202892d65bf6ca12981687add0ba8bf5cbe2e598074a8fa8974e7d57),
            uint256(0x16e668d00c0c840d4242782684e68dd0d88f5e1901e90afe66c2e319c6b667b7),
            uint256(0x2310cade82d43609280b72d71cde878edf0307845e028660f5a5a804fb7b7e65),
            uint256(0x065ecccddbcf11a698b11982c638b37452168d06b36fab62d7e50806657f2214),
            uint256(0x1746910eee94d94d32b803fcd263b1442a02d6bed456a5023d06f36d2f03f76c),
            uint256(0x175cf011d3cfca9b205dfcef9534009d1eb7e48288112e3c0e834f2134bbd749),
            uint256(0x221d7b47d1f55cfc0da5a1176f98449d924552d3166f5f60094d85d85684d468),
            uint256(0x094045a475e21902130b5d028c8c05334e6e51b2966af6a7a863653d27757f04),
            uint256(0x1cfde6c0c3dd73020835c4b837fa5f202a81a92c438a26bd142ecc174657aaf5),
            uint256(0x13997c4b0b35ed1597ad6f07a30b43df5b42b4b5f49b382f8022556e3a0629af),
            uint256(0x21ab3cb79d056a2a635ad5563834250c1a30b73e9514bedaeb0a847be4ff6cc4),
            uint256(0x01edba74f2caf2ff5983a5157c2ec3a55746c330bc8962951d4c659cfd92699c)
        ];
    }

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
        inventory.getDeck(player2, 0); // player1 has card id of 49-72 inclusive
        inventory.getDeck(player2, 0); // player2 has card id of 73-96 inclusive
        // ids are not starting at 1 because the deploy script currently airdrops some addresses, might change
        vm.prank(address(0));
        game.toggleCheckProof(); // check zk proof for first player
        vm.startPrank(player1);
        game.commitSalt(COMMITTED_SALT);
        game.joinGame(gameID, 0, bytes(""), HAND_ROOT, DECK_ROOT, generateProof());
        vm.stopPrank();
        vm.prank(address(0));
        game.toggleCheckProof();
        vm.startPrank(player2);
        game.commitSalt(COMMITTED_SALT);
        game.joinGame(gameID, 0, bytes(""), HAND_ROOT, DECK_ROOT, generateProof());
        vm.stopPrank();

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
