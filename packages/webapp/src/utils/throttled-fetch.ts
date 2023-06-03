/**
 * cf. {@link throttledFetch}
 *
 * @module fetch
 */

// =================================================================================================

/** The default throttle period () in milliseconds. */
const defaultThrottlePeriod = 2000

// -------------------------------------------------------------------------------------------------

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
export function throttledFetch
    <Params extends any[], Result>
    (fetchFn: (...args: Params) => Promise<Result>, throttlePeriod: number = defaultThrottlePeriod)
    : (...args: Params) => Promise<Result>|null {

  // Used for throttling
  let lastRequestTimestamp = 0

  // used to avoid "zombie" updates: old data overwriting newer game data.
  let sequenceNumber = 1
  let lastCompletedNumber = 0

  return async (...args: Params) => {

    const seqNum = sequenceNumber++

    // Throttle
    const timestamp = Date.now()
    if (timestamp - lastRequestTimestamp < throttlePeriod)
      return null // there is a recent-ish refresh in flight
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
    if (seqNum < lastCompletedNumberAfterFetch) return null

    return result
  }
}

// =================================================================================================