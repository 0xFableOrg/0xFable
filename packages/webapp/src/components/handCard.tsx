import { useState } from "react"
import Image from "next/image"
import { playCard } from "src/actions/playCard"
import { Address } from "src/chain"
import { CancellationHandler } from "src/components/lib/loadingModal"
import { cards } from "src/utils/card-list"
import { useSortable } from "@dnd-kit/sortable"
import { CardPlacement } from "src/store/types"
import { CSS } from "@dnd-kit/utilities"

export const HandCard = ({
  id,
  gameID,
  playerAddress,
  className,
  handHovered,
  setLoading,
  cancellationHandler,
  placement,
}: {
  // TODO id has a double role as ID and card index in hand
  id: number
  gameID: bigint
  playerAddress: Address
  className?: string
  handHovered?: boolean
  setLoading: (label: string | null) => void
  cancellationHandler: CancellationHandler
  placement?: CardPlacement
}) => {
  // @todo cleanup
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } =
    useSortable({
      id: id, // currently the IDs used to reference the hard coded cards
    })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [ isDetailsVisible, setIsDetailsVisible ] = useState<boolean>(false)
  const [ cardHover, setCardHover]  = useState<boolean>(false)
  const [ showCardName, setShowCardName ] = useState<boolean>(false)

  const showingDetails = isDetailsVisible && !isDragging

  const handCardDisplayContent = (
    <div
      className={`${className} transition-all ease-in-out duration-300 ${
        showingDetails
          ? "shadow-2xl z-[50] flex h-[33rem] max-w-[24rem] scale-[65%] cursor-pointer flex-col items-center justify-evenly rounded-lg border-4 bg-gray-900 p-5 transform translateY-[-50%]"
          : "flex flex-col space-y-1 max-w-[200px]"
      }`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.3 : 1
      }}
      onClick={() => {
        setIsDetailsVisible(!isDetailsVisible)
        void playCard({
          gameID,
          playerAddress,
          cardIndexInHand: id,
          setLoading,
          cancellationHandler
        })
      }}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => {
        setIsDetailsVisible(false)
        setCardHover(false)
      }}
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
        {cards[id]?.name}
      </span>
      <Image
        alt={`${id}`}
        src={cards[id]?.image}
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
            {cards[id]?.description}
          </p>
          <hr className="w-full border-slate-500" />
          <div className="flex w-full justify-between font-mono text-2xl">
            <p className="select-none">⚔️ {cards[id]?.attack}</p>
            <p className="select-none">🛡 {cards[id]?.defense}</p>
          </div>
        </>
      )}
    </div>
  )

  const boardCardDisplayContent = (
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
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg select-none">
              {`${cards[id]?.attack}`}
            </div>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg select-none">
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

  // -----------------------------------------------------------------------------------------------
  
  if (placement === CardPlacement.BOARD) {
    return boardCardDisplayContent
  } else {
    // cards being dragged and cards in hand
    return handCardDisplayContent
  }
}
