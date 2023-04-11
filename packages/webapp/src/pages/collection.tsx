import React, { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { type NextPage } from 'next'
import debounce from 'lodash/debounce'
import Head from "next/head"

import { MintGameModal } from "../components/modals/mintDeckModal"
import { Navbar } from "src/components/navbar"
import { useInventoryCardsCollectionGetCollection } from "src/generated"
import { deployment } from "src/deployment"

// Eventually, you have to get all the effects used in the collection's cards
const effects = [{label: 'Charge', active: false}, {label: 'Flight', active: false}, {label: 'Courage', active: false}, {label: 'Undying', active: false}, {label: 'Frenzy', active: false}, {label: 'Enlightened', active: false}];
const types = [{label: 'Creature', active: false}, {label: 'Magic', active: false}, {label: 'Weapon', active: false}];

const Play: NextPage = () => {

  const { address } = useAccount();

  const [selectedCard, setSelectedCard] = useState({name: 'Select a card', flavor: 'Select a card to see its details'});
  const [searchInput, setSearchInput] = useState('');
  const [activeEffects, setActiveEffects] = useState(effects);
  const [activeTypes, setActiveTypes] = useState(types);

  const cardsData = useInventoryCardsCollectionGetCollection({
    address: deployment.InventoryCardsCollection,
    args: [address]
  });
  const cards = cardsData.data || [];

    
  const handleClick = (card) => {
    setSelectedCard(card);
  };

  const handleEffectClick = (index) => {
    const newEffects = [...activeEffects];
    newEffects[index].active = !newEffects[index].active;
    setActiveEffects(newEffects);
  };

  const handleTypeClick = (index) => {
    const newTypes = [...activeTypes];
    newTypes[index].active = !newTypes[index].active;
    setActiveTypes(newTypes);
  };

  const handleInputChange = (event) => {
    setSearchInput(event.target.value);
  }

  const debounceHandler = useMemo(
    () => debounce(handleInputChange, 300)
  , []);

  const filteredCards = cards.filter(card => {
    const cardEffects = card[1].effects || []; // assume empty array if 'effects' doesn't exist
    const cardTypes = card[1].types || []; // assume empty array if 'types' doesn't exist
    return activeEffects.every(effect => effect.active ? cardEffects.includes(effect.label) : true) &&
          activeTypes.every(type => type.active ? cardTypes.includes(type.label) : true) &&
          card[0].name.toLowerCase().includes(searchInput.toLowerCase());
  });

  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
        <meta name="description" content="Manage your card collection" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex h-screen flex-col">
        <Navbar />
        <div className="mx-6 mb-6 grid grow grid-cols-12 gap-4 min-h-0">
          
          <div className="flex col-span-3 rounded-xl border overflow-y-auto">
            <div className="overflow-y-auto">

            {/* Search*/}
            <h2 className="text-2xl font-bold text-white m-1.5">Search</h2>
            <div>
              <input 
                type="text"
                onChange={debounceHandler}
                className="px-4 py-2 border rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent m-1.5"
                placeholder="Search by name" />
            </div>

            {/*Effects*/}
            <h3 className="text-xl font-bold text-white m-1.5">Effects</h3>
            <div className="flex flex-wrap gap-2">
              {activeEffects.map((effect, index) => (
                <button
                  key={index}
                  onClick={() => handleEffectClick(index)}
                  className={`text-white font-bold py-2 px-2 rounded m-1.5 ${effect.active ? 'bg-purple-900' : 'bg-gray-500'}`}>
                  {effect.label}
                </button>
              ))}
            </div>
              
            {/*Types*/}
            <h3 className="text-xl font-bold text-white m-1">Types</h3>
            <div className="flex flex-wrap gap-2">
              {activeTypes.map((type, index) => (
                <button
                  key={index}
                  onClick={() => handleTypeClick(index)}
                  className={`text-white font-bold py-2 px-2 rounded m-1 ${type.active ? 'bg-green-900' : 'bg-gray-500'}`}>
                  {type.label}
                </button>
              ))}
            </div>

            {/* the selected card displayed on the left*/}
              <div>
                <h2 className="text-3xl font-bold text-white m-1.5">Card details</h2>
                <div key={selectedCard.name} className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
                  <img src="/card_art/0" alt={selectedCard.name} className="w-64 h-64 m-auto"/> {/*TODO handle the image*/}
                  <div className="text-center">{selectedCard.name}</div>
                </div>
                <div className="text-center m-2">{selectedCard.flavor}</div>
                <div className="h-20"></div> {/*to add padding at the bottom*/}
              </div>
          </div>
        </div>

          {/* the actual card collection displayed on the right*/}
          <div className="col-span-9 flex rounded-xl border overflow-y-auto">
            { !(cards.length > 0) &&
              <div className="flex flex-row w-full justify-center items-center">
                <MintGameModal />
              </div>
            }
            { cards.length > 0 &&
              <div className="grid grid-cols-4 gap-4 overflow-y-auto pb-4">
              {filteredCards.map((card) => (
                <div className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900" style={{height: 'fit-content'}} onClick={() => handleClick(card[0])}>
                <img src="/card_art/0" alt={card[0].name} className="w-64 h-64" /> {/*TODO handle the image*/}
                <div className="text-center">{card[0].name}</div>
                  <div className="flex items-end justify-between p-2 relative">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg absolute bottom-[-16px]">
                      {card[1].attack}
                    </div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-gray-900 font-bold text-lg absolute bottom-[-16px] right-3">
                      {card[1].defense}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            }
          </div>
        </div>
      </main>
    </>
  );
};

export default Play;
