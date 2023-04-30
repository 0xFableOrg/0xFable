import { useEffect, useState } from "react"

// Returns true if the component has already been hydrated (it is not the firstrender), false
// otherwise (first render). Automatically triggers a re-render after hydration.
export const useIsHydrated = () => {
  const [isHydration, setIsHydration] = useState(false)

  useEffect(() => {
    setIsHydration(true);
  }, [])

  return isHydration
}
