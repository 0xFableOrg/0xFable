import React, { useState } from 'react';
import { Deck, Card } from 'src/store/types' 

interface DeckPanelProps {
    deck: Deck;
    selectedCards: Card[];
    onCardSelect: (card: Card) => void;
    onSave: (deck: Deck) => void;
    onCancel: () => void;
  }
  
  
  const DeckPanel: React.FC<DeckPanelProps> = ({ deck, selectedCards = [], onCardSelect, onSave, onCancel }) => {
    const [ deckName, setDeckName ] = useState(deck.name)

    const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setDeckName(event.target.value)
    }
  
    const handleSave = () => {
      onSave({ ...deck, name: deckName })
    }

    const handleCancel = () => {
      onCancel()
    }

  return (
    <div className="w-full flex flex-col items-center p-3">
        <style jsx>{`
        .card-name-container {
            width: 100%;
            background-color: #4A5568; /* Dark grayish-blue background */
            color: white; 
            margin-bottom: 8px; 
            padding: 10px; 
            border-radius: 5px; 
            border: 1px solid #2D3748;
            cursor: pointer; /* Change cursor to indicate interactiveness */
            transition: background-color 0.3s ease; /* Smooth transition for hover effect */
        }
        
        .card-name-container:hover {
            background-color: #2D3748; /* Slightly darker background on hover */
        }
    `}</style>

      {/* Deck Name Input */}
      <input 
        type="text"
        value={deckName}
        onChange={handleDeckNameChange}
        className="text-xl font-bold card-name-container w-full p-2"
        placeholder="Deck name"
      />

      {/* Save and Cancel Buttons */}
      <div className="flex justify-center space-x-2 my-2">
        <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Save</button>
        <button onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
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
              <img src="/card_art/0.jpg" className="w-10 h-10 object-cover rounded-full" />
              <span className="font-medium">{card.lore.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

DeckPanel.defaultProps = {
    deck: {
      name: 'New Deck',
      cards: []
    }
  };

export default DeckPanel