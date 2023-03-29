const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Initial Hand Test", () => {
    const circuit = 'initial.test';
    let mimcsponge;
    let deckLeaves = [], handLeaves = [];
    let deckRoot;
    let newDeckRoot, newHandRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < 64; i++) {
            deckLeaves.push(BigInt(i));
            handLeaves.push(BigInt(255));
        }
        deckRoot = getMerkleRoot(deckLeaves, mimcsponge);
    });

    // set longer timeout for test
    jest.setTimeout(30000);
    it("Should correctly construct a merkle tree root", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;
        const drawnIndices = new Set([2, 4, 6, 8, 10, 12, 14]);
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
                deckPredicate.push(maxDeckSize ** handCount);
                handCount++;
            } else {
                // card is not drawn
                deckPredicate.push(maxDeckSize ** deckCount);
                deckCount++;
            }
        }

        let newDeckLeaves = [...deckLeaves];
        // update deck leaves
        for (const index of drawnIndices) {
            newDeckLeaves[index] = BigInt(255);
        }
        // reorder deck leaves
        newDeckLeaves = [
            ...newDeckLeaves.filter((num) => num != 255), // keep all non-255 numbers
            ...newDeckLeaves.filter((num) => num == 255), // move all 255 numbers to the end
        ];
        console.log("new deck leaves: ", newDeckLeaves);
        newDeckRoot = getMerkleRoot(newDeckLeaves, mimcsponge);

        // let newHandLeaves = [...handLeaves];
        // // update hand leaves
        // for (let i = 0; i < drawnCardIndices.length; i++) {
        //     newHandLeaves[i] = drawnCardIndices[i];
        // }
        // newHandRoot = getMerkleRoot(newHandLeaves, mimcsponge);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot), 
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot), 
            deckLeaves: deckLeaves,
            newDeckLeaves: newDeckLeaves,
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