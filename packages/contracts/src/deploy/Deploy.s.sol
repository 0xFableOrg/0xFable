// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection} from "../CardsCollection.sol";
import {DeckAirdrop} from "../DeckAirdrop.sol";
import {Game} from "../Game.sol";
import {Inventory} from "../Inventory.sol";
import {InventoryCardsCollection} from "../InventoryCardsCollection.sol";
import {PlonkVerifier as DrawVerifier} from "../verifiers/DrawVerifier.sol";
import {PlonkVerifier as DrawHandVerifier} from "../verifiers/DrawHandVerifier.sol";
import {PlonkVerifier as PlayVerifier} from "../verifiers/PlayVerifier.sol";

import {Script, console2} from "forge-std/Script.sol";
// import {Multicall3} from "multicall/Multicall3.sol";

contract Deploy is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    CardsCollection public cardsCollection;
    Inventory public inventory;
    InventoryCardsCollection public inventoryCardsCollection;
    DrawVerifier public drawVerifier;
    PlayVerifier public playVerifier;
    DrawHandVerifier public drawHandVerifier;
    Game public game;
    DeckAirdrop public airdrop;

    bool private doLog = true;

    function dontLog() external {
        doLog = false;
    }

    function log(string memory s, address a) private view {
        if (doLog) {
            console2.log(s, a); // solhint-disable-line
        }
    }

    function run() external {
        vm.startBroadcast();

        // deploy
        cardsCollection = new CardsCollection();
        inventory = new Inventory(salt, cardsCollection);
        inventoryCardsCollection = inventory.inventoryCardsCollection();
        drawVerifier = new DrawVerifier();
        playVerifier = new PlayVerifier();
        drawHandVerifier = new DrawHandVerifier();
        game = new Game(inventory, drawVerifier, playVerifier, drawHandVerifier);
        airdrop = new DeckAirdrop(inventory);

        // initialize
        cardsCollection.setInventory(inventory);
        inventory.setAirdrop(airdrop);
        inventory.setGame(game);
        cardsCollection.setAirdrop(airdrop);

        log("CardsCollection address", address(cardsCollection));
        log("Inventory address", address(inventory));
        log("InventoryCardsCollection address", address(inventoryCardsCollection));
        log("Game address", address(game));
        log("DeckAirdrop address", address(airdrop));

        vm.stopBroadcast();

        // Anvil first two test accounts.
        string memory mnemonic = "test test test test test test test test test test test junk";
        (address account0,) = deriveRememberKey(mnemonic, 0);
        (address account1,) = deriveRememberKey(mnemonic, 1);

        vm.broadcast(account0);
        airdrop.claimAirdrop();
        vm.broadcast(account1);
        airdrop.claimAirdrop();

        // In case we need it.
        // Multicall3 multicall = new Multicall3();
        // console2.log("Multicall3 address", address(multicall));
    }
}
