pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

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