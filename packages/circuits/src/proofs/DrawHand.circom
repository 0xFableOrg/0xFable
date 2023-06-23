pragma circom 2.0.0;

include "../lib/Merkle.circom";

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mimcsponge.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/**
 * This circuit is responsible for proving that the player drew the correct initial hand of cards.
 *
 * Parameters:
 * - `levels` is the base-2 log of the max size of the deck (6 for a deck of max 64 cards)
 * - `initialHandSize` is the amount of cards to draw
 *
 * Public inputs:
 * - `initialDeck` are the cards in the initial deck listing (padded with 255 to reach a size of 2**levels)
 * - `deckRoot` is the Merkle root of the deck after drawing the cards
 * - `handRoot` is the Merkleroot of the hand the player drew
 * - `saltHash` is the hash of player's secret salt, acting as an on-chain commitment to that salt
 * - `publicRandom` is a public randomness value available on-chain
 *
 * Private inputs:
 * - `hand` are the cards drawn by the player
 * - `deck` are the cards in the deck after removing the drawn card
 *   (replacing them with cards from the back of the deck and shrinking the deck)
 * - `salt` is the player's secret salt
 *
 * About 222k Plonk constraints.
 */
template DrawHand(levels, initialHandSize) {

    // public inputs
    signal input initialDeck[2];
    signal input deckRoot;
    signal input handRoot;
    signal input saltHash;
    signal input publicRandom;

    // private inputs
    signal input salt;
    signal input deck[2];
    signal input hand[2];

    // verify the private salt matches the public salt hash
    component checkSalt = MiMCSponge(1, 220, 1);
    checkSalt.ins[0] <== salt;
    checkSalt.k <== 0;
    saltHash === checkSalt.outs[0];

    // compute randomness from private salt and public randomness (publicRandom)
    component randomness = MiMCSponge(2, 220, 1);
    randomness.ins[0] <== salt;
    randomness.ins[1] <== publicRandom;
    randomness.k <== 0;

    // unpack initial deck
    component unpackInitialDeck[2];
    component convertToNum[64];
    signal initialDeckInBits[512]; // 64 cards * 8 bits per card
    signal initialDeckInNum[64];
    for (var i = 0; i < 2; i++) {
        unpackInitialDeck[i] = Num2Bits(256);
        unpackInitialDeck[i].in <== initialDeck[i];
        for (var j = 0; j < 256; j++) {
            initialDeckInBits[j + i*256] <== unpackInitialDeck[i].out[j];
        }
    }

    for (var i = 0; i < 64; i++) {
        convertToNum[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            convertToNum[i].in[j] <== initialDeckInBits[j + i*8];
        }
        initialDeckInNum[i] <== convertToNum[i].out;
    }

    component drawCards[initialHandSize];
    signal divisors[initialHandSize];

    // This will contain the deck as one card is being drawn (swapped out for last card) at a time.
    signal intermediateDecks[initialHandSize+1][2**levels];
    intermediateDecks[0] <== initialDeckInNum;

    for (var i = 0; i < initialHandSize; i++) {

        // NOTE: This is buggy.
        // This should use a new public signal giving the deck size, and be `deckSize - 1 - i`.
        // Unfortunately, doing so would break the circuit because we rely on lastIndex being a
        // compile-time constant. This is fixable, but requires to double the number of deck iterations
        // (need to add an extra iteration to pick out the current last card).
        var lastIndex = 2**levels - 1 - i;

        drawCards[i] = RemoveIndex(levels, lastIndex + 1);

        // pick out a random card — we need to do the dance to prove the modulus
        drawCards[i].index <-- randomness.outs[0] % lastIndex;
        divisors[i] <-- randomness.outs[0] \ lastIndex;
        randomness.outs[0] === divisors[i] * lastIndex + drawCards[i].index;

        // update deck and hand
        drawCards[i].deck <== intermediateDecks[i];
        intermediateDecks[i+1] <== drawCards[i].updatedDeck;
        // hand[i] === drawCards[i].selectedCard;
    }

    // unpack intermidiateDEcks[initialHandSize]
    component repackInitialDeck[2];
    component convertToBits[64];
    signal newDeckInBits[512]; // 64 cards * 8 bits per card
    signal newDeckInNum[64];
    for (var i = 0; i < 64; i++) {
        convertToBits[i] = Num2Bits(8);
        convertToBits[i].in <== intermediateDecks[initialHandSize][i];
        for (var j = 0; j < 8; j++) {
            newDeckInBits[j + i*8] <== convertToBits[i].out[j];
        }
    }
    for (var i = 0; i < 2; i++) {
        repackInitialDeck[i] = Bits2Num(256);
        for (var j = 0; j < 256; j++) {
            repackInitialDeck[i].in[j] <== newDeckInBits[j + i*256];
        }
        deck[i] === repackInitialDeck[i].out;
    }

    // check the deck root matches the deck content after drawing
    component checkNewDeck = MiMCSponge(3, 220, 1);
    for (var i = 0; i < 2; i++) {
        checkNewDeck.ins[i] <== deck[i];
    }
    checkNewDeck.ins[2] <== salt;
    checkNewDeck.k <== 0;
    checkNewDeck.outs[0] === deckRoot;

    // check the hand root matches the drawn cards
    component checkNewHand = MiMCSponge(3, 220, 1);
    for (var i = 0; i < 2; i++) {
        checkNewHand.ins[i] <== hand[i];
    }
    checkNewHand.ins[2] <== salt;
    checkNewHand.k <== 0;
    checkNewHand.outs[0] === handRoot;
}

/**
 * Given a deck of size `size` (rounded up to capacity `2**levels` by adding 255 as a filler
 * element), and an index (`index`), returns the card at the index (`selectedCard`) and a copy of
 * the deck (`updatedDeck`), such that:
 *
 * - `updatedDeck[index] = deck[size - 1]`
 * - `updatedDeck[size - 1] = 255`
 * - `updatedDeck[i] = deck[i]` for all other indexes
 */
template RemoveIndex(levels, size) {
    assert(size <= 2**levels);

    var capacity = 2**levels;
    var lastIndex = size - 1;

    signal input index;
    signal input deck[capacity];
    signal output selectedCard;
    signal output updatedDeck[capacity];

    // Calling RemoveIndex from DrawHand ensures that this is always true, but otherwise, it would
    // be necessary to verify this.

    // // check index < lastIndex
    // component checkIndex = LessThan(levels);
    // checkIndex.in[0] <== index;
    // checkIndex.in[1] <== size;
    // checkIndex.out === 1;

    component mux[capacity];
    component isEqual[capacity];

    // deck[i] will get added to `accumulator` once, and nothing else will get added.
    // So after the loop:
    //    `accumulator[i] == 0` for all `i <= index`
    //    `accumulator[i] == deck[i]` for all `i > index`
    //     and we can read `deck[i]` from `accumulator[size]`

    signal accumulator[size+1];
    accumulator[0] <== 0;

    for (var i = 0; i < size; i++) {

        // (isEqual[i].out == 1) <=> (index == i)
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== index;

        // if index == i, add deck[i] to accumulator
        accumulator[i+1] <== accumulator[i] + (isEqual[i].out * deck[i]);

        // mux[i].out[0] == index == i ? deck[lastIndex] : deck[i]
        mux[i] = DualMux();
        mux[i].in[0] <== deck[i];
        mux[i].in[1] <== deck[lastIndex];
        mux[i].s <== isEqual[i].out;

        // updatedDeck[i] = deck[lastIndex]     if i == index
        // updatedDeck[i] = 255                 if i == lastIndex
        // updatedDeck[i] = deck[i]             otherwise
        updatedDeck[i] <== (i == lastIndex) ? 255: mux[i].out[0];
    }

    // fill up remaining indices with 255 (null)
    for (var i = size; i < capacity; i++)
        updatedDeck[i] <== 255;

    selectedCard <== accumulator[size];
}