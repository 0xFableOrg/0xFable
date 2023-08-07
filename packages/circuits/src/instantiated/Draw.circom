pragma circom 2.0.0;

include "../proofs/Draw.circom";

// // Max 64 (2*32) cards in a deck and in a hand.
component main {public [deckRoot, newDeckRoot, handRoot, newHandRoot, saltHash, publicRandom, initialHandSize, lastIndex]} = Draw(2);