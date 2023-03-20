pragma circom 2.0.0;

include "../../src/draw.circom";

component main {public [deckRoot, newDeckRoot, handRoot, newHandRoot]} = Draw(2);