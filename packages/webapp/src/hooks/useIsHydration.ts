import { useEffect, useState } from "react"

// Returns true if this is the hydration (initial) render, false otherwise.
// Automatically triggers a re-render after hydration.
export const useIsHydration = () => {
  const [isHydration, setIsHydration] = useState(false)

  useEffect(() => {
    setIsHydration(true);
  }, [])

  return isHydration
}
