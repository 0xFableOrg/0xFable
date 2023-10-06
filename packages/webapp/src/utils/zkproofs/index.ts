/**
 * Utilities to deal with Circom proofs.
 *
 * @module utils/proofs
 */

// Note: we've needed to split proveInWorker off from proofs.ts, because the worker scripts
// (proofWorker.ts) needs to import from proofs.ts, and if it imports the file that instantiates
// the worker, then webpack complains about circular dependencies (it can't include content hashes
// in chunk identities, or something like that, which apparently can cause caching problems).

export * from "src/utils/zkproofs/proofs"
export { proveInWorker } from "src/utils/zkproofs/proveInWorker"