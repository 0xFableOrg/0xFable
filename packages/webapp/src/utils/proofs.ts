/**
 * Utilities to deal with Circom proofs.
 *
 * @module utils/proofs
 */

import { formatTimestamp } from "src/utils/js-utils"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const snarkjs = require("snarkjs")

// =================================================================================================

type ProofOutput = {
  // Bigints in (decimal) string form.
  publicSignals: readonly string[]
  proof: any
}

// =================================================================================================
// PROVING

/**
 * Generates a proof for the given circuit, with the given inputs.
 */
export async function prove(circuitName: string, inputs: Record<string, bigint|string>): Promise<ProofOutput> {
  const timestampStart = Date.now()
  console.log(`start proving (at ${formatTimestamp(timestampStart)})`)

  const output = await snarkjs.plonk.fullProve(inputs,
    `proofs/${circuitName}.wasm`,
    `proofs/${circuitName}.zkey`)

  const timestampEnd = Date.now()
  console.log(`end proving (at ${formatTimestamp(timestampEnd)} — ` +
    `time: ${(timestampEnd - timestampStart) / 1000}s)`)

  return output
}

// =================================================================================================
// VERIFYING

/**
 * Verify the given proof, for the given circuit, given the public inputs.
 *
 * This is only used fort testing purposes.
 */
export async function verify(circuitName: string, publicSignals: readonly string[], proof: any)
    : Promise<boolean> {

  // If this were to be used in production, we would need to cache the vkey.
  const vKey = await fetch(`proofs/${circuitName}.vkey.json`).then(it => it.json())
  return await snarkjs.plonk.verify(vKey, publicSignals, proof)
}

// =================================================================================================
// TESTING

/** Testing function that generates a proof and verifies it. */
export async function testProving (circuitName: string, inputs: Record<string, bigint|string>) {
  const { proof, publicSignals } = await prove(circuitName, inputs)
  const success = await verify(circuitName, publicSignals, proof)
  console.log(success ? "Proof is valid" : "Proof is invalid")
}

// =================================================================================================