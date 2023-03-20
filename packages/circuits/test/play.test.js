const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Play Cards Test", () => {
    const circuit = 'play.test';
    let mimcsponge;
    let handLeaf1, handLeaf2, handLeaf3, handLeaf4, handHash1, handHash2, handRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // a two levels merkle tree for the cards hand
        /// @dev: empty leaf is 255
        handLeaf1 = BigInt(1);
        handLeaf2 = BigInt(2);
        handLeaf3 = BigInt(3);
        handLeaf4 = BigInt(4);
        // second level hashes
        handHash1 = mimcsponge.multiHash([handLeaf1, handLeaf2]);
        handHash2 = mimcsponge.multiHash([handLeaf3, handLeaf4]);
        // root hash
        handRoot = mimcsponge.multiHash([handHash1, handHash2]);
    });

    it("Should correctly draw a card", async () => {
        // assume user plays card number 4
        const newHandHash2 = mimcsponge.multiHash([handLeaf3, BigInt(255)]);
        const newHandRoot = mimcsponge.multiHash([handHash1, newHandHash2]);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            handRoot: mimcsponge.F.toObject(handRoot),
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
            playedCardLeaf: BigInt(4),
            playedCardIndex: BigInt(3),
            playedCardHashPath: [handLeaf3, mimcsponge.F.toObject(handHash1)],
            tailCardLeaf: BigInt(4),
            tailCardIndex: BigInt(3),
            tailCardHashPath: [handLeaf3, mimcsponge.F.toObject(handHash1)],
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})