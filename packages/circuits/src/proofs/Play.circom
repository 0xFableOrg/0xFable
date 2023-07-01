pragma circom 2.0.0;

include "../lib/Card.circom";
include "../lib/BytePacking.circom";

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

template Play(elementSize) {
    /// 12594 constraints

    // public inputs
    signal input handRoot;
    signal input newHandRoot;
    signal input saltHash;
    signal input publicRandom;
    signal input lastIndex;
    signal input playedCardLeaf;

    // private inputs
    signal input salt;
    signal input hand[elementSize];
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

    // check the hand root matches the hand content before playing
    component checkHand = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkHand.ins[i] <== hand[i];
    }
    checkHand.ins[elementSize] <== salt;
    checkHand.k <== 0;
    checkHand.outs[0] === handRoot;

    // unpack initial hand
    component unpackHand = UnpackCards(elementSize);
    signal initialHandInNum[elementSize*31];
    unpackHand.packedCards <== hand;
    initialHandInNum <== unpackHand.unpackedCards;

    component playCard = RemoveCard(elementSize*31);

    // update hand
    playCard.lastIndex <== lastIndex;
    playCard.randomness <== randomness.outs[0];
    playCard.deck <== initialHandInNum;
    // constraint selected card
    playCard.selectedCard === playedCardLeaf;
    // pack the updated hand into 256-bit elements
    component packHand = PackCards(elementSize);
    packHand.unpackedCards <== playCard.updatedDeck;
    for (var i = 0; i < elementSize; i++) {
        newHand[i] === packHand.packedCards[i];
    }

    // check the hand root matches the hand root after drawing
    component checkNewHand = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkNewHand.ins[i] <== newHand[i];
    }
    checkNewHand.ins[elementSize] <== salt;
    checkNewHand.k <== 0;
    checkNewHand.outs[0] === newHandRoot;

}