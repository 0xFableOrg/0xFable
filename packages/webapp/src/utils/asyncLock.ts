/**
 * A (non-re-entrant) lock implemented using a promise.
 *
 * Bracket the critical section(s) of your code with `protect()` (or with `lock.take()` and
 * `lock.release()`) to ensure that the execution of two bracketed sections are never interleaved
 * (which could happen in Javascript if they contain async code).
 */
export class AsyncLock {
    #promise: Promise<void>
    #resolve: () => void

    constructor() {
        this.#resolve = () => {} // shut up bogus warnings
        this.#promise = new Promise(resolve => this.#resolve = resolve)
        this.#resolve()
    }

    async take() {
        await this.#promise
        this.#promise = new Promise(resolve => this.#resolve = resolve)
    }

    release() {
        this.#resolve()
    }

    async protect<T>(f: () => Promise<T>): Promise<T> {
        await this.take()
        try {
            return await f()
        } finally {
            this.release()
        }
    }
}