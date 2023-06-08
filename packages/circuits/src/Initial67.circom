pragma circom 2.0.0;

include "initial.circom";

// Max 64 cards in a deck, draw 7 cards.
component main {public [deckRoot, newDeckRoot, newHandRoot, committedSalt, blockhash]} = Initial(6, 7);