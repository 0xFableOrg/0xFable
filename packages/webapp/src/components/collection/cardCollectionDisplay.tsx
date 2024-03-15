import React from "react"
import Image from "next/image"

import { MintDeckModal } from "src/components/modals/mintDeckModal"
import { Card } from "src/store/types"
import { testCards } from "src/utils/card-list"

interface CardCollectionDisplayProps {
    cards: Card[]
    isHydrated: boolean
    setSelectedCard: (card: Card | null) => void
    onCardToggle: (card: Card) => void
    selectedCards: Card[]
    isEditing: boolean
}

const CardCollectionDisplay: React.FC<CardCollectionDisplayProps> = ({
    cards,
    isHydrated,
    setSelectedCard,
    selectedCards,
    onCardToggle,
    isEditing,
}) => {
    return (
        <>
            <div className="col-span-7 flex overflow-y-auto rounded-xl border">
                {isHydrated && cards.length === 0 && (
                    <div className="flex w-full flex-row items-center justify-center">
                        <MintDeckModal />
                    </div>
                )}

                {isHydrated && cards.length > 0 && (
                    <div className="flex flex-wrap justify-around overflow-y-auto pb-4">
                        {cards.map((card, index) => (
                            <div
                                key={card.id}
                                className={`m-4 bg-slate-900/50 ${
                                    selectedCards.some((c) => c.id === card.id)
                                        ? "shadow-highlight shadow-orange-300"
                                        : ""
                                } w-[220px] max-w-[330px] grow rounded-lg border-4 border-slate-900 p-4 hover:bg-slate-800`}
                                onMouseEnter={() => setSelectedCard(card)}
                                onClick={() => {
                                    if (isEditing) {
                                        onCardToggle(card)
                                    }
                                }}
                            >
                                <Image
                                    className="aspect-square"
                                    src={testCards.find((tc) => Number(tc.id) === index + 1)?.image || ""}
                                    alt={card.lore.name}
                                    width={256}
                                    height={256}
                                />
                                <div className="text-center">{card.lore.name}</div>
                                <div className="relative flex items-end justify-between p-2">
                                    <div className="absolute bottom-[-16px] flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-gray-900">
                                        {card.stats.attack}
                                    </div>
                                    <div className="absolute bottom-[-16px] right-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-gray-900">
                                        {card.stats.defense}
                                    </div>
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
