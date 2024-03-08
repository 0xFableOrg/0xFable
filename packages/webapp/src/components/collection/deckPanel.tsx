import React, { useState } from "react"
import Image from "next/image"

import { Button } from "src/components/ui/button"
import { Card, Deck } from "src/store/types"
import { testCards } from "src/utils/card-list"

interface DeckConstructionPanelProps {
    deck: Deck
    selectedCards: Card[]
    onCardSelect: (card: Card) => void
    onSave: (deck: Deck) => void
    onCancel: () => void
}

const DeckConstructionPanel: React.FC<DeckConstructionPanelProps> = ({
    deck,
    selectedCards = [],
    onCardSelect,
    onSave,
    onCancel,
}) => {
    const MAX_CARDS = 40
    const MIN_CARDS = 10

    const [deckName, setDeckName] = useState(deck.name || "My Deck")
    const [deckNameValid, setIsDeckNameValid] = useState(true)

    const nameValid = (name: string) => name.trim().length > 0

    const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = event.target.value
        setDeckName(event.target.value)
        setIsDeckNameValid(nameValid(newName))
    }

    const handleSave = () => {
        if (!nameValid(deckName)) return

        const newDeck = {
            name: deckName.trim(),
            cards: selectedCards,
        }

        onSave(newDeck)
    }

    return (
        <div className="flex w-full flex-col items-center overflow-y-auto overflow-x-hidden p-3">
            {/* Deck Name Input */}
            <div className="flex w-full flex-wrap justify-center gap-2">
                <input
                    type="text"
                    value={deckName}
                    onChange={handleDeckNameChange}
                    style={{ outline: deckNameValid ? "none" : "2px solid red" }}
                    className="flex-basis[auto] m-1.5 min-w-0 max-w-full flex-shrink rounded-md border bg-white px-2 py-2 text-black placeholder-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deck name"
                />
            </div>

            {/* Counter Row */}
            <div className="w-full py-1">
                <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                    <div style={{ width: `${(selectedCards.length / MAX_CARDS) * 100}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${selectedCards.length < MIN_CARDS ? 'bg-red-500' : selectedCards.length <= MAX_CARDS ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    </div>
                </div>
                </div>
                <div className="text-center text-sm font-medium">
                {selectedCards.length}/{MAX_CARDS}
                </div>
            </div>

            {/* Save and Cancel Buttons */}
            <div className="flex w-full flex-wrap justify-center gap-2">
                <Button
                    variant="default"
                    className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400"
                    onClick={handleSave}
                >
                    ✓ Save
                </Button>
                <Button
                    variant="secondary"
                    className="border-2 border-yellow-500 font-fable text-xl normal-case hover:scale-105 hover:border-yellow-400"
                    onClick={onCancel}
                >
                    ✕ Cancel
                </Button>
            </div>

            {/* List of Cards in the Deck */}
            <div className="mt-4 w-full">
                {selectedCards.length > 0 ? (
                    selectedCards.map((card, index) => (
                        <div
                            key={index}
                            className="cursor-pointer p-2 hover:bg-gray-100"
                            onClick={() => onCardSelect(card)}
                        >
                            <div className="flex items-center space-x-3">
                                <Image
                                    src={testCards.find((tc) => tc.id === Number(card.id))?.image || "/card_art/1.jpg"}
                                    alt="Card art"
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                                <span className="font-medium">{card.lore.name}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-300">Click on cards to add them to the deck.</div>
                )}
            </div>
        </div>
    )
}

export default DeckConstructionPanel
