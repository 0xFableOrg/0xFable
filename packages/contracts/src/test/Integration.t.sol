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
            inventory.addCard(start + j);
            deck[j] = start + j;
        }
        inventory.addDeck(Inventory.Deck(deck));
        vm.stopPrank();
    }

    function setUp() public {
        cardsCollection = new CardsCollection();
        inventory = new Inventory(salt, cardsCollection);
        inventoryCardsCollection = inventory.inventoryCardsCollection();
        game = new Game(inventory);

        createDeck(0,  player1);
        createDeck(24, player2);
    }

    function testGame() public {
        address[] memory players = new address[](2);
        uint8[] memory decks = new uint8[](2); // [0, 0]
        players[0] = player1;
        players[1] = player2;
        game.createGame(players, decks);
        uint256 x = 1;
        assertEq(x, x);
    }

/*
Accounts private accounts;
    Buildings private buildings;
    Deuterium private deuterium;
    Gas private gas;
    Mineral private mineral;

    address private constant player = 0x00000000000000000000000000000000DeaDBeef;
    BuildingType private constant MINE = BuildingType.MINERAL_MINE;
    BuildingType private constant EXTRACTOR = BuildingType.GAS_EXTRACTOR;
    BuildingType private constant SYNTHESIZER = BuildingType.DEUTERIUM_SYNTHESIZER;

    function setUp() public {
        accounts = new Accounts();
        buildings = new Buildings();
        deuterium = new Deuterium(address(accounts), buildings);
        gas = new Gas(address(accounts), buildings);
        mineral = new Mineral(address(accounts), buildings);
    }

    function testBuildingsNoDoubleInit() public {
        buildings.initialize(deuterium, gas, mineral);
        vm.expectRevert(AlreadyInitialized.selector);
        buildings.initialize(deuterium, gas, mineral);
    }

    function testAccountsNoDoubleInit() public {
        accounts.initialize(deuterium, gas, mineral);
        vm.expectRevert(AlreadyInitialized.selector);
        accounts.initialize(deuterium, gas, mineral);
    }

    function testCreateAccountRevertIfNonInit() public {
        vm.expectRevert(bytes(""));
        vm.prank(player);
        accounts.createAccount();
    }

    function testUpgradeRevertIfNonInit() public {
        vm.expectRevert(bytes(""));
        buildings.upgrade(player, MINE);
    }

    modifier init() {
        accounts.initialize(deuterium, gas, mineral);
        buildings.initialize(deuterium, gas, mineral);

        // not really needed for now
        vm.prank(player);
        accounts.createAccount();

        _;
    }

    function testUpgrade() public init {
        deal(address(mineral), player, 1000, true);
        deal(address(gas), player, 1000, true);

        assertEq(buildings.levels(player, MINE), 0);
        buildings.upgrade(player, MINE);
        assertEq(buildings.levels(player, MINE), 1);

        assertEq(buildings.levels(player, EXTRACTOR), 0);
        buildings.upgrade(player, EXTRACTOR);
        assertEq(buildings.levels(player, EXTRACTOR), 1);

        assertEq(buildings.levels(player, SYNTHESIZER), 0);
        buildings.upgrade(player, SYNTHESIZER);
        assertEq(buildings.levels(player, SYNTHESIZER), 1);

        // alternate upgrades on purpose

        buildings.upgrade(player, MINE);
        assertEq(buildings.levels(player, MINE), 2);

        buildings.upgrade(player, EXTRACTOR);
        assertEq(buildings.levels(player, EXTRACTOR), 2);

        buildings.upgrade(player, SYNTHESIZER);
        assertEq(buildings.levels(player, SYNTHESIZER), 2);
    }
*/

}
