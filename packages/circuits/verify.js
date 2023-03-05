const snarkjs = require("snarkjs");
const fs = require("fs");

async function run(circuitName, inputs) {
  const { proof, publicSignals } = await snarkjs.plonk.fullProve(inputs,
    `out/${circuitName}_js/${circuitName}.wasm`,
    `out/${circuitName}.zkey`);

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));

  const vKey = JSON.parse(fs.readFileSync(`out/${circuitName}.vkey.json`));

  const res = await snarkjs.plonk.verify(vKey, publicSignals, proof);

  if (res === true) {
    console.log("Verification OK");
  } else {
    console.log("Invalid proof");
  }
}

run("Cards", {a: 10, b: 21}).then(() => {
  process.exit(0);
});