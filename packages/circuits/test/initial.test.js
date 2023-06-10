const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Initial Hand Test", () => {
    let mimcsponge;
    let poseidon;
    let privateSalt = BigInt(1234); // random private salt
    let blockhash = BigInt(5678); // block hash from smart contract
    let deckLeaves = [], handLeaves = [];
    let deckRoot;
    let newDeckRoot, newHandRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();
        poseidon = await circomlib.buildPoseidon();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < 64; i++) {
            deckLeaves.push(BigInt(i));
            handLeaves.push(BigInt(255));
        }
        deckRoot = getMerkleRoot(deckLeaves, mimcsponge);
    });

    // set longer timeout for test
    jest.setTimeout(25000);

    it("Should correctly construct an initial hand proof", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;
        const cardCount = 7;

        // draw cards
        let newDeckLeaves = [...deckLeaves];
        let newHandLeaves = [...handLeaves];
        const randomness = poseidon.F.toObject(poseidon([privateSalt, blockhash]));
        let lastIndex = maxDeckSize - 1;
        let drawnIndex;
        for (let i = 0; i < cardCount; i++) {
            drawnIndex = randomness % BigInt(lastIndex);
            newHandLeaves[i] = newDeckLeaves[drawnIndex];
            newDeckLeaves[drawnIndex] = newDeckLeaves[lastIndex];
            newDeckLeaves[lastIndex] = BigInt(255);
            lastIndex--;
        }

        // construct merkle root        
        newHandRoot = getMerkleRoot(newHandLeaves, mimcsponge);
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
            privateSalt: privateSalt,
            committedSalt: poseidon.F.toObject(poseidon([privateSalt])),
            blockhash: blockhash
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