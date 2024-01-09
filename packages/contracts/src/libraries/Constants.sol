// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Constants {
    uint8 internal constant INITIAL_HAND_SIZE = 7;

    uint16 internal constant STARTING_HEALTH = 20;

    // Marks the absence of index inside an index array.
    uint8 internal constant NONE = 255;

    // Max number of decks that each player can have.
    uint256 internal constant MAX_DECKS = 256;

    // Min number of cards in a deck.
    uint256 internal constant MIN_DECK_SIZE = 10;

    // Max number of cards in a deck.
    uint256 internal constant MAX_DECK_SIZE = 62;

    // Max card copies in a deck.
    uint256 private constant MAX_CARD_COPY = 3;

    // The prime that bounds the field used by our proof scheme of choice.
    // Currently, this is for Plonk.
    uint256 internal constant PROOF_CURVE_ORDER =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
}