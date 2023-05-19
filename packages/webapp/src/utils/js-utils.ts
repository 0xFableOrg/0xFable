/**
 * General Javascript utilities
 *
 * @module utils/react-utils
 */

// =================================================================================================

/**
 * Returns a string representation of the object that is prettier than `JSON.stringify`. In
 * particular, keys are not quoted, sensible whitespace is applied (after comma and colons).
 *
 * The function supports single-line or multiline output (with indent size two), defaulting to
 * single-line.
 */
export function format(obj, multiline = false, indent = 0) {
  const linePrefix =  multiline ? " ".repeat(indent + 2) : undefined
  const separator = multiline ? ",\n" : ", "
  const pairs = []

  for (const key in obj) {
    const value = obj[key]
    let pair = multiline ? `${linePrefix}${key}: ` : `${key}: `

    if (typeof value === "object" && value !== null) {
      pair += format(value, multiline, indent + 2)
    } else if (typeof value === "string") {
      pair += `"${value}"`
    } else {
      pair += value
    }

    pairs.push(pair)
  }

  const openingBracket = multiline ? "{\n" : "{ "
  const closingBracket = multiline ? `\n${" ".repeat(indent)}}` : " }"

  return `${openingBracket}${pairs.join(separator)}${closingBracket}`
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the standard string represetnation for most values (as used in string interpolation), or
 * {@linkcode format(obj)} for objects (`typeof value === "object"`).
 */
export function toString(obj: any) {
  return typeof obj === "object" ? format(obj) : `${obj}`
}

// -------------------------------------------------------------------------------------------------

/** Check if the string represents a positive integer. */
export function isStringPositiveInteger(str: string): boolean {
  const n = Math.floor(Number(str))
  return n !== Infinity && String(n) === str && n >= 0
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((num) => num < 10 ? "0" + num : num)
    .join(":")
}

// =================================================================================================