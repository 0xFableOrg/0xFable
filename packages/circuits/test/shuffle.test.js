const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Shuffle Test", () => {
    const circuit = 'shuffle.test';
    let mimcsponge;
    let initialDeck = [], finalDeck = [];
    let deckRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves
        for (let i = 0; i < 64; i++) {
            initialDeck.push(BigInt(i));
        }
        finalDeck = [...initialDeck];
    });

    // set longer timeout for test
    jest.setTimeout(25000);
    it("Should be able to shuffle a deck", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;

        let deckPredicate = []
        for (let i = 0; i < maxDeckSize; i++) {
            deckPredicate.push(maxDeckSize ** i);
        }

        // arbitrary shuffle
        // swap index 2 and 7
        finalDeck[2] = initialDeck[7];
        finalDeck[7] = initialDeck[2];
        let temp = deckPredicate[2];
        deckPredicate[2] = deckPredicate[7];
        deckPredicate[7] = temp;
        
        // swap index 4 and 14
        finalDeck[4] = initialDeck[14];
        finalDeck[14] = initialDeck[4];
        temp = deckPredicate[4];
        deckPredicate[4] = deckPredicate[14];
        deckPredicate[14] = temp;

        deckRoot = getMerkleRoot(finalDeck, mimcsponge);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot),
            initialDeck: initialDeck,
            finalDeck: finalDeck,
            deckPredicate: deckPredicate
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})

function getMerkleRoot(arr, mimcsponge) {
    const levels = [[...arr]];
    
    // Compute the Merkle tree
    while (levels[0].length > 1) {
      const level = levels[0];
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        const hash = mimcsponge.multiHash([level[i], level[i+1]]);
        nextLevel.push(hash);
      }
      levels.unshift(nextLevel);
    }
  
    return levels[0][0];
}