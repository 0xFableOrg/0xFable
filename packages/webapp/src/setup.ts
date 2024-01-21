/**
 * This module contains logic that runs as a side-effect of module iniitalization, and should be run
 * first thing when the app launches. It sets up various hooks and customizations.
 *
 * @module setup
 */

// We're doing too much magic here.
// @ts-nocheck

// =================================================================================================
// SETUP

// Called at bottom of this file.
function setup() {
  setupFilterErrorMessages()
  setupFilterWarningMessages()
  setupFilterInfoMessages()

  // Only in dev mode, because that's where the annoying messages occur for now.
  if (process.env.NODE_ENV === "development")
    setupFilterLogMessages()

  setupBigintSerialization()
}

// =================================================================================================

/**
 * Replaces an object's function, for instance:
 * `console.log = replaceFunction(console, "log", (old) => (...args) => old("LOGGING: ", ...args))`
 */
export function replaceFunction<T>
    (obj: any, name: string, replacement: (old: T) => T): T {
  const old = obj[name]["0xFable_oldFunction"] ?? obj[name]
  const result = replacement(old) as any
  result["0xFable_oldFunction"] = old
  return result
}

// =================================================================================================
// CONSOLE LOGGING

// Sadly, it's impossible to prevent Metamask errors, as these are caused by an addon and are
// isolated from the window context.

const filteredErrorCodes = [
  // we can handle this via error handlers
  "UNPREDICTABLE_GAS_LIMIT",
]

const filteredErrorMessages: (string|RegExp)[] = [
    "ChainDoesNotSupportContract: Chain \"Localhost\" does not support contract \"ensUniversalResolver\".",
    "ChainDoesNotSupportContract: Chain \"Rollop\" does not support contract \"ensUniversalResolver\"."
]

const filteredWarningMessages = [
  "Lit is in dev mode.",
  // React in dev mode, in Playwright
  "Please install/enable Redux devtools extension",
  // WalletConnect
  "SingleFile is hooking the IntersectionObserver API to detect and load deferred images",
  // NextJS — I can tell and things should be designed to work
  "[Fast Refresh] performing full reload"
]

const filteredInfoMessages = [
  // WalletConnect
  "Unsuccessful attempt at preloading some images"
]

const filteredLogMessages = [
  // NextJS — used by FastRefresh
  "[HMR] connected"
]

// Logs I can't suppress:
//
// - "[HMR] connected"
//     - from NextJS (Hot Module Replacement), loaded before my code

// - "Ignoring unsupported entryTypes: largest-contentful-paint."
//     - only on Firefox
//     - Origin unknown, seems to be from Firefox via a performance observer, but pinpointed in the
//       `play.js` chunk.
//
// - 'Partitioned cookie or storage access was provided to
//    “https://verify.walletconnect.com/8934622f70e11b51de893ea309871a4c” because it is loaded in
//    the third-party context and dynamic state partitioning is enabled.'
//      - only on Firefox, URL varies
//
// - Source map error: Error: NetworkError when attempting to fetch resource.
//    - only on Firefox
//
// You can hide those with the filter: -/HMR.*connected|Partitioned|entryTypes|Source map error/

// -------------------------------------------------------------------------------------------------

function matchFilter(err?: string, filter: string|RegExp): boolean {
  if (err === undefined) return false
  return typeof filter === "string"
    ? err.startsWith(filter)
    : err.match(filter).length > 0
}

// -------------------------------------------------------------------------------------------------

function setupFiltering(
    level: string, filteredMessages: (string|RegExp)[], filteredCodes?: string[]) {

  console[level] = replaceFunction(console, level, (oldFunction) => (msg, ...args) => {

    if (typeof msg === "string" && args.length > 0)
      // Very imperfect implementation of string substitutions, good enough for us.
      msg.replace(/%s/g, () => args.shift())

    const msgStr = msg?.toString()

    const filteredMsg = filteredMessages.some((filter) => matchFilter(msgStr, filter))
    const filteredCode = filteredCodes && filteredCodes.includes(msg?.code)

    if (filteredMsg || filteredCode) {
      const suppressed = `suppressed${level[0].toUpperCase()}${level.slice(1)}s`
      console[suppressed] ||= []
      console[suppressed].push(msgStr)
    } else {
      oldFunction(msg, ...args)
    }
  })
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.error} such that string errors starting with any of the strings in {@link
 * filteredErrorMessages} and object errors with a `code` property contained in {@link
 * filteredErrorCodes} will be filtered out. Instead they will be stored in
 * `console.suppressedErrors`.
 */
function setupFilterErrorMessages() {
  setupFiltering("error", filteredErrorMessages, filteredErrorCodes)
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.warn} such that string warnings starting with any of the strings in {@link
 * filteredWarningMessages} will be filtered out. Instead they will be stored in
 * `console.suppressedWarnings`.
 */
function setupFilterWarningMessages() {
  setupFiltering("warn", filteredWarningMessages)
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.info} such that string infos starting with any of the strings in {@link
 * filteredInfoMessages} will be filtered out. Instead they will be stored in
 * `console.suppressedInfos`.
 */
function setupFilterInfoMessages() {
  setupFiltering("info", filteredInfoMessages)
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.log} such that string infos starting with any of the strings in {@link
 * filteredLogMessages} will be filtered out. Instead they will be stored in
 * `console.suppressedLogs`.
 */
function setupFilterLogMessages() {
  setupFiltering("log", filteredLogMessages)
}

// =================================================================================================
// JSON SERIALIZATION/DESERIALIZATION

// Enable BigInts to be serialized to / deserialized from JSON.
// This is needed for debug tools to handle BigInt in React state, and is just a lot more convenient
// than adding explicit parsing everywhere in general.
function setupBigintSerialization() {

  // Same behaviour as wagmi serialize/deserialize, but hand-rolled because redefining
  // stringify/parse in terms of the wagmi function creates infinite recursion.

  // Serialization
  const oldStringify = JSON.stringify["oldStringify"] ?? JSON.stringify
  JSON.stringify = (value, replacer, space) => {
    return oldStringify(value, (key, value) => {
      if (typeof value === "bigint")
        return `#bigint.${value}`
      else if (typeof replacer === "function")
        return replacer(key, value)
      else
        return value
    }, space)
  }
  JSON.stringify["oldStringify"] = oldStringify

  // Deserialization
  const oldParse = JSON.parse["oldParse"] ?? JSON.parse
  JSON.parse = (text, reviver) => {
    return oldParse(text, (key, value) => {
      // We only values of shape "#bigint.<data>"
      if (typeof value === "string" && value.startsWith("#bigint."))
            return BigInt(value.slice(8)).valueOf()
      // Otherwise fallback to normal behavior
      if (typeof reviver === "function")
        return reviver(key, value)
      else
        return value
    })
  }
  JSON.parse["oldParse"] = oldParse
}

// =================================================================================================

setup()

// =================================================================================================