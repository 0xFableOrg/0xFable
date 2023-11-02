pragma circom 2.0.0;

include "../lib/BytePacking.circom";
include "../lib/Card.circom";

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

/**
 * This circuit is responsible for proving that the player drew the correct initial hand of cards.
 *
 * Parameters:
 * - `elementSize` is the number of packed elements for deck and hand (each element can hold a uint256, where each card represented by a byte)
 * - `initialHandSize` is the number of cards to draw
 *
 * Public inputs:
 * - `initialDeck` are the cards in the initial deck listing (packed into 256-bit elements)
 * - `deckRoot` is the hash of the deck after drawing the cards, together with the salt
 * - `handRoot` is the hash of the hand the player drew, together with the salt
 * - `saltHash` is the hash of player's secret salt, acting as an on-chain commitment to that salt
 * - `publicRandom` is a public randomness value available on-chain
 *
 * Private inputs:
 * - `hand` are the cards drawn by the player (packed into 256-bit elements)
 * - `deck` are the cards in the deck after removing the drawn card (packed into 256-bit elements)
 *   (replacing them with cards from the back of the deck and shrinking the deck)
 * - `salt` is the player's secret salt
 *
 * 20785 Plonk constraints.
 */
template DrawHand(elementSize, initialHandSize) {

    // public inputs
    signal input initialDeck[elementSize];
    signal input lastIndex;
    signal input deckRoot;
    signal input handRoot;
    signal input saltHash;
    signal input publicRandom;

    // private inputs
    signal input salt;
    signal input deck[elementSize];
    signal input hand[elementSize];

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
    component unpackDeck = UnpackCards(elementSize);
    signal initialDeckInNum[elementSize*31];
    unpackDeck.packedCards <== initialDeck;
    initialDeckInNum <== unpackDeck.unpackedCards;

    component drawCards[initialHandSize];

    // This will contain the deck as one card is being drawn (swapped out for last card) at a time.
    signal intermediateDecks[initialHandSize+1][elementSize*31];
    signal drawnCards[elementSize*31];
    intermediateDecks[0] <== initialDeckInNum;

    for (var i = 0; i < initialHandSize; i++) {
        drawCards[i] = RemoveCard(elementSize*31);

        // update deck and hand
        drawCards[i].lastIndex <== lastIndex - i;
        drawCards[i].candidateIndex <== randomness.outs[0];
        drawCards[i].cardList <== intermediateDecks[i];
        intermediateDecks[i+1] <== drawCards[i].updatedCardList;
        drawnCards[i] <== drawCards[i].selectedCard;
    }

    // fill up drawnCards with 255 to reach a size of 2**levels
    for (var i = initialHandSize; i < elementSize*31; i++) {
        drawnCards[i] <== 255;
    }

    // pack the deck into 256-bit elements
    component packDeck = PackCards(elementSize);
    packDeck.unpackedCards <== intermediateDecks[initialHandSize];
    for (var i = 0; i < elementSize; i++) {
        deck[i] === packDeck.packedCards[i];
    }

    // pack the hand into 256-bit elements
    component packHand = PackCards(elementSize);
    packHand.unpackedCards <== drawnCards;
    for (var i = 0; i < elementSize; i++) {
        hand[i] === packHand.packedCards[i];
    }

    // check the deck root matches the deck content after drawing
    component checkNewDeck = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkNewDeck.ins[i] <== deck[i];
    }
    checkNewDeck.ins[elementSize] <== salt;
    checkNewDeck.k <== 0;
    checkNewDeck.outs[0] === deckRoot;

    // check the hand root matches the drawn cards
    component checkNewHand = MiMCSponge(elementSize+1, 220, 1);
    for (var i = 0; i < elementSize; i++) {
        checkNewHand.ins[i] <== hand[i];
    }
    checkNewHand.ins[elementSize] <== salt;
    checkNewHand.k <== 0;
    checkNewHand.outs[0] === handRoot;
}