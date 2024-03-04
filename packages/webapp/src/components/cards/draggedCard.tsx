import Image from "next/image"
import React, { forwardRef } from "react"
import { testCards } from "src/utils/card-list"

interface DraggedCardProps {
    id: number
}

const DraggedCard = forwardRef<HTMLImageElement, DraggedCardProps>(({ id }, ref) => {
    return (
        <>
            <Image
                alt={`${id}`}
                className="pointer-events-none rounded-xl border select-none"
                src={testCards[id]?.image}
                width={200}
                height={200}
                style={{
                    boxShadow: "0 0 10px 2px gold",
                }}
                ref={ref}
            />
        </>
    )
})

DraggedCard.displayName = "DraggedCard"

export default DraggedCard
