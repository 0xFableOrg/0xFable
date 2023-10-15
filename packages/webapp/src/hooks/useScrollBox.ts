import { useState, useEffect, useCallback } from "react"
import throttle from "lodash/throttle"

const timing = (1 / 60) * 1000
const decay = (v: any) => -0.1 * ((1 / timing) ^ 4) + v

function useScrollBox(scrollRef: any) {
  const [lastScrollX, setLastScrollX] = useState(0)
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false)
  const [showRightArrow, setShowRightArrow] = useState<boolean>(false)

  const scrollWrapperCurrent = scrollRef.current

  const cardWidth = 200 // width of card when not in focus
  const scrollAmount = 2 * cardWidth
  const duration = 300

  const checkArrowsVisibility = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth)
  }

  const smoothScroll = (target: number) => {
    if (!scrollRef.current) return

    const start = scrollRef.current.scrollLeft
    const startTime = Date.now()

    const animateScroll = () => {
      const now = Date.now()
      const time = Math.min(1, (now - startTime) / duration)

      scrollRef.current.scrollLeft = start + time * (target - start)

      if (time < 1) requestAnimationFrame(animateScroll)
      else checkArrowsVisibility()
    }

    requestAnimationFrame(animateScroll)
  }

  const scrollLeft = () => {
    if (!scrollRef.current) return
    const target = Math.max(0, scrollRef.current.scrollLeft - scrollAmount)
    smoothScroll(target)
  }

  const scrollRight = () => {
    if (!scrollRef.current) return
    const maxScrollLeft =
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    const target = Math.min(
      maxScrollLeft,
      scrollRef.current.scrollLeft + scrollAmount
    )
    smoothScroll(target)
  }

  const handleLastScrollX = useCallback(
    throttle((screenX) => {
      setLastScrollX(screenX)
    }, timing),
    []
  )

  const handleScroll = (e: WheelEvent) => {
    if (scrollRef.current) {
      // Adjust the scrollLeft property based on the deltaY value
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  const handleResize = () => {
    setShowLeftArrow(true)
    setShowRightArrow(true)
  }

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

  return {
    showLeftArrow,
    scrollLeft,
    showRightArrow,
    scrollRight,
  }
}

export default useScrollBox
