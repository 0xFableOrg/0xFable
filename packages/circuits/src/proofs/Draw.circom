pragma circom 2.0.0;

include "../lib/Card.circom";
include "../lib/BytePacking.circom";

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

template Draw(elementSize) {
    /// 21777 constraints

    // public inputs
    signal input deckRoot;
    signal input newDeckRoot;
    signal input handRoot;
    signal input newHandRoot;
    signal input saltHash;
    signal input publicRandom;
    signal input initialHandSize;
    signal input lastIndex;

    // private inputs
    signal input salt;
    signal input deck[elementSize];
    signal input hand[elementSize];
    signal input newDeck[elementSize];
    signal input newHand[elementSize];

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
    component checkDeck = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkDeck.ins[i] <== deck[i];
    }
    checkDeck.ins[elementSize] <== salt;
    checkDeck.k <== 0;
    checkDeck.outs[0] === deckRoot;

    // check the hand root matches the hand content before drawing
    component checkHand = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkHand.ins[i] <== hand[i];
    }
    checkHand.ins[elementSize] <== salt;
    checkHand.k <== 0;
    checkHand.outs[0] === handRoot;

    // unpack initial deck
    component unpackDeck = UnpackCards(elementSize);
    signal initialDeckInNum[elementSize*32];
    unpackDeck.packedCards <== deck;
    initialDeckInNum <== unpackDeck.unpackedCards;

    // unpack initial hand
    component unpackHand = UnpackCards(elementSize);
    signal initialHandInNum[elementSize*32];
    unpackHand.packedCards <== hand;
    initialHandInNum <== unpackHand.unpackedCards;

    component drawCard = RemoveCard(elementSize*32);

    // update deck and hand
    drawCard.lastIndex <== lastIndex;
    drawCard.randomness <== randomness.outs[0];
    drawCard.deck <== initialDeckInNum;
    // pack the updated deck into 256-bit elements
    component packDeck = PackCards(elementSize);
    packDeck.unpackedCards <== drawCard.updatedDeck;
    for (var i = 0; i < elementSize; i++) {
        newDeck[i] === packDeck.packedCards[i];
    }

    // add selected card to hand
    component updateHand = AddCard(elementSize*32);
    signal newHandInNum[elementSize*32];
    updateHand.index <== initialHandSize;
    updateHand.card <== drawCard.selectedCard;
    updateHand.deck <== initialDeckInNum;
    newHandInNum <== updateHand.updatedDeck;

    // pack the updated hand into 256-bit elements
    component packHand = PackCards(elementSize);
    packHand.unpackedCards <== newHandInNum;
    for (var i = 0; i < elementSize; i++) {
        newHand[i] === packHand.packedCards[i];
    }
    
    // check the deck root matches the deck content after drawing
    component checkNewDeck = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkNewDeck.ins[i] <== newDeck[i];
    }
    checkNewDeck.ins[elementSize] <== salt;
    checkNewDeck.k <== 0;
    checkNewDeck.outs[0] === newDeckRoot;

    // check the hand root matches the hand root after drawing
    component checkNewHand = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkNewHand.ins[i] <== newHand[i];
    }
    checkNewHand.ins[elementSize] <== salt;
    checkNewHand.k <== 0;
    checkNewHand.outs[0] === newHandRoot;
}