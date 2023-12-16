const snarkjs = require("snarkjs")
const fs = require("fs")

// =================================================================================================

async function run(circuitName, inputs) {

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs,
    `out/${circuitName}_js/${circuitName}.wasm`,
    `out/${circuitName}.zkey`)

  // console.log(`Proof: ${JSON.stringify(proof)}`)

  const vKey = JSON.parse(fs.readFileSync(`out/${circuitName}.vkey.json`))

  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof)

  if (res === true) {
    console.log("Verification OK")
  } else {
    console.log("Invalid proof")
  }
}

// -------------------------------------------------------------------------------------------------

async function runWithFile(circuitName, inputFilename) {
  const inputs = JSON.parse(fs.readFileSync(inputFilename))
  return run(circuitName, inputFilename)
}

// =================================================================================================
// Standard Examples

const drawHandInputs = {
  // public
  initialDeck: [
    452312848583266382662295851582552835256924104183953103905329565847915725056n,
    452312848583266388373324160190187140051835877600158453279131187530910662655n ],
  lastIndex: 23n,
  deckRoot: "0x2cedcf06ec7f5c6350b8deb0b9905552148e6d1468d03718c74de8b4ac4b2f3d",
  handRoot: "0x1a5f10052631a3a5e5742bf41a7db6aab32e520e64f1d781def8b6d5d155dc8f",
  saltHash: 10644022205700269842939357604110603061463166818082702766765548366499887869490n,
  publicRandom: 69n,
  // private
  salt: 42n,
  deck: [
    452312848583266388373324160190187058404079193295056622468015728205796344064n,
    452312848583266388373324160190187140051835877600158453279131187530910662655n ],

  hand: [
    452312848583266388373324160190187140051835877600158453279062250449992618757n,
    452312848583266388373324160190187140051835877600158453279131187530910662655n ]
}

// NOTE: If you want to run this example via a JSON file, the formatting looks like this:
/*
{
  "initialDeck": [
    "452312848583266382662295851582552835256924104183953103905329565847915725056",
    "452312848583266388373324160190187140051835877600158453279131187530910662655" ],
  "lastIndex": 23,
  "deckRoot": "0x2cedcf06ec7f5c6350b8deb0b9905552148e6d1468d03718c74de8b4ac4b2f3d",
  "handRoot": "0x1a5f10052631a3a5e5742bf41a7db6aab32e520e64f1d781def8b6d5d155dc8f",
  "saltHash": "10644022205700269842939357604110603061463166818082702766765548366499887869490",
  "publicRandom": 69,
  "salt": 42,
  "deck": [
    "452312848583266388373324160190187058404079193295056622468015728205796344064",
    "452312848583266388373324160190187140051835877600158453279131187530910662655" ],
  "hand": [
    "452312848583266388373324160190187140051835877600158453279062250449992618757",
    "452312848583266388373324160190187140051835877600158453279131187530910662655" ]
}
 */

// =================================================================================================

// Example uses:
//    node verify.js "DrawHand" "input.json"
//    node verify.js "DrawHand"

async function main() {
  // 0 is node, 1 is verify.js
  const circuit = process.argv[2]
  const inputFile = process.argv[3]

  if (inputFile !== undefined)
    return runWithFile(circuit, inputFile)

  if (circuit === "DrawHand")
    return run(circuit, drawHandInputs)

  if (circuit === "Draw") {
    console.log("TODO: Include Draw circuit input example")
    return
  }

  if (circuit === "Play") {
    console.log("TODO: Include Play circuits input example")
    return
  }

  console.log(`Unknown circuit: ${circuit}`)
}

main().then(() => process.exit(0))

// =================================================================================================