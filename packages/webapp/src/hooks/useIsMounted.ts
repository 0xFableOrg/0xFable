// This hook should be used when setting state from a callback, to make sure the component is still
// mounted (it's an error to set state in an unmounted compoent).
// NOTE(norswap): Currently unused
// Source: https://usehooks-ts.com/react-hook/use-is-mounted
import { useCallback, useEffect, useRef } from "react"

export function useIsMounted() {
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return useCallback(() => isMounted.current, [])
}