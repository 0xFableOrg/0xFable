pragma circom 2.0.0;

include "../../src/proofs/Draw.circom";

component main {public [deckRoot, newDeckRoot, handRoot, newHandRoot, saltHash, publicRandom, initialHandSize, lastIndex]} = Draw(2);