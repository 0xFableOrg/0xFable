pragma circom 2.0.0;

include "./merkle.circom";
include "./draw.circom";

template Initial(levels, cardCount) {
    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels];
    signal input handRoot;
    signal input drawnCardIndices[cardCount];

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    var tailCardIndex = 2**levels - 1;
    var handCards[cardCount];
    var deckCards[2**levels];
    deckCards = deckLeaves;
    for (var i = 0; i < cardCount; i++) {
        handCards[i] = deckLeaves[drawnCardIndices[i]];
        deckCards[drawnCardIndices[i]] = deckCards[tailCardIndex];
        deckCards[tailCardIndex] = 255; // we use 255 as representation of null
        tailCardIndex--;
    }

    component checkNewDeck = CheckMerkleRoot(levels);
    checkNewDeck.root <== newDeckRoot;
    checkNewDeck.leaves <== deckCards;

    component checkHand = CheckMerkleRoot(levels);
    checkHand.root <== handRoot;
    checkHand.leaves <== handCards;
}

component main {public [deckRoot, newDeckRoot, deckLeaves, handRoot, drawnCardIndices]} = Initial(4, 2);