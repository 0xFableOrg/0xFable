/**
 * Enables generating a zk proof in a dedicated web worker.
 *
 * This needs to be split from {@link module:utils/zkproofs/proofs} because of dependencies issue.
 * See the comment in `index.ts` for explanations.
 *
 * Import this from {@link module:utils/zkproofs} instead.
 */

import { isProofOutput, ProofCancelled, ProofOutput, ProofTimeoutError } from "src/utils/zkproofs/proofs"

// =================================================================================================

/**
 * Just like {@link module:utils/zkproofs/proofs#prove}, but runs the proof in a dedicated web
 * worker.
 *
 * A timeout (in seconds) can be supplied, in which case the worker will be terminated if the proof
 * takes longer than the timeout. If set to 0 (the default), no timeout is used.
 *
 * In additiona to the promise, this returns a `cancel` function which can be used to terminate the
 * worker (and hence cancel the proof).
 */
export function proveInWorker(
    circuitName: string,
    inputs: Record<string, bigint | bigint[] | string>,
    timeout: number = 0
): { promise: Promise<ProofOutput>; cancel: () => void } {
    const proofWorker = new Worker(new URL("proofWorker.ts", import.meta.url))

    let timeoutID: ReturnType<typeof setTimeout> | undefined = undefined
    let reject: (reason: Error) => void

    const promise = new Promise<ProofOutput>((resolve, _reject) => {
        reject = _reject

        proofWorker.onmessage = (event: MessageEvent<ProofOutput | Error>) => {
            if (isProofOutput(event.data)) resolve(event.data)
            else reject(event.data)
        }

        if (timeout > 0)
            timeoutID = setTimeout(() => {
                proofWorker.terminate()
                reject(new ProofTimeoutError(`proof timed out after ${timeout}s`))
            }, timeout * 1000)
    })

    proofWorker.postMessage({ circuitName, inputs })

    return {
        promise,
        cancel: () => {
            if (timeoutID !== undefined) clearTimeout(timeoutID)
            proofWorker.terminate()
            reject(new ProofCancelled("proof cancelled by user"))
        },
    }
}

// =================================================================================================
