pragma circom 2.0.0;

include "../lib/Merkle.circom";
include "./DrawHand.circom";

template Draw(levels) {
    /// @dev levels do not include the top level root
    /// 75 k constraints

    // public inputs
    signal input deckRoot;
    signal input newDeckRoot;
    signal input handRoot;
    signal input newHandRoot;
    signal input saltHash;
    signal input publicRandom;
    signal input initialHandSize;

    // private inputs
    signal input salt;
    signal input deck[2**levels];
    signal input hand[2**levels];
    signal input newDeck[2**levels];
    signal input newHand[2**levels];

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

    // check the deck root matches the deck content before drawing
    component checkDeck = MiMCSponge(2**levels+1, 220, 1);
    for (var i = 0; i < 2**levels; i++) {
        checkDeck.ins[i] <== deck[i];
    }
    checkDeck.ins[2**levels] <== salt;
    checkDeck.k <== 0;
    checkDeck.outs[0] === deckRoot;

    // check the hand root matches the hand content before drawing
    component checkHand = MiMCSponge(2**levels+1, 220, 1);
    for (var i = 0; i < 2**levels; i++) {
        checkHand.ins[i] <== hand[i];
    }
    checkHand.ins[2**levels] <== salt;
    checkHand.k <== 0;
    checkHand.outs[0] === handRoot;

    signal divisor;

    // NOTE: This is buggy.
    // This should use a new public signal giving the deck size, and be `deckSize - 1 - i`.
    // Unfortunately, doing so would break the circuit because we rely on lastIndex being a
    // compile-time constant. This is fixable, but requires to double the number of deck iterations
    // (need to add an extra iteration to pick out the current last card).
    var lastIndex = 2**levels - 1;
    component drawCard = RemoveIndex(levels, lastIndex + 1);

    // pick out a random card — we need to do the dance to prove the modulus
    drawCard.index <-- randomness.outs[0] % lastIndex;
    divisor <-- randomness.outs[0] \ lastIndex;
    randomness.outs[0] === divisor * lastIndex + drawCard.index;

    // update deck and hand
    drawCard.deck <== deck;
    newDeck === drawCard.updatedDeck;

    /// @dev I know the following code block (line 76-88) can be further optimized with RemoveIndex template to remove redundant looping
    /// @dev but it only introduces 500 extra constraints, so for the purpose of this comparison, I'll leave it for now
    component isEqual[2**levels];
    component mux[2**levels];
    for (var i = 0; i < 2**levels; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== i;
        isEqual[i].in[1] <== initialHandSize;
        mux[i] = DualMux();
        mux[i].in[0] <== hand[i];
        mux[i].in[1] <== drawCard.selectedCard;
        mux[i].s <== isEqual[i].out;
        newHand[i] === mux[i].out[0];
    }
    
    // check the deck root matches the deck content after drawing
    component checkNewDeck = MiMCSponge(2**levels+1, 220, 1);
    for (var i = 0; i < 2**levels; i++) {
        checkNewDeck.ins[i] <== newDeck[i];
    }
    checkNewDeck.ins[2**levels] <== salt;
    checkNewDeck.k <== 0;
    checkNewDeck.outs[0] === newDeckRoot;

    // check the hand root matches the hand root after drawing
    component checkNewHand = MiMCSponge(2**levels+1, 220, 1);
    for (var i = 0; i < 2**levels; i++) {
        checkNewHand.ins[i] <== newHand[i];
    }
    checkNewHand.ins[2**levels] <== salt;
    checkNewHand.k <== 0;
    checkNewHand.outs[0] === newHandRoot;
}