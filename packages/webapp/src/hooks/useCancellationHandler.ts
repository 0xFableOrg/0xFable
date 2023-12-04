/**
 * cf. {@link useCancellationHandler}
 *
 * @module hooks/useCancellationHandler
 */

import { CancellationHandler } from "src/components/lib/loadingModal"
import { useEffect, useRef } from "react"

// =================================================================================================

/**
 * Return a {@link CancellationHandler} for a {@link LoadingModal}. This hook keeps a cancellation
 * handler at the ready at all times, and discards the current handler in favour of a new one
 * whenever the loading state transitions from non-null to null (as this signifies that the current
 * action has been completed and the current action cannot be cancelled anymore, making the existing
 * cancellation handlers obsolete).
 */
export function useCancellationHandler(loading: string | null): CancellationHandler {
  const previous = useRef<string | null>(loading)
  const cancellationHandler = useRef<CancellationHandler | null>(null)

  // If the loading state changes from non-null to null, then discard the old cancellation handler,
  // and create a new one.
  if (previous !== null && loading === null) {
    cancellationHandler.current = new CancellationHandler()
  }

  // This is only to initialize the very first cancellation handler, and avoid calling the
  // constructor every time the hook is invoked.
  if (cancellationHandler.current === null) {
    cancellationHandler.current = new CancellationHandler()
  }

  // Update previous value.
  useEffect(() => {
    previous.current = loading
  }, [loading])

  return cancellationHandler.current
}

// =================================================================================================
