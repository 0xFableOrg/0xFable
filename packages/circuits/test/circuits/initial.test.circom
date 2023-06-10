pragma circom 2.0.0;

include "../../src/initial.circom";

component main {public [deckRoot, newDeckRoot, newHandRoot, committedSalt, blockhash]} = Initial(6, 7);