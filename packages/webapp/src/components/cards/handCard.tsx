import React, { forwardRef, useState } from "react"
import Image from "next/image"

import { testCards } from "src/utils/card-list"

interface HandCardProps {
    id: number
    handHovered?: boolean
    isDragging: boolean
    cardGlow?: boolean
}

const HandCard = forwardRef<HTMLDivElement, HandCardProps>(({ id, isDragging, handHovered, cardGlow }, ref) => {
    const [cardHover, setCardHover] = useState<boolean>(false)
    const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false)
    const showingDetails = isDetailsVisible && !isDragging

    return (
        <div
            className={`flex h-full w-full flex-col ${
                showingDetails ? "rounded-xl border-[1px] border-white p-4" : null
            }`}
            style={{
                zIndex: isDragging ? 1000 : 1,
                opacity: isDragging ? 0.3 : 1,
            }}
            onClick={() => {
                setIsDetailsVisible(!isDetailsVisible)
            }}
            onMouseEnter={() => setCardHover(true)}
            onMouseLeave={() => {
                setCardHover(false)
                setIsDetailsVisible(false)
            }}
            ref={ref}
        >
            <span
                className={
                    showingDetails
                        ? "max-w-[320px] select-none overflow-hidden text-clip text-left font-serif text-2xl font-bold text-slate-200"
                        : handHovered
                          ? "select-none truncate text-left font-serif text-[14px] font-bold text-slate-200"
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
                className="pointer-events-none select-none rounded-xl border"
                style={{
                    boxShadow: (cardHover && !isDetailsVisible) || cardGlow ? "0 0 10px 2px gold" : "none", // Adds golden glow when hovered
                }}
            />
            {showingDetails && (
                <>
                    <p className="-mt-10 select-none rounded-b-xl border border-t-0 bg-slate-900 p-2 text-center font-mono font-semibold italic">
                        {testCards[id]?.description}
                    </p>
                    <hr className="mt-2 w-full border-slate-500" />
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
