import React, { useCallback, useEffect, useState } from "react"

import { getDeckNames } from "src/actions/getDeck"
import Link from "src/components/link"
import { Button } from "src/components/ui/button"
import * as store from "src/store/hooks"

interface DeckCollectionDisplayProps {
    onDeckSelect: (deckID: number) => void
}

const DeckCollectionDisplay: React.FC<DeckCollectionDisplayProps> = ({ onDeckSelect }) => {
    const playerAddress = store.usePlayerAddress()
    const [deckNames, setDeckNames] = useState<string[]>([])
    const [isLoadingDecks, setIsLoadingDecks] = useState(false)

    const loadDeckNames = useCallback(() => {
        if (playerAddress) {
            setIsLoadingDecks(true)
            getDeckNames({
                playerAddress: playerAddress,
                onSuccess: () => {},
            })
                .then((response) => {
                    if (!response.simulatedResult) return
                    const receivedDecks = response.simulatedResult as string[]
                    setDeckNames(receivedDecks)
                    setIsLoadingDecks(false)
                })
                .catch((error) => {
                    console.error("Error fetching decks:", error)
                })
        }
    }, [playerAddress])

    useEffect(() => {
        loadDeckNames()
    }, [loadDeckNames])

    return (
        <div className="flex w-full flex-col items-center p-3">
            {/* New Deck Button */}
            <Button
                width="full"
                className="my-2 border-2 border-yellow-500 font-fable text-xl hover:scale-105 hover:border-yellow-400"
            >
                <Link href={"/collection?newDeck=true"}>New Deck →</Link>
            </Button>

            {/* Loading Button */}
            {isLoadingDecks && (
                <Button
                    width="full"
                    variant="secondary"
                    className="my-2 border-2 border-yellow-500 font-fable text-xl normal-case hover:scale-105 hover:border-yellow-400"
                    disabled={true}
                >
                    Loading...
                </Button>
            )}

            {/* Deck Buttons */}
            {deckNames.map((deckname, deckID) => (
                <Button
                    variant={"secondary"}
                    width="full"
                    className="my-1 border-2 border-yellow-500 font-fable text-xl normal-case hover:scale-105 hover:border-yellow-400"
                    key={deckID}
                    onClick={() => onDeckSelect(deckID)}
                >
                    {deckname}
                </Button>
            ))}
        </div>
    )
}

export default DeckCollectionDisplay
