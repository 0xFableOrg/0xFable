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
    signal selectedIndex <-- candidateIndex % numCards;
    signal divisor <-- candidateIndex \ numCards;
    candidateIndex === divisor * numCards + selectedIndex;

    // Loop through the card List to get the last card (cardList[lastIndex])
    // So after the loop:
    //    `lastCardAccumulator[i] == 0` for all `i <= lastIndex`
    //    `lastCardAccumulator[i] == cardList[i]` for all `i > lastIndex`
    //     and we can read `cardList[lastIndex]` from `lastCardAccumulator[size]`

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

    // lastCard == cardList[lastIndex]
    signal lastCard <== lastCardAccumulator[size];

    // In the following loop, we:
    // - Use the same technique as above to select the card at `selectedIndex` (cardList[selectedIndex])
    // - Replace the selected card with the last card, and the last card with 255.

    // Used to select the card at `selectedIndex`.
    component isEqualToIndex[size];
    signal selectedCardAccumulator[size+1];
    selectedCardAccumulator[0] <== 0;

    // Used to output `cardList[lastIndex]` if `selectedIndex == i` else `cardList[i]`
    // Goal: replace selected card with last card in the list.
    component muxIndex[size];

    // Used to output `255` if `lastIndex == i` else `cardList[i]`
    // Goal: replace last card in the list with `255`.
    component muxLastIndex[size];

    // Successive version of the card list, with the selected card replaced by the last card in the
    // list, and the last card replaced by `255`, once there respective indexes have been iterated
    // over.
    signal intermediateCardList[size];

    for (var i = 0; i < size; i++) {

        // (isEqualToIndex[i].out == 1) <=> (selectedIndex == i)
        isEqualToIndex[i] = IsEqual();
        isEqualToIndex[i].in[0] <== i;
        isEqualToIndex[i].in[1] <== selectedIndex;

        // if selectedIndex == i, add cardList[i] to selectedCardAccumulator
        selectedCardAccumulator[i+1] <== selectedCardAccumulator[i] + (isEqualToIndex[i].out * cardList[i]);

        // muxIndex[i].out[0] == selectedIndex == i ? cardList[lastIndex] : cardList[i]
        muxIndex[i] = DualMux();
        muxIndex[i].in[0] <== cardList[i];
        muxIndex[i].in[1] <== lastCard;
        muxIndex[i].s <== isEqualToIndex[i].out;

        // intermediateCardList[i] = cardList[lastIndex]     if i == selectedIndex
        // intermediateCardList[i] = cardList[i]             otherwise
        intermediateCardList[i] <== muxIndex[i].out[0];

        // (isEqualToLastIndex[i].out == 1) <=> (lastIndex == i)
        // muxLastIndex[i].out[0] == lastIndex == i ? 255 : cardList[i]
        muxLastIndex[i] = DualMux();
        muxLastIndex[i].in[0] <== intermediateCardList[i];
        muxLastIndex[i].in[1] <== 255;
        muxLastIndex[i].s <== isEqualToLastIndex[i].out;

        // updatedCardList[i] = 255                        if i == lastIndex
        // updatedCardList[i] = intermediateCardList[i]    otherwise
        updatedCardList[i] <== muxLastIndex[i].out[0];
    }

    // lastCard == cardList[selectedIndex]
    selectedCard <== selectedCardAccumulator[size];
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
