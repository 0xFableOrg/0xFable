pragma circom 2.0.0;

include "../proofs/DrawHand.circom";

// Max 64 (2*32) cards in a deck and in a hand, draw 7 cards.
component main {public [initialDeck, deckRoot, handRoot, saltHash, publicRandom, lastIndex]} = DrawHand(2, 7);