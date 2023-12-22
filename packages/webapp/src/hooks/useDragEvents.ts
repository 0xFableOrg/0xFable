import {
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core"
import * as store from "src/store/hooks"
import { usePlayedCards } from "src/store/hooks"
import { CardInPlay, CardPlacement } from "src/store/types"
import { Address } from "viem"
import { useCallback } from "react"
import { extractCardID } from "src/utils/js-utils"

function useDragEvents() {
  const [ _, addCard ] = usePlayedCards()
  const playerAddress = store.usePlayerAddress()

  const useDragStart = (setActiveId: (id: UniqueIdentifier | null) => void) => {
    const handleDragStart = useCallback(
      ({ active }: DragStartEvent) => {
        const matchedCardId = extractCardID(active.id as unknown as string)
        setActiveId(matchedCardId)
      },
      [setActiveId]
    )

    return handleDragStart
  }

  const useDragEnd = (
    playerHand: bigint[],
    setPlayerHand: React.Dispatch<React.SetStateAction<bigint[]>>
  ) => {
    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { over, active } = event
        if (over && over.id === CardPlacement.BOARD) {
          const cardId = extractCardID(active.id as unknown as string)
          const playedCard: CardInPlay = {
            cardId: cardId as unknown as number,
            owner: playerAddress as Address,
          }
          addCard(playedCard)
          setPlayerHand(
            playerHand.filter(
              (card) => card !== BigInt(cardId as unknown as number)
            )
          ) // remove card from hand

          // @todo void playCard :: tx for card being placed on player board
        } else if (over && over.id === "player-hand") {
          return
        }
      },
      [playerHand, setPlayerHand]
    )

    return handleDragEnd
  }

  const useDragCancel = (
    setActiveIdCallback: (id: UniqueIdentifier | null) => void
  ) => {
    const handleDragCancel = useCallback(
      ({}: DragStartEvent) => {
        setActiveIdCallback(null)
      },
      [setActiveIdCallback]
    )

    return handleDragCancel
  }

  return {
    useDragStart,
    useDragEnd,
    useDragCancel,
  }
}

export default useDragEvents
