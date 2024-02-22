import React, { useState } from 'react'
import { Deck, Card } from 'src/store/types' 
import Image from 'next/image' 
import { testCards } from 'src/utils/card-list'
import { Button } from "src/components/ui/button"

interface DeckConstructionPanelProps {
    deck: Deck
    selectedCards: Card[]
    onCardSelect: (card: Card) => void
    onSave: (deck: Deck) => void
    onCancel: () => void
  }
  
  
  const DeckConstructionPanel : React.FC<DeckConstructionPanelProps> = ({ deck, selectedCards = [], onCardSelect, onSave, onCancel }) => {
    const [ deckName, setDeckName ] = useState(deck.name)
    const [ deckNameValid, setIsDeckNameValid ] = useState(false)

    const nameValid = (name: string) => name.trim().length > 0

    const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newName = event.target.value
      setDeckName(event.target.value)
      setIsDeckNameValid(nameValid(newName))
    }

    const handleSave = () => {
      if(!deckNameValid) return

      const newDeck = {
        name: deckName.trim(),
        cards: selectedCards
      }

      onSave(newDeck)
    }

  return (
    <div className="flex flex-col items-center w-full p-3 overflow-y-auto overflow-x-hidden">
      {/* Deck Name Input */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        <input
          type="text"
          value={deckName}
          onChange={handleDeckNameChange}
          style={{ outline: deckNameValid ? "none" : "2px solid red" }}
          className="flex-shrink min-w-0 px-2 py-2 border rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent m-1.5 placeholder-gray-700 flex-basis[auto] max-w-full"
          placeholder="Deck name"
        />
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        <Button variant="secondary" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400" onClick={handleSave}>
          ✓Save
        </Button>
        <Button variant="secondary" className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400" onClick={onCancel}>
          ✕Cancel
        </Button>
      </div>

      {/* List of Cards in the Deck */}
      <div className="mt-4 w-full">
      {selectedCards.length > 0 ? (
        selectedCards.map((card, index) => (
          <div 
            key={index} 
            className="p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => onCardSelect(card)}
          >
            <div className="flex items-center space-x-3">
              <Image src={testCards.find(tc => tc.id === card.id)?.image || '/card_art/1.jpg'} alt="Card art" width={40} height={40} className="object-cover rounded-full" />
              <span className="font-medium">{card.lore.name}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-gray-300">
          Click on cards to add them to the deck.
        </div>
      )}
      </div>
    </div>
  )
}

export default DeckConstructionPanel