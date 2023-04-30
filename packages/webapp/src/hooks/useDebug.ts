import { useDebugValue, useState } from "react"
import { toString } from "src/utils/js-utils"

// -------------------------------------------------------------------------------------------------

/**
 * This hook wraps React's {@link useDebugValue} in a custom hook that displays a dictionary, making
 * the dictionary available for display in the React Dev Tools. Unlike {@link useDebugValue}, this
 * can be used at the top level of a component.
 */
export function useDebugValues(dict: Record<string, any>) {
  useDebugValue(dict)
}

// -------------------------------------------------------------------------------------------------

/**
 * Wraps a React's {@link useState} into a custom hook that adds a string (via {@link useDebugValue})
 * showing the value directly within the React dev tool. An optional label can be provided to help
 * identify the value.
 *
 * Note that changing a {@link useState} to {@link useDebugState} is not friendly to fast refreshes.
 * To preserve state but still help with debugging, use {@link useDebugValues} instead.
 */
export function useDebugState<T>(initial: T, label?: string) {
  const [value, setValue] = useState(initial)
  useDebugValue(label ? `${label}: ${toString(value)}` : value)
  return [value, setValue]
}

// -------------------------------------------------------------------------------------------------