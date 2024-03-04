/**
 * Utilities to deal with the Jotai state management library.
 *
 * @module utils/jotai
 */

import { atom, Atom } from "jotai"
import { isEqual } from "lodash"

// =================================================================================================

/** Re-export simplified definition of jotai Getter type. */
export type Getter = <Value>(atom: Atom<Value>) => Value

/** Re-export simplified definition of jotai Read type. */
export type Read<Value> = (get: Getter) => Value

/**
 * Similar to a read-only derived atom, but the result will be cached via deep-comparison,
 * to avoid spurious re-renders.
 */
export function cachedAtom<Value>(read: Read<Value>): Atom<Value> {
    let cache: Value | null = null
    return atom((get) => {
        const value = read(get as any)
        if (!isEqual(value, cache)) cache = value
        return cache!
    })
}

// =================================================================================================
