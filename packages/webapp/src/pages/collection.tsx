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

// NOTE(norswap & geniusgarlic): Just an example, when the game actually has effects & types,
//   fetch those from the chain instead of hardcoding them here.

type Effect = string

const effects: Effect[] = ['Charge', 'Flight', 'Courage', 'Undying', 'Frenzy', 'Enlightened']
const initialEffectMap = Object.assign({}, ...effects.map(name => ({[name]: false})))

const types = ['Creature', 'Magic', 'Weapon']
const initialTypeMap = Object.assign({}, ...types.map(name => ({[name]: false})))

const Collection: FablePage = ({ isHydrated }) => {

  const { address } = useAccount()
  const [ selectedCard, setSelectedCard ] = useState<Card|null>(null)
  const [ searchInput, setSearchInput ] = useState('')
  const [ effectMap, setEffectMap ] = useState(initialEffectMap)
  const [ typeMap, setTypeMap ] = useState(initialTypeMap)

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
    setSearchInput(event.target.value);
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

  // todo @eviterin: would be good to have something in read.ts that allows me to fetch all decks by address
  const testCards = [
    {
      id: BigInt(57),
      lore: {
        name: "Fire Fighter",
        flavor: "",
        URL: ""
      },
      stats: {
        attack: 2,
        defense: 2
      },
      cardTypeID: 57
    },
    {
      id: BigInt(31),
      lore: {
        name: "Wise Elf",
        flavor: "",
        URL: ""
      },
      stats: {
        attack: 1,
        defense: 3
      },
      cardTypeID: 31
    },
    {
      id: BigInt(38),
      lore: {
        name: "Grave Digger",
        flavor: "",
        URL: ""
      },
      stats: {
        attack: 2,
        defense: 3
      },
      cardTypeID: 38
    }
  ];
  const [decks, setDecks] = useState([
    {
      name: "Mystical Creatures",
      cards: testCards // Assuming 'cards' contains the array of card objects
    },
    {
      name: "Empty Deck",
      cards: [] // An empty deck for testing
    }
  ]);


  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
      </Head>
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
              <div className="grid grid-cols-4 gap-4 overflow-y-auto pb-4">
              {cards.map(card => (
                <div className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900"
                     key={`${card.id}`}
                     style={{height: 'fit-content'}}
                     onMouseEnter={() => setSelectedCard(card)}>
                  {/*TODO handle the image*/}
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
            <div className="w-full flex flex-col items-center p-3">
              {/* New Deck Button */}
              <button className="w-full px-4 py-2 mb-2 border rounded-md text-gray-100 bg-purple-900 hover:bg-gray-500 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                New Deck
              </button>

              {/* Deck Buttons */}
              {decks.map((deck, index) => (
                <button 
                  key={index} 
                  className="w-full px-4 py-2 mb-2 border rounded-md text-gray-100 bg-purple-900 hover:bg-gray-500 font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onClick={() => {/* handle deck selection or other action */}}
                >
                  {deck.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Collection