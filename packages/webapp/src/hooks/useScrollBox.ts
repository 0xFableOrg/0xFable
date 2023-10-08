import { useState, useEffect, useCallback } from "react";
import throttle from "lodash/throttle";

const timing = (1 / 60) * 1000;
const decay = (v: any) => -0.1 * ((1 / timing) ^ 4) + v;

function useScrollBox(scrollRef: any) {
  const [clickStartX, setClickStartX] = useState();
  const [scrollStartX, setScrollStartX] = useState();
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [lastScrollX, setLastScrollX] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false);
  const [showRightArrow, setShowRightArrow] = useState<boolean>(false);

  const scrollWrapperCurrent = scrollRef.current;

  const cardWidth = 200; // width of card when not in focus
  const scrollAmount = 2 * cardWidth;
  const duration = 300;

  const checkArrowsVisibility = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
  };

  const smoothScroll = (target: number) => {
    if (!scrollRef.current) return;

    const start = scrollRef.current.scrollLeft;
    const startTime = Date.now();

    const animateScroll = () => {
      const now = Date.now();
      const time = Math.min(1, (now - startTime) / duration);

      scrollRef.current.scrollLeft = start + time * (target - start);

      if (time < 1) requestAnimationFrame(animateScroll);
      else checkArrowsVisibility();
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const target = Math.max(0, scrollRef.current.scrollLeft - scrollAmount);
    smoothScroll(target);
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const maxScrollLeft =
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    const target = Math.min(
      maxScrollLeft,
      scrollRef.current.scrollLeft + scrollAmount
    );
    smoothScroll(target);
  };

  const handleLastScrollX = useCallback(
    throttle((screenX) => {
      setLastScrollX(screenX);
    }, timing),
    []
  );
  const handleMomentum = useCallback(
    throttle((nextMomentum) => {
      setMomentum(nextMomentum);
      scrollRef.current.scrollLeft =
        scrollRef.current.scrollLeft + nextMomentum * timing * direction;
    }, timing),
    [scrollWrapperCurrent, direction]
  );
  useEffect(() => {
    if (direction !== 0) {
      if (momentum > 0.1 && !isDragging) {
        handleMomentum(decay(momentum));
      } else if (isDragging) {
        setMomentum(speed);
      } else {
        setDirection(0);
      }
    }
  }, [momentum, isDragging, speed, direction, handleMomentum]);

  useEffect(() => {
    if (scrollRef.current) {
      const handleDragStart = (e: any) => {
        setClickStartX(e.screenX);
        setScrollStartX(scrollRef.current.scrollLeft);
        setDirection(0);
      };
      const handleDragMove = (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        if (clickStartX !== undefined && scrollStartX !== undefined) {
          const touchDelta = (clickStartX as number) - e.screenX;
          scrollRef.current.scrollLeft = (scrollStartX as number) + touchDelta;

          if (Math.abs(touchDelta) > 1) {
            setIsDragging(true);
            setDirection(touchDelta / Math.abs(touchDelta));
            setSpeed(Math.abs((lastScrollX - e.screenX) / timing));
            handleLastScrollX(e.screenX);
          }
        }
      };
      const handleDragEnd = () => {
        if (isDragging && clickStartX !== undefined) {
          setClickStartX(undefined);
          setScrollStartX(undefined);
          setIsDragging(false);
        }
      };

      if (scrollRef.current.ontouchstart === undefined) {
        scrollRef.current.onmousedown = handleDragStart;
        scrollRef.current.onmousemove = handleDragMove;
        scrollRef.current.onmouseup = handleDragEnd;
        scrollRef.current.onmouseleave = handleDragEnd;
      }

      checkArrowsVisibility();
      const scrollWrapper = scrollRef.current;
      if (scrollWrapper) {
        scrollWrapper.addEventListener("scroll", checkArrowsVisibility);
      }
      return () => {
        if (scrollWrapper) {
          scrollWrapper.removeEventListener("scroll", checkArrowsVisibility);
        }
      };
    }
  }, [
    scrollWrapperCurrent,
    clickStartX,
    isDragging,
    scrollStartX,
    handleLastScrollX,
    lastScrollX,
  ]);

  return {
    clickStartX,
    scrollStartX,
    isDragging,
    direction,
    momentum,
    lastScrollX,
    speed,
    showLeftArrow,
    scrollLeft,
    showRightArrow,
    scrollRight,
  };
}

export default useScrollBox;
