pragma circom 2.0.0;

include "./merkle.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template CheckReplaceArray(n) {
    signal input index;
    signal input value;
    signal input array[n];
    signal output newArray[n];

    component checkIndex[n];
    component muxers[n];
    for (var i = 0; i < n; i++) {
        checkIndex[i] = IsEqual();
        checkIndex[i].in[0] <== i;
        checkIndex[i].in[1] <== index;
        newArray[i] <== (value - array[i]) * checkIndex[i].out + array[i];
        // newArray[i] <== (checkIndex[i].out * value) + ((1 - checkIndex[i].out) * array[i]);
    }
}

template Initial(levels, cardCount) {
    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels];
    signal input handRoot;
    signal input drawnCardIndices[cardCount];

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    component updateArray[2*cardCount];
    var tailCardIndex = 2**levels - 1;
    var tailCard = deckLeaves[tailCardIndex];
    for (var i = 0; i < 2*cardCount; i+=2) {
        // replace the drawn card with tail card
        updateArray[i] = CheckReplaceArray(2**levels);
        updateArray[i].index <== drawnCardIndices[i/2];
        updateArray[i].value <== tailCard;
        updateArray[i].array <== i == 0 ? deckLeaves : updateArray[i-1].newArray;

        // replace tail card with null
        updateArray[i+1] = CheckReplaceArray(2**levels);
        updateArray[i+1].index <== tailCardIndex;
        updateArray[i+1].value <== 255;
        updateArray[i+1].array <== updateArray[i].newArray;

        // update tail card and index
        tailCardIndex--;
        tailCard = updateArray[i+1].newArray[tailCardIndex];
    }

    // check updated deck
    component checkNewDeck = CheckMerkleRoot(levels);
    checkNewDeck.root <== newDeckRoot;
    checkNewDeck.leaves <== updateArray[2*cardCount-1].newArray;
}

component main {public [deckRoot, newDeckRoot, handRoot, drawnCardIndices]} = Initial(4, 2);