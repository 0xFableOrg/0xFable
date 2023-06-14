const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Draw Hand Test", () => {
    let mimcsponge;
    let salt = BigInt(1234); // random private salt
    let publicRandom = BigInt(5678); // block hash from smart contract
    let initialDeck = [], initialHand = [];
    let deckRoot, handRoot;

    beforeAll(async () => {
        mimcsponge = await circomlib.buildMimcSponge();

        // initialize deck leaves and hand leaves
        for (let i = 0; i < 64; i++) {
            initialDeck.push(BigInt(i));
            initialHand.push(BigInt(255));
        }
    });

    // set longer timeout for test
    jest.setTimeout(25000);

    it("Should correctly construct an initial hand proof", async () => {
        // assume user draws 7 cards
        const maxDeckSize = 64;
        const cardCount = 7;

        // draw cards
        let deck = [...initialDeck];
        let hand = [...initialHand];
        const randomness = mimcsponge.F.toObject(mimcsponge([salt, publicRandom]));
        let lastIndex = maxDeckSize - 1;
        let drawnIndex;
        for (let i = 0; i < cardCount; i++) {
            drawnIndex = randomness % BigInt(lastIndex);
            hand[i] = deck[drawnIndex];
            deck[drawnIndex] = deck[lastIndex];
            deck[lastIndex] = BigInt(255);
            lastIndex--;
        }

        // construct merkle root        
        handRoot = getMerkleRoot(hand, mimcsponge);
        deckRoot = getMerkleRoot(deck, mimcsponge);

        // construct the circuit inputs
        const circuit = 'Initial.test';
        const circuitInputs = ff.utils.stringifyBigInts({
            // public inputs
            initialDeck,
            deckRoot: mimcsponge.F.toObject(deckRoot),
            handRoot: mimcsponge.F.toObject(handRoot),
            saltHash: mimcsponge.F.toObject(mimcsponge([salt])),
            publicRandom,
            // private inputs
            salt,
            deck,
            hand
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