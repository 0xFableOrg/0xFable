import React, { useEffect, useState, useCallback } from "react"
import Link from "src/components/link"
import { Deck } from 'src/store/types'
import { Button } from "src/components/ui/button"
import { getAllDecks, getNumDecks, getDeckNames } from "src/actions/getDeck"
import * as store from "src/store/hooks"
import { Deck } from "src/store/types"

interface DeckCollectionDisplayProps {
  decks: Deck[]
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>
  onDeckSelect: (deckID: number) => void
}

const DeckCollectionDisplay: React.FC<DeckCollectionDisplayProps> = ({ decks, setDecks, onDeckSelect }) => {
  const playerAddress = store.usePlayerAddress()
  const [ deckNames, setDeckNames] = useState<string[]>([])

  function deckCount(): Promise<void> {
    return new Promise((resolve) => {
      getNumDecks({
        playerAddress: playerAddress!,
        onSuccess: () => { }
      })
    })
  }

  const loadDeckNames = useCallback(() => {
    if (playerAddress) {
      getDeckNames({
        playerAddress: playerAddress,
        onSuccess: () => {
        },
      }).then(response => {
        if(!response.simulatedResult) return
        console.log(response)
        const receivedDecks = response.simulatedResult as string[]
        setDeckNames(receivedDecks)
      }).catch(error => {
        console.error("Error fetching decks:", error)
      })
    }
  }, [playerAddress])


  useEffect(() => {
    loadDeckNames()
    //loadDecks()
  }, [loadDeckNames])

  return (
      <div className="w-full flex flex-col items-center p-3">
        {/* New Deck Button */}
        <Button  width="full" className="border-2 border-yellow-500 hover:scale-105 font-fable text-xl hover:border-yellow-400">
          <Link href={"/collection?newDeck=true"}> 
            New Deck →
          </Link>
        </Button>

        {/* Deck Buttons */}
        {deckNames.map((deckname, deckID) => (
          <Button 
            variant={ "secondary" } 
            width="full" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400"
            key={deckID} 
            onClick={() => onDeckSelect(deckID)}
            >
            {deckname}
          </Button>
        ))}
      </div>
  )
}

export default DeckCollectionDisplay
