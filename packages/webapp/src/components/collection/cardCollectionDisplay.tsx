import React from 'react'
import Image from 'next/image'
import { Card } from 'src/store/types' 
import { MintDeckModal } from 'src/components/modals/mintDeckModal'

interface CardCollectionDisplayProps {
  cards: Card[];
  isHydrated: boolean;
  setSelectedCard: (card: Card | null) => void;
  onCardToggle: (card: Card) => void;
  selectedCards: Card[]; 
}

const CardCollectionDisplay: React.FC<CardCollectionDisplayProps> = ({ cards, isHydrated, refetch, setSelectedCard, selectedCards, onCardToggle, isEditing }) => {
  return (
    <>
      <div className="col-span-7 flex rounded-xl border overflow-y-auto">
        {isHydrated && cards.length === 0 && (
          <div className="flex flex-row w-full justify-center items-center">
            <MintDeckModal callback={refetch} />
          </div>
        )}

        {isHydrated && cards.length > 0 && (
          <div className="flex flex-wrap justify-around overflow-y-auto pb-4">
            {cards.map(card => (
              <div 
                key={card.id} 
                className={`m-4 bg-slate-900/50 ${
                  selectedCards.some(c => c.id === card.id) ? 'shadow-highlight shadow-orange-300' : '' // Highlight if selected
                } hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900 grow w-[220px] max-w-[330px]`}
                onMouseEnter={() => setSelectedCard(card)}
                onClick={() => {
                  if (isEditing) {
                    onCardToggle(card); // Only toggle card selection when in editing mode
                  }
                }}
              >
                <Image className="aspect-square" src="/card_art/0.jpg" alt={card.lore.name} width={256} height={256} />
                <div className="text-center">{card.lore.name}</div>
                  <div className="flex items-end justify-between p-2 relative">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg absolute bottom-[-16px]">{card.stats.attack}</div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg absolute bottom-[-16px] right-3">{card.stats.defense}</div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default CardCollectionDisplay
