pragma circom 2.0.0;

include "../../src/proofs/DrawHand.circom";

component main {public [initialDeck, deckRoot, handRoot, saltHash, publicRandom, lastIndex]} = DrawHand(2, 7);