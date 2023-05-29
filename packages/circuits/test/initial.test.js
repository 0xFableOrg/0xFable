const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Initial Hand Test", () => {
    let mimcsponge;
    let initialDeck = [];
    let deckLeaves = [], handLeaves = [];
    let deckRoot;
    let newDeckRoot, newHandRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < 64; i++) {
            initialDeck.push(BigInt(i));
            handLeaves.push(BigInt(255));
        }
        deckRoot = getMerkleRoot(initialDeck, mimcsponge);
    });

    // set longer timeout for test
    jest.setTimeout(25000);

    it("Should be able to shuffle a deck", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;

        let deckPredicate = []
        deckLeaves = [...initialDeck];
        for (let i = 0; i < maxDeckSize; i++) {
            deckPredicate.push(2**i);
        }

        // arbitrary shuffle
        // swap index 2 and 7
        deckLeaves[2] = initialDeck[7];
        deckLeaves[7] = initialDeck[2];
        let temp = deckPredicate[2];
        deckPredicate[2] = deckPredicate[7];
        deckPredicate[7] = temp;
        
        // swap index 4 and 14
        deckLeaves[4] = initialDeck[14];
        deckLeaves[14] = initialDeck[4];
        temp = deckPredicate[4];
        deckPredicate[4] = deckPredicate[14];
        deckPredicate[14] = temp;

        deckRoot = getMerkleRoot(deckLeaves, mimcsponge);

        // construct the circuit inputs
        const circuit = 'shuffle.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot),
            initialDeck: initialDeck,
            finalDeck: deckLeaves,
            deckPredicate: deckPredicate
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 

    it("Should correctly construct an initial hand proof", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;
        let drawnIndices = [2,4,6,8,10,12,14];

        // update hand leaves
        let newHandLeaves = [...handLeaves];
        for (let i = 0; i < drawnIndices.length; i++) {
            newHandLeaves[i] = deckLeaves[drawnIndices[i]];
        }
        newHandRoot = getMerkleRoot(newHandLeaves, mimcsponge);

        drawnIndices = new Set(drawnIndices);
        let drawnCardIndices = Array(64).fill(0);
        for (const index of drawnIndices) {
            drawnCardIndices[index] = 1;
        }
        let deckPredicate = []
        let deckCount = 0;
        let handCount = 0;
        for (let i = 0; i < 64; i++) {
            if (drawnIndices.has(i)) {
                // card is drawn
                deckPredicate.push(2**handCount);
                handCount++;
            } else {
                // card is not drawn
                deckPredicate.push(2**deckCount);
                deckCount++;
            }
        }

        // update deck leaves
        let newDeckLeaves = [...deckLeaves];
        for (const index of drawnIndices) {
            newDeckLeaves[index] = BigInt(255);
        }
        // reorder deck leaves
        newDeckLeaves = [
            ...newDeckLeaves.filter((num) => num != 255), // keep all non-255 numbers
            ...newDeckLeaves.filter((num) => num == 255), // move all 255 numbers to the end
        ];
        newDeckRoot = getMerkleRoot(newDeckLeaves, mimcsponge);

        // construct the circuit inputs
        const circuit = 'initial.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot), 
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot), 
            deckLeaves: deckLeaves,
            newDeckLeaves: newDeckLeaves,
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
            newHandLeaves: newHandLeaves,
            deckPredicate: deckPredicate,
            drawnCardIndices: drawnCardIndices
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