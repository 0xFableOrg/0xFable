import { useState, useEffect, useCallback, RefObject } from "react"
import throttle from "lodash/throttle"
import { toast } from "sonner"

const timing = (1 / 60) * 1000

function useScrollBox(scrollRef: RefObject<HTMLDivElement>, cards: readonly bigint[] | null) {
    // Stores the last horizontal scroll position.
    const [lastScrollX, setLastScrollX] = useState(0)

    // Determines the visibility of navigation arrows based on scroll position.
    const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false)
    const [showRightArrow, setShowRightArrow] = useState<boolean>(false)

    const [isLastCardGlowing, setIsLastCardGlowing] = useState<boolean>(false)

    const scrollWrapperCurrent = scrollRef.current

    const cardWidth = 200 // width of card when not in focus
    const scrollAmount = 2 * cardWidth
    const duration = 300

    /** Checks and updates the arrow visibility states based on the scroll position. */
    const checkArrowsVisibility = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeftArrow(scrollLeft > 0)
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth)
    }

    /** Performs a smooth scrolling animation to a specified target position.
     *  Accepts a target scroll position and an optional callback to execute after completion. */
    const smoothScroll = useCallback((target: number, callback?: () => void) => {
        if (!scrollRef.current) return

        const start = scrollRef.current.scrollLeft
        const startTime = Date.now()

        const animateScroll = () => {
            const now = Date.now()
            const time = Math.min(1, (now - startTime) / duration)

            scrollRef.current!.scrollLeft = start + time * (target - start)

            if (time < 1) {
                requestAnimationFrame(animateScroll)
            } else {
                checkArrowsVisibility()
                if (callback) callback() // Execute callback after the scroll animation completes
            }
        }

        requestAnimationFrame(animateScroll)
    }, [])

    /** Scrolls the container a fixed distance to the left or right with animation. */
    const scrollLeft = () => {
        if (!scrollRef.current) return
        const target = Math.max(0, scrollRef.current.scrollLeft - scrollAmount)
        smoothScroll(target)
    }

    const scrollRight = () => {
        if (!scrollRef.current) return
        const maxScrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
        const target = Math.min(maxScrollLeft, scrollRef.current.scrollLeft + scrollAmount)
        smoothScroll(target)
    }

    /** Throttled function to update the last horizontal scroll position, minimizing performance impact. */
    const handleLastScrollX = useCallback(
        throttle((screenX) => {
            setLastScrollX(screenX)
        }, timing),
        []
    )

    /** Handles the wheel event to adjust the scrollLeft property, enabling horizontal scrolling. */
    const handleScroll = (e: WheelEvent) => {
        if (scrollRef.current) {
            // Adjust the scrollLeft property based on the deltaY value
            scrollRef.current.scrollLeft += e.deltaY
        }
    }

    /** Responds to window resize events to update arrow visibility states. */
    const handleResize = () => {
        setShowLeftArrow(true)
        setShowRightArrow(true)
    }

    /** Smoothly scrolls to the rightmost end of the container,
     *  triggers a glow in the last card added. */
    const smoothScrollToRightThenLeft = useCallback(() => {
        const element = scrollRef.current
        if (!element) return

        const targetRight = element.scrollWidth - element.clientWidth
        smoothScroll(targetRight, () => {
            triggerLastCardGlow()
        })
    }, [scrollRef])

    const triggerLastCardGlow = useCallback(() => {
        setIsLastCardGlowing(true)
        // dismiss the toast displaying draw status
        toast.dismiss("DRAW_CARD_TOAST")
        setTimeout(() => {
            setIsLastCardGlowing(false)
        }, 2500)
    }, [])

    /** Sets up and cleans up event listeners for resize, scroll, and wheel events. */
    useEffect(() => {
        if (scrollRef.current) {
            checkArrowsVisibility()

            window.addEventListener("resize", handleResize)

            const scrollWrapper = scrollRef.current
            if (scrollWrapper) {
                scrollWrapper.addEventListener("scroll", checkArrowsVisibility)
                scrollWrapper.addEventListener("wheel", handleScroll)
            }

            // Cleanup function
            return () => {
                window.removeEventListener("resize", handleResize)

                if (scrollWrapper) {
                    scrollWrapper.removeEventListener("scroll", checkArrowsVisibility)
                    scrollWrapper.removeEventListener("wheel", handleScroll)
                }
            }
        }
    }, [scrollWrapperCurrent, handleLastScrollX, lastScrollX])

    // Detects changes in the `cards` array to trigger the pop-up effect and initiate smooth scrolling to highlight new content.
    useEffect(() => {
        if (cards && cards.length > 0) {
            const timer = setTimeout(() => {
                smoothScrollToRightThenLeft()
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [cards, smoothScrollToRightThenLeft])

    return {
        showLeftArrow,
        scrollLeft,
        showRightArrow,
        scrollRight,
        isLastCardGlowing,
    }
}

export default useScrollBox
