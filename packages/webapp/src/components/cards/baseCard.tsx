import React, { useState } from "react"
import { CardPlacement } from "src/store/types"
import { useSortable } from "@dnd-kit/sortable"
import DraggedCard from "./draggedCard"
import BoardCard from "./boardCard"
import HandCard from "./handCard"
import { CSS } from "@dnd-kit/utilities"

interface BaseCardProps {
  id: number
  className?: string
  handHovered?: boolean
  placement: CardPlacement
}

const BaseCard: React.FC<BaseCardProps> = ({
  id,
  className,
  handHovered,
  placement,
}) => {
  const [ isDetailsVisible, setIsDetailsVisible ] = useState<boolean>(false)
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

  const showingDetails = isDetailsVisible && !isDragging

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const renderCardContent = () => {
    switch (placement) {
      case CardPlacement.HAND:
        return (
          <HandCard
            id={id as number}
            handHovered={handHovered}
            isDragging={isDragging}
            isDetailsVisible={isDetailsVisible}
            ref={setNodeRef}
          />
        )
      case CardPlacement.BOARD:
        return <BoardCard id={id} ref={setNodeRef} />
      case CardPlacement.DRAGGED:
        return <DraggedCard id={id} ref={setNodeRef} />
      default:
        return null
    }
  }
  return (
    <div
      className={`${className} ${
        showingDetails
          ? "shadow-2xl z-[50] flex h-[33rem] max-w-[24rem] scale-[65%] cursor-pointer flex-col items-center justify-evenly rounded-lg border-4 bg-gray-900 p-5 transform translateY-[-50%]"
          : "flex flex-col space-y-1 max-w-[200px]"
      }`} // account for additional styles for HAND cards
      onClick={() => {
        placement === CardPlacement.HAND ??
          setIsDetailsVisible(!isDetailsVisible)
      }}
      onMouseLeave={() => {
        placement === CardPlacement.HAND ?? setIsDetailsVisible(false)
      }}
      style={sortableStyle}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {renderCardContent()}
    </div>
  )
}

export default BaseCard
