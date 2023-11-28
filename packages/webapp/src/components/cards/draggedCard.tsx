// import { Transform } from '@dnd-kit/utilities'
import Image from 'next/image'
import React from 'react'
import { testCards } from 'src/utils/card-list'

interface DraggedCardProps {
	id: number
	// isDragging: boolean
	// transform: Transform|null
	// transition: string|undefined
} 

const DraggedCard: React.FC<DraggedCardProps> = ({ id }) => {
	// when dragged, only the image needs to be seen, maybe can add a zoom style or some fancy bordering/framer magic
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
			/>
		</>
	)
}

export default DraggedCard