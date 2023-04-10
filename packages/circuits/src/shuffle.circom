pragma circom 2.0.0;

include "./merkle.circom";

template Shuffle(levels) {

    signal input initialDeck[2**levels];
    signal input finalDeck[2**levels];
    signal input deckPredicate[2**levels];
    signal input deckRoot;

    var maxDeckSize = 2**levels;

    var deckSum;
    for (var i = 0; i < maxDeckSize; i++) {
        deckSum += initialDeck[i] * (maxDeckSize**i);
    }

    signal tempSum[2**levels]; // we need to use intermediate signal to prevent non quadratic error
    for (var i = 0; i < maxDeckSize; i++) {
        if (i == 0) {
            tempSum[i] <== finalDeck[i];
        } else {
            tempSum[i] <== tempSum[i-1] + (finalDeck[i] * deckPredicate[i]);
        }
    }

    // check that the deck is a permutation of the initial deck
    deckSum === tempSum[maxDeckSize-1];

    // check merkle root of the final deck
    component checkFinalDeck = CheckMerkleRoot(levels);
    checkFinalDeck.root <== deckRoot;
    checkFinalDeck.leaves <== finalDeck;
}