/**
 * TODO
 */

import { isProofOutput, ProofOutput, ProofTimeoutError } from "src/utils/zkproofs/proofs"

// =================================================================================================

/**
 * Just like `prove`, but runs the proof in a dedicated web worker.
 *
 * A timeout (in seconds) can be supplied, in which case the worker will be terminated if the proof
 * takes longer than the timeout. If set to 0 (the default), no timeout is used.
 */
export async function proveInWorker
(circuitName: string, inputs: Record<string, bigint|bigint[]|string>, timeout: number = 0)
  : Promise<ProofOutput> {

  const proofWorker = new Worker(new URL("proofWorker.ts", import.meta.url))

  const promise = new Promise<ProofOutput>((resolve, reject) => {
    proofWorker.onmessage = (event: MessageEvent<ProofOutput|Error>) => {
      if (isProofOutput(event.data))
        resolve(event.data)
      else
        reject(event.data)
    }

    if (timeout > 0)
      setTimeout(() => {
        proofWorker.terminate()
        reject(new ProofTimeoutError(`proof timed out after ${timeout}s`))
      }, timeout * 1000)
  })

  proofWorker.postMessage({ circuitName, inputs })

  return promise
}

// =================================================================================================
