import { DragStartEvent, DragEndEvent,  DragOverEvent, UniqueIdentifier } from "@dnd-kit/core"
import * as store from "src/store/hooks"
import { usePlayedCards } from "src/store/hooks"
import { CardInPlay } from "src/store/types"
import { Address } from "viem"
import { useCallback } from "react"

function useDragEvents () {
	const [ _, addCard ] = usePlayedCards()
	const playerAddress = store.usePlayerAddress()

	const useDragStart = (setActiveIdCallback: (id: UniqueIdentifier) => void) => {
		const handleDragStart = useCallback(({ active }: DragStartEvent) => {
			setActiveIdCallback(active.id);
		}, [setActiveIdCallback]);
		
		return handleDragStart;
	};
	
	const handleDragOver = (event: DragOverEvent) => {
		const { over, active } = event;
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { over } = event
		if (over && over.id === "player-board") {
			// @todo need a naming convention for board refs + id
			const eventStr = event.active.id as unknown as string
			if (eventStr.match(/playedCard/)) return

			const cardId = Number((eventStr.match(/^card-(\d+)/) || [, undefined])[1]) // card being moved from hand, still unplayed
			const playedCard: CardInPlay = {
					cardId: cardId,
					owner: playerAddress as Address,
			}
			addCard(playedCard)
			// @todo remove card from hand once placed in board
			// @todo void playCard :: tx for card being placed on player board
		} else if (over && over.id === "player-hand") {
			// don't add card to playedCards if the user brings it back to the hand
			return
		}
	}
	return {
		useDragStart,
		handleDragOver,
		handleDragEnd
	}
}

export default useDragEvents