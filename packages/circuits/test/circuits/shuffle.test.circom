pragma circom 2.0.0;

include "../../src/shuffle.circom";

component main { public [initialDeck, deckRoot] } = Shuffle(6);