import { type NextPage } from "next";
import Head from "next/head";
import { Navbar } from "../components/navbar";
import React, { useState, useEffect } from 'react';
import { useInventoryGetCollection } from "../generated";
import { useAccount } from 'wagmi'
import { deployment } from "src/deployment";
// Eventually, you have to get all the effects used in the collection's cards
const effects = [{label: 'Charge', active: false}, {label: 'Flight', active: false}, {label: 'Courage', active: false}, {label: 'Undying', active: false}, {label: 'Frenzy', active: false}, {label: 'Enlightened', active: false}];
const types = [{label: 'Creature', active: false}, {label: 'Magic', active: false}, {label: 'Weapon', active: false}];

const Play: NextPage = () => {

  const { address } = useAccount();

  const [selectedCard, setSelectedCard] = useState({name: 'Select a card', flavor: 'Select a card to see its details'});
  const [searchInput, setSearchInput] = useState('');
  const [activeEffects, setActiveEffects] = useState(effects);
  const [activeTypes, setActiveTypes] = useState(types);
  const [cardsAvailable, setCardsAvailable] = useState(false);

  const cardsData = useInventoryGetCollection({
    address: deployment.Inventory,
    args: [address] // TODO change this to the address of the user
  });
  var cards = cardsData.data;
  
  useEffect(() => setCardsAvailable((typeof cards==='undefined' || cards.length===0)?false:true), [])
  
  const handleClick = (card) => {
    setSelectedCard(card);
  };

  const handleClickDiscover = () => {
    setCardsAvailable((typeof cards==='undefined' || cards.length===0)?false:true);
  };

  const handleEffectClick = (index) => {
    const newEffects = [...activeEffects];
    newEffects[index].active = !newEffects[index].active;
    setActiveEffects(newEffects);
  };

  const handleTypeClick = (index) => {
    console.log(cards);
    console.log(typeof cards === 'undefined');
    console.log(cardsAvailable);
    console.log((typeof cards==='undefined')?false:true);
    const newTypes = [...activeTypes];
    newTypes[index].active = !newTypes[index].active;
    setActiveTypes(newTypes);
  };

  const handleInputChange = (event) => {
    setSearchInput(event.target.value);
  }

  // TODO: search takes too much places over the card details (maybe make the details pop over the search?)

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
            <div>
              <h2 className="text-3xl font-bold text-white" style={{margin: '5px'}}>Card details</h2>
              <div key={selectedCard.name} className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
                <img src="/card_art/0" alt={selectedCard.name} className="w-64 h-64" style={{margin: "auto"}} /> {/*TODO handle the image*/}
                <div className="text-center">{selectedCard.name}</div>
              </div>
              <div className="text-center" style={{margin: "10px"}}>{selectedCard.flavor}</div>
              <div className="h-20"></div> {/*to add padding at the bottom*/}
            </div>

        </div>

          {/* the actual card collection displayed on the right*/}
          <div className="col-span-9 h-full rounded-xl border overflow-auto h-screen">
            { !cardsAvailable &&
              <div className="flex flex-col justify-center items-center h-screen overscroll-auto">
                {/*Can't remove the scrollba*/}
                
                <button
                onClick={() => handleClickDiscover()}
                className={`text-white font-bold py-5 px-5 rounded bg-gray-500`}
                style={{margin: "20px"}}>
                <h2 className="text-3xl font-bold text-white">
                  Please click here after you minted your deck to see your card collection ...
                </h2>
              </button>
              </div>
            }
            { cardsAvailable && typeof cards !== 'undefined' &&
              <div className="grid grid-cols-4 gap-4">
              {cards.filter(card => card[0].name.toLowerCase().includes(searchInput.toLowerCase()))
              .filter(card => {
                        const cardEffects = card[1].effects || []; // assume empty array if 'effects' doesn't exist
                        const cardTypes = card[1].types || []; // assume empty array if 'types' doesn't exist
                        return activeEffects.every(effect => effect.active ? cardEffects.includes(effect.label) : true) &&
                              activeTypes.every(type => type.active ? cardTypes.includes(type.label) : true);
                      })
              .map((card) => (
                <div className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900" style={{height: '95%'}} onClick={() => handleClick(card[0])}>
                <img src="/card_art/0" alt={card[0].name} className="w-64 h-64" /> {/*TODO handle the image*/}
                <div className="text-center">{card[0].name}</div>
                <div className="card-footer">
                  <div className="attack">{card[1].attack}</div>
                  <div className="defense">{card[1].defense}</div>
                </div>
              </div>
              
              ))}
              <div className="h-20"> </div> {/*to add padding at the bottom*/}
            </div>
            }
          </div>
        </div>
      </main>
    </>
  );
};

export default Play;
