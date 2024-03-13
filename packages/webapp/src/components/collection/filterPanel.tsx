import React from "react"
import Image from "next/image"

import { Card } from "src/store/types"

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
    selectedCard,
}) => {
    const cardName = selectedCard?.lore.name || "Select a card"
    const cardFlavor = selectedCard?.lore.flavor || "Select a card to see its details"

    return (
        <div className="col-span-3 flex overflow-y-auto rounded-xl border">
            <div className="overflow-y-auto">
                {/* Search */}
                <h2 className="m-1.5 text-2xl font-bold text-white">Search</h2>
                <div>
                    <input
                        type="text"
                        onChange={handleInputChange}
                        className="m-1.5 rounded-md border px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by name"
                    />
                </div>

                {/* Effects */}
                <h3 className="m-1.5 text-xl font-bold text-white">Effects</h3>
                <div className="flex flex-wrap gap-2">
                    {effects.map((effect, index) => (
                        <button
                            key={index}
                            onClick={() => handleEffectClick(index)}
                            className={`m-1.5 rounded px-2 py-2 font-bold text-white ${
                                effectMap[effect] ? "bg-purple-900" : "bg-gray-500"
                            }`}
                        >
                            {effect}
                        </button>
                    ))}
                </div>

                {/* Types */}
                <h3 className="m-1 text-xl font-bold text-white">Types</h3>
                <div className="flex flex-wrap gap-2">
                    {types.map((type, index) => (
                        <button
                            key={index}
                            onClick={() => handleTypeClick(index)}
                            className={`m-1 rounded px-2 py-2 font-bold text-white ${
                                typeMap[type] ? "bg-purple-900" : "bg-gray-500"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* todo @eviterin: makes sense to add a filter for the card collection display to only show one of each card. */}

                {/* Selected Card Display */}
                <div className="pb-5">
                    <h2 className="m-1.5 text-3xl font-bold text-white">Card details</h2>
                    <div className="m-4 rounded-lg border-4 border-slate-900 bg-slate-900/50 p-4">
                        <Image src="/card_art/0.jpg" alt={cardName} width={256} height={256} className="m-auto" />
                        <div className="text-center">{cardName}</div>
                    </div>
                    <div className="m-2 text-center">{cardFlavor}</div>
                </div>
            </div>
        </div>
    )
}

export default FilterPanel
