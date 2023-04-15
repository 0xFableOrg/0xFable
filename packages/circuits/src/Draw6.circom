pragma circom 2.0.0;

include "draw.circom";

// Handles max 64 cards in a deck.
component main {public [deckRoot, newDeckRoot, handRoot, newHandRoot]} = Draw(6);