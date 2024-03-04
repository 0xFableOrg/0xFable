/**
 * Utilities for use with React & associated libraries.
 *
 * @module utils/react-utils
 */

// =================================================================================================

import { atom, type Atom, type Getter, type Setter, type WritableAtom } from "jotai"

// =================================================================================================
// Recreating (simplified) Jotai types

/**
 * Simplified version of the unexported Jotai `Read` type (parameter to some {@link atom}
 * overloads).
 */
export type JotaiRead<Value> = (get: Getter) => Value

/**
 * Simplified version of the unexported Jotai `Write` type (parameter to some {@link atom}
 * overloads), meant to work with {@link writeableAtom} and its {@link WAtom} return type.
 */
export type JotaiWrite<Value> = (get: Getter, set: Setter, ...args: [Value]) => void

// =================================================================================================

export function readOnlyAtom<T>(readWriteAtom: Atom<T>): Atom<T> {
    return atom((get) => get(readWriteAtom))
}

// -------------------------------------------------------------------------------------------------

/**
 * Just like {@link WritableAtom} where the object supplied to the setter is the same as the type
 * returned by the getter and the setter has no return value.
 */
export type WAtom<Value> = WritableAtom<Value, [Value], void>

// -------------------------------------------------------------------------------------------------

/** Just an alias for the overload of {@link atom} that returns a {@link WAtom}. */
export function writeableAtom<Value>(read: JotaiRead<Value>, write: JotaiWrite<Value>): WAtom<Value> {
    return atom(read, write)
}

// -------------------------------------------------------------------------------------------------

/**
 * Just an alias for the read-only overload of {@link atom} to signify we expect a an async read
 * function here and avoid typing the {@link Promise} type when the value type is typed out
 * explicitly for documentation purposes.
 */
export function asyncAtom<Value>(read: (get: Getter) => Promise<Value>): Atom<Promise<Value>> {
    return atom(read)
}

// -------------------------------------------------------------------------------------------------

/**
 * Just an alias for the read-write overload of {@link atom} to signify we expect a an async read
 * function here and avoid typing the {@link Promise} type when the value type is typed out
 * explicitly for documentation purposes.
 */
export function asyncWriteableAtom<Value>(
    read: (get: Getter) => Promise<Value>,
    write: (get: Getter, set: Setter, value: Value) => void
): WritableAtom<Promise<Value>, [Value], void> {
    return atom(read, write)
}

// =================================================================================================
