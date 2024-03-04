/**
 * cf. {@link throttledFetch}
 *
 * @module throttledFetch
 */

// =================================================================================================

import { DEFAULT_THROTTLE_PERIOD } from "src/constants"

/** Returned by {@link throttledFetch} when a rejected because of throttling. */
export const THROTTLED = Symbol("THROTTLED")

/** Returned by {@link throttledFetch} when a fetch is rejected because it is a zombie. */
export const ZOMBIE = Symbol("ZOMBIE")

/**
 * Type returned by {@link throttledFetch}, which can be the result type, {@link THROTTLED} or
 * {@link ZOMBIE}.
 */
export type Fetched<Result> = Result | typeof THROTTLED | typeof ZOMBIE

// -------------------------------------------------------------------------------------------------

// NOTE(norswap): Throttling was designed with the idea in mind that we would always emit a fetch
// for the data we need when we don't have it. The architecture has changed a bit and now we only
// fetch the game data, and we only do that when we have a sign that it's needed, or we're retrying,
// or in case of the safety fallback fetch on a timer (not yet implemented). As such, there should
// never be a case when we actually need to throttle anything, and we might consider deleting this
// code.

/**
 * Returns a function wrapping {@link fetchFn} that will be throttled so that if another fetch (from
 * another call to the returned function) is in-flight, and less than {@link throttlePeriod}
 * milliseconds have elapsed, the fetch will be ignored.
 *
 * (Note that, unlike lodash's throttle, we do enable back-to-back fetches, as long as a fetch
 * request comes in after the previous fetch has completed).
 *
 * Additionally, fetches are given sequence numbers, so that the result of a "zombie" fetch that was
 * initiated befored another fetch that has already completed is ignored.
 *
 * Throttled and ignored fetches return null.
 */
export function throttledFetch<Params extends any[], Result>(
    fetchFn: (...args: Params) => Promise<Result>,
    throttlePeriod: number = DEFAULT_THROTTLE_PERIOD
): (...args: Params) => Promise<Fetched<Result>> {
    // Used for throttling
    let lastRequestTimestamp = 0

    // used to avoid "zombie" updates: old data overwriting newer game data.
    let sequenceNumber = 1
    let lastCompletedNumber = 0

    return async (...args: Params) => {
        const seqNum = sequenceNumber++

        // Throttle
        const timestamp = Date.now()
        if (timestamp - lastRequestTimestamp < throttlePeriod) return THROTTLED // there is a recent-ish refresh in flight
        lastRequestTimestamp = timestamp

        let result: Result
        let lastCompletedNumberAfterFetch: number
        try {
            result = await fetchFn(...args)
        } catch (e) {
            throw e
        } finally {
            // Bookkeeping for zombie filtering
            lastCompletedNumberAfterFetch = lastCompletedNumber
            lastCompletedNumber = seqNum

            // Allow another fetch immediately
            lastRequestTimestamp = 0
        }

        // Filter zombie updates
        if (seqNum < lastCompletedNumberAfterFetch) return ZOMBIE

        return result
    }
}

// =================================================================================================
