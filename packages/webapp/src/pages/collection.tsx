import React, { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { type NextPage } from 'next'
import Head from "next/head"
import debounce from 'lodash/debounce'

import { MintGameModal } from "src/components/modals/mintDeckModal"
import { Navbar } from "src/components/navbar"
import { useInventoryCardsCollectionGetCollection } from "src/generated"
import { deployment } from "src/deployment"
import { useIsMounted } from "src/hooks/useIsMounted"
import { Card } from "src/types"

// NOTE(norswap & geniusgarlic): Just an example, when the game actually has effects & types,
//   fetch those from the chain instead of hardcoding them here.

const effects = ['Charge', 'Flight', 'Courage', 'Undying', 'Frenzy', 'Enlightened']
const initialEffectMap = Object.assign({}, ...effects.map(name => ({[name]: false})))

const types = ['Creature', 'Magic', 'Weapon']
const initialTypeMap = Object.assign({}, ...types.map(name => ({[name]: false})))

const Play: NextPage = () => {

  const isMounted = useIsMounted()
  const { address } = useAccount()
  const [selectedCard, setSelectedCard] = useState<Card>(null)
  const [searchInput, setSearchInput] = useState('')
  const [effectMap, setEffectMap] = useState(initialEffectMap)
  const [typeMap, setTypeMap] = useState(initialTypeMap)

  const cardName = selectedCard?.lore.name || "Select a card"
  const cardFlavor = selectedCard?.lore.flavor || "Select a card to see its details"

  const activeEffects = Object.keys(effectMap).filter(key => effectMap[key])
  const activeTypes = Object.keys(typeMap).filter(key => typeMap[key])

  const { data: unfilteredCards } = useInventoryCardsCollectionGetCollection({
    address: deployment.InventoryCardsCollection,
    args: [address]
  }) as { data: Card[] }

  const cards: Card[] = (unfilteredCards || []).filter(card => {
    // TODO(norswap): it would look like this if the card had effects & types
    // const cardEffects = card.stats.effects || []
    // const cardTypes = card.stats.types || []
    const cardEffects = []
    const cardTypes = []
    return activeEffects.every(effect => cardEffects.includes(effect))
      && activeTypes.every(type => cardTypes.includes(type))
      && card.lore.name.toLowerCase().includes(searchInput.toLowerCase())
  })

  const handleInputChangeBouncy = (event) => {
    setSearchInput(event.target.value);
  }
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  const handleEffectClick = (effectIndex) => {
    const effect = effects[effectIndex]
    setEffectMap({...effectMap, [effect]: !effectMap[effect]})
  }

  const handleTypeClick = (typeIndex) => {
    const type = types[typeIndex]
    setTypeMap({...typeMap, [type]: !typeMap[type]})
  }

  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
      </Head>

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
                <img src="/card_art/0" alt={selectedCard?.lore.name || ""} className="w-64 h-64 m-auto"/>
                <div className="text-center">{cardName}</div>
              </div>
              <div className="text-center m-2">{cardFlavor}</div>
            </div>
          </div>
        </div>

          {/* Card Collection Display */}
          <div className="col-span-9 flex rounded-xl border overflow-y-auto">
            { isMounted && cards.length == 0 &&
              <div className="flex flex-row w-full justify-center items-center">
                <MintGameModal />
              </div>}

            { isMounted && cards.length > 0 &&
              <div className="grid grid-cols-4 gap-4 overflow-y-auto pb-4">
              {cards.map(card => (
                <div className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900"
                     key={`${card.id}`}
                     style={{height: 'fit-content'}}
                     onClick={() => setSelectedCard(card)}>
                  {/*TODO handle the image*/}
                  <img src="/card_art/0" alt={card.lore.name} className="w-64 h-64" />
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
        </div>
      </main>
    </>
  )
}

export default Play