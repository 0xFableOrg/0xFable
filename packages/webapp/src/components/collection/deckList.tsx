import React, { useEffect, useState, useCallback } from "react"
import Link from "src/components/link"
import { Deck } from 'src/store/types'
import { Button } from "src/components/ui/button"
import { getAllDecks, getNumDecks } from "src/actions/getDeck"
import * as store from "src/store/hooks"
import { Deck } from "src/store/types"

interface DeckCollectionDisplayProps {
  decks: Deck[]
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>
  onDeckSelect: (deckID: number) => void
}

const DeckCollectionDisplay: React.FC<DeckCollectionDisplayProps> = ({ decks, setDecks, onDeckSelect }) => {
  const playerAddress = store.usePlayerAddress()
  const [ isLoadingDecks, setIsLoadingDecks ] = useState(true)

  function deckCount(): Promise<void> {
    return new Promise((resolve) => {
      getNumDecks({
        playerAddress: playerAddress!,
        onSuccess: () => { }
      })
    })
  }

  const loadDecks = useCallback(() => {
    if (playerAddress) {
      setIsLoadingDecks(true)
      getAllDecks({
        playerAddress: playerAddress,
        onSuccess: () => {
        },
      }).then(response => {
        if(!response.simulatedResult) return
        const receivedDecks = response.simulatedResult as Deck[]
        setDecks(receivedDecks)
      }).catch(error => {
        console.error("Error fetching decks:", error)
      }).finally(() => {
        setIsLoadingDecks(false)
      })
    }
  }, [playerAddress, setIsLoadingDecks])


  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  return (
      <div className="w-full flex flex-col items-center p-3">
        {/* New Deck Button */}
        <Button  width="full" className="border-2 border-yellow-500 hover:scale-105 font-fable text-xl hover:border-yellow-400">
          <Link href={"/collection?newDeck=true"}> 
            New Deck →
          </Link>
        </Button>

        {/* Deck Buttons */}
        {decks.map((deck, deckID) => (
          <Button 
            variant={isLoadingDecks ? "secondary" : "default"} 
            width="full" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400"
            key={deckID} 
            onClick={() => onDeckSelect(deckID)}
            >
            {deck.name}
          </Button>
        ))}
      </div>
  )
}

export default DeckCollectionDisplay
