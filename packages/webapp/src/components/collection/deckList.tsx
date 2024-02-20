import React from 'react'
import Link from "src/components/link"
import { Deck } from 'src/store/types'
import { Button } from "src/components/ui/button"

interface DeckCollectionDisplayProps {
  decks: Deck[]
  onDeckSelect: (deckID: number) => void
}

const DeckCollectionDisplay: React.FC<DeckCollectionDisplayProps> = ({ decks, onDeckSelect }) => {
  return (
      <div className="w-full flex flex-col items-center p-3">
        {/* New Deck Button */}
        <div>
        <Button variant="secondary" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400">
          <Link 
            href={"/collection?newDeck=true"} 
            className="w-full px-4 py-2 mb-2 border rounded-md text-gray-100 bg-purple-900 hover:bg-gray-500 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            New Deck →
          </Link>
        </Button>
        </div>

        {/* Deck Buttons */}
        {decks.map((deck, deckID) => (
          <Button variant="secondary" width="full" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400"
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