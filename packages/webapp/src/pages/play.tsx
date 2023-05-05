import { useAtom } from "jotai"
import { type NextPage } from "next"
import { useEffect, useState } from "react"

import Hand from "src/components/hand"
import { GameEndedModal } from "src/components/modals/gameEndedModal"
import { LoadingModal } from "src/components/modals/loadingModal"
import { ModalTitle } from "src/components/lib/modalElements"
import { Navbar } from "src/components/navbar"
import { useGameWrite } from "src/hooks/fableTransact"
import { useIsHydrated } from "src/hooks/useIsHydrated"
import * as store from "src/store"
import { GameStatus } from "src/types"

const Play: NextPage = () => {
  const isHydrated = useIsHydrated()
  const [ gameID ] = useAtom(store.gameID)
  const [ data ] = useAtom(store.gameData)
  const [ gameStatus ] = useAtom(store.gameStatus)
  const [ hasVisitedBoard, setHasVisitedBoard ] = useAtom(store.hasVisitedBoard)
  useEffect(() => setHasVisitedBoard(true), [hasVisitedBoard])
  const [ loading, setLoading ] = useState<string>(null)

  const [ playerHand ] = useAtom(store.playerHand)

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    setLoading
  })

  // -----------------------------------------------------------------------------------------------

  if (loading) return <>
    <LoadingModal>
      <ModalTitle>{loading}</ModalTitle>
    </LoadingModal>
  </>

  return (
    <>
      {gameStatus === GameStatus.ENDED && <GameEndedModal />}
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

          <button
            className=" btn-warning btn-lg btn absolute right-96 bottom-1/2 z-50 translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
            DRAW
          </button>

          <button
            className=" btn-warning btn-lg btn absolute right-48 bottom-1/2 z-50 translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
            END TURN
          </button>

          <button
            className=" btn-warning btn-lg btn absolute right-4 bottom-1/2 z-50 translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
            disabled={!concede} onClick={concede}>
            CONCEDE
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
  )
}

export default Play;
