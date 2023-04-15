import { constants } from "ethers/lib"
import { useAtom } from "jotai"
import { type NextPage } from "next"
import {useEffect, useRef, useState} from "react"
import { Address, useAccount } from "wagmi"

import Hand from "src/components/hand"
import { Navbar } from "src/components/navbar"
import { deployment } from "src/deployment"
import { gameABI, useGame } from "src/generated"
import * as store from "src/store"
import {useGameEvents, useGameRead} from "src/hooks/fableTransact";
import {StaticGameData} from "src/types";

const events = [
  'CardDrawn',
  'CardPlayed',
  'PlayerAttacked',
  'PlayerDefended',
  'PlayerPassed',
  'PlayerJoined'
]

/*
// A player drew a card.
    event CardDrawn(uint256 indexed gameID, uint8 player);

    // A player played a card.
    event CardPlayed(uint256 indexed gameID, uint8 player, uint256 card);

    // A player attacked another player.
    event PlayerAttacked(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player defended against another player.
    event PlayerDefended(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player ended his turn without attacking.
    event PlayerPassed(uint256 indexed gameID, uint8 player);
 */

const Play: NextPage = () => {

  const [ gameID ] = useAtom(store.gameID)
  // const ID = gameID ? BigNumber.from(gameID) : null
  const [ ID ] = useState(0) // TODO debug purposes
  const game: [Address, any] = [deployment.Game, gameABI]
  const zero = constants.HashZero
  const { address } = useAccount()
  const gameContract = useGame({ address: deployment.Game })

  useGameEvents(events, (name, ...args) => {
    console.log(`event fired ${name}(${args})`)
    switch (name) {
      case 'CardDrawn': {
        const [gameID, player] = args;
        break;
      } case 'CardPlayed': {
        const [gameID, player, card] = args;
        break;
      } case 'PlayerAttacked': {
        const [gameID, attacking, defending] = args;
        break;
      } case 'PlayerDefended': {
        const [gameID, attacking, defending] = args;
        break;
      } case 'PlayerPassed': {
        const [gameID, player] = args;
        break;
      } case 'PlayerJoined': {
        const [gameID, player] = args;
        // Refetch game data to get up to date player list.
        if (player != address && playersLeftToJoin.current > 0)
          refetch()
        break;
      }
    }
  })

  const { data, refetch } = useGameRead<StaticGameData>({
    functionName: "staticGameData",
    args: [ID]
  })

  const playersLeftToJoin = useRef(data?.playersLeftToJoin ?? 2)

  useEffect(() => {
    if (playersLeftToJoin.current == 0) return
    const timeoutID = setTimeout(() => {
      console.log("timer firing: " + playersLeftToJoin.current)
      if (playersLeftToJoin.current > 0) {
        console.log("refetching via timer")
        // One second has passed and there are players that still need to join.
        // Refetch to make sure we didn't make miss the PlayerJoined event (could happen if it fired
        // the event subscription was set up).
        refetch()
      }
    }, 1000)
    return () => {
      clearTimeout(timeoutID)
    }
  }, [])

  // TODO debug initial rendering

  // TODO: learn how to pop an info modal
  // TODO: learn how to pop a spinner modal + pop one while waiting for player to join


  console.log(data)




  const currentStep = useState(data?.currentStep)
  const currentPlayer = useState(data?.currentPlayer)

  const [ playerHand, ] = useAtom(store.playerHand)


  // useEvents(...game, [""])

  /*
  useGameEvent({
    address: deployment.Game,
    eventName: "CardDrawn",
    listener(x) {
      console.log(x);
      refetch();
    },
  });

  const currentStep = useState(data?.currentStep);
  const currentPlayer: any = useState(data?.currentPlayer);

  console.log("--- current ---")
  console.log(currentStep);
  console.log(currentPlayer);

  function isStep(expected): boolean {
    return data && expected.includes(currentStep) && currentPlayer == address;
  }

  const [drawn, draw] = useTransact(...game, "drawCard", [ID, zero, zero, zero],
    (receipt) => {
      console.log("drawn");
    },
    isStep(['draw']));

  const [passed, pass] = useTransact(...game, "pass", [ID],
    (receipt) => {
      console.log("passed");
    },
    isStep(['attack', 'play']));

   */

  const draw = null, pass = null;

  return (
    <>
      <main className="flex min-h-screen flex-col">
        <Navbar />

        <Hand
          cards={playerHand}
          className="mt-500 absolute z-[100] translate-y-1/2 transition-all duration-500 ease-in-out hover:translate-y-0"
        />
        <div className="grid-col-1 relative mx-6 mb-6 grid grow grid-rows-[6]">
          <div className="border-b-1 relative row-span-6 rounded-xl rounded-b-none border bg-base-300 shadow-inner">
            <p className="z-0 m-2 font-mono font-bold"> 🛡 p2 address </p>
            <p className="z-0 m-2 font-mono font-bold"> ♥️ 100 </p>
            {/* <div className="absolute top-0 right-1/2 -mb-2 flex h-32 w-32 translate-x-1/2 items-center justify-center rounded-full border bg-slate-900  font-mono text-lg font-bold text-white">
              100
            </div> */}
          </div>

          <button onClick={refetch}
          // <button onClick={draw}
            className=" btn-warning btn-lg btn absolute right-48 bottom-1/2 z-50 translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
            DRAW
          </button>

          <button onClick={pass}
            className=" btn-warning btn-lg btn absolute right-4 bottom-1/2 z-50 translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
            END TURN
          </button>

          <div className="relative row-span-6 rounded-xl rounded-t-none border border-t-0 bg-base-300 shadow-inner">
            <p className="z-0 m-2 font-mono font-bold"> ⚔️ p1 address </p>
            <p className="-0 m-2 font-mono font-bold"> ♥️ 100 </p>
            {/* <div className="absolute bottom-0 right-1/2 -mb-2 flex h-32 w-32 translate-x-1/2 items-center justify-center rounded-full border bg-slate-900  font-mono text-lg font-bold text-white">
              100
            </div> */}
          </div>
        </div>
      </main>
    </>
  );
};

export default Play;
