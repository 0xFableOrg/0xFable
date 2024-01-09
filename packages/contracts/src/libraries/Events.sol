// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

library Events {
    // Replace player indexes in all of those by addresses.

    // NOTE(norswap): we represented players as an address when the event can contribute to their
    //  match stats, and as a uint8 index when these are internal game events.

    // The player took to long to submit an action and lost as a consequence.
    event PlayerTimedOut(uint256 indexed gameID, address indexed player);

    // Not all players joined and drew their hands within the time limit, the game is cancelled
    // as a consequence.
    event MissingPlayers(uint256 indexed gameID);

    // A game was created by the given creator.
    event GameCreated(uint256 gameID, address indexed creator);

    // The game was cancelled by its creator before it is started.
    event GameCancelled(uint256 indexed gameID);

    // A player joined the game.
    event PlayerJoined(uint256 indexed gameID, address player);

    // A player drew his initial hand.
    event PlayerDrewHand(uint256 indexed gameID, address player);

    // All players joined (total number of players reached).
    // A game can be cancelled by its creator up until this point.
    event FullHouse(uint256 indexed gameID);

    // The game started (all players joined + drew their initial hands).
    event GameStarted(uint256 indexed gameID);

    // A player drew a card.
    event CardDrawn(uint256 indexed gameID, uint8 player);

    // A player played a card.
    event CardPlayed(uint256 indexed gameID, uint8 player, uint256 card);

    // The given player ended his turn.
    event TurnEnded(uint256 indexed gameID, address player);

    // A player attacked another player.
    event PlayerAttacked(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player defended against another player.
    event PlayerDefended(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // Someone won!
    event Champion(uint256 indexed gameID, address indexed player);

    // The player conceded the game.
    event PlayerConceded(uint256 indexed gameID, address indexed player);

    // A creature was destroyed at the given index in the attacker/defender's battlefield.
    // The battlefield index matches the battlefield before the battle (defender defending),
    // which will not match the on-chain battlefield after the battle (because the destroyed
    // creatures are removed).
    event CreatureDestroyed(uint256 indexed gameID, address player, uint8 cardIndex);

    // A player was defeated by an ennemy attack.
    event PlayerDefeated(uint256 indexed gameID, address indexed player);
}