pragma circom 2.0.0;

include "./merkle.circom";

template Initial(levels, cardCount) {
    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels];
    signal input newDeckLeaves[2**levels];
    signal input newHandRoot;
    signal input newHandLeaves[2**levels];
    signal input deckPredicate[2**levels]; // (maxDeckSize ** sum of prefix bits)
    signal input drawnCardIndices[2**levels];

    var maxDeckSize = 2**levels;

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    // set initial hand
    var handLeaves[2**levels];
    for (var i = 0; i < 2**levels; i++) {
        handLeaves[i] = 255;
    }

    var indicesSum = 0;
    var deckSum = 0;
    var handSum = 0;
    component mux[2**levels];
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
    }
    // check that number of drawn cards is correct
    cardCount === indicesSum;

    var newDeckSum = 0;
    // check that the cards in th new deck is correct
    for (var i = 0; i < 2**levels - cardCount; i++) {
        newDeckSum += newDeckLeaves[i] * (maxDeckSize**i);
    }
    deckSum === newDeckSum;
    // check that the remaining deck is null
    for (var i = 2**levels - cardCount; i < 2**levels; i++) {
        newDeckLeaves[i] === 255;
    }

    var newHandSum = 0;
    // check that the cards in the hand is correct
    for (var i = 0; i < cardCount; i++) {
        newHandSum += newHandLeaves[i] * (maxDeckSize**i);
    }
    handSum === newHandSum;
    // check that the remaining hand is null
    for (var i = cardCount; i < 2**levels; i++) {
        newHandLeaves[i] === 255;
    }
}
