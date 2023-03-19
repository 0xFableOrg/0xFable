const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Draw Cards Test", () => {
    const circuit = 'draw';
    let mimcsponge;
    let deckLeaf1, deckLeaf2, deckLeaf3, deckLeaf4, deckHash1, deckHash2, deckRoot;
    let handLeaf1, handLeaf2, handLeaf3, handLeaf4, handHash1, handHash2, handRoot;

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

        // a two levels merkle tree for the cards hand
        /// @dev: empty leaf is 0
        handLeaf1 = BigInt(5);
        handLeaf2 = BigInt(6);
        handLeaf3 = BigInt(7);
        handLeaf4 = BigInt(0);
        // second level hashes
        handHash1 = mimcsponge.multiHash([handLeaf1, handLeaf2]);
        handHash2 = mimcsponge.multiHash([handLeaf3, handLeaf4]);
        // root hash
        handRoot = mimcsponge.multiHash([handHash1, handHash2]);
    });

    it("Should correctly draw a card", async () => {
        // assume user draws card number 4
        const newDeckHash2 = mimcsponge.multiHash([deckLeaf3, BigInt(0)]);
        const newDeckRoot = mimcsponge.multiHash([deckHash1, newDeckHash2]);
        const newHandHash2 = mimcsponge.multiHash([handLeaf3, BigInt(4)]);
        const newHandRoot = mimcsponge.multiHash([handHash1, newHandHash2]);

        // construct the circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            deckRoot: mimcsponge.F.toObject(deckRoot),
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot),
            handRoot: mimcsponge.F.toObject(handRoot),
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
            drawnCardLeaf: BigInt(4),
            deckDrawnCardIndex: BigInt(3),
            deckDrawnCardHashPath: [deckLeaf3, mimcsponge.F.toObject(deckHash1)],
            deckTailCardLeaf: BigInt(3),
            deckTailCardIndex: BigInt(2),
            deckTailCardHashPath: [deckLeaf4, mimcsponge.F.toObject(deckHash2)],
            handTailCardLeaf: BigInt(7),
            handTailCardIndex: BigInt(2),
            handTailCardHashPath: [handLeaf4, mimcsponge.F.toObject(handHash2)],
            handDrawnCardHashPath: [handLeaf3, mimcsponge.F.toObject(handHash1)]
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})