pragma circom 2.0.0;

include "../../src/proofs/Play.circom";

component main {public [handRoot, newHandRoot, playedCardLeaf]} = Play(2);