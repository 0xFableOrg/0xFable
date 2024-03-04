/**
 * A library for making contract with useful callbacks for the UI.
 *
 * @module ui/libContractWrite
 */

import type { Address, Hash } from "src/chain"
import {
    Abi,
    ContractFunctionExecutionError,
    ContractFunctionResult,
    EstimateGasExecutionError,
    GetFunctionArgs,
    TransactionExecutionError,
    TransactionReceipt,
} from "viem"
import { prepareWriteContract, waitForTransaction, writeContract } from "wagmi/actions"

// =================================================================================================

/** Arguments to {@link contractWrite}. */
export type ContractWriteArgs<TAbi extends Abi, TFunctionName extends string> = {
    /** Called contract address. */
    contract: Address

    /** Called contract ABI. */
    abi: TAbi

    /** Called function name. */
    functionName: TFunctionName

    /** Args to call the function with. */
    args: GetFunctionArgs<TAbi, TFunctionName>["args"]

    /**
     * If provided, this will be called with the result of the simulated call. This is the only way to
     * get the return value of a write call, however beware that nothing guarantees that the actual
     * on-chain call will return the same value (and there is no way to retrieve the on-chain returned
     * value).
     */
    onSimulated?: (result: ContractFunctionResult<TAbi, TFunctionName>) => void

    /** Called after the transaction is signed, with the transaction hash. */
    onSigned?: (hash: Hash) => void

    /**
     * Called with a label indicating the current state of processing the transaction, suitable for
     * display in the UI, or null when the transaction has finished processing.
     */
    setLoading?: (label: string | null) => void
}

// -------------------------------------------------------------------------------------------------
/*

NOTE: The following type would allow us to write the `contractWrite` signature as:

async function contractWrite<TAbi, TFunctionName>(args: ContractWriteArgs<TAbi, TFunctionName>) ...

However, since this `ContractWriteArgs` is not currently only used in that signature, I believe
the gains are not worth the extra indirection. Still I'd like to preserve the trick here, in case
we ever need it.

export type ContractWriteArgsTerse<TAbi, TFunctionName> =
  TAbi extends Abi
    ? TFunctionName extends string
      ? ContractWriteArgs<TAbi, TFunctionName>
      : ContractWriteArgs<TAbi, string>
    : TFunctionName extends string
      ? ContractWriteArgs<Abi, TFunctionName>
      : ContractWriteArgs<Abi, string>

*/

// -------------------------------------------------------------------------------------------------

/**
 * Returned by {@link contractWrite} when the write was successful.
 */
export type ContractWriteResultSuccess<TAbi extends Abi, TFunctionName extends string> = {
    success: true
    receipt: TransactionReceipt
    /**
     * If the call was simulated, the result of the SIMULATED call, otherwise null. It is impossible
     * to retrieve the actual returned value of an on-chain transaction — transacions have no retun
     * only value, only an exit code.
     */
    simulatedResult: ContractFunctionResult<TAbi, TFunctionName> | null
}

// -------------------------------------------------------------------------------------------------

/**
 * Returned by {@link contractWrite} when an error happened when attempting the write. The
 * transaction wasn't included on-chain.
 */
export type ContractWriteResultError = {
    success: false
    revert: false
    error: any
}

// -------------------------------------------------------------------------------------------------

/**
 * Returned by {@link contractWrite} when the transaction was reverted on-chain. This should be
 * rare as it means the simulation and gas estimation succeeded but the transaction failed on-chain.
 */
export type ContractWriteResultRevert = {
    success: false
    revert: true
    receipt: TransactionReceipt
}

// -------------------------------------------------------------------------------------------------

/**
 * Union of the unsuccessful contract write result types.
 */
export type ContractWriteResultFailed = ContractWriteResultError | ContractWriteResultRevert

// -------------------------------------------------------------------------------------------------

/**
 * Return type of {@link contractWrite}, union of all possible return types.
 */
export type ContractWriteResult<TAbi extends Abi, TFunctionName extends string> =
    | ContractWriteResultSuccess<TAbi, TFunctionName>
    | ContractWriteResultError
    | ContractWriteResultRevert

// =================================================================================================

/**
 * Attempts to call an onchain function (cf. {@link ContractWriteArgs} for the argument details).
 *
 * This operation notifies its progress by passing string labels to {@link args.setLoading},
 * which is usually used to update a loading modal.
 *
 * The function can succeed (returning {@link ContractWriteResultSuccess}), fail with an error
 * notably but not only during simulation and/or gas estimation (returning {@link
 * ContractWriteResultError}, or fail during on-chain execution (returning {@link
 * ContractWriteResultRevert}.
 *
 * In case of failure, due to an error, the viem error is passed, except that {@link
 * ContractFunctionExecutionError}, {@link TransactionExecutionError} and {@link
 * EstimateGasExecutionError} are unwrapped (their cause is passed instead).
 *
 * If you want failure cases to throw, use {@link contractWriteThrowing} instead.
 */
export async function contractWrite<TAbi extends Abi, TFunctionName extends string>(
    args: ContractWriteArgs<TAbi, TFunctionName>
): Promise<ContractWriteResult<TAbi, TFunctionName>> {
    args.setLoading?.("Waiting for signature...")

    try {
        // NOTE: Even if we don't run this, `writeContract` will call it anyway — this is good
        // because we want to catch possible errors before on-chain execution.
        const config = await prepareWriteContract({
            address: args.contract,
            abi: args.abi,
            functionName: args.functionName,
            args: args.args,
        } as any)

        args.onSimulated?.(config.result as any)

        /*

    // NOTE(norswap): here's how we could retrieve the gas here.
    // Capturing the gas estimation and passing it to the user would be useful in order to
    // differentiate between an out-of-gas revert and and a programmatic revert.

    // BUT: This could be expensive, e.g. Alchemy charges 3.5x the price for a gas estimation vs
    // a transaction simulation. This needs to be done anyway, but in the flow where we don't
    // call this explicitly, the request is made by the wallet directly.

    // If we did this, we should also use viem's writeContract (and not wagmi's) to avoid
    // doing an extra `simulateTransaction` call — the `estimateGas` call is just as good to
    // detect errors before actual on-chain execution.

    // NOTE: import { estimateContractGas } from "viem/contract"

    const gas = await estimateContractGas(getPublicClient(), {
      account: getAccount(),
      ...config
    } as any)

    const { hash } = await writeContract({ ...config, gas } as any)

     */

        const { hash } = await writeContract(config)

        args.setLoading?.("Waiting for on-chain inclusion...")
        args.onSigned?.(hash)

        const receipt: TransactionReceipt = await waitForTransaction({ hash })
        if (receipt.status === "success") {
            args.setLoading?.(null)
            return {
                success: true,
                receipt,
                simulatedResult: config?.result as ContractFunctionResult<TAbi, TFunctionName> | null,
            }
        } else {
            args.setLoading?.(null)
            return {
                success: false,
                revert: true,
                receipt,
            }
        }
    } catch (e) {
        if (
            e instanceof ContractFunctionExecutionError ||
            e instanceof EstimateGasExecutionError ||
            e instanceof TransactionExecutionError
        ) {
            return {
                success: false,
                revert: false,
                error: e.cause,
            }
        }
        return {
            success: false,
            revert: false,
            error: e,
        }
    }
}

// -------------------------------------------------------------------------------------------------

/**
 * Variant of {@link contractWrite} that wraps the failing result types in a {@link
 * ContractWriteError}.
 */
export async function contractWriteThrowing<TAbi extends Abi, TFunctionName extends string>(
    args: ContractWriteArgs<TAbi, TFunctionName>
): Promise<ContractWriteResultSuccess<TAbi, TFunctionName>> {
    const result = await contractWrite(args)
    if (!result.success) {
        throw new ContractWriteError(args as any, result)
    }
    return result
}

// =================================================================================================

/**
 * Error class that wraps a {@link ContractWriteResultFailed}.
 */
export class ContractWriteError extends Error {
    /** The arguments to the {@link contractWrite} call. */
    args: ContractWriteArgs<Abi, string>

    /** The failing result of the {@link contractWrite} call. */
    result: ContractWriteResultFailed

    constructor(args: ContractWriteArgs<Abi, string>, result: ContractWriteResultFailed) {
        super("Contract write failed.")
        this.args = args
        this.result = result
    }
}

// =================================================================================================
