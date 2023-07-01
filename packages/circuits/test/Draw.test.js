const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');
const { bytesPacking } = require('./utils');

describe("Draw Card Test", () => {
    let mimcsponge;
    let salt = BigInt(1234); // random private salt
    let publicRandom = BigInt(5678); // block hash from smart contract
    let initialDeck = [], initialHand = [];
    let initialDeckSize = 62;
    let remainingDeckSize = 55;
    let initialHandSize = 7;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < remainingDeckSize; i++) {
            initialDeck.push(BigInt(i));
        }
        for (let i = remainingDeckSize; i < initialDeckSize; i++) {
            initialDeck.push(BigInt(255));
            initialHand.push(i);
        }
        initialHand = [...initialHand, ...Array(remainingDeckSize).fill(BigInt(255))];
    });

    it("Should correctly construct an draw proof", async () => {
        // draw cards
        let deck = [...initialDeck];
        let hand = [...initialHand];
        const randomness = mimcsponge.F.toObject(mimcsponge.multiHash([salt, publicRandom]));
        const lastIndex = remainingDeckSize - 1;
        let drawnIndex = randomness % BigInt(lastIndex);
        hand[initialHandSize] = deck[drawnIndex];
        deck[drawnIndex] = deck[lastIndex];
        deck[lastIndex] = BigInt(255);

        // construct root  
        initialDeck = bytesPacking(initialDeck);
        initialHand = bytesPacking(initialHand);
        let newDeck = bytesPacking(deck);
        let newHand = bytesPacking(hand);
        let deckRoot = mimcsponge.multiHash([...initialDeck, salt]);
        let handRoot = mimcsponge.multiHash([...initialHand, salt]);
        let newHandRoot = mimcsponge.multiHash([...newHand, salt]);
        let newDeckRoot = mimcsponge.multiHash([...newDeck, salt]);

        // construct the circuit inputs
        const circuit = 'Draw.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            // public inputs
            deckRoot: mimcsponge.F.toObject(deckRoot),
            newDeckRoot: mimcsponge.F.toObject(newDeckRoot),
            handRoot: mimcsponge.F.toObject(handRoot),
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
            saltHash: mimcsponge.F.toObject(mimcsponge.multiHash([salt])),
            publicRandom: publicRandom,
            initialHandSize: initialHandSize,
            lastIndex: lastIndex,
            // private inputs
            salt: salt,
            deck: initialDeck,
            hand: initialHand,
            newDeck: newDeck,
            newHand: newHand
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})