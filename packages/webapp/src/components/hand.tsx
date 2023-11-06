import { useEffect, useRef, useState } from "react"
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai"
import useScrollBox from "../hooks/useScrollBox"
import * as store from "src/store/hooks"
import { CancellationHandler } from "src/components/lib/loadingModal"
import { HandCard } from "./handCard"
import { useDroppable } from "@dnd-kit/core"

const Hand = ({
  cards,
  className,
  setLoading,
  cancellationHandler
}: {
  cards: readonly bigint[] | null
  className?: string
  setLoading: (label: string | null) => void
  cancellationHandler: CancellationHandler
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const hand: any = []
  const scrollWrapperRef = useRef<any>()
  const { showLeftArrow, scrollLeft, showRightArrow, scrollRight } =
    useScrollBox(scrollWrapperRef)

  const gameID = store.useGameID()[0]!
  const playerAddress = store.usePlayerAddress()!

  if (cards && cards.length > 0) {
    for (let i = 0; i < cards?.length; i++) {
      hand.push(
        <div key={i}>
          <HandCard
            id={i}
            gameID={gameID}
            playerAddress={playerAddress}
            className="transitional-all duration-200 hover:scale-[100%] hover:border-yellow-500"
            handHovered={isFocused}
            setLoading={setLoading}
            cancellationHandler={cancellationHandler}
          />
        </div>
      )
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsFocused(true)
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div
      className={`${className} flex flex-row items-center justify-evenly bottom-0 w-[95%] space-x-2`}
      ref={setNodeRef}
      onMouseEnter={() => {
        setIsFocused(true)
      }}
      onMouseLeave={() => {
        setIsFocused(false)
      }}
    >
      {showLeftArrow && isFocused && (
        <div
          className="absolute top-[55%] transform -translate-y-1/2 left-0 z-10 p-2 cursor-pointer"
          onClick={scrollLeft}
        >
          <AiOutlineLeft className="text-white text-[50px]" />
        </div>
      )}
      <div className={`relative w-[90%] overflow-x-hidden overflow-y-visible`}>
        <div className="overflow-x-scroll no-scrollbar" ref={scrollWrapperRef}>
          <div className="relative flex w-max">
            <div className="flex flex-row items-end justify-center space-x-4 px-2">
              {hand}
            </div>
          </div>
        </div>
      </div>
      {showRightArrow && isFocused && (
        <div
          className="absolute top-[55%] transform -translate-y-1/2 right-0 z-10 p-2 cursor-pointer"
          onClick={scrollRight}
        >
          <AiOutlineRight className="text-white text-[50px]" />
        </div>
      )}
    </div>
  )
}

export default Hand
