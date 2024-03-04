/**
 * Generic error types.
 *
 * @module utils/errors
 */

// =================================================================================================

/**
 * Thrown when an operation times out.
 */
export class TimeoutError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

// =================================================================================================
