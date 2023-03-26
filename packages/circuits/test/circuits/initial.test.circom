pragma circom 2.0.0;

include "../../src/initial.circom";

component main {public [deckRoot, newDeckRoot, initialDeckTailCardIndex, handRoot, newHandRoot, drawnCardIndices]} = Initial(4, 2);