/**
 * This module contains logic to be called at the top of the app (via {@link setup}), representing
 * various hooks and customizations.
 *
 * @module setup
 */

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

  setupBigintSerialization()

  setupStore()
}

// =================================================================================================

/**
 * Replaces an object's function, for instance:
 * `console.log = replaceFunction(console, "log", (old) => (...args) => old("LOGGING: ", ...args))`
 */
export function replaceFunction<T>
    (obj: object, name: string, replacement: (old: T) => T): T {
  const old = obj[name]["0xFable_oldFunction"] ?? obj[name]
  const result = replacement(old)
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

const filteredErrorMessages = [] // none right now

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

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.error} such that string errors starting with any of the strings in
 * {@link filteredErrorMessages} and object errors with a `code` property contained in {@link
 * filteredErrorCodes} will be filtered out. Instead they will be stored in {@link
 * window.suppressedErrors}.
 */
function setupFilterErrorMessages() {
  const oldError = console.error["oldError"] ?? console.error
  console.error = (err) => {
    const filteredMsg = typeof err === "string"
      && filteredErrorMessages.some((msg) => err.startsWith(msg))
    const filteredCode = filteredErrorCodes.includes(err?.code)

    if (filteredMsg || filteredCode) {
      window["suppressedErrors"] ||= []
      window["suppressedErrors"].push(err)
    } else {
      oldError(err)
    }
  }
  console.error["oldError"] = oldError
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.warn} such that string warnings starting with any of the strings in {@link
 * filteredWarningMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedWarnings}.
 */
function setupFilterWarningMessages() {
  const oldWarn = console.warn["oldWarn"] ?? console.warn
  console.warn = (warning) => {
    const filteredMsg = typeof warning === "string"
      && filteredWarningMessages.some((msg) => warning.startsWith(msg))

    if (filteredMsg) {
      window["suppressedWarnings"] ||= []
      window["suppressedWarnings"].push(warning)
    } else {
      oldWarn(warning)
    }
  }
  console.warn["oldWarn"] = oldWarn
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.info} such that string infos starting with any of the strings in {@link
 * filteredInfoMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedInfos}.
 */
function setupFilterInfoMessages() {
  const oldInfo = console.info["oldInfo"] ?? console.info
  console.info = (info) => {
    const filteredMsg = typeof info === "string"
      && filteredInfoMessages.some((msg) => info.startsWith(msg))

    if (filteredMsg) {
      window["suppressedInfos"] ||= []
      window["suppressedInfos"].push(info)
    } else {
      oldInfo(info)
    }
  }
  console.info["oldInfo"] = oldInfo
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