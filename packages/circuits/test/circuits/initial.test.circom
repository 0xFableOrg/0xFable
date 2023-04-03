pragma circom 2.0.0;

include "../../src/initial.circom";

component main {public [deckRoot, newDeckRoot, newHandRoot, deckPredicate, drawnCardIndices]} = Initial(6, 7);