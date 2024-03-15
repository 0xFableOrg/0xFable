import React, { forwardRef, useState } from "react"
import Image from "next/image"

import { testCards } from "src/utils/card-list"

interface BoardCardProps {
    id: number
}

const BoardCard = forwardRef<HTMLDivElement, BoardCardProps>(({ id }, ref) => {
    const [showCardName, setShowCardName] = useState<boolean>(false)

    return (
        <div
            className="relative h-full w-full"
            ref={ref}
            onMouseEnter={() => setShowCardName(true)}
            onMouseLeave={() => setShowCardName(false)}
        >
            <Image
                alt={`${id}`}
                className="pointer-events-none select-none rounded-xl border"
                src={testCards[id]?.image}
                width={200}
                height={200}
                style={{
                    boxShadow: "0 0 10px 2px gold",
                }}
            />
            {showCardName && (
                <>
                    <div className="absolute left-0 right-0 top-0 flex w-full justify-between p-2">
                        <div className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-gray-900">
                            {`${testCards[id]?.attack}`}
                        </div>
                        <div className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-red-600 text-lg font-bold text-gray-900">
                            {`${testCards[id]?.defense}`}
                        </div>
                    </div>

                    <span
                        className={`absolute bottom-0 left-1/2 w-[90%] -translate-x-1/2 transform select-none truncate pb-2.5 text-center font-serif text-[14px] font-bold text-slate-200 transition-opacity duration-1000 ${
                            showCardName ? "opacity-100" : "opacity-0"
                        } hover:overflow-visible hover:whitespace-normal`}
                    >
                        {`${testCards[id]?.name}`}
                    </span>
                </>
            )}
        </div>
    )
})

BoardCard.displayName = "BoardCard"

export default BoardCard
