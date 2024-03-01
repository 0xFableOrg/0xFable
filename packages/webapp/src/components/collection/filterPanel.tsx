import React from 'react'
import Image from 'next/image'
import { Card } from 'src/store/types' 

interface FilterPanelProps {
  effects: string[]
  types: string[]
  effectMap: { [key: string]: boolean }
  typeMap: { [key: string]: boolean }
  handleEffectClick: (index: number) => void
  handleTypeClick: (index: number) => void
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  selectedCard: Card | null
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  effects,
  types,
  effectMap,
  typeMap,
  handleEffectClick,
  handleTypeClick,
  handleInputChange,
  selectedCard
}) => {
  const cardName = selectedCard?.lore.name || "Select a card"
  const cardFlavor = selectedCard?.lore.flavor || "Select a card to see its details"

  return (
    <div className="flex col-span-3 rounded-xl border overflow-y-auto">
      <div className="overflow-y-auto">
        {/* Search */}
        <h2 className="text-2xl font-bold text-white m-1.5">Search</h2>
        <div>
          <input 
            type="text"
            onChange={handleInputChange}
            className="px-4 py-2 border rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent m-1.5"
            placeholder="Search by name" />
        </div>

        {/* Effects */}
        <h3 className="text-xl font-bold text-white m-1.5">Effects</h3>
        <div className="flex flex-wrap gap-2">
          {effects.map((effect, index) => (
            <button
              key={index}
              onClick={() => handleEffectClick(index)}
              className={`text-white font-bold py-2 px-2 rounded m-1.5 ${effectMap[effect] ? 'bg-purple-900' : 'bg-gray-500'}`}>
              {effect}
            </button>)
          )}
        </div>
          
        {/* Types */}
        <h3 className="text-xl font-bold text-white m-1">Types</h3>
        <div className="flex flex-wrap gap-2">
          {types.map((type, index) => (
            <button
              key={index}
              onClick={() => handleTypeClick(index)}
              className={`text-white font-bold py-2 px-2 rounded m-1 ${typeMap[type] ? 'bg-purple-900' : 'bg-gray-500'}`}>
              {type}
            </button>)
          )}
        </div>

        {/* todo @eviterin: makes sense to add a filter for the card collection display to only show one of each card. */}

        {/* Selected Card Display */}
        <div className="pb-5">
          <h2 className="text-3xl font-bold text-white m-1.5">Card details</h2>
          <div className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
            <Image src="/card_art/0.jpg" alt={cardName} width={256} height={256} className="m-auto" />
            <div className="text-center">{cardName}</div>
          </div>
          <div className="text-center m-2">{cardFlavor}</div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel