import * as store from "src/store/hooks"
import { shortenAddress } from "src/utils/js-utils"
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { HandCard } from "../handCard"
import { CardPlacement } from "src/store/types"

interface PlayerBoardProps {
  playerAddress: `0x${string}`|undefined|null, // opponent on top, current player below
  playedCards: number[] // ids of cards they have in play
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({
  playerAddress,
  playedCards,
}) => {
  const { setNodeRef, isOver } = useSortable({
    id: "player-board",
  })

  const currentPlayerAddress = store.usePlayerAddress()
  const playerActive = isOver && playerAddress === currentPlayerAddress
  return (
      <div
        className={
          playerAddress !== currentPlayerAddress
            ? `border-b-1 relative row-span-6 rounded-xl rounded-b-none border bg-base-300 shadow-inner overflow-hidden`
            : `relative row-span-6 rounded-xl rounded-t-none border border-t-0 bg-base-300 shadow-inner overflow-hidden`
        }
        ref={setNodeRef}
        style={{
          color: playerActive ? "green" : undefined,
          borderColor: playerActive ? "green" : undefined,
        }}
      >
        <div className="relative flex flex-col items-center space-y-4">
          <div className="flex flex-row p-2 space-x-3 self-start items-center">
            <p className="z-0 m-2 font-mono font-bold select-none">
              {" "}
              {`🛡 ${shortenAddress(playerAddress)}`}{" "}
            </p>
            <p className="z-0 m-3 font-mono font-bold select-none"> ♥️ 100 </p>
          </div>

          <div className={`absolute top-[150%] flex flex-row p-4 space-x-4 rounded-xl mx-4 items-center justify-center min-h-[220px] min-w-[95%] ${playerActive ? "bg-green-700 opacity-50" : null}`}>
            <SortableContext items={playedCards} strategy={horizontalListSortingStrategy}>
              {playedCards?.map((card) => (
                // @todo rename HandCard to Card
                <HandCard 
                  key={card} 
                  id={card} 
                  className={`flex flex-col items-start space-y-3 relative`} 
                  placement={CardPlacement.BOARD} 
                />
              ))}
            </SortableContext>
            
          </div>
        </div>
      </div>  
  )
}

export default PlayerBoard
