/**
 * Utilities to deal with Circom proofs.
 *
 * @module utils/zkproofs/proofs
 */

import { formatTimestamp } from "src/utils/js-utils"
import { TimeoutError } from "src/utils/errors"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const snarkjs = require("snarkjs")

// =================================================================================================

/**
 * Whether to generate proofs, can be turned to false for debugging (in which case the corresponding
 * switch (`checkProofs = false`) must be set on the contract side).
 */
export const SHOULD_GENERATE_PROOFS = !process.env["NEXT_PUBLIC_NO_PROOFS"]

// -------------------------------------------------------------------------------------------------

/**
 * Stand-in value for proofs, used when {@link SHOULD_GENERATE_PROOFS} is false.
 */
export const FAKE_PROOF: ProofOutput = {
  proof_a: [1n, 1n] as const,
  proof_b: [[1n, 1n] as const, [1n, 1n] as const],
  proof_c: [1n, 1n] as const
}

// =================================================================================================

export type ProofInputs = Record<string, bigint|bigint[]|string>

// -------------------------------------------------------------------------------------------------

export type ProofOutput = {
  proof_a: readonly [bigint, bigint],
  proof_b: readonly [readonly [bigint, bigint], readonly [bigint, bigint]],
  proof_c: readonly [bigint, bigint]
}

// -------------------------------------------------------------------------------------------------

export function isProofOutput(value: any): value is ProofOutput {
  return value !== undefined && value.proof_a !== undefined && 
    value.proof_b !== undefined && value.proof_c !== undefined
}

// -------------------------------------------------------------------------------------------------

/**
 * Wraps errors thrown during proof computation.
 */
export class ProofError extends Error {
  cause: unknown
  constructor(cause: unknown) {
    super(`Error while computing proof: ${cause}`)
    this.cause = cause
  }
}

// =================================================================================================
// PROVING

/**
 * Generates a proof for the given circuit, with the given inputs.
 */
export async function prove
    (circuitName: string, inputs: Record<string, bigint|bigint[]|string>)
    : Promise<ProofOutput> {

  const timestampStart = Date.now()
  console.log(`start proving (at ${formatTimestamp(timestampStart)})`)

  try {
    const { publicSignals, proof } = await snarkjs.groth16.fullProve(inputs,
      `${self.origin}/proofs/${circuitName}.wasm`,
      `${self.origin}/proofs/${circuitName}.zkey`)

    const timestampEnd = Date.now()
    console.log(`end proving (at ${formatTimestamp(timestampEnd)} — ` +
      `time: ${(timestampEnd - timestampStart) / 1000}s)`)

    // NOTE: proof can be verified with
    //       `verify(circuitName, publicSignals, proof)`

    // Parse proof outputs
    const generated_proof: ProofOutput =  { 
      proof_a: proof["pi_a"].slice(0,2) as [bigint, bigint],
      // note: solidity verifier requires using a different Endian, hence the manual parsing
      proof_b: [
        [proof["pi_b"][0][1], proof["pi_b"][0][0]],
        [proof["pi_b"][1][1], proof["pi_b"][1][0]]
      ] as [[bigint, bigint], [bigint, bigint]],
      proof_c: proof["pi_c"].slice(0,2) as [bigint, bigint]
    }
    return generated_proof

    // NOTE: We could have copied the ordering of proof items from the `exportSolidityCallData`
    // function and read them from the `proof` object directly. The risk is we need to change the
    // code if the ordering changes (but now we need to change the code if the formatting changes).
  }
  catch (error) {
    const timestampEnd = Date.now()
    console.log(`end proving with exception (at ${formatTimestamp(timestampEnd)} — ` +
      `time: ${(timestampEnd - timestampStart) / 1000}s)`)
    throw new ProofError(error)
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Thrown when a proof times out.
 */
export class ProofTimeoutError extends TimeoutError {
  constructor(msg: string) {
    super(msg)
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Thrown when a proof is cancelled
 */
export class ProofCancelled extends Error {
  constructor(msg: string) {
    super(msg)
  }
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
  const vKey = await fetch(`${self.origin}/proofs/${circuitName}.vkey.json`).then(it => it.json())
  return await snarkjs.groth16.verify(vKey, publicSignals, proof)
}

// =================================================================================================
// INPUT PREPARATION

/**
 * Encodes the `bytes` array into a `numFelts`-long array of bigint (representing elliptic curve
 * field elements), each of which packs up to `itemsPerFelt` number of bytes.
 *
 * Each number in the `bytes` array must be between 0 and 255. The bytes will be encoded in
 * little-endian ordering within field elements (i.e. the first byte will be the least significant
 * byte of the first field element), while the field elements themselves will be ordered
 * sequentially in the returned ordered.
 *
 * If the array is too big to fit in the given number of field elements, an error is thrown. If
 * there are too few bytes to fill the given number of field elements, the remaining space is
 * padded with 0s.
 */
export function packBytes(bytes: Uint8Array|number[], numFelts: number, itemsPerFelt: number)
    : bigint[] {

  if (bytes.length > numFelts * itemsPerFelt)
    throw new Error(`too many bytes to pack into ${numFelts} field elements`)

  const felts = []

  // for each field element
  for (let i = 0; i < numFelts; i++) {
    let felt = ""

    // For the next `itemsPerFelt` bytes in the array (if they exist, otherwise 0),
    // prepend the byte (two hex chars) to the `felt` string.
    for (let j = i * itemsPerFelt; j < (i+1) * itemsPerFelt; j++) {
      if (j >= bytes.length) {
        felt = "00" + felt // ensure there is at least one zero in the string
        break
      } else {
        const byte = bytes[j].toString(16)
        felt = (byte.length < 2 ? "0" : "") + byte + felt
      }
    }

    felts.push(BigInt("0x" + felt))
  }
  return felts
}

// =================================================================================================