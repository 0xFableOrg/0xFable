// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

library Errors {
    // The game doesn't exist or has already ended.
    error NoGameNoLife();

    // The game hasn't started yet (at least one player hasn't joined or drawn his initial hand).
    error FalseStart();

    // Trying to take an action when it's not your turn.
    error WrongPlayer();

    // Player is trying to take a game action but hasn't drawn his initial hand yet.
    error PlayerHasntDrawn();

    // Trying to take a game action that is not allowed right now.
    error WrongStep();

    // Trying to start a game with fewer than 2 people.
    error YoullNeverPlayAlone();

    // Trying to create a game while already being in one.
    error OvereagerCreator();

    // Game creators didn't supply the same number of decks than the number of players.
    error WrongNumberOfDecks();

    // Trying to join or decline a game that you already joined.
    error AlreadyJoined();

    // Trying to draw an initial hand again.
    error AlreadyDrew();

    // Trying to cancel a game you didn't create.
    error OvereagerCanceller();

    // Trying to join a full game (total number of players reached).
    error GameIsFull();

    // Trying to cancel or join a game where all the players have already joined.
    // (We don't use the term "started", which we reserve for when all players have drawn their
    // initial hand.)
    error GameAlreadyLocked();

    // Trying to do actions in a game that has already ended.
    error GameAlreadyEnded();

    // ZK proof didn't verify.
    error WrongProof();

    // Attempt to join game was rejected by the join check.
    error NotAllowedToJoin();

    // Trying to concede a game that you are not participating in.
    error PlayerNotInGame();

    // Trying to play a card whose index is invalid (bigger than card array size).
    error CardIndexTooHigh();

    // Trying to attack a player whose index is out of range, or trying to attack oneself.
    error WrongAttackTarget();

    // Signals that an attacker was specified that is not on the player's battlefield.
    error AttackerNotOnBattlefield();

    // Mismatch between the number of specified attackers and defenders.
    error AttackerDefenderMismatch();

    // Specifiying the same attacking creature multiple time.
    error DuplicateAttacker();

    // Specifiying the same defending creature multiple time.
    error DuplicateDefender();

    // Specifying a defender with an index bigger than the number of creatures on the battlefield.
    error DefenderIndexTooHigh(uint8 index);

    // Specifying an attacker with an index bigger than the number of attacking creatures.
    error AttackerIndexTooHigh(uint8 index);

    // Signals that a defender was specified that is not on the player's battlefield.
    error DefenderNotOnBattlefield();

    // Trying to defend with an attacker (on the battlefield at the given index).
    error DefenderAttacking(uint8 index);

    // ZK proof generated is incorrect
    error InvalidProof();

    // Trying to boot a timed out player when the timeout hasn't elapsed yet.
    error GameNotTimedOut();

    // Should only revert with this error if the implementation is erroneous.
    error ImplementationError();
}
