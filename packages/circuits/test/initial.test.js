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
        for (let i = 0; i < 16; i++) {
            deckLeaves.push(BigInt(i));
            handLeaves.push(BigInt(255));
        }
        deckRoot = getMerkleRoot(deckLeaves, mimcsponge);
    });

    // set longer timeout for test
    jest.setTimeout(15000);
    it("Should correctly construct a merkle tree root", async () => {
        // assume user draws 2 cards
        const drawnCardIndices = [BigInt(2), BigInt(5)];

        let newDeckLeaves = [...deckLeaves];
        // update deck leaves for 1st drawn card
        newDeckLeaves[2] = BigInt(15);
        newDeckLeaves[15] = BigInt(255);
        // update deck leaves for 2nd drawn card
        newDeckLeaves[5] = BigInt(14);
        newDeckLeaves[14] = BigInt(255);
        newDeckRoot = getMerkleRoot(newDeckLeaves, mimcsponge);

        let newHandLeaves = [...handLeaves];
        // update hand leaves for 1st drawn card
        newHandLeaves[0] = BigInt(2);
        // update hand leaves for 2nd drawn card
        newHandLeaves[1] = BigInt(5);
        newHandRoot = getMerkleRoot(newHandLeaves, mimcsponge);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot), 
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot), 
            deckLeaves: deckLeaves,
            initialDeckTailCardIndex: BigInt(15),
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