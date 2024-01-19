import React from 'react'
import Link from 'next/link'
import { Deck } from 'src/store/types.ts'

interface DeckListProps {
  decks: Deck[]
  onDeckSelect: (deckID: number) => void
}

const DeckList: React.FC<DeckListProps> = ({ decks, onDeckSelect }) => {
  return (
      <div className="w-full flex flex-col items-center p-3">
        {/* New Deck Button */}
        <Link 
          href={"/collection?newDeck=true"} 
          className="w-full px-4 py-2 mb-2 border rounded-md text-gray-100 bg-purple-900 hover:bg-gray-500 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          New Deck →
        </Link>

        {/* Deck Buttons */}
        {decks.map((deck, deckID) => (
          <button 
            key={deckID} 
            onClick={() => onDeckSelect(deckID)}
            className="w-full px-4 py-2 mb-2 border rounded-md text-gray-100 bg-purple-900 hover:bg-gray-500 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {deck.name}
          </button>
        ))}
      </div>
  )
}

export default DeckList