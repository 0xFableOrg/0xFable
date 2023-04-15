pragma circom 2.0.0;

include "play.circom";

// Max hand size is 16 cards.
component main {public [handRoot, newHandRoot, playedCardLeaf]} = Play(4);