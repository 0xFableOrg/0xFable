import { useEffect, useState } from "react"

import Hand from "src/components/hand"
import { LoadingModal } from "src/components/lib/loadingModal"
import { useModalController } from "src/components/lib/modal"
import { GameEndedModal } from "src/components/modals/gameEndedModal"
import { Navbar } from "src/components/navbar"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { getPrivateInfo } from "src/store/read"
import { GameStatus, PrivateInfo } from "src/store/types"
import { FablePage } from "src/pages/_app"
import { Address } from "viem"

const Play: FablePage = ({ isHydrated }) => {
  const [ gameID ] = store.useGameID()
  const gameStatus = store.useGameStatus()
  const [ hasVisitedBoard, visitBoard ] = store.useHasVisitedBoard()
  useEffect(() => visitBoard, [visitBoard, hasVisitedBoard])
  const [ loading, setLoading ] = useState<string|null>(null)
  const [ hideResults, setHideResults ] = useState(false)
  const [ concedeCompleted, setConcedeCompleted ] = useState(false)
  const playerAddress = store.usePlayerAddress()

  let privateInfo: PrivateInfo | null = null
  if (gameID) {
    privateInfo = getPrivateInfo(gameID as bigint, playerAddress as Address)
  }

  const playerHand: bigint[] | null = privateInfo
    ? (privateInfo?.deck as bigint[])
    : null

  const ended = gameStatus === GameStatus.ENDED || concedeCompleted

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: gameID !== null,
    setLoading,
    // Optimistically update the UX, as we know the transaction succeeded and the data refresh
    // will follow.
    onSuccess: () => setConcedeCompleted(true),
  })

  const ctrl = useModalController({ displayed: true, closeable: false })

  // TODO: if there is no game ID, should redirect away from this page
  // TODO: the navbar connector should show bad chain if it's a bad chain

  // -----------------------------------------------------------------------------------------------

  if (!isHydrated) return <></>

  return (
    <>
      {loading && (
        <LoadingModal ctrl={ctrl} loading={loading} setLoading={setLoading} />
      )}

      {ended && !hideResults && (
        <GameEndedModal closeCallback={() => setHideResults(true)} />
      )}

      <main className="flex min-h-screen flex-col">
        <Navbar />

        <Hand
          cards={playerHand}
          className="absolute left-0 right-0 mx-auto z-[100] translate-y-1/2 transition-all duration-500 rounded-xl ease-in-out hover:translate-y-0"
        />
        <div className="grid-col-1 relative mx-6 mb-6 grid grow grid-rows-[6]">
          <div className="border-b-1 relative row-span-6 rounded-xl rounded-b-none border bg-base-300 shadow-inner">
            <p className="z-0 m-2 font-mono font-bold"> 🛡 p2 address </p>
            <p className="z-0 m-2 font-mono font-bold"> ♥️ 100 </p>
            {/* <div className="absolute top-0 right-1/2 -mb-2 flex h-32 w-32 translate-x-1/2 items-center justify-center rounded-full border bg-slate-900  font-mono text-lg font-bold text-white">
              100
            </div> */}
          </div>

          {!ended && (
            <>
              <button className="btn-warning btn-lg btn absolute right-96 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
                DRAW
              </button>

              <button className="btn-warning btn-lg btn absolute right-48 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105">
                END TURN
              </button>

              <button
                className="btn-warning btn-lg btn absolute right-4 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={!concede}
                onClick={concede}
              >
                CONCEDE
              </button>
            </>
          )}

          {/* TODO avoid the bump by grouping buttons in a container that is translated, then no need for the translation here and the important */}
          {ended && (
            <>
              <button
                className="btn-warning btn-lg btn absolute right-4 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                onClick={() => setHideResults(false)}
              >
                SEE RESULTS & EXIT
              </button>
            </>
          )}

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

export default Play
