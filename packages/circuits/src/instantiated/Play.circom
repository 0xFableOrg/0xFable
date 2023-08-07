pragma circom 2.0.0;

include "../proofs/Play.circom";

// Max 64 (2*32) cards in a hand.
component main {public [handRoot, newHandRoot, saltHash, publicRandom, lastIndex, playedCardLeaf]} = Play(2);