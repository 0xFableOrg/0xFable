pragma circom 2.0.0;

include "../proofs/Play.circom";

// Max hand size is 16 (2**4) cards.
component main {public [handRoot, newHandRoot, playedCardLeaf]} = Play(4);