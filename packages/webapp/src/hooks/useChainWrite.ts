import { type TransactionReceipt } from "viem"
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi"

import { Address, Hash } from "src/chain"

// =================================================================================================

/**
 * Parameters for {@link useChainWrite}.
 * - Refer to Wagmi documentation for {@link useContractWrite} for more information.
 * - Refer to {@link completeParams} for default values/behaviours.
 * - Significant differences/additions/things to note:
 *   - `prepare` controls we use {@link usePrepareContractWrite} or not, false by default
 *      This causes conditional inclusion of a hook, so cannot be changed over component lifecycle.
 *   - `setLoading` is a function taking a string describing what we are currently waiting for
 *   - `enabled` is true by default
 *   - `onError` is passed to all functions that can fail
 *   - `onWrite` is called after the write function was called (action trigger), `onSigned` after
 *      the transaction was signed by the user, and `onSuccess` after the transaction lands on-chain
 */
export type UseWriteParams = {
    contract: Address
    abi: any
    functionName: string
    args?: any[]
    onWrite?: () => void
    onSuccess?: (data: TransactionReceipt) => void
    onSigned?: (data: { hash: Hash }) => void
    onError?: (err: Error) => void
    setLoading?: (label: string | null) => void
    enabled?: boolean
    prepare?: boolean
}

// -------------------------------------------------------------------------------------------------

/** Result type for {@link useChainWrite}. Type to allow to expand returned value in the future. */
export type UseWriteResult = {
    write?: () => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Completes the parameters for {@link useChainWrite} with default values.
 */
function completeParams(params: UseWriteParams): UseWriteParams {
    const result = { ...params }
    if (result.enabled === undefined) result.enabled = true
    if (result.prepare === undefined) result.prepare = false

    const setLoading = result.setLoading
    if (setLoading) {
        const { onWrite, onSigned, onSuccess, onError } = params

        result.onWrite = () => {
            setLoading("Waiting for signature...")
            onWrite?.()
        }
        result.onSigned = (data) => {
            setLoading("Waiting for on-chain inclusion...")
            onSigned?.(data)
        }
        result.onSuccess = (data) => {
            setLoading(null)
            onSuccess?.(data)
        }
        result.onError = (error) => {
            setLoading(null)
            if (onError) onError(error)
            else {
                // It would be nice to combine these two, however, interpolating `error` or event
                // `error.stack` into the string doesn't give the nice builtin formatting + clickable links
                // in browsers' consoles.
                console.log(`Error in useWrite (${result.functionName}):`)
                console.log(error)
            }
        }
    } else {
        const noop = () => {}
        result.onWrite = result.onWrite || noop
        result.onSigned = result.onSigned || noop
        result.onSuccess = result.onSuccess || noop
        result.onError =
            result.onError ||
            ((error) => {
                console.log(`Error in useWrite (${result.functionName}):`)
                console.log(error)
            })
    }

    return result
}

// -------------------------------------------------------------------------------------------------

/**
 * Send a transaction to the chain, based on the parameters.
 */
export function useChainWrite(_params: UseWriteParams): UseWriteResult {
    // Unlikely that this is more work than memoization would incur!
    const { contract, abi, functionName, args, enabled, prepare, onSigned, onWrite, onSuccess, onError } =
        completeParams(_params)

    // TODO(norswap): It could be good to include some generic error handling / preprocessing here.
    //   This will require disentangling what can happen when and what to do about it.
    //   cf. https://twitter.com/norswap/status/1640409794409316361

    const config = prepare
        ? // Prepare the transaction configuration: this will call the RPC to simulate the call and get
          // the estimated gas cost. This might decrease the time to perform a tx, but might increase RPC
          // costs, and might cause errors depending on the caching policy (which I haven't investigated).
          // eslint-disable-next-line
          usePrepareContractWrite({
              address: contract,
              abi,
              functionName,
              args: args || [],
              enabled,
              onError,
          } as any).config // type safety blah blah, then it doesn't even type correctly — midwit shit
        : {
              address: contract,
              abi,
              functionName,
              args: args || [],
              enabled,
          }

    // Uses the configuration to get a write function which will send the transaction. After `write`
    // is called and the user signs the transaction in the wallet, the `data` will be populated with a
    // transaction hash (the hash is known before the transaction lands on chain).
    const { data, write } = useContractWrite({
        ...config,
        onMutate: onWrite,
        onSuccess: onSigned,
        onError,
    } as any)

    // `data` reflects the last invocation of `write` with the same configuration.
    //
    // Crucially, this means that if the configuration changes, the `data` for an in-flight `write`
    // will become inaccessible. One should refrain from changing the parameters of `useWrite` until
    // the transaction has landed on-chain. However, the configuration also includes the gas price and
    // the nonce, which can be updated more frequently. I'm not really sure how this is supposed to
    // be safe (seems like a potential race condition where the config is updated before we can get
    // the data from a write), but it seems to work in practice. If not, `onSuccess` and `onError`
    // callbacks could be used to avoid the issue.
    //
    // Because write commits to a certain nonce, `write` should only be called once per render cycle.

    // Waits for the transaction — this will only be enabled if the hash is defined.
    useWaitForTransaction({
        hash: data?.hash,
        onSuccess,
        onError,
    } as any) // remove the deprecation errors for onSuccess and onError — absolutely undocumented

    return { write }
}

// =================================================================================================
