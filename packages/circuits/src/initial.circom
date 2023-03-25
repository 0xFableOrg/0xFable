pragma circom 2.0.0;

include "./merkle.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template CheckReplaceArray(n) {
    signal input index;
    signal input newValue;
    signal input array[n];
    signal output newArray[n];
    signal output replacedValue;

    component checkIndex[n];
    signal items[n];
    for (var i = 0; i < n; i++) {
        checkIndex[i] = IsEqual();
        checkIndex[i].in[0] <== i;
        checkIndex[i].in[1] <== index;
        newArray[i] <== (newValue - array[i]) * checkIndex[i].out + array[i];
        // newArray[i] <== (checkIndex[i].out * newValue) + ((1 - checkIndex[i].out) * array[i]);
        items[i] <== checkIndex[i].out * array[i];
    }

    // get the replaced value
    var temp = 0;
    for (var i = 0; i < n; i++) {
        temp += items[i];
    }
    replacedValue <== temp;
}

template Initial(levels, cardCount) {
    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels];
    signal input handRoot;
    signal input newHandRoot;
    signal input drawnCardIndices[cardCount];

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    // check initial hand is all null
    var handLeaves[2**levels];
    for (var i = 0; i < 2**levels; i++) {
        handLeaves[i] = 255;
    }
    component checkInitialHand = CheckMerkleRoot(levels);
    checkInitialHand.root <== handRoot;
    checkInitialHand.leaves <== handLeaves;

    component updateDeckArray[2*cardCount];
    component updateHandArray[cardCount];
    var tailCardIndex = 2**levels - 1;
    var tailCard = deckLeaves[tailCardIndex];
    for (var i = 0; i < 2*cardCount; i+=2) {
        // replace the drawn card with tail card
        updateDeckArray[i] = CheckReplaceArray(2**levels);
        updateDeckArray[i].index <== drawnCardIndices[i/2];
        updateDeckArray[i].newValue <== tailCard;
        updateDeckArray[i].array <== i == 0 ? deckLeaves : updateDeckArray[i-1].newArray;

        // replace tail card with null
        updateDeckArray[i+1] = CheckReplaceArray(2**levels);
        updateDeckArray[i+1].index <== tailCardIndex;
        updateDeckArray[i+1].newValue <== 255;
        updateDeckArray[i+1].array <== updateDeckArray[i].newArray;

        // update tail card and index
        tailCardIndex--;
        tailCard = updateDeckArray[i+1].newArray[tailCardIndex];

        // update hand
        updateHandArray[i/2] = CheckReplaceArray(2**levels);
        updateHandArray[i/2].index <== i/2;
        updateHandArray[i/2].newValue <== updateDeckArray[i].replacedValue;
        updateHandArray[i/2].array <== i == 0 ? handLeaves : updateHandArray[i/2-1].newArray;
    }

    // check updated deck
    component checkNewDeck = CheckMerkleRoot(levels);
    checkNewDeck.root <== newDeckRoot;
    checkNewDeck.leaves <== updateDeckArray[2*cardCount-1].newArray;

    // check updated hand
    component checkNewHand = CheckMerkleRoot(levels);
    checkNewHand.root <== newHandRoot;
    checkNewHand.leaves <== updateHandArray[cardCount-1].newArray;
}