// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./Inventory.sol";

contract Game {

    // maps players to the index of their current game (if any)
    mapping(address => uint256) playerToGames;

    // maps a game index to the players in the game
    address[][] players;

    constructor() {
        players.push(); // skip index 0, as 0 represents absence of games in `playerToGames`
    }
}
