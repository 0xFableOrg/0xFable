/**
 * Errors that can be thrown as a result of a user action, and associated utilities.
 * These should be caught at the latest at the top-level of the action.
 *
 * The utilities include default error handling not only for errors defined in this module, but
 * also elsewhere, including {@link ContractWriteError} and {@link StaleError}.
 *
 * @module actions/errors
 */

import { ContractFunctionRevertedError, UserRejectedRequestError } from "viem"

import { ContractWriteError } from "src/actions/libContractWrite"
import { GIT_ISSUES } from "src/constants"
import { setError } from "src/store/actions"

import { StaleError } from "src/store/read"
import { TimeoutError } from "src/utils/errors"
import { ProofError, ProofTimeoutError } from "src/utils/zkproofs/proofs"

// =================================================================================================
// ERRORS

// -------------------------------------------------------------------------------------------------

/**
 * Thrown when an network request times out.
 */
export class FableRequestTimeout extends TimeoutError {
  constructor(msg: string) {
    super(msg)
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Thrown when an inconsistent game state is detected. This is an error that should in principle
 * never be thrown and denotes an implementatin bug, as we strive to include checks to avoid such
 * inconsistencies (in particular via {@link checkFresh}, and throwing {@link StaleError} whenever
 * the state shifted underneath an async operation).
 */
export class InconsistentGameStateError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}

// =================================================================================================
// ERROR HANDLING

// -------------------------------------------------------------------------------------------------

/**
 * Performs default error handling for user actions: if the error is of a known type, it is handled,
 * and false returned. If the error is unknown, it is rethrown.
 *
 * Handling is done by setting the global error state, which is then displayed by the UI to report
 * the issue to the user, and give him options for handling it (though usually not much can be done
 * besides retrying or refresh the page).
 *
 * For {@link StaleError}, no error is displayed, as the UI should have already updated from the
 * store changes that caused the error to be thrown.
 */
export function defaultErrorHandling(actionName: string, err: unknown): false {

  if (err instanceof StaleError)
    return false

  if (err instanceof FableRequestTimeout) {
    setError({
      title: "Request timed out.",
      message: (err as Error).message + " Please try again.",
      buttons: [DISMISS_BUTTON]
    })
    return false
  }

  if (err instanceof ProofTimeoutError) {
    setError({
      title: "ZK proof generation timed out.",
      message: "Please try again.",
      buttons: [DISMISS_BUTTON]
    })
    return false
  }

  if (err instanceof ProofError) {
    setError({
      title: "Could not generate ZK proof.",
      message: "Please reload page and try again.",
      buttons: [RELOAD_BUTTON, DISMISS_BUTTON]
    })
    // This is most likely gibberish, but you never known.
    console.error(err.cause)
    return false
  }

  if (err instanceof ContractWriteError)
    return defaultContractWriteErrorHandling(err)

  if (err instanceof InconsistentGameStateError) {
    reportInconsistentGameState(err)
    return false
  }

  throw err
}

// -------------------------------------------------------------------------------------------------

/**
 * Performs default error handling for {@link ContractWriteError} thrown by {@link
 * contractWriteThrowing}.
 *
 * Just like {@link defaultErrorHandling}, this sets the global error state to report issues to the
 * user.
 *
 * Unlike {@link defaultErrorHandling}, unknown exceptions wrapped by {@link ContractWriteError} are
 * never rethrown.
 */
export function defaultContractWriteErrorHandling(err: ContractWriteError): false {

  if (err.result.revert) {
    // Ethereum nodes do not store the revert reason at all, so there is no way to be more
    // precise than this. These errors can only occur when the call succeeded at simulation time
    // but failed at executing on-chain, which should make them rare. This also means they are
    // caused by a race condition in the contract, where another action changed the state such
    // that a previously successful call now fails. We should try to avoid these as a matter of
    // design.

    // It's also hard to know if the error was due to a logic revert or to running
    // out of gas. This is a viem issue, see here for the explanation:
    // https://twitter.com/norswap/status/1687491839320842240
    // In both cases, the problem is triggered by an underlying state change.

    // Ideally, we override this and handle it in a custom manner only for actions where these
    // races are possible.

    setError({
      title: "Contract execution error",
      message: `Transaction reverted (${err.args.functionName}) at execution time `
        + "but not at simulation time. Please try again.",
      buttons: [DISMISS_BUTTON]
    })
    return false
  }

  const error = err.result.error

  if (error instanceof UserRejectedRequestError) {
    // The user rejected the execution, he's probably well aware of the fact.
    return false
  }

  if (error instanceof ContractFunctionRevertedError) {
    if (error.data) {
      // The revert was parsed, because the function signature was found in the ABI of the
      // calling contract (meaning it was declared *inside* the contract).
      setError({
        title: "Contract execution error",
        message: `Transaction reverted (${err.args.functionName}) with `
          +`${error.data.errorName}(${error.data.args})`,
        buttons: [DISMISS_BUTTON]
      })
    } else {
      // The revert wasn't parsed, probably because the error isn't declared *inside* the
      // contract, but comes from another contract and wasn't redeclared.

      const signatureMsg = error.signature
          ? `with signature ${error.signature}`
          : "with no signature"

      setError({
        title: "Contract execution error",
        message: `Transaction reverted (${err.args.functionName}) ${signatureMsg}.`
          + `Please report to ${GIT_ISSUES}`,
        buttons: [DISMISS_BUTTON]
      })
    }
    return false
  }

  setError({
    title: "Contract execution error",
    message: error.toString(),
    buttons: [DISMISS_BUTTON]
  })

  return false
}

// -------------------------------------------------------------------------------------------------

/**
 * Sets the global error state to report an inconsistent game state to the user.
 *
 * As state in {@link InconsistentGameStateError}, this should never occur in practice, and
 * implies an implementation bug or weakness.
 */
export function reportInconsistentGameState(err: InconsistentGameStateError|string) {
  const message = typeof err === "string" ? err : err.message
  setError({
    title: "Error: Inconsistent game state.",
    message: `${message}\n\nPlease reload the page.`,
    buttons: [RELOAD_BUTTON, DISMISS_BUTTON]
  })
}

// =================================================================================================
// ERROR UTILITIES

// -------------------------------------------------------------------------------------------------

/**
 * A button meant to be used as a component in {@link ErrorConfig.buttons} when passed to {@link
 * setError}. It dismisses the error when clicked.
 */
export const DISMISS_BUTTON = { text: "Dismiss", onClick: () => setError(null) }

// -------------------------------------------------------------------------------------------------

/**
 * A button meant to be used as a component in {@link ErrorConfig.buttons} when passed to {@link
  * setError}. It reloads the page when clicked.
 */
export const RELOAD_BUTTON = { text: "Refresh", onClick: () => window.location.reload() }

// =================================================================================================