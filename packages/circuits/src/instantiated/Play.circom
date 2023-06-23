pragma circom 2.0.0;

include "../proofs/Play.circom";

component main {public [handRoot, newHandRoot, saltHash, publicRandom, lastIndex, playedCardLeaf]} = Play(2);