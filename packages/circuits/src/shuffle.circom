pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkle.circom";

template Shuffle(levels) {

    signal input initialDeck[2**levels];
    signal input finalDeck[2**levels];
    signal input deckPredicate[2**levels];
    signal input deckRoot;

    var maxDeckSize = 2**levels;

    var deckSum;
    var deckPredicateSum;
    for (var i = 0; i < maxDeckSize; i++) {
        deckSum += initialDeck[i] * (2**i);
        deckPredicateSum += (2**i);
    }

    // we need to use intermediate signals to prevent non quadratic error
    signal tempSum[2**levels];
    signal tempDeckPredicateSum[2**levels]; 
    for (var i = 0; i < maxDeckSize; i++) {
        if (i == 0) {
            tempSum[i] <== finalDeck[i];
            tempDeckPredicateSum[i] <== deckPredicate[i];
        } else {
            tempSum[i] <== tempSum[i-1] + (finalDeck[i] * deckPredicate[i]);
            tempDeckPredicateSum[i] <== tempDeckPredicateSum[i-1] + deckPredicate[i];
        }
    }

    // check that the deck is a permutation of the initial deck
    deckSum === tempSum[maxDeckSize-1];

    // constraint the deck predicate sum
    deckPredicateSum === tempDeckPredicateSum[maxDeckSize-1];

    // check merkle root of the final deck
    component checkFinalDeck = CheckMerkleRoot(levels);
    checkFinalDeck.root <== deckRoot;
    checkFinalDeck.leaves <== finalDeck;
}

template FisherYates(levels, lastIndex) {
    signal input index;
    signal input deck[2**levels];
    signal output updatedDeck[2**levels];
    signal output selectedCard;

    component mux[2**levels];
    component isEqual[2**levels];

    // safety constraint to check index less than lastIndex
    component checkIndex = LessThan(levels);
    checkIndex.in[0] <== index;
    checkIndex.in[1] <== lastIndex;
    checkIndex.out === 1;

    signal accumulator[lastIndex+1]; // accumulator is used to calculate selected card
    accumulator[0] <== 0;
    for (var i = 0; i < lastIndex; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== index;
        accumulator[i+1] <== accumulator[i] + (isEqual[i].out * deck[i]); 
        // if index == i, then we swap the card at i with the card at lastIndex
        mux[i] = DualMux();
        mux[i].in[0] <== deck[i];
        mux[i].in[1] <== deck[2**levels-1];
        mux[i].s <== isEqual[i].out;
        updatedDeck[i] <== mux[i].out[0];
    }

    // fill up remaining indices with 255 (null)
    for (var i = lastIndex; i < 2**levels; i++) {
        updatedDeck[i] <== 255;
    }

    selectedCard <==accumulator[lastIndex];
}

// component main = FisherYates(64, 63);
component main { public[deckRoot] } = Shuffle(6);