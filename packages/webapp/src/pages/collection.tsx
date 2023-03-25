import { type NextPage } from "next";
import Head from "next/head";
import { Navbar } from "../components/navbar";
import React, { useState } from 'react';

//quick fix for testing
const cards = [
  {
    name: "Magician1",
    description: "A powerful magician",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
  {
    name: "Dwarf1",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
    image: "/card_art/1",
  },
  {
    name: "Dwarf2",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
    image: "/card_art/2",
  },
  {
    name: "Dwarf3",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
    image: "/card_art/3",
  },
  {
    name: "Dwarf4",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
    image: "/card_art/4",
  },
  {
    name: "Warrior",
    description: "A fierce warrior, having fought many battles.",
    attack: 1,
    defense: 1,
    image: "/card_art/5",
  },
  {
    name: "Dwarf5",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
    image: "/card_art/6",
  },
  {
    name: "Dwarf6",
    description: "A sturdy dwarven druid.",
    attack: 1,
    defense: 1,
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
    description: "A powerful magician.",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
  {
    name: "Magician3",
    description: "A powerful magician.",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
];  


const Play: NextPage = () => {
  const [selectedCard, setSelectedCard] = useState(cards[0]);

  const handleClick = (card) => {
    setSelectedCard(card);
  };

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
          <div className="col-span-3 grow rounded-xl border">
            search box / filters by others (attack, defense, etc.)
            card displayed (what should it be at the start?)
            <div key={selectedCard.name} className="m-4 bg-slate-900/50 rounded-lg p-4 border-4 border-slate-900">
              <img src={selectedCard.image} alt={selectedCard.name} className="w-64 h-64" />
              <div className="text-center">{selectedCard.name}</div>
              <div className="text-center">{selectedCard.description}</div>
            </div>

          </div>
          <div className="col-span-9 h-full rounded-xl border overflow-y-auto h-screen">
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.name} className="m-4 bg-slate-900/50 hover:bg-slate-800 rounded-lg p-4 border-4 border-slate-900" onClick={() => handleClick(card)}>
                  <img src={card.image} alt={card.name} className="w-64 h-64" />
                  <div className="text-center">{card.name}</div>
                  <div className="text-center">{card.description}</div>
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
