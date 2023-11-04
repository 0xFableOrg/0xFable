import * as store from "src/store/hooks"
import { shortenAddress } from "src/utils/js-utils"
import { useDroppable } from "@dnd-kit/core"
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable"
import PlayedCard from "./playedCard"

interface PlayerBoardProps {
  playerAddress: `0x${string}` | undefined | null, // opponent on top, current player below
  playedCards: number[] // ids of cards they have in play
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ playerAddress, playedCards }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "player-board",
  })

  const currentPlayerAddress = store.usePlayerAddress()

  return (
    <div
      className={playerAddress !== currentPlayerAddress 
        ? `border-b-1 relative row-span-6 rounded-xl rounded-b-none border bg-base-300 shadow-inner overflow-hidden`
        : `relative row-span-6 rounded-xl rounded-t-none border border-t-0 bg-base-300 shadow-inner overflow-hidden`}
      ref={setNodeRef}
      style={{
        color:
          isOver && playerAddress === currentPlayerAddress
            ? "green"
            : undefined,
        borderColor:
          isOver && playerAddress === currentPlayerAddress
            ? "green"
            : undefined,
      }}
    >
      <div className="relative flex flex-col">
        <div className="flex flex-row p-2 space-x-3 justify-start items-center">
          <p className="z-0 m-2 font-mono font-bold select-none">
            {" "}
            {`🛡 ${shortenAddress(playerAddress)}`}{" "}
          </p>
          <p className="z-0 m-3 font-mono font-bold select-none"> ♥️ 100 </p>
        </div>
        <SortableContext
          items={playedCards}
          strategy={horizontalListSortingStrategy}
        >
          <div className="absolute top-[100%] flex flex-row px-4 space-x-4 items-center justify-center w-full">
            {playedCards?.map((card) => (
              <PlayedCard
                key={card}
                id={card}
                className={`flex flex-col items-start space-y-3 relative`}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default PlayerBoard
