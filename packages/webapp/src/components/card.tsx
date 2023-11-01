import { useState } from "react"
import { DragOverlay, useDraggable } from "@dnd-kit/core"
import Image from "next/image"
import { playCard } from "src/actions/playCard"
import { Address } from "src/chain"
import { CancellationHandler } from "src/components/lib/loadingModal"

// quick fix for hackathon
const cards = [
  {
    name: "Goblin Spawn, The Damned",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0.jpg",
  },
  {
    name: "Eternal Smite, Unborn Legacy",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/1.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/2.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/3.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/4.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/5.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/6.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/7.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/8.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/9.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0.jpg",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0.jpg",
  },
]

export const Card = ({
  id,
  gameID,
  playerAddress,
  className,
  handHovered,
  setLoading,
  cancellationHandler
}: {
  // TODO id has a double role as ID and card index in hand
  id: number
  gameID: bigint
  playerAddress: Address
  className?: string
  handHovered?: boolean
  setLoading: (label: string | null) => void
  cancellationHandler: CancellationHandler
}) => {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `card-${id}`,
    })

  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false)
  const [cardHover, setCardHover] = useState<boolean>(false)

  const cardDisplayContent = (
    <div
      className={`${className} transition-all ease-in-out duration-300 ${
        isDetailsVisible && !isDragging
          ? "shadow-2xl z-[50] flex h-[33rem] max-w-[24rem] scale-[65%] cursor-pointer flex-col items-center justify-evenly rounded-lg border-4 bg-gray-900 p-5 transform translateY-[-50%]"
          : "flex flex-col space-y-1 max-w-[200px]"
      }`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        zIndex: isDragging ? 1000 : 1,
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
          isDetailsVisible && !isDragging
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
        width={isDetailsVisible && !isDragging ? 375 : 200}
        height={isDetailsVisible && !isDragging ? 375 : 200}
        className="pointer-events-none rounded-xl border select-none"
        style={{
          boxShadow:
            cardHover && !isDetailsVisible ? "0 0 10px 2px gold" : "none", // Adds golden glow when hovered
        }}
      />
      {isDetailsVisible && !isDragging && (
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

  // -----------------------------------------------------------------------------------------------
  
  if (isDragging) {
    return ReactDOM.createPortal(
      <DragOverlay>{cardDisplayContent}</DragOverlay>,
      document.body
    )
  }
  return cardDisplayContent
}
