import { useState } from 'react'
import Image from 'next/image'
import React from 'react'
import { testCards } from 'src/utils/card-list'

interface BoardCardProps {
	id: number
} 

const BoardCard: React.FC<BoardCardProps> = ({ id }) => {
	const [ showCardName, setShowCardName ] = useState<boolean>(false)

	return (
		<div 
      className="relative w-full h-full"
      onMouseEnter={() => setShowCardName(true)}
      onMouseLeave={() => setShowCardName(false)}
    >
			<Image 
				alt={`${id}`} 
				className="pointer-events-none rounded-xl border select-none"
				src={testCards[id]?.image}
				width={200}
				height={200}
				style={{
					boxShadow: "0 0 10px 2px gold",
				}}
			/>
      {showCardName && (
        <>
          <div className="flex w-full justify-between p-2 absolute top-0 left-0 right-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg select-none">
              {`${testCards[id]?.attack}`}
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg select-none">
              {`${testCards[id]?.defense}`}
            </div>
          </div>

          <span
            className={`absolute w-[90%] bottom-0 left-1/2 transform -translate-x-1/2 font-serif text-[14px] font-bold text-slate-200 text-center pb-2.5 select-none truncate transition-opacity duration-1000 ${
              showCardName ? "opacity-100" : "opacity-0"
            } hover:whitespace-normal hover:overflow-visible`}
          >
            {`${testCards[id]?.name}`}
          </span>
        </>
      )}
		</div>
	)
}

export default BoardCard