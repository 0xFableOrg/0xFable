import { useEffect, useRef, useState } from "react"
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai"

import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"

import CardContainer from "src/components/cards/cardContainer"
import { CancellationHandler } from "src/components/modals/loadingModal"
import useScrollBox from "src/hooks/useScrollBox"
import { CardPlacement } from "src/store/types"
import { convertBigIntArrayToStringArray } from "src/utils/js-utils"

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
    const { showLeftArrow, scrollLeft, showRightArrow, scrollRight, isLastCardGlowing } = useScrollBox(
        scrollWrapperRef,
        cards
    )

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
            } bottom-0 flex w-[95%] flex-row items-center justify-evenly space-x-2 py-4`}
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
                    className="absolute left-0 top-[55%] z-10 -translate-y-1/2 transform cursor-pointer p-2"
                    onClick={scrollLeft}
                >
                    <AiOutlineLeft className="text-[50px] text-white" />
                </div>
            )}
            <div className={`relative w-[90%] overflow-x-hidden overflow-y-visible`}>
                <div className="no-scrollbar overflow-x-scroll" ref={scrollWrapperRef}>
                    <div className="relative flex w-max">
                        <div className="flex flex-row items-end justify-center space-x-4 px-2">
                            <SortableContext items={range} strategy={horizontalListSortingStrategy}>
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
                    className="absolute right-0 top-[55%] z-10 -translate-y-1/2 transform cursor-pointer p-2"
                    onClick={scrollRight}
                >
                    <AiOutlineRight className="text-[50px] text-white" />
                </div>
            )}
        </div>
    )
}

export default Hand
