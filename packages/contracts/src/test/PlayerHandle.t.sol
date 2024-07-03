// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../PlayerHandle.sol";
import {MockENSResolver} from "../MockResolver.sol";

// running tests for PlayerHandle and MockENSResolver
contract PlayerHandleTest is Test {
    PlayerHandle public playerHandle;
    MockENSResolver public mockENSResolver;

    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        mockENSResolver = new MockENSResolver();
        playerHandle = new PlayerHandle(address(mockENSResolver));
    }

    function testRegisterHandle() public {
        vm.prank(alice);
        playerHandle.registerHandle("AliceHandle");

        assertEq(playerHandle.getPlayerHandle(alice), "AliceHandle");
    }

    function testRegisterInvalidHandle() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("InvalidHandle()"));
        playerHandle.registerHandle("a");
    }

    function testHandleAlreadyTaken() public {
        vm.prank(alice);
        playerHandle.registerHandle("AliceHandle");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("HandleAlreadyTaken()"));
        playerHandle.registerHandle("AliceHandle");
    }

    function testChangeHandle() public {
        vm.prank(alice);
        playerHandle.registerHandle("AliceHandle");

        vm.prank(alice);
        playerHandle.changeHandle("NewAliceHandle");

        assertEq(playerHandle.getPlayerHandle(alice), "NewAliceHandle");
    }

    function testSetUseEns() public {
        bytes32 node = keccak256(abi.encodePacked(addressToBytes32(alice)));
        mockENSResolver.setName(node, "alice.eth");

        vm.prank(alice);
        playerHandle.setUseEns(true);

        assertEq(playerHandle.getPlayerHandle(alice), "alice.eth");
    }

    function testUnsetUseEns() public {
        bytes32 node = keccak256(abi.encodePacked(addressToBytes32(alice)));
        mockENSResolver.setName(node, "alice.eth");

        vm.prank(alice);
        playerHandle.registerHandle("AliceHandle");
        playerHandle.setUseEns(true);
        playerHandle.setUseEns(false);

        assertEq(playerHandle.getPlayerHandle(alice), "AliceHandle");
    }

    function addressToBytes32(address addr) private pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
