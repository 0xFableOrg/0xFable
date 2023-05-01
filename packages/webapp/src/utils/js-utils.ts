/**
 * General Javascript utilities
 *
 * @module utils/react-utils
 */

// =================================================================================================

/**
 * Returns {@linkcode Object.toString}, or {@linkcode JSON.stringify(obj)} if `toString` would
 * print as "[object Object]".
 */
export function toString(obj: any) {
  const str = obj.toString()
  return str === "[object Object]" ? JSON.stringify(obj) : str
}

// -------------------------------------------------------------------------------------------------

/** Check if the string represents a positive integer. */
export function isStringPositiveInteger(str: string): boolean {
  const n = Math.floor(Number(str))
  return n !== Infinity && String(n) === str && n >= 0
}

// =================================================================================================