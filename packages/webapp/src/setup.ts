/**
 * This module contains logic to be called at the top of the app (via {@link setup}), representing
 * various hooks and customizations.
 *
 * @module setup
 */

import { setupStore } from "src/store"

// =================================================================================================

export function setup() {
  setupFilterErrorMessages()
  setupFilterWarningMessages()
  setupFilterInfoMessages()

  // Enable BigInts to be serialized as JSON.
  // This is needed for debug tools to handle BigInt in React state.
  if (BigInt.prototype["toJSON"] == undefined) {
    BigInt.prototype["toJSON"] = function() { return this.toString() }
  }

  setupStore()
}

// -------------------------------------------------------------------------------------------------

// Sadly, it's impossible to prevent Metamask errors, as these are caused by an addon and are
// isolated from the window context.

const filteredErrorCodes = [
  // we can handle this via error handlers
  "UNPREDICTABLE_GAS_LIMIT",
]

const filteredErrorMessages = [] // none right now

const filteredWarningMessages = [
  "Lit is in dev mode.",
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
  const oldError = console.error
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
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.warn} such that string warnings starting with any of the strings in {@link
 * filteredWarningMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedWarnings}.
 */
function setupFilterWarningMessages() {
  const oldWarn = console.warn
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
}

// -------------------------------------------------------------------------------------------------

/**
 * Hooks {@link console.info} such that string infos starting with any of the strings in {@link
 * filteredInfoMessages} will be filtered out. Instead they will be stored in {@link
 * window.suppressedInfos}.
 */
function setupFilterInfoMessages() {
  const oldInfo = console.info
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
}

// =================================================================================================