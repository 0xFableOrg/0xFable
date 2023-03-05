// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "../CardsCollection.sol";
import "../Inventory.sol";
import "../InventoryCardsCollection.sol";
import "../Game.sol";
import "../DeckAirdrop.sol";

import "forge-std/Script.sol";
import "multicall/Multicall3.sol";


contract DeployLocal is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    function run() external {
        vm.startBroadcast();

        CardsCollection cardsCollection = new CardsCollection();
        Inventory inventory = new Inventory(salt, cardsCollection);
        InventoryCardsCollection inventoryCardsCollection = inventory.inventoryCardsCollection();
        Game game = new Game(inventory, true);
        DeckAirdrop airdrop = new DeckAirdrop(inventory);

        cardsCollection.transferOwnership(address(airdrop));
        airdrop.mint();

        console2.log("CardsCollection address", address(cardsCollection));
        console2.log("Inventory address", address(inventory));
        console2.log("InventoryCardsCollection address", address(inventoryCardsCollection));
        console2.log("Game address", address(game));
        console2.log("DeckAirdrop address", address(airdrop));

        Multicall3 multicall = new Multicall3();
        console2.log("Multicall3 address", address(multicall));

        vm.stopBroadcast();
    }
}

contract DeployPublic is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    function run() external {
        vm.startBroadcast();

        // TODO CREATE2 messed up Ownable, by setting owner to CREATE2 deployer

        // Using CREATE2 (specifying salt) makes deployment address predictable no matter the chain,
        // if the bytecode does not change. (Note that Foundry omits the matadata hash by default:
        // https://github.com/foundry-rs/foundry/pull/1180)

        // Not used for local deployments because it needs the CREATE2 deployer deployed at
        // 0x4e59b44847b379578588920ca78fbf26c0b4956c and that's not the case on the Anvil chain.

        CardsCollection cardsCollection = new CardsCollection{salt: salt}();
        Inventory inventory = new Inventory{salt: salt}(salt, cardsCollection);
        InventoryCardsCollection inventoryCardsCollection = inventory.inventoryCardsCollection();
        Game game = new Game{salt: salt}(inventory, true);
        DeckAirdrop airdrop = new DeckAirdrop{salt: salt}(inventory);

        console2.log("CardsCollection address", address(cardsCollection));
        console2.log("Inventory address", address(inventory));
        console2.log("InventoryCardsCollection address", address(inventoryCardsCollection));
        console2.log("Game address", address(game));
        console2.log("DeckAirdropF address", address(airdrop));

        console2.log("Multicall3 address", 0xcA11bde05977b3631167028862bE2a173976CA11);

        vm.stopBroadcast();
    }
}
