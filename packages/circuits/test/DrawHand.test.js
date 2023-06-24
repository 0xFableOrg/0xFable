const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Draw Hand Test", () => {
    let mimcsponge;
    let salt = BigInt(1234); // random private salt
    let publicRandom = BigInt(5678); // block hash from smart contract
    let initialDeck = [], initialHand = [];
    let deckRoot, handRoot;
    let deckSize = 64;
    let initialLastIndex = 63;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < deckSize; i++) {
            initialDeck.push(BigInt(i));
            initialHand.push(BigInt(255));
        }
    });

    // set longer timeout for test
    jest.setTimeout(30000);

    it("Should correctly construct an initial hand proof", async () => {
        // assume user draws 7 cards
        const cardCount = 7;

        // draw cards
        let deck = [...initialDeck];
        let hand = [...initialHand];
        const randomness = mimcsponge.F.toObject(mimcsponge.multiHash([salt, publicRandom]));
        let lastIndex = deckSize - 1;
        let drawnIndex;
        for (let i = 0; i < cardCount; i++) {
            drawnIndex = randomness % BigInt(lastIndex);
            hand[i] = deck[drawnIndex];
            deck[drawnIndex] = deck[lastIndex];
            deck[lastIndex] = BigInt(255);
            lastIndex--;
        }

        // construct root  
        let newDeck = bytesPacking(deck);
        let newHand = bytesPacking(hand);      
        handRoot = mimcsponge.multiHash([...newHand, salt]);
        deckRoot = mimcsponge.multiHash([...newDeck, salt]);

        // construct the circuit inputs
        const circuit = 'DrawHand.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            // public inputs
            initialDeck: bytesPacking(initialDeck),
            lastIndex: initialLastIndex, 
            deckRoot: mimcsponge.F.toObject(deckRoot),
            handRoot: mimcsponge.F.toObject(handRoot),
            saltHash: mimcsponge.F.toObject(mimcsponge.multiHash([salt])),
            publicRandom: publicRandom,
            // private inputs
            salt: salt,
            deck: newDeck,
            hand: newHand
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    }) 
})

function bytesPacking(arr) {
    elements = [];
    for (let i = 0; i < 2; i++) {
        let bytes = "";
        for (let j = 0; j < 32; j++) {
            const byte = arr[i * 32 + j].toString(16);
            if (byte.length < 2) {
                bytes += "0" + byte;
            } else {
                bytes += byte;
            }
        }
        bytes = "0x" + bytes;
        elements.push(BigInt(bytes));
    }
    return elements;
}