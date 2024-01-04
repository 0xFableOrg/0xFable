import React from "react"
import { CardPlacement } from "src/store/types"
import { useSortable } from "@dnd-kit/sortable"
import DraggedCard from "./draggedCard"
import BoardCard from "./boardCard"
import HandCard from "./handCard"
import { CSS } from "@dnd-kit/utilities"
import { convertStringToSafeNumber } from "src/utils/js-utils"

interface BaseCardProps {
  id: string
  className?: string
  handHovered?: boolean
  placement: CardPlacement
}

const CardContainer: React.FC<BaseCardProps> = ({
  id,
  handHovered,
  placement,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: placement === CardPlacement.BOARD ? `B-${id}` : `H-${id}`,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const idAsNum = convertStringToSafeNumber(id); // to refer to cards in JSON file

  const renderCardContent = () => {
    switch (placement) {
      case CardPlacement.HAND:
        return (
          <HandCard
            id={idAsNum}
            handHovered={handHovered}
            isDragging={isDragging}
            ref={setNodeRef}
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
      className={`${"shadow-2xl z-[50] flex  max-w-[24rem] cursor-pointer flex-col items-center justify-evenly rounded-lg bg-gray-900 transform translateY-[-50%]"}`}
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
