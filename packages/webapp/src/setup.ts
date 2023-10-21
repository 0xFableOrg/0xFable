/**
 * This module contains logic to be called at the top of the app (via {@link setup}), representing
 * various hooks and customizations.
 *
 * @module setup
 */

// We're doing too much magic here.
// @ts-nocheck

import { setupStore } from "src/store/update"

// =================================================================================================

// Only run setup once.
let setupHasRun = false

export function setup() {
  if (setupHasRun) return
  setupHasRun = true

  setupFilterErrorMessages()
  setupFilterWarningMessages()
  setupFilterInfoMessages()

  // Only in dev mode, because that's where the annoying messages occur for now.
  if (process.env.NODE_ENV === "development")
    setupFilterLogMessages()

  setupBigintSerialization()

  setupStore()
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
    "ChainDoesNotSupportContract: Chain \"Localhost\" does not support contract \"ensUniversalResolver\"."
]

const filteredWarningMessages = [
  "Lit is in dev mode.",
  // React in dev mode, in Playwright
  "Please install/enable Redux devtools extension",
  // WalletConnect
  "SingleFile is hooking the IntersectionObserver API to detect and load deferred images"
]

const filteredInfoMessages = [
  // WalletConnect
  "Unsuccessful attempt at preloading some images"
]

const filteredLogMessages = [
  "[HMR] connected"
]

// -------------------------------------------------------------------------------------------------

function matchFilter(err?: string, filter: string|RegExp): boolean {
  if (err === undefined) return false
  return typeof filter === "string"
    ? err.startsWith(filter)
    : err.match(filter).length > 0
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.error} such that string errors starting with any of the strings in
 * {@link filteredErrorMessages} and object errors with a `code` property contained in {@link
 * filteredErrorCodes} will be filtered out. Instead they will be stored in {@link
 * window.suppressedErrors}.
 */
function setupFilterErrorMessages() {
  console.error = replaceFunction(console, "error", (oldFunction) => (arg) => {
    arg = arg?.toString()
    const filteredErr = filteredErrorMessages.some((filter) => matchFilter(arg, filter))
    const filteredCode = filteredErrorCodes.includes(arg?.code)

    if (filteredErr || filteredCode) {
      window["suppressedErrors"] ||= []
      window["suppressedErrors"].push(arg)
    } else {
      oldFunction(arg)
    }
  })
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.warn} such that string warnings starting with any of the strings in {@link
 * filteredWarningMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedWarnings}.
 */
function setupFilterWarningMessages() {
  console.warn = replaceFunction(console, "warn", (oldFunction) => (arg) => {
    arg = arg?.toString()
    const filteredMsg = filteredWarningMessages.some((filter) => matchFilter(arg, filter))

    if (filteredMsg) {
      window["suppressedWarnings"] ||= []
      window["suppressedWarnings"].push(arg)
    } else {
      oldFunction(arg)
    }
  })
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.info} such that string infos starting with any of the strings in {@link
 * filteredInfoMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedInfos}.
 */
function setupFilterInfoMessages() {
  console.info = replaceFunction(console, "info", (oldFunction) => (arg) => {
    arg = arg?.toString()
    const filteredMsg = filteredInfoMessages.some((filter) => matchFilter(arg, filter))

    if (filteredMsg) {
      window["suppressedInfos"] ||= []
      window["suppressedInfos"].push(arg)
    } else {
      oldFunction(arg)
    }
  })
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.log} such that string infos starting with any of the strings in {@link
  * filteredLogMessages} will be filtered out. Instead they will be stored in {@link
  * window.suppressedLogs}.
 */
function setupFilterLogMessages() {
  console.log = replaceFunction(console, "log", (oldFunction) => (arg) => {
    arg = arg?.toString()
    const filteredMsg = filteredLogMessages.some((filter) => matchFilter(arg, filter))

    if (filteredMsg) {
      window["suppressedLogs"] ||= []
      window["suppressedLogs"].push(arg)
    } else {
      oldFunction(arg)
    }
  })
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