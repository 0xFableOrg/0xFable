// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "multicall/Multicall3.sol";

contract DeployLocal is Script {
    function run() external {
        vm.startBroadcast();

// EXAMPLE DEPLOY SCRIPT
//        Accounts accounts = new Accounts();
//        Buildings buildings = new Buildings();
//        Deuterium deuterium = new Deuterium(address(accounts), buildings);
//        Gas gas = new Gas(address(accounts), buildings);
//        Mineral mineral = new Mineral(address(accounts), buildings);
//
//
//        console2.log("Accounts address", address(accounts));
//        console2.log("Buildings address", address(buildings));
//        console2.log("Deuterium address", address(deuterium));
//        console2.log("Gas address", address(gas));
//        console2.log("Mineral address", address(mineral));

//
//        accounts.initialize(deuterium, gas, mineral);
//        buildings.initialize(deuterium, gas, mineral);

        // This is deployed on most networks, but must be deployed locally.
        Multicall3 multicall = new Multicall3();
        console2.log("Multicall3 address", address(multicall));

        vm.stopBroadcast();
    }
}

contract DeployPublic is Script {
    bytes32 private constant salt = bytes32(uint256(4269));

    function run() external {
        vm.startBroadcast();

        // Using CREATE2 (specifying salt) makes deployment address predictable no matter the chain,
        // if the bytecode does not change. (Note that Foundry omits the matadata hash by default:
        // https://github.com/foundry-rs/foundry/pull/1180)

        // Not used for local deployments because it needs the CREATE2 deployer deployed at
        // 0x4e59b44847b379578588920ca78fbf26c0b4956c and that's not the case on the Anvil chain.

//        Accounts accounts = new Accounts{salt: salt}();
//        Buildings buildings = new Buildings{salt: salt}();
//        Deuterium deuterium = new Deuterium{salt: salt}(address(accounts), buildings);
//        Gas gas = new Gas{salt: salt}(address(accounts), buildings);
//        Mineral mineral = new Mineral{salt: salt}(address(accounts), buildings);
//
//        console2.log("Accounts address", address(accounts));
//        console2.log("Buildings address", address(buildings));
//        console2.log("Deuterium address", address(deuterium));
//        console2.log("Gas address", address(gas));
//        console2.log("Mineral address", address(mineral));
//
//        // Adress where it's deployed on most chains, cf. https://github.com/mds1/multicall
//        console2.log("Multicall3 address", "0xcA11bde05977b3631167028862bE2a173976CA11");
//
//        accounts.initialize(deuterium, gas, mineral);
//        buildings.initialize(deuterium, gas, mineral);

        vm.stopBroadcast();
    }
}
