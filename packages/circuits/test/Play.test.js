const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');
const { bytesPacking } = require('./utils');

describe("Play Card Test", () => {
    let mimcsponge;
    let salt = BigInt(1234); // random private salt
    let publicRandom = BigInt(5678); // block hash from smart contract
    let initialHand = [];
    let handSize = 62;
    let initialHandSize = 20;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < initialHandSize; i++) {
            initialHand.push(BigInt(i));
        }
        initialHand = [...initialHand, ...Array(handSize-initialHandSize).fill(BigInt(255))];
    });

    it("Should correctly construct a play proof", async () => {
        // play card
        let hand = [...initialHand];
        const randomness = mimcsponge.F.toObject(mimcsponge.multiHash([salt, publicRandom]));
        const lastIndex = initialHandSize - 1;
        let drawnIndex = randomness % BigInt(lastIndex);
        let selectedCard = hand[drawnIndex];
        hand[drawnIndex] = hand[lastIndex];
        hand[lastIndex] = BigInt(255);

        // construct root  
        initialHand = bytesPacking(initialHand);
        let newHand = bytesPacking(hand);
        let handRoot = mimcsponge.multiHash([...initialHand, salt]);
        let newHandRoot = mimcsponge.multiHash([...newHand, salt]);

        // construct the circuit inputs
        const circuit = 'Play.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            // public inputs
            handRoot: mimcsponge.F.toObject(handRoot),
            newHandRoot: mimcsponge.F.toObject(newHandRoot),
            saltHash: mimcsponge.F.toObject(mimcsponge.multiHash([salt])),
            cardIndex: drawnIndex,
            lastIndex: lastIndex,
            playedCard: selectedCard,
            // private inputs
            salt: salt,
            hand: initialHand,
            newHand: newHand
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})