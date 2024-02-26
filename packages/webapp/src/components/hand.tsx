import { useEffect, useRef, useState } from "react"
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai"
import useScrollBox from "../hooks/useScrollBox"
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CardPlacement } from "src/store/types"
import CardContainer from "./cards/cardContainer"
import { convertBigIntArrayToStringArray } from "src/utils/js-utils"
import { CancellationHandler } from "src/components/modals/loadingModal"

const Hand = ({
  cards,
  className,
}: {
  cards: readonly bigint[] | null
  className?: string
  setLoading: (label: string | null) => void
  cancellationHandler: CancellationHandler
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)
  const {
    showLeftArrow,
    scrollLeft,
    showRightArrow,
    scrollRight,
    isLastCardGlowing,
  } = useScrollBox(scrollWrapperRef, cards)

  const { setNodeRef } = useSortable({
    id: CardPlacement.HAND,
  })

  const convertedCards = convertBigIntArrayToStringArray(cards)
  const range = convertedCards?.map((_, index) => index + 1) ?? []

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
      className={`${className} ${
        isLastCardGlowing ? "translate-y-0" : null
      } py-4 flex flex-row items-center justify-evenly bottom-0 w-[95%] space-x-2`}
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
              <SortableContext
                items={range}
                strategy={horizontalListSortingStrategy}
              >
                {range.map((index) => (
                  <div key={index}>
                    <CardContainer
                      id={convertedCards[index - 1]}
                      placement={CardPlacement.HAND}
                      cardGlow={isLastCardGlowing && index === range.length}
                    />
                  </div>
                ))}
              </SortableContext>
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
