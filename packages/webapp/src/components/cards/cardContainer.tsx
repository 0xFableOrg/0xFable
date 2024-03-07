import React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { CardPlacement } from "src/store/types"
import { convertStringToSafeNumber } from "src/utils/js-utils"

import BoardCard from "./boardCard"
import DraggedCard from "./draggedCard"
import HandCard from "./handCard"

interface BaseCardProps {
    id: string
    className?: string
    handHovered?: boolean
    placement: CardPlacement
    cardGlow?: boolean
}

const CardContainer: React.FC<BaseCardProps> = ({ id, handHovered, placement, cardGlow }) => {
    const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
        id: placement === CardPlacement.BOARD ? `B-${id}` : `H-${id}`,
    })

    const sortableStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const idAsNum = convertStringToSafeNumber(id) // to refer to cards in JSON file

    const renderCardContent = () => {
        switch (placement) {
            case CardPlacement.HAND:
                return (
                    <HandCard
                        id={idAsNum}
                        handHovered={handHovered}
                        isDragging={isDragging}
                        ref={setNodeRef}
                        cardGlow={cardGlow}
                    />
                )
            case CardPlacement.BOARD:
                return <BoardCard id={idAsNum} ref={setNodeRef} />
            case CardPlacement.DRAGGED:
                return <DraggedCard id={idAsNum} ref={setNodeRef} />
            default:
                return null
        }
    }
    return (
        <div
            className={`${"translateY-[-50%] z-[50] flex  max-w-[24rem] transform cursor-pointer flex-col items-center justify-evenly rounded-lg bg-gray-900 shadow-2xl"}`}
            style={sortableStyle}
            ref={setNodeRef}
            {...attributes}
            {...listeners}
        >
            {renderCardContent()}
        </div>
    )
}

export default CardContainer
