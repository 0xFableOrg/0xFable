import { useEffect, useMemo, useState } from "react"

import Hand from "src/components/hand"
import { CancellationHandler, LoadingModal } from "src/components/lib/loadingModal"
import { useModalController } from "src/components/lib/modal"
import { GameEndedModal } from "src/components/modals/gameEndedModal"
import { Navbar } from "src/components/navbar"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { GameStatus, GameStep } from "src/store/types"
import { FablePage } from "src/pages/_app"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { useRouter } from "next/router"
import { setError } from "src/store/actions"
import { DISMISS_BUTTON } from "src/actions/errors"
import { navigate } from "src/utils/navigate"
import { drawCard } from "src/actions/drawCard"
import { endTurn } from "src/actions/endTurn"
import { currentPlayer, isEndingTurn } from "src/game/misc"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"

const Play: FablePage = ({ isHydrated }) => {
  const [ gameID, setGameID ] = store.useGameID()
  const gameStatus = store.useGameStatus()
  const [ loading, setLoading ] = useState<string|null>(null)
  const [ hideResults, setHideResults ] = useState(false)
  const [ concedeCompleted, setConcedeCompleted ] = useState(false)
  const playerAddress = store.usePlayerAddress()
  const router = useRouter()
  const privateInfo = store.usePrivateInfo(gameID, playerAddress)
  const gameData = store.useGameData()

  const [ hasVisitedBoard, visitBoard ] = store.useHasVisitedBoard()
  useEffect(visitBoard, [visitBoard, hasVisitedBoard])

  useEffect(() => {
    // If the game ID is null, fetch it from the contract. If still null, we're not in a game,
    // navigate back to homepage.
    const fetchGameID = async () => {
      const fetchedGameID = await readContract({
        address: deployment.Game,
        abi: gameABI,
        functionName: "inGame",
        args: [playerAddress as Address],
      })
      console.log("fetchedGameID", fetchedGameID)
      if (fetchedGameID > 0n)
        setGameID(fetchedGameID)
      else
        void navigate(router, "/")
    }

    // Back to home screen if player disconnects.
    if (playerAddress === null)
      void navigate(router, "/")

    if (gameID === null && playerAddress !== null)
      void fetchGameID()

  }, [gameID, setGameID, playerAddress, router])

  const playerHand: bigint[] | null = privateInfo?.deck as bigint[] ?? null

  const ended = gameStatus === GameStatus.ENDED || concedeCompleted

  useEffect(() => {
    // This avoids overlapping the concede loading modal with the game ended modal. This tends to
    // happen because we receive the game ended event before the confirmation that the concede
    // transaction succeeded.
    if (ended) setLoading(null)
  }, [ended])

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: gameID !== null,
    setLoading,
    // Optimistically update the UX, as we know the transaction succeeded and the data refresh
    // will follow.
    onSuccess: () => setConcedeCompleted(true),
  })

  const cantDoThings = gameID === null|| playerAddress === null || gameData === null
    || currentPlayer(gameData) !== playerAddress

  const cancellationHandler = useCancellationHandler(loading)

  const doDrawCard = cantDoThings || gameData.currentStep !== GameStep.DRAW
    ? undefined
    : () => drawCard({
        gameID,
        playerAddress,
        setLoading,
        cancellationHandler
      })

  const doEndTurn = cantDoThings || !isEndingTurn(gameData.currentStep)
    ? undefined
    : () => endTurn({
      gameID,
      playerAddress,
      setLoading,
    })

  useEffect(() => {
    if (gameID !== null && playerAddress !== null && !privateInfo) {
      setError({
        title: "Hand information is missing",
        message: "Keep playing on the device where you started the game, and do not clear your "
          + "browser data while a game is in progress.",
        buttons: [DISMISS_BUTTON, { text: "Concede", onClick: () => {
          void concede!()
          setError(null)
          }
        }]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateInfo])


  const ctrl = useModalController({ displayed: true, closeable: false })

  // -----------------------------------------------------------------------------------------------

  if (!isHydrated) return <></>

  return (
    <>
      {loading && (
        <LoadingModal ctrl={ctrl} loading={loading} setLoading={setLoading} />)}

      {gameID === 0n && (
        <LoadingModal ctrl={ctrl} loading="Fetching game ..." setLoading={setLoading} />)}

      {ended && !hideResults && (
        <GameEndedModal closeCallback={() => setHideResults(true)} />)}

      <main className="flex min-h-screen flex-col">
        <Navbar />

        <Hand
          cards={playerHand}
          setLoading={setLoading}
          cancellationHandler={cancellationHandler}
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
              <button className="btn-warning btn-lg btn absolute right-96 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={!doDrawCard}
                onClick={doDrawCard}>
                DRAW
              </button>

              <button
                className="btn-warning btn-lg btn absolute right-48 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={!doEndTurn}
                onClick={doEndTurn}>
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
