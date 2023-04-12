pragma circom 2.0.0;

include "./merkle.circom";

/**** DOCUMENTATION ****

`levels` is the base-2 log of the max size of the deck (6 for a deck of max 64 cards)
`cardCount` is the amount of cards to draw
`deckRoot` is the root of the initial deck listing
`deckLeaves` are the cards in the initial deck listing (padded with 255 to reach a size of 2**levels)
`newDeckRoot` is the root of the deck after drawing the cards and unconstrained shuffling by the player
`newDeckLeaves` are the cards in the new deck (cf. newDeckRoot), padded with 255 to reach a size of 2**levels
`drawnCardIndices` is an array contain containing 1 if the corresponding index is to be drawn, zero otherwise.
`drawnPredicate[i]` contains
    if drawnCardIndices[i] == 0 : (2**levels) ** positionInHand
    if drawnCardIndices[i] == 1 : (2**levels) ** positionInNewDeck
    (positions start at 0)

This circuit maintains privacy because the users shuffles his deck after drawing the cards and does not reveal this new ordering.

*/

template Initial(levels, cardCount) {
    /// @dev levels do not include the top level root

    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels]; // private signal
    signal input newDeckLeaves[2**levels]; // private signal
    signal input newHandRoot;
    signal input newHandLeaves[2**levels]; // private signal
    signal input deckPredicate[2**levels];
    signal input drawnCardIndices[2**levels];

    var maxDeckSize = 2**levels;

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    var indicesSum = 0;
    var deckSum = 0;
    var handSum = 0;
    component mux[2**levels];
    signal tempDeckPredicateSum[2**levels]; // we need to use intermediate signals to prevent non quadratic error
    for (var i = 0; i < 2**levels; i++) {
        // check that indices can only take 0 or 1
        drawnCardIndices[i] * (1 - drawnCardIndices[i]) === 0;
        indicesSum += drawnCardIndices[i];

        mux[i] = DualMux();
        mux[i].in[0] <== deckLeaves[i] * deckPredicate[i];
        mux[i].in[1] <== 0;
        mux[i].s <== drawnCardIndices[i];
        deckSum += mux[i].out[0];
        handSum += mux[i].out[1];

        // sum the deck predicate
        tempDeckPredicateSum[i] <== i==0 ? deckPredicate[i] : tempDeckPredicateSum[i-1] + deckPredicate[i];
    }
    // check that number of drawn cards is correct
    cardCount === indicesSum;

    // check that the new deck contains the same cards as the old deck, minus those that were drawn
    var deckPredicateSum = 0;
    var newDeckSum = 0;
    for (var i = 0; i < 2**levels - cardCount; i++) {
        newDeckSum += newDeckLeaves[i] * (maxDeckSize**i);
        deckPredicateSum += (maxDeckSize**i);
    }
    deckSum === newDeckSum;
    // check that the remaining of the deck is null
    for (var i = 2**levels - cardCount; i < 2**levels; i++) {
        newDeckLeaves[i] === 255;
    }

    // check that the cards in the hand are those that were drawn
    var newHandSum = 0;
    for (var i = 0; i < cardCount; i++) {
        newHandSum += newHandLeaves[i] * (maxDeckSize**i);
        deckPredicateSum += (maxDeckSize**i);
    }
    handSum === newHandSum;
    // check that the remaining hand is null
    for (var i = cardCount; i < 2**levels; i++) {
        newHandLeaves[i] === 255;
    }

    // constraint the deck predicate sum
    deckPredicateSum === tempDeckPredicateSum[2**levels - 1];

    component checkNewDeck = CheckMerkleRoot(levels);
    checkNewDeck.root <== newDeckRoot;
    checkNewDeck.leaves <== newDeckLeaves;

    component checkNewHand = CheckMerkleRoot(levels);
    checkNewHand.root <== newHandRoot;
    checkNewHand.leaves <== newHandLeaves;
}
