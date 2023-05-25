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