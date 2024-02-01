import { DragStartEvent, DragEndEvent, UniqueIdentifier } from "@dnd-kit/core"
import * as store from "src/store/hooks"
import { CardPlacement } from "src/store/types"
import { useCallback } from "react"
import { extractCardID } from "src/utils/js-utils"
import { CancellationHandler } from "src/components/modals/loadingModal"
import { playCard } from "src/actions/playCard"

function useDragEvents(
  setActiveId: (id: UniqueIdentifier | null) => void,
  setLoading: (loading: string | null) => void,
  cancellationHandler: CancellationHandler
) {
  const playerAddress = store.usePlayerAddress()
  const [gameID, _] = store.useGameID()
  const playerBattlefield = store.usePlayerBattlefield()

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const matchedCardId = extractCardID(active.id as unknown as string)
      setActiveId(matchedCardId)
    },
    [setActiveId]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over, active } = event
      if (over && over.id === CardPlacement.BOARD) {
        const cardID = extractCardID(active.id as unknown as string)
        const cardIndex = playerBattlefield!.findIndex(
          (card) => card === BigInt(cardID as string)
        )
        void playCard({
          gameID: gameID!,
          playerAddress: playerAddress!,
          cardIndexInHand: cardIndex >= 0 ? cardIndex : 0,
          setLoading: setLoading,
          cancellationHandler: cancellationHandler,
        })
      } else if (over && over.id === CardPlacement.HAND) {
        return
      }
    },
    [cancellationHandler, setLoading, playerBattlefield, gameID, playerAddress]
  )

  const handleDragCancel = useCallback(
    ({}: DragStartEvent) => {
      setActiveId(null)
    },
    [setActiveId]
  )

  return {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}

export default useDragEvents