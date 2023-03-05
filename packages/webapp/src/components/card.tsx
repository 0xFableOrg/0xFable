import Image from "next/image";
import useStore from "../store";

//quick fix for hackathon
const cards = [
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/1",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/2",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/3",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/4",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/5",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/6",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/7",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/8",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/9",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
  {
    name: "Goblin",
    description: "A small, green, mean, and ugly creature.",
    attack: 1,
    defense: 1,
    image: "/card_art/0",
  },
];

export const Card = ({ id, className }: { id: number; className?: string }) => {
  const addtoPlayerBoard = useStore((state) => state.addtoPlayerBoard);
  const removefromPlayerHand = useStore((state) => state.removefromPlayerHand);

  return (
    <div
      className={` ${className} shadow-2xl} z-[50] flex h-[33rem] max-w-[24rem] scale-[65%] cursor-pointer flex-col items-center justify-evenly rounded-lg  border-4 bg-gray-900 p-5 text-center`}
      onClick={() => {
        addtoPlayerBoard(id);
        removefromPlayerHand(id);
      }}
    >
      <h1 className="font- font-serif text-3xl font-bold text-slate-200">
        {cards[id].name}
      </h1>
      <Image
        alt={`${id}`}
        src={cards[id].image}
        width={375}
        height={375}
        className="pointer-events-none rounded-xl border"
      />
      <p className=" -mt-10 rounded-b-xl border border-t-0 bg-slate-900 font-mono font-semibold italic">
        {cards[id].description}
      </p>
      <hr className="w-full border-slate-500" />
      <div className="flex w-full justify-between font-mono text-2xl">
        <p>⚔️ {cards[id].attack}</p>
        <p>🛡 {cards[id].defense}</p>
      </div>
    </div>
  );
};
