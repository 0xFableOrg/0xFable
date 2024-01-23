import React, { useState } from 'react'
import { Deck, Card } from 'src/store/types' 
import Image from 'next/image' 

interface DeckConstructionPanelProps {
    deck: Deck
    selectedCards: Card[]
    onCardSelect: (card: Card) => void
    onSave: (deck: Deck) => void
    onCancel: () => void
  }
  
  
  const DeckConstructionPanel : React.FC<DeckConstructionPanelProps> = ({ deck, selectedCards = [], onCardSelect, onSave, onCancel }) => {
    const [ deckName, setDeckName ] = useState(deck.name)
    const [ isDeckNameValid, setIsDeckNameValid ] = useState(true)

    const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setDeckName(event.target.value)
      setIsDeckNameValid(true)
    }
  
    const handleSave = () => {
      if (!deckName.trim()) {
        setIsDeckNameValid(false)
        return
      }

      const newDeck = {
        name: deckName,
        cards: selectedCards
      }

      onSave(newDeck)
    }

  return (
    <div className="w-full flex flex-col items-center p-3">
        <style jsx>{`
        .card-name-container {
            width: 100%
            background-color: #4A5568 /* Dark grayish-blue background */
            color: white 
            margin-bottom: 8px 
            padding: 10px 
            border-radius: 5px 
            border: 1px solid #2D3748
            cursor: pointer /* Change cursor to indicate interactiveness */
            transition: background-color 0.3s ease /* Smooth transition for hover effect */
        }
        
        .card-name-container:hover {
            background-color: #2D3748 /* Slightly darker background on hover */
        }
    `}</style>

      <div className="flex justify-between items-center">
        {/* Deck Name Input */}
        <input
          type="text"
          value={deckName}
          onChange={handleDeckNameChange}
          style={{ outline: isDeckNameValid ? "none" : "2px solid red" }}
          className="flex-grow px-2 py-2 border rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent m-1.5"
          placeholder=" Deck name"
        />
      
        {/* Save and Cancel Buttons */}
        <div className="flex justify-center">
          <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-l-md">
            ✓
          </button>
          <button onClick={onCancel} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-r-md">
            ✕
          </button>
        </div>
      </div>

      {/* List of Cards in the Deck */}
      <div className="mt-4 w-full">
        {selectedCards.map((card, index) => (
          <div 
            key={index} 
            className="p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-100"
            onClick={() => onCardSelect(card)}
          >
            <div className="flex items-center space-x-3">
              {/* todo @eviterin: get proper link to the card instead of always the witch */}
              <Image src="/card_art/0.jpg" alt ="Card art" width={40} height={40} className="object-cover rounded-full" />
              <span className="font-medium">{card.lore.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

DeckConstructionPanel.defaultProps = {
    deck: {
      name: 'New Deck',
      cards: []
    }
  }

export default DeckConstructionPanel