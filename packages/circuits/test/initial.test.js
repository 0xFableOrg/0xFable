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
        const drawnCardIndices = [BigInt(2), BigInt(4), BigInt(6), BigInt(8), BigInt(10), BigInt(12), BigInt(14)];
        const initialDeckTailCardIndex = BigInt(63); // 63 is the last card in the deck

        let newDeckLeaves = [...deckLeaves];
        // update deck leaves
        let currentTailCard = initialDeckTailCardIndex; 
        for (const index of drawnCardIndices) {
            newDeckLeaves[index] = currentTailCard;
            newDeckLeaves[currentTailCard] = BigInt(255);
            currentTailCard--;
        }
        newDeckRoot = getMerkleRoot(newDeckLeaves, mimcsponge);

        let newHandLeaves = [...handLeaves];
        // update hand leaves
        for (let i = 0; i < drawnCardIndices.length; i++) {
            newHandLeaves[i] = drawnCardIndices[i];
        }
        newHandRoot = getMerkleRoot(newHandLeaves, mimcsponge);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot), 
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot), 
            deckLeaves: deckLeaves,
            initialDeckTailCardIndex: initialDeckTailCardIndex,
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
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