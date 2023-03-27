import { type NextPage } from "next";
import Head from "next/head";
import { Navbar } from "../components/navbar";
import React, { useState } from 'react';

//quick fix for testing
const cards = [
  {
    name: "Magician1",
    description: "A powerful magician",
    attack: 10,
    defense: 1,
    image: "/card_art/0",
    effects: ["Charge", "Flight"],
    types: ["Creature", "Magic"],
  },
  {
    name: "Dwarf1",
    description: "A sturdy dwarven druid.",
    attack: 5,
    defense: 6,
    image: "/card_art/1",
  },
  {
    name: "Dwarf2",
    description: "A sturdy dwarven druid.",
    attack: 7,
    defense: 2,
    image: "/card_art/2",
  },
  {
    name: "Dwarf3",
    description: "A sturdy dwarven druid.",
    attack: 5,
    defense: 5,
    image: "/card_art/3",
  },
  {
    name: "Dwarf4",
    description: "A sturdy dwarven druid.",
    attack: 4,
    defense: 3,
    image: "/card_art/4",
  },
  {
    name: "Warrior",
    description: "A fierce warrior, having fought many battles.",
    attack: 9,
    defense: 9,
    image: "/card_art/5",
  },
  {
    name: "Dwarf5",
    description: "A sturdy dwarven druid.",
    attack: 6,
    defense: 5,
    image: "/card_art/6",
  },
  {
    name: "Dwarf6",
    description: "A sturdy dwarven druid.",
    attack: 5,
    defense: 7,
    image: "/card_art/7",
  },
  {
    name: "Goblin1",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/8",
  },
  {
    name: "Goblin2",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/9",
  },
  {
    name: "Magician2",
    description: "The female magician stands in front of a backdrop of a deep, midnight blue sky, studded with shining stars. She is bathed in the warm light of a single spotlight, which picks out the intricate details of her costume. Her long, flowing robes are made of shimmering black silk, and they trail elegantly behind her as she moves. A golden, jeweled belt cinches her waist, adding a touch of glamour to her ensemble. She stands tall and proud, holding a wand aloft in one hand, as if ready to cast a spell at any moment. Her expression is confident and determined, with a hint of mischief in her eyes.",
    attack: 10,
    defense: 1,
    image: "/card_art/0",
  },
  {
    name: "Magician3",
    description: "A powerful magician.",
    attack: 10,
    defense: 1,
    image: "/card_art/0",
  },
];

// Eventually, you have to get all the effects used in the collection's cards
const effects = [{label: 'Charge', active: false}, {label: 'Flight', active: false}, {label: 'Courage', active: false}, {label: 'Undying', active: false}, {label: 'Frenzy', active: false}, {label: 'Enlightened', active: false}];
const types = [{label: 'Creature', active: false}, {label: 'Magic', active: false}, {label: 'Weapon', active: false}];

const Play: NextPage = () => {
  const [selectedCard, setSelectedCard] = useState(cards[0]);
  const [searchInput, setSearchInput] = useState('');
  const [activeEffects, setActiveEffects] = useState(effects);
  const [activeTypes, setActiveTypes] = useState(types);

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

  // TODO: search takes too much places over the card details (maybe make the details pop over the search?)
  // TODO: pull the real cards from the collection

  return (
    <>
      <Head>
        <title>0xFable: My Collection</title>
        <meta name="description" content="Manage your card collection" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col">
        <Navbar />
        <div className="grid-col-2 mx-6 mb-6 grid grow grid-cols-12 gap-4">
          <div className="col-span-3 grow rounded-xl border overflow-y-auto h-screen">

            {/* Search*/}
            <h2 className="text-2xl font-bold text-white" style={{margin: '5px'}}>Search</h2>
            <div>
              <input type="text" value={searchInput} onChange={handleInputChange} className="px-4 py-2 border rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{margin: "5px"}} placeholder="Search by name" />
            </div>

            {/*Effects*/}
            <h3 className="text-xl font-bold text-white" style={{margin: '5px'}}>Effects</h3>
            <div className="flex flex-wrap gap-2">
              {activeEffects.map((effect, index) => (
                <button
                  key={index}
                  onClick={() => handleEffectClick(index)}
                  className={`text-white font-bold py-2 px-2 rounded ${effect.active ? 'bg-purple-900' : 'bg-gray-500'}`}
                  style={{margin: "5px"}}>
                  {effect.label}
                </button>
              ))}
            </div>
              
            {/*Types*/}
            <h3 className="text-xl font-bold text-white" style={{margin: '5px'}}>Types</h3>
            <div className="flex flex-wrap gap-2">
              {activeTypes.map((type, index) => (
                <button
                  key={index}
                  onClick={() => handleTypeClick(index)}
                  className={`text-white font-bold py-2 px-2 rounded ${type.active ? 'bg-green-900' : 'bg-gray-500'}`}
                  style={{margin: "5px"}}>
                  {type.label}
                </button>
              ))}
            </div>

            {/* the selected card displayed on the left*/}
            <h2 className="text-3xl font-bold text-white" style={{margin: '5px'}}>Card details</h2>
  
            <div key={selectedCard.name} className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
              <img src={selectedCard.image} alt={selectedCard.name} className="w-64 h-64" style={{margin: "auto"}} />
              <div className="text-center">{selectedCard.name}</div>
            </div>
            <div className="text-center" style={{margin: "10px"}}>{selectedCard.description}</div>
            <div className="h-20"></div> {/*to add padding at the bottom*/}

          </div>

          {/* the actual card collection displayed on the right*/}
          <div className="col-span-9 h-full rounded-xl border overflow-y-auto h-screen">
            <div className="grid grid-cols-4 gap-4">
              {cards.filter(card => card.name.toLowerCase().includes(searchInput.toLowerCase()))
              .filter(card => {
                        const cardEffects = card.effects || []; // assume empty array if 'effects' doesn't exist
                        const cardTypes = card.types || []; // assume empty array if 'types' doesn't exist
                        return activeEffects.every(effect => effect.active ? cardEffects.includes(effect.label) : true) &&
                               activeTypes.every(type => type.active ? cardTypes.includes(type.label) : true);
                      })
              .map((card) => (
                <div key={card.name} className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900" style={{height: '95%'}} onClick={() => handleClick(card)}>
                  <img src={card.image} alt={card.name} className="w-64 h-64" />
                  <div className="text-center">{card.name}</div>
                  <div className="card-footer">
                    <div className="attack">{card.attack}</div>
                    <div className="defense">{card.defense}</div>
                  </div>
                </div>
              ))}
              <div className="h-20"></div> {/*to add padding at the bottom*/}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Play;
