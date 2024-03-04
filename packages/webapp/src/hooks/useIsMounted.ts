/**
 * This hook should be used when setting state from a callback, to make sure the component is still
 * mounted (it's an error to set state in an unmounted component).
 *
 * NOTE: In React strict mode, React will run the effect then immediately remove it, only to re-run
 * it later. In the interval where the effect is removed, it might run other effects that will see
 * `fisMounted.current` as false. This should generally be fine, because this will be the *second*
 * run of these effects. Nevertheless it could cause errors if these effects observe the the
 * `isMounted` value to do something more fancy than simply not updating React state (which in a
 * second run would simply be a no-op as the state was already set).
 *
 * Source: https://usehooks-ts.com/react-hook/use-is-mounted
 */

import { RefObject, useEffect, useRef } from "react"

export function useIsMounted(): RefObject<boolean> {
    const isMounted = useRef(true)
    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    return isMounted
}
