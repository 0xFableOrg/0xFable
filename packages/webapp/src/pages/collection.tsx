import debounce from "lodash/debounce"
import Head from "next/head"
// This causes the "Ignoring unsupported entryTypes: largest-contentful-paint.", presumably
// because Firefox does not support some associated features.
import Image from "next/image"
import { useState, useMemo, useEffect } from "react"
import { useAccount } from "wagmi"

import jotaiDebug from "src/components/lib/jotaiDebug"
import { MintDeckModal } from "src/components/modals/mintDeckModal"
import { Navbar } from "src/components/navbar"
import { deployment } from "src/deployment"
import { useInventoryCardsCollectionGetCollection } from "src/generated"
import { Card } from "src/store/types"
import { Address } from "src/chain"
import { FablePage } from "src/pages/_app"
import Link from "next/link"
import { useRouter } from 'next/router'

import FilterPanel from 'src/components/editor/filterPanel'
import CardCollectionDisplay from 'src/components/editor/cardCollectionDisplay'
import DeckList from 'src/components/editor/deckList'
import DeckPanel from 'src/components/editor/deckPanel'

// NOTE(norswap & geniusgarlic): Just an example, when the game actually has effects & types,
//   fetch those from the chain instead of hardcoding them here.

type Effect = string

const effects: Effect[] = ['Charge', 'Flight', 'Courage', 'Undying', 'Frenzy', 'Enlightened']
const initialEffectMap = Object.assign({}, ...effects.map(name => ({[name]: false})))

const types = ['Creature', 'Magic', 'Weapon']
const initialTypeMap = Object.assign({}, ...types.map(name => ({[name]: false})))

const Collection: FablePage = ({ decks, isHydrated }) => {

  const { address } = useAccount()
  const [ selectedCard, setSelectedCard ] = useState<Card|null>(null)
  const [ searchInput, setSearchInput ] = useState('')
  const [ effectMap, setEffectMap ] = useState(initialEffectMap)
  const [ typeMap, setTypeMap ] = useState(initialTypeMap)
  const [ isEditing, setIsEditing ] = useState(false)
  const [ currentDeck, setCurrentDeck]  = useState({ name: '', cards: [] })
  const [ originalDeckIndex, setOriginalDeckIndex ] = useState(null)
  const [ deckCards, setDeckCards ] = useState([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const router = useRouter()

  const cardName = selectedCard?.lore.name || "Select a card"
  const cardFlavor = selectedCard?.lore.flavor || "Select a card to see its details"

  const activeEffects = Object.keys(effectMap).filter(key => effectMap[key])
  const activeTypes = Object.keys(typeMap).filter(key => typeMap[key])

  const { data: unfilteredCards, refetch } = useInventoryCardsCollectionGetCollection({
    address: deployment.InventoryCardsCollection,
    args: [address as Address] // TODO not ideal but safe in practice
  }) as {
    // make the wagmi type soup understandable, there are many more fields in reality
    data: readonly Card[],
    refetch: () => Promise<{ data?: readonly Card[], error: Error|null }>
  }

  const cards: Card[] = (unfilteredCards || []).filter(card => {
    // TODO(norswap): it would look like this if the card had effects & types
    // const cardEffects = card.stats.effects || []
    // const cardTypes = card.stats.types || []
    const cardEffects: Effect[] = []
    const cardTypes: Effect[] = []
    return activeEffects.every(effect => cardEffects.includes(effect))
      && activeTypes.every(type => cardTypes.includes(type))
      && card.lore.name.toLowerCase().includes(searchInput.toLowerCase())
  })

  const handleInputChangeBouncy = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value)
  }
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  const handleEffectClick = (effectIndex: number) => {
    const effect = effects[effectIndex]
    setEffectMap({...effectMap, [effect]: !effectMap[effect]})
  }

  const handleTypeClick = (typeIndex: number) => {
    const type = types[typeIndex]
    setTypeMap({...typeMap, [type]: !typeMap[type]})
  }

  const handleNewDeck = () => {
    setCurrentDeck({ name: 'New Deck', cards: [] });
    setIsEditing(true);
    setOriginalDeckIndex(null);
  };

  const handleDeckChange = (updatedDeck) => {
    setIsEditing(false)
  }

  const handleDeckSelect = (deckID) => {
    const selectedDeck = decks[deckID]
    setCurrentDeck(selectedDeck)
    setOriginalDeckIndex(deckID)
    setIsEditing(true)
  }

  const handleSaveDeck = () => {
    let updatedDecks = [...decks]
  
    if (originalDeckIndex !== null) {
      updatedDecks[originalDeckIndex] = currentDeck
    } else {
      updatedDecks.push(currentDeck)
    }
  
    setDecks(updatedDecks)
    setIsEditing(false)
  }

  const handleCancelEditing = () => {
    setIsEditing(false);
  }

  const addToDeck = (card: Card) => {
    setDeck(prevDeck => {
      const isAlreadyInDeck = prevDeck.some(cardInDeck => cardInDeck.id === card.id)
      if (isAlreadyInDeck) {
        // Remove the card from the deck
        return prevDeck.filter(cardInDeck => cardInDeck.id !== card.id)
      } else {
        // Add the card to the deck
        return [...prevDeck, card]
      }
    })
  }

  const toggleCardInDeck = (card) => {
    setDeckCards((currentCards) => {
      const isCardInDeck = currentCards.find((c) => c.id === card.id);
      if (isCardInDeck) {
        return currentCards.filter((c) => c.id !== card.id);
      } else {
        return [...currentCards, card];
      }
    });
  };

  const onCardToggle = (card: Card) => {
    setSelectedCards((prevSelectedCards) => {
        if (prevSelectedCards.some(selectedCard => selectedCard.id === card.id)) {
            // Remove the card if it's already selected
            return prevSelectedCards.filter(selectedCard => selectedCard.id !== card.id);
        } else {
            // Add the card if it's not already selected
            return [...prevSelectedCards, card];
        }
    });
  };

  useEffect(() => {
    if (router.query.newDeck) {
      setCurrentDeck({ name: '', cards: [] })
      setIsEditing(true)
      setOriginalDeckIndex(null)
    }
  }, [router.query.newDeck])

  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
      </Head>
      {jotaiDebug()}
      <main className="flex h-screen flex-col">
        <Navbar />
        <div className="mx-6 mb-6 grid grow grid-cols-12 gap-4 min-h-0">
          {/* Left Panel - Search and Filters */}
          <div className="flex col-span-3 rounded-xl border overflow-y-auto">
            <FilterPanel
                effects={effects}
                types={types}
                effectMap={effectMap}
                typeMap={typeMap}
                handleEffectClick={handleEffectClick}
                handleTypeClick={handleTypeClick}
                handleInputChange={handleInputChange}
                selectedCard={selectedCard}
              />
          </div>

          {/* Middle Panel - Card Collection Display */}
          <div className="col-span-7 flex rounded-xl border overflow-y-auto">
            <CardCollectionDisplay
              cards={cards}
              isHydrated={isHydrated}
              setSelectedCard={setSelectedCard}
              onCardToggle={onCardToggle}
              selectedCards={selectedCards}
            />
          </div>

          {/* Right Panel - Deck List */}
          <div className="flex col-span-2 rounded-xl border overflow-y-auto">
            {isEditing ? (
              <DeckPanel
                deck={currentDeck}
                onCardSelect={addToDeck}
                onSave={handleSaveDeck}
                onCancel={handleCancelEditing} 
              />
            ) : (
              <DeckList 
                decks={decks} 
                onDeckSelect={handleDeckSelect}
              />
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default Collection