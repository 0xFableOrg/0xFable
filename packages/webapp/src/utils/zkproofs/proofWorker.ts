/**
 * Worker script for computing zero-knowledge proofs from actions.
 *
 * Used from {@link proveInWorker}.
 */

import { type ProofInputs,prove } from "src/utils/zkproofs/proofs"

// =================================================================================================

type ProofSpec = {
    circuitName: string
    inputs: ProofInputs
}

// -------------------------------------------------------------------------------------------------

addEventListener("message", async (event: MessageEvent<ProofSpec>) => {
    try {
        const output = await prove(event.data.circuitName, event.data.inputs)
        postMessage(output)
    } catch (error) {
        // This will be a ProofError
        postMessage(error)
    }
})

// =================================================================================================
