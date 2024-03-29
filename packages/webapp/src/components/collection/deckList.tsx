import React from "react"

import Link from "src/components/link"
import { Button } from "src/components/ui/button"
import { Deck } from "src/store/types"

interface DeckCollectionDisplayProps {
    decks: Deck[]
    onDeckSelect: (deckID: number) => void
}

const DeckCollectionDisplay: React.FC<DeckCollectionDisplayProps> = ({ decks, onDeckSelect }) => {
    return (
        <div className="flex w-full flex-col items-center p-3">
            {/* New Deck Button */}
            <div>
                <Button
                    variant="secondary"
                    className="border-2 border-yellow-500 font-fable text-xl normal-case hover:scale-105 hover:border-yellow-400"
                >
                    <Link href={"/collection?newDeck=true"}>New Deck →</Link>
                </Button>
            </div>

            {/* Deck Buttons */}
            {decks.map((deck, deckID) => (
                <Button
                    variant="secondary"
                    width="full"
                    className="border-2 border-yellow-500 font-fable text-xl normal-case hover:scale-105 hover:border-yellow-400"
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
