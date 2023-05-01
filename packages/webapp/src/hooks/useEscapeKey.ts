import { useCallback, useEffect } from "react"

import "utils/extensions"

// =================================================================================================

const KEY_NAME_ESC = 'Escape'
const KEY_EVENT_TYPE = 'keyup'

const callbacks = []

// =================================================================================================

/**
 * Register a callback to be called when the Escape key is pressed. If multiple components
 * register an ESC callback, only the most recent one is applied.
 *
 * After a component is unmounted (or disabled via the {@link enabled} parameter), its callback is
 * removed, and the behaviour of the ESC key reverts to the previous callback, if any.
 */
export function useEscapeKey(enabled = true, handleEscape: () => void) {
  const handleEscKey = useCallback((event) => {
    if (event.key === KEY_NAME_ESC)
      handleEscape()
  }, [handleEscape])

  useEffect(() => {
    // Nothing to do if not enabled. If the hook was previously enabled, the cleanup function will
    // be run, removing the hook.
    if (enabled) {
      // remove previous callback, install new one
      if (callbacks.length > 0)
        document.removeEventListener(KEY_EVENT_TYPE, callbacks.last)
      callbacks.push(handleEscKey)
      document.addEventListener(KEY_EVENT_TYPE, handleEscKey)

      return () => {
        // remove callback & restore previous one
        document.removeEventListener(KEY_EVENT_TYPE, handleEscKey)
        callbacks.pop()
        if (callbacks.length > 0)
          document.addEventListener(KEY_EVENT_TYPE, callbacks.last)
      }
    }
  }, [handleEscKey, enabled])
}
// =================================================================================================