import { useEffect, useState } from "react"

/**
 * Returns true if the component has already been hydrated (it is not the first render), false
 * otherwise (first render). Automatically triggers a re-render after hydration.
 *
 * You can also check if you're undergoing server-side rendering if the window property exists:
 * `if (typeof window !== "undefined") // not server side-rendering`.
 */
export const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true);
  }, [])

  return isHydrated
}
