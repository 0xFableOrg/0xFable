pragma circom 2.0.0;

include "../proofs/Draw.circom";

// // Max 64 (2**6) cards in a deck.
component main {public [deckRoot, newDeckRoot, handRoot, newHandRoot, saltHash, publicRandom, initialHandSize]} = Draw(2);