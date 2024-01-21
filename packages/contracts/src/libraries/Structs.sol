// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

// Action that can be taken in the game.
enum GameStep {
    UNINITIALIZED,
    DRAW,
    PLAY,
    ATTACK,
    DEFEND,
    END_TURN,
    ENDED
}

// Per-player game data.
struct PlayerData {
    uint16 health;
    bool defeated;
    uint8 deckStart;
    uint8 deckEnd;
    uint8 handSize;
    uint8 deckSize;
    // The block number at which the player's joinGame transaction landed.
    // NOTE: Since this is only used at the start of the game, it could be packed into another
    //       uint256 value (e.g. battlefield).
    uint256 joinBlockNum;
    // Hash of a secret salt value that the players uses to generate the hand and deck roots.
    uint256 saltHash;
    // A hash of the content of the player's hand + the player's secret salt.
    bytes32 handRoot;
    // A hash of the content of the player's deck + the player's secret salt.
    bytes32 deckRoot;
    // Bitfield of cards in the player's battlefield, for each bit: 1 if the card at the same
    // index as the bit in `GameData.cards` is on the battlefield, 0 otherwise.
    uint256 battlefield;
    // Bitfield of cards in the player's graveyard (same thing as `battlefield`).
    uint256 graveyard;
    uint8[] attacking;
}

// All the data for a single game instance.
struct GameData {
    address gameCreator;
    mapping(address => PlayerData) playerData;
    address[] players;
    // Last block number at which the game data changed, updated in player actions via the
    // `step` modifier, as well as in createGame, joinGame, cancelGame and concedeGame.
    uint256 lastBlockNum;
    uint8 playersLeftToJoin;
    uint8[] livePlayers;
    function (uint256, address, uint8, bytes memory) external returns (bool) joinCheck;
    uint8 currentPlayer;
    GameStep currentStep;
    address attackingPlayer;
    // Array of playable cards in this game (NFT IDs) — concatenation of players' initial decks
    // used in this game.
    uint256[] cards;
}

// A read-friendly version of `GameData`, adding the gameID, flattening the player data into an
// arary, excluding the joinCheck predicate, as well as the cards array that never changes. Use
// `getCards()` to read them instead.
struct FetchedGameData {
    uint256 gameID;
    address gameCreator;
    address[] players;
    PlayerData[] playerData;
    uint256 lastBlockNum;
    uint256 publicRandomness;
    uint8 playersLeftToJoin;
    uint8[] livePlayers;
    uint8 currentPlayer;
    GameStep currentStep;
    address attackingPlayer;
    uint256[] cards;
}
