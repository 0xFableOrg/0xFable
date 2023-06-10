pragma circom 2.0.0;

include "./merkle.circom";
include "./shuffle.circom";
include "../node_modules/circomlib/circuits/comparators.circom";


/**** DOCUMENTATION ****

`levels` is the base-2 log of the max size of the deck (6 for a deck of max 64 cards)
`cardCount` is the amount of cards to draw
`deckRoot` is the root of the initial deck listing
`deckLeaves` are the cards in the initial deck listing (padded with 255 to reach a size of 2**levels)
`newDeckRoot` is the root of the deck after drawing the cards and unconstrained shuffling by the player
`newDeckLeaves` are the cards in the new deck (cf. newDeckRoot), padded with 255 to reach a size of 2**levels
`drawnCardIndices` is an array contain containing 1 if the corresponding index is to be drawn, zero otherwise.
`deckPredicate[i]` contains
    if drawnCardIndices[i] == 0 : 2 ** positionInHand
    if drawnCardIndices[i] == 1 : 2 ** positionInNewDeck
    (positions start at 0)

This circuit maintains privacy because the users shuffles his deck after drawing the cards and does not reveal this new ordering.

*/

template Initial(levels, cardCount) {
    /// @dev non linear constraints of around 240693
    /// @dev levels do not include the top level root

    signal input deckRoot;
    signal input newDeckRoot;
    signal input deckLeaves[2**levels]; // private signal
    signal input newDeckLeaves[2**levels]; // private signal
    signal input newHandRoot;
    signal input newHandLeaves[2**levels]; // private signal
    signal input privateSalt; // private input
    signal input committedSalt;
    signal input blockhash;

    // TODO: decide which hash function to use
    component checkSalt = Poseidon(1);
    checkSalt.inputs[0] <== privateSalt;
    committedSalt === checkSalt.out;

    component randomness = Poseidon(2);
    randomness.inputs[0] <== privateSalt;
    randomness.inputs[1] <== blockhash;

    component checkInitialDeck = CheckMerkleRoot(levels);
    checkInitialDeck.root <== deckRoot;
    checkInitialDeck.leaves <== deckLeaves;

    var initialLastIndex = 2**levels - 1;
    component drawCards[cardCount];
    signal tempDeckLeaves[cardCount+1][2**levels];
    signal selectedIndex[cardCount];
    signal divider[cardCount];
    tempDeckLeaves[0] <== deckLeaves;
    for (var i = 0; i < cardCount; i++) {
        var lastIndex = initialLastIndex - i;
        // select and constraint randomness
        selectedIndex[i] <-- randomness.out % lastIndex;
        divider[i] <-- randomness.out / lastIndex;
        lastIndex * divider[i] + selectedIndex[i] === randomness.out;
        // draw cards using fisher yates
        drawCards[i] = FisherYates(levels, lastIndex);
        drawCards[i].index <== selectedIndex[i];
        drawCards[i].deck <== tempDeckLeaves[i];
        tempDeckLeaves[i+1] <== drawCards[i].updatedDeck;
        newHandLeaves[i] === drawCards[i].selectedCard;
    }
    newDeckLeaves === tempDeckLeaves[cardCount];

    component checkNewDeck = CheckMerkleRoot(levels);
    checkNewDeck.root <== newDeckRoot;
    checkNewDeck.leaves <== newDeckLeaves;

    component checkNewHand = CheckMerkleRoot(levels);
    checkNewHand.root <== newHandRoot;
    checkNewHand.leaves <== newHandLeaves;
}
