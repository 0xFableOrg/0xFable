// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../PlayerHandle.sol";

contract MockENSResolver is IENSResolver {
    mapping(address => string) private ensNames;

    function setEnsName(address addr, string memory name) external {
        ensNames[addr] = name;
    }

    function getEnsName(address addr) external view override returns (string memory) {
        return ensNames[addr];
    }
}

contract PlayerHandleTest is Test {
    PlayerHandle public playerHandle;
    MockENSResolver public mockEnsResolver;

    address player1 = address(0x1);
    address player2 = address(0x2);

    function setUp() public {
        mockEnsResolver = new MockENSResolver();
        playerHandle = new PlayerHandle(address(mockEnsResolver));
    }

    function testRegisterHandle() public {
        vm.prank(player1);
        playerHandle.registerHandle("player1");

        string memory handle = playerHandle.getPlayerHandle(player1);
        assertEq(handle, "player1");
    }

    function testChangeHandle() public {
        vm.prank(player1);
        playerHandle.registerHandle("player1");

        vm.prank(player1);
        playerHandle.changeHandle("newPlayer1");

        string memory handle = playerHandle.getPlayerHandle(player1);
        assertEq(handle, "newPlayer1");
    }

    function testSetUseEns() public {
        mockEnsResolver.setEnsName(player1, "player1.eth");

        vm.prank(player1);
        playerHandle.setUseEns(true);

        string memory handle = playerHandle.getPlayerHandle(player1);
        assertEq(handle, "player1.eth");
    }

    function testHandleValidity() public {
        assertTrue(playerHandle.checkHandleValidity("validHandle"));
        assertFalse(playerHandle.checkHandleValidity("inv"));
        assertFalse(playerHandle.checkHandleValidity("invalid.handle"));
    }

    function testHandleAlreadyTaken() public {
        vm.prank(player1);
        playerHandle.registerHandle("player1");

        vm.prank(player2);
        vm.expectRevert("Handle already taken");
        playerHandle.registerHandle("player1");
    }

    function testPlayerEligibility() public {
        assertTrue(playerHandle.checkPlayerEligibility(player1));
    }
}
