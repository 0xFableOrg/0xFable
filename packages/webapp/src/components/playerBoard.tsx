import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"

import CardContainer from "src/components/cards/cardContainer"
import * as store from "src/store/hooks"
import { CardPlacement, GameStep } from "src/store/types"
import { convertBigIntArrayToStringArray, shortenAddress } from "src/utils/js-utils"

interface PlayerBoardProps {
    playerAddress: `0x${string}` | undefined | null
    playedCards: readonly bigint[] | null
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ playerAddress, playedCards }) => {
    const { setNodeRef, isOver } = useSortable({
        id: CardPlacement.BOARD,
    })

    const currentPlayerAddress = store.usePlayerAddress()
    const gameData = store.useGameData()
    const currentTurnAddress = store.useCurrentPlayerAddress()

    // Only show the green drop indicator when:
    // 1. A card is being dragged over this board
    // 2. This is the local player's board
    // 3. It is the local player's turn
    // 4. The current game step is PLAY (player hasn't already played a card this turn)
    const isMyBoard = playerAddress === currentPlayerAddress
    const isMyTurn = currentTurnAddress === currentPlayerAddress
    const canPlayCard = gameData?.currentStep === GameStep.PLAY
    const playerActive = isOver && isMyBoard && isMyTurn && canPlayCard
    const convertedCards = convertBigIntArrayToStringArray(playedCards)
    return (
        <div
            className={`bg-base-300 relative row-span-6 overflow-hidden rounded-xl shadow-inner ${
                playerAddress !== currentPlayerAddress
                    ? `border-b-1 rounded-b-none border`
                    : `rounded-t-none border border-t-0`
            }`}
            ref={setNodeRef}
            style={{
                color: playerActive ? "green" : undefined,
                borderColor: playerActive ? "green" : undefined,
            }}
        >
            <div className="relative flex flex-col items-center space-y-4">
                <div className="flex flex-row items-center space-x-3 self-start p-2">
                    <p className="z-0 m-2 select-none px-2 font-mono font-bold">
                        {`🛡 ${shortenAddress(playerAddress)}`}
                    </p>
                    <p className="z-0 m-3 select-none font-mono font-bold"> ♥️ 100 </p>
                </div>

                <div
                    className={`absolute top-[100%] mx-4 flex min-h-[220px] min-w-[95%] flex-row items-center justify-center space-x-4 rounded-xl p-4 ${
                        playerActive ? "bg-green-700 opacity-50" : null
                    }`}
                >
                    <SortableContext items={convertedCards} strategy={horizontalListSortingStrategy}>
                        {convertedCards?.map((card) => (
                            <CardContainer key={card} id={card.toString()} placement={CardPlacement.BOARD} />
                        ))}
                    </SortableContext>
                </div>
            </div>
        </div>
    )
}

export default PlayerBoard
