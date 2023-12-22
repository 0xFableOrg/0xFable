import React, { forwardRef, useState } from 'react'
import Image from "next/image"
import { testCards } from "src/utils/card-list"

interface HandCardProps {
  id: number
  handHovered?: boolean
  isDragging: boolean
  isDetailsVisible: boolean
}

const HandCard = forwardRef<HTMLDivElement, HandCardProps>(({ id, isDragging, handHovered, isDetailsVisible }, ref) => {
  const [ cardHover, setCardHover ]  = useState<boolean>(false)
  const showingDetails = isDetailsVisible && !isDragging
 
  return (
    <div 
     className={`relative w-full h-full`}
     style={{
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.3 : 1
      }}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => {
        setCardHover(false)
      }}
      ref={ref}
    >
      <span
        className={
          showingDetails
            ? "font-serif overflow-hidden text-2xl font-bold text-slate-200 text-left text-clip max-w-[320px] select-none"
            : handHovered
              ? "font-serif text-[14px] font-bold text-slate-200 text-left truncate select-none"
              : "hidden"
        }
      >
        {testCards[id]?.name}
      </span>
      <Image
        alt={`${id}`}
        src={testCards[id]?.image}
        width={showingDetails ? 375 : 200}
        height={showingDetails ? 375 : 200}
        className="pointer-events-none rounded-xl border select-none"
        style={{
          boxShadow:
            cardHover && !isDetailsVisible ? "0 0 10px 2px gold" : "none", // Adds golden glow when hovered
        }}
      />
      {showingDetails && (
        <>
          <p className="-mt-10 rounded-b-xl border border-t-0 bg-slate-900 font-mono font-semibold italic p-2 text-center select-none">
            {testCards[id]?.description}
          </p>
          <hr className="w-full border-slate-500" />
          <div className="flex w-full justify-between font-mono text-2xl">
            <p className="select-none">⚔️ {testCards[id]?.attack}</p>
            <p className="select-none">🛡 {testCards[id]?.defense}</p>
          </div>
        </>
      )}
    </div>
  )
})

HandCard.displayName = "HandCard"

export default HandCard