import debounce from "lodash/debounce"
import Head from "next/head"
// This causes the "Ignoring unsupported entryTypes: largest-contentful-paint.", presumably
// because Firefox does not support some associated features.
import Image from "next/image"
import { useState, useMemo } from "react"
import { useAccount } from "wagmi"

import jotaiDebug from "src/components/lib/jotaiDebug"
import { MintDeckModal } from "src/components/modals/mintDeckModal"
import { Navbar } from "src/components/navbar"
import { deployment } from "src/deployment"
import { useInventoryCardsCollectionGetCollection } from "src/generated"
import { Card } from "src/store/types"
import { Address } from "src/chain"
import { FablePage } from "src/pages/_app"
import { router } from 'next/router';
import { useEffect} from 'react';

// NOTE(norswap & geniusgarlic): Just an example, when the game actually has effects & types,
//   fetch those from the chain instead of hardcoding them here.

type Effect = string

const effects: Effect[] = ['Charge', 'Flight', 'Courage', 'Undying', 'Frenzy', 'Enlightened']
const initialEffectMap = Object.assign({}, ...effects.map(name => ({[name]: false})))

const types = ['Creature', 'Magic', 'Weapon']
const initialTypeMap = Object.assign({}, ...types.map(name => ({[name]: false})))

const Editor: FablePage = ({ decks, setDecks, isHydrated }) => {
  const { address } = useAccount()
  const [ selectedCard, setSelectedCard ] = useState<Card|null>(null)
  const [ searchInput, setSearchInput ] = useState('')
  const [ effectMap, setEffectMap ] = useState(initialEffectMap)
  const [ typeMap, setTypeMap ] = useState(initialTypeMap)
  const [ deckName, setDeckName ] = useState('') //todo @eviterin: start using Deck type in types.ts 
  const [ deck, setDeck ] = useState<Card[]>([]); //todo @eviterin: start using Deck type in types.ts 

  const cardName = selectedCard?.lore.name || "Hover a card"
  const cardFlavor = selectedCard?.lore.flavor || "Hover a card to see its details"

  const activeEffects = Object.keys(effectMap).filter(key => effectMap[key])
  const activeTypes = Object.keys(typeMap).filter(key => typeMap[key])

  const [isDeckNameValid, setIsDeckNameValid] = useState(true);

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

  const addToDeck = (card: Card) => {
    setDeck(prevDeck => {
      const isAlreadyInDeck = prevDeck.some(cardInDeck => cardInDeck.id === card.id);
      if (isAlreadyInDeck) {
        // Remove the card from the deck
        return prevDeck.filter(cardInDeck => cardInDeck.id !== card.id);
      } else {
        // Add the card to the deck
        return [...prevDeck, card];
      }
    });
  };

  // Check url for an index, which is passed if the user wants to modify an existing deck
  // Now useEffect can safely use `addToDeck`
  useEffect(() => {
    const deckIndex = parseInt(router.query.index);
    if (!isNaN(deckIndex) && decks[deckIndex] != null) {
      const selectedDeck = decks[deckIndex];
      setDeckName(selectedDeck.name);
      // Initialize the deck by simulating adding each card
      selectedDeck.cards.forEach(card => addToDeck(card, true));
    }
  }, [router.query.index, decks]);

  const isCardInDeck = (cardToCheck: Card) => {
    return deck.some(cardInDeck => cardInDeck.id === cardToCheck.id);
  };

  const removeFromDeck = (index: number) => {
    setDeck(prevDeck => prevDeck.filter((_, i) => i !== index));
  };

  const handleInputChangeBouncy = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }

  const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeckName(event.target.value); // Update deck name state
  }

  const handleDiscard = () => {
    setDeck([]); // Clear all cards from the deck
  };

  const handleSave = () => {
    if (!deckName.trim()) {
      // Deck name is empty or only whitespace
      setIsDeckNameValid(false);
      return; // Prevent further actions
    }
    setIsDeckNameValid(true);
  
    // Create a new deck object
    const newDeck = { name: deckName, cards: deck };
  
    // Update the decks state to include the new deck
    setDecks(prevDecks => [...prevDecks, newDeck]);
  
    // Redirect to the collections page
    router.push('/collection');
  };
  
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  const handleEffectClick = (effectIndex: number) => {
    const effect = effects[effectIndex]
    setEffectMap({...effectMap, [effect]: !effectMap[effect]})
  }

  const handleTypeClick = (typeIndex: number) => {
    const type = types[typeIndex]
    setTypeMap({...typeMap, [type]: !typeMap[type]})
  }

  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
      </Head>
      <style jsx>{`
        .card-in-deck {
          box-shadow: 0 0 10px orange; 
        }

        .card-name-container {
          width: 100%; /* Full width */
          background-color: #333; /* Darker shade of grey */
          margin-bottom: 8px; /* Spacing between items */
          padding: 10px 0; /* Vertical padding */
          border-radius: 5px; /* Rounded corners */
        }
      `}</style>
      {jotaiDebug()}
      <main className="flex h-screen flex-col">
        <Navbar />
        <div className="mx-6 mb-6 grid grow grid-cols-12 gap-4 min-h-0">

          {/* Left Panel */}
          <div className="flex col-span-3 rounded-xl border overflow-y-auto">
            <div className="overflow-y-auto">

            {/* Search*/}
            <h2 className="text-2xl font-bold text-white m-1.5">Search</h2>
            <div>
              <input 
                type="text"
                onChange={handleInputChange}
                className="px-4 py-2 border rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent m-1.5"
                placeholder="Search by name" />
            </div>

            {/*Effects*/}
            <h3 className="text-xl font-bold text-white m-1.5">Effects</h3>
            <div className="flex flex-wrap gap-2">
              {effects.map((effect, index) => {
                const bgColor = effectMap[effect] ? 'bg-purple-900' : 'bg-gray-500'
                return (
                  <button
                    key={index}
                    onClick={() => handleEffectClick(index)}
                    className={`text-white font-bold py-2 px-2 rounded m-1.5 ${bgColor}`}>
                    {effect}
                  </button>)
              })}
            </div>
              
            {/*Types*/}
            <h3 className="text-xl font-bold text-white m-1">Types</h3>
            <div className="flex flex-wrap gap-2">
              {types.map((type, index) => {
                const bgColor = typeMap[type] ? 'bg-purple-900' : 'bg-gray-500'
                return (
                  <button
                    key={index}
                    onClick={() => handleTypeClick(index)}
                    className={`text-white font-bold py-2 px-2 rounded m-1 ${bgColor}`}>
                    {type}
                  </button>)
              })}
            </div>

            {/* Selected Card Display */}
            <div className="pb-5">
              <h2 className="text-3xl font-bold text-white m-1.5">Card details</h2>
              <div className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
                {/*TODO handle the image*/}
                <Image src="/card_art/0.jpg" alt={selectedCard?.lore.name || ""} width={256} height={256} className="m-auto" />
                <div className="text-center">{cardName}</div>
              </div>
              <div className="text-center m-2">{cardFlavor}</div>
            </div>
          </div>
        </div>

          {/* Card Collection Display */}
          <div className="col-span-7 flex rounded-xl border overflow-y-auto">
            { isHydrated && cards.length == 0 &&
              <div className="flex flex-row w-full justify-center items-center">
                <MintDeckModal callback={refetch} />
              </div>}

            { isHydrated && cards.length > 0 &&
              <div className="grid grid-cols-4 overflow-y-auto pb-4">
              {cards.map(card => (
                <div 
                className={`m-4 bg-slate-900/50 ${isCardInDeck(card) ? 'card-in-deck' : ''} hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900`}
                  key={`${card.id}`}
                  style={{height: 'fit-content'}}
                  onClick={() => addToDeck(card)}
                  onMouseEnter={() => setSelectedCard(card)}
                  >
                  
                  <Image src="/card_art/0.jpg" alt={card.lore.name} width={256} height={256} />
                  <div className="text-center">{card.lore.name}</div>
                  <div className="flex items-end justify-between p-2 relative">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg absolute bottom-[-16px]">
                      {`${card.stats.attack}`}
                    </div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg absolute bottom-[-16px] right-3">
                      {`${card.stats.defense}`}
                    </div>
                  </div>
                </div>

              ))}
            </div>}
          </div>

          {/* Deck Panel */}
          <div className="col-span-2 flex rounded-xl border overflow-y-auto">
            {/* name and save */}
            <div className="w-full p-3">
              <div style={{ marginBottom: '20px' }}>
                <div className="flex items-center">
                  <input 
                    type="text"
                    placeholder="Deck name"
                    value={deckName}
                    onChange={handleDeckNameChange}
                    className={`flex-grow px-1 py-1 border ${isDeckNameValid ? 'rounded-l-md' : 'border-red-500 rounded-l-md'} text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <button 
                    onClick={handleSave}
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 text-white bg-green-500 hover:bg-green-600 rounded-r-md">
                      ✓
                  </button>
                </div>
              </div>
   
              {/* Container for the Card Names */}
              <div className="flex flex-col w-full">
                {deck.map((card, index) => (
                  <div 
                    key={index} // Using index as key since cards can be duplicated
                    className="card-name-container"
                    onClick={() => removeFromDeck(index)}
                    onMouseEnter={() => setSelectedCard(card)}
                  > 
                    <div className="text-center text-white">{card.lore.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Editor