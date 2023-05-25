// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "../CardsCollection.sol";
import "../Inventory.sol";
import "../InventoryCardsCollection.sol";
import "../Game.sol";
import "../DeckAirdrop.sol";

import "forge-std/Script.sol";
import "multicall/Multicall3.sol";


contract Deploy is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    CardsCollection public cardsCollection;
    Inventory public inventory;
    InventoryCardsCollection public inventoryCardsCollection;
    DrawVerifier public drawVerifier;
    PlayVerifier public playVerifier;
    InitialVerifier public initialVerifier;
    Game public game;
    DeckAirdrop public airdrop;

    bool private log = true;

    function dontLog() external {
        log = false;
    }

    function run() external {
        vm.startBroadcast();

        // deploy
        cardsCollection = new CardsCollection();
        inventory = new Inventory(salt, cardsCollection);
        inventoryCardsCollection = inventory.inventoryCardsCollection();
        drawVerifier = new DrawVerifier();
        playVerifier = new PlayVerifier();
        initialVerifier = new InitialVerifier();
        game = new Game(inventory, drawVerifier, playVerifier, initialVerifier);
        airdrop = new DeckAirdrop(inventory);

        // initialize
        cardsCollection.setInventory(inventory);
        inventory.setAirdrop(airdrop);
        inventory.setGame(game);
        cardsCollection.setAirdrop(airdrop);

        if (log) {
            console2.log("CardsCollection address", address(cardsCollection));
            console2.log("Inventory address", address(inventory));
            console2.log("InventoryCardsCollection address", address(inventoryCardsCollection));
            console2.log("Game address", address(game));
            console2.log("DeckAirdrop address", address(airdrop));
        }

        vm.stopBroadcast();

        // Anvil first two test accounts.
        string memory mnemonic = "test test test test test test test test test test test junk";
        (address ACCOUNT0,) = deriveRememberKey(mnemonic, 0);
        (address ACCOUNT1,) = deriveRememberKey(mnemonic, 1);

        vm.broadcast(ACCOUNT0);
        airdrop.claimAirdrop();
        vm.broadcast(ACCOUNT1);
        airdrop.claimAirdrop();

        // In case we need it.
        // Multicall3 multicall = new Multicall3();
        // console2.log("Multicall3 address", address(multicall));
    }
}

contract DeployDeterministic is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    bool private log = true;

    function dontLog() external {
        log = false;
    }

    CardsCollection public cardsCollection;
    Inventory public inventory;
    InventoryCardsCollection public inventoryCardsCollection;
    DrawVerifier public drawVerifier;
    PlayVerifier public playVerifier;
    InitialVerifier public initialVerifier;
    Game public game;
    DeckAirdrop public airdrop;

    function run() external {
        vm.startBroadcast();

        // TODO CREATE2 messed up Ownable, by setting owner to CREATE2 deployer

        // Using CREATE2 (specifying salt) makes deployment address predictable no matter the chain,
        // if the bytecode does not change. (Note that Foundry omits the matadata hash by default:
        // https://github.com/foundry-rs/foundry/pull/1180)

        // Not used for local deployments because it needs the CREATE2 deployer deployed at
        // 0x4e59b44847b379578588920ca78fbf26c0b4956c and that's not the case on the Anvil chain.

        // deploy
        cardsCollection = new CardsCollection{salt: salt}();
        inventory = new Inventory{salt: salt}(salt, cardsCollection);
        inventoryCardsCollection = inventory.inventoryCardsCollection();
        drawVerifier = new DrawVerifier{salt: salt}();
        playVerifier = new PlayVerifier{salt: salt}();
        initialVerifier = new InitialVerifier{salt: salt}();
        game = new Game{salt: salt}(inventory, drawVerifier, playVerifier, initialVerifier);
        airdrop = new DeckAirdrop{salt: salt}(inventory);

        // initialize
        cardsCollection.setInventory(inventory);
        inventory.setAirdrop(airdrop);
        inventory.setGame(game);
        cardsCollection.setAirdrop(airdrop);

        if (log) {
            console2.log("CardsCollection address", address(cardsCollection));
            console2.log("Inventory address", address(inventory));
            console2.log("InventoryCardsCollection address", address(inventoryCardsCollection));
            console2.log("Game address", address(game));
            console2.log("DeckAirdrop address", address(airdrop));
        }

        // console2.log("Multicall3 address", 0xcA11bde05977b3631167028862bE2a173976CA11);

        vm.stopBroadcast();
    }
}
