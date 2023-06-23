pragma circom 2.0.0;

include "./Merkle.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/**
 * Given a deck of size `size` and an index (`index`), returns the card at the index (`selectedCard`) 
 * and a copy of the deck (`updatedDeck`), such that:
 *
 * - `updatedDeck[index] = deck[size - 1]`
 * - `updatedDeck[size - 1] = 255`
 * - `updatedDeck[i] = deck[i]` for all other indexes
 */
template RemoveCard(size) {

    signal input lastIndex;
    signal input randomness;
    signal input deck[size];
    signal output selectedCard;
    signal output updatedDeck[size];

    // pick out a random card — we need to do the dance to prove the modulus
    signal index;
    signal divisor;
    index <-- randomness % lastIndex;
    divisor <-- randomness \ lastIndex;
    randomness === divisor * lastIndex + index;

    // loop through the deck to get the last card
    component isEqualToLastIndex[size];
    signal lastCardAccumulator[size+1];
    lastCardAccumulator[0] <== 0;
    for (var i = 0; i < size; i++) {
        // (isEqualToLastIndex[i].out == 1) <=> (lastIndex == i)
        isEqualToLastIndex[i] = IsEqual();
        isEqualToLastIndex[i].in[0] <== i;
        isEqualToLastIndex[i].in[1] <== lastIndex;

        // if lastIndex == i, add deck[i] to accumulator
        lastCardAccumulator[i+1] <== lastCardAccumulator[i] + (isEqualToLastIndex[i].out * deck[i]);
    }
    signal lastCard <== lastCardAccumulator[size];

    // deck[i] will get added to `accumulator` once, and nothing else will get added.
    // So after the loop:
    //    `accumulator[i] == 0` for all `i <= index`
    //    `accumulator[i] == deck[i]` for all `i > index`
    //     and we can read `deck[i]` from `accumulator[size]`
    component muxIndex[size];
    component muxLastIndex[size];
    component isEqualToIndex[size];
    signal accumulator[size+1];
    signal intermediateDeck[size];
    accumulator[0] <== 0;

    for (var i = 0; i < size; i++) {

        // (isEqualToIndex[i].out == 1) <=> (index == i)
        isEqualToIndex[i] = IsEqual();
        isEqualToIndex[i].in[0] <== i;
        isEqualToIndex[i].in[1] <== index;

        // if index == i, add deck[i] to accumulator
        accumulator[i+1] <== accumulator[i] + (isEqualToIndex[i].out * deck[i]);

        // muxIndex[i].out[0] == index == i ? deck[lastIndex] : deck[i]
        muxIndex[i] = DualMux();
        muxIndex[i].in[0] <== deck[i];
        muxIndex[i].in[1] <== lastCard;
        muxIndex[i].s <== isEqualToIndex[i].out;

        // intermediateDeck[i] = deck[lastIndex]     if i == index
        // intermediateDeck[i] = deck[i]             otherwise
        intermediateDeck[i] <== muxIndex[i].out[0];

        // (isEqualToLastIndex[i].out == 1) <=> (lastIndex == i)
        // muxLastIndex[i].out[0] == lastIndex == i ? de : deck[i]
        muxLastIndex[i] = DualMux();
        muxLastIndex[i].in[0] <== intermediateDeck[i];
        muxLastIndex[i].in[1] <== 255;
        muxLastIndex[i].s <== isEqualToLastIndex[i].out;

        // updatedDeck[i] = 255                    if i == lastIndex
        // updatedDeck[i] = intermediateDeck[i]    otherwise
        updatedDeck[i] <== muxLastIndex[i].out[0];
    }
}
