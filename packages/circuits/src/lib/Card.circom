pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

/**
 * Given
 *
 * 1. `cardList`, a list of cards of size `size` whose `lastIndex + 1` first elements are not 255
 *    (denoting absence of cards) and whose remaining elements are 255
 * 2. a candidate index (`candidateIndex`), taken modulo `lastIndex + 1` to obtain the actual index
 *
 * returns the card at the index as `selectedCard` and a copy of the list as `updatedCardList`, such
 * that:
 *
 * - `index == candidateIndex % (lastIndex + 1)`
 * - `updatedCardList[index] = deck[size - 1]`
 * - `updatedCardList[size - 1] = 255`
 * - `updatedCardList[i] = deck[i]` for all other indexes
 */
template RemoveCard(size) {

    signal input lastIndex;
    signal input candidateIndex;
    signal input cardList[size];
    signal output selectedCard;
    signal output updatedCardList[size];

    // pick out a random card — we need to do the dance to prove the modulus
    signal numCards <-- lastIndex + 1;
    signal index <-- candidateIndex % numCards;
    signal divisor <-- candidateIndex \ numCards;
    candidateIndex === divisor * numCards + index;

    // loop through the card List to get the last card
    component isEqualToLastIndex[size];
    signal lastCardAccumulator[size+1];
    lastCardAccumulator[0] <== 0;
    for (var i = 0; i < size; i++) {
        // (isEqualToLastIndex[i].out == 1) <=> (lastIndex == i)
        isEqualToLastIndex[i] = IsEqual();
        isEqualToLastIndex[i].in[0] <== i;
        isEqualToLastIndex[i].in[1] <== lastIndex;

        // if lastIndex == i, add cardList[i] to accumulator
        lastCardAccumulator[i+1] <== lastCardAccumulator[i] + (isEqualToLastIndex[i].out * cardList[i]);
    }
    signal lastCard <== lastCardAccumulator[size];

    // cardList[i] will get added to `accumulator` once, and nothing else will get added.
    // So after the loop:
    //    `accumulator[i] == 0` for all `i <= index`
    //    `accumulator[i] == cardList[i]` for all `i > index`
    //     and we can read `cardList[i]` from `accumulator[size]`
    component muxIndex[size];
    component muxLastIndex[size];
    component isEqualToIndex[size];
    signal accumulator[size+1];
    signal intermediateCardList[size];
    accumulator[0] <== 0;

    for (var i = 0; i < size; i++) {

        // (isEqualToIndex[i].out == 1) <=> (index == i)
        isEqualToIndex[i] = IsEqual();
        isEqualToIndex[i].in[0] <== i;
        isEqualToIndex[i].in[1] <== index;

        // if index == i, add cardList[i] to accumulator
        accumulator[i+1] <== accumulator[i] + (isEqualToIndex[i].out * cardList[i]);

        // muxIndex[i].out[0] == index == i ? cardList[lastIndex] : cardList[i]
        muxIndex[i] = DualMux();
        muxIndex[i].in[0] <== cardList[i];
        muxIndex[i].in[1] <== lastCard;
        muxIndex[i].s <== isEqualToIndex[i].out;

        // intermediateCardList[i] = cardList[lastIndex]     if i == index
        // intermediateCardList[i] = cardList[i]             otherwise
        intermediateCardList[i] <== muxIndex[i].out[0];

        // (isEqualToLastIndex[i].out == 1) <=> (lastIndex == i)
        // muxLastIndex[i].out[0] == lastIndex == i ? de : cardList[i]
        muxLastIndex[i] = DualMux();
        muxLastIndex[i].in[0] <== intermediateCardList[i];
        muxLastIndex[i].in[1] <== 255;
        muxLastIndex[i].s <== isEqualToLastIndex[i].out;

        // updatedCardList[i] = 255                        if i == lastIndex
        // updatedCardList[i] = intermediateCardList[i]    otherwise
        updatedCardList[i] <== muxLastIndex[i].out[0];
    }

    selectedCard <== accumulator[size];
}

template AddCard(size) {

    signal input index;
    signal input card;
    signal input deck[size];
    signal output updatedDeck[size];

    component isEqual[size];
    component mux[size];
    signal newHandInNum[size];
    for (var i = 0; i < size; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== index;
        mux[i] = DualMux();
        mux[i].in[0] <== deck[i];
        mux[i].in[1] <== card;
        mux[i].s <== isEqual[i].out;
        updatedDeck[i] <== mux[i].out[0];
    }

}
