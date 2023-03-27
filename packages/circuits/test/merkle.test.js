const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Merkle Tree Test", () => {
    const circuit = 'merkle.test';
    let mimcsponge;
    let deckLeaf1, deckLeaf2, deckLeaf3, deckLeaf4, deckHash1, deckHash2, deckRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // a two levels merkle tree for the cards deck
        deckLeaf1 = BigInt(1);
        deckLeaf2 = BigInt(2);
        deckLeaf3 = BigInt(3);
        deckLeaf4 = BigInt(4);
        // second level hashes
        deckHash1 = mimcsponge.multiHash([deckLeaf1, deckLeaf2]);
        deckHash2 = mimcsponge.multiHash([deckLeaf3, deckLeaf4]);
        // root hash
        deckRoot = mimcsponge.multiHash([deckHash1, deckHash2]);
    });

    // set longer timeout for test
    jest.setTimeout(10000);
    it("Should correctly construct a merkle tree root", async () => {
        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            leaves: [deckLeaf1, deckLeaf2, deckLeaf3, deckLeaf4],
            root: mimcsponge.F.toObject(deckRoot)
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})