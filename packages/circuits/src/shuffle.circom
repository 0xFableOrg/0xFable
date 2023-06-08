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

template AtIndex(N) {
    signal input array[N];
    signal input index;
    signal output out;

    component isEqual[N];

    signal accumulator[N+1];
    accumulator[0] <== 0;
    for (var i = 0; i < N; i++) {
        // Check if i == index
        isEqual[i] = IsEqual(); 
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== index;
        accumulator[i+1] <== accumulator[i] + (isEqual[i].out * array[i]); 
    }

    out <== accumulator[N]; 
}

template FisherYates(deckSize, lastIndex) {
    signal input index;
    signal input deck[deckSize];
    signal output updatedDeck[deckSize];
    signal output selectedCard;

    component mux[deckSize];
    component isEqual[deckSize];

    // TODO: check index less than lastIndex

    for (var i = 0; i < lastIndex; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== index;
        mux[i] = DualMux();
        mux[i].in[0] <== deck[i];
        mux[i].in[1] <== deck[deckSize-1];
        mux[i].s <== isEqual[i].out;
        updatedDeck[i] <== mux[i].out[0];
    }

    for (var i = lastIndex; i < deckSize; i++) {
        updatedDeck[i] <== 255;
    }

    component select = AtIndex(deckSize);
    select.array <== deck;
    select.index <== index;
    selectedCard <== select.out;
}

// component main = FisherYates(64, 63);