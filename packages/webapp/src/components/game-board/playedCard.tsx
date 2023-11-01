import Image from "next/image"
import React, { useState } from "react"
import { cards } from "src/utils/card-list"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const PlayedCard = ({
  id,
  className,
}: {
  id: number
  key: number
  className?: string
}) => {
  const [ showCardName, setShowCardName ] = useState<boolean>(false)

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `playedCard-${id}` })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      className={`${className}`}
      style={sortableStyle}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setShowCardName(true)}
      onMouseLeave={() => setShowCardName(false)}
    >
      <Image
        alt={`${id}`}
        src={cards[id]?.image}
        width={200}
        height={200}
        className="pointer-events-none rounded-xl border select-none"
        style={{
          boxShadow: "0 0 10px 2px gold",
        }}
      />

      {showCardName && (
        <>
          <div className="flex w-full justify-between px-2 absolute top-0 left-0 right-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg">
              {`${cards[id]?.attack}`}
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg">
              {`${cards[id]?.defense}`}
            </div>
          </div>

          <span
            className={`absolute w-[90%] bottom-0 left-1/2 transform -translate-x-1/2 font-serif text-[14px] font-bold text-slate-200 text-center pb-2.5 select-none truncate transition-opacity duration-1000 ${
              showCardName ? "opacity-100" : "opacity-0"
            } hover:whitespace-normal hover:overflow-visible`}
          >
            {`${cards[id]?.name}`}
          </span>
        </>
      )}
    </div>
  )
}

export default PlayedCard
