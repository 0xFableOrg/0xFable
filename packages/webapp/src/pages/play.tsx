import { useCallback, useEffect, useState } from "react"

import Hand from "src/components/hand"
import { LoadingModal } from "src/components/lib/loadingModal"
import { useModalController } from "src/components/lib/modal"
import { GameEndedModal } from "src/components/modals/gameEndedModal"
import { Navbar } from "src/components/navbar"
import * as store from "src/store/hooks"
import { GameStatus, GameStep } from "src/store/types"
import { FablePage } from "src/pages/_app"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { useRouter } from "next/router"
import { setError } from "src/store/write"
import { DISMISS_BUTTON } from "src/actions/errors"
import { navigate } from "src/utils/navigate"
import { concede } from "src/actions/concede"
import { drawCard } from "src/actions/drawCard"
import { endTurn } from "src/actions/endTurn"
import { currentPlayer, isEndingTurn } from "src/game/misc"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import { usePlayerHand } from "src/store/hooks"
import { usePlayedCards } from "src/store/hooks"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import PlayerBoard from "src/components/playerBoard"
import { createPortal } from "react-dom"
import useDragEvents from "src/hooks/useDragEvents"
import BaseCard from "src/components/cards/baseCard"

const Play: FablePage = ({ isHydrated }) => {
  const [ gameID, setGameID ] = store.useGameID()
  const gameStatus = store.useGameStatus()

  const playerAddress = store.usePlayerAddress()
  const opponentAddress = store.useGameData()?.players.find(address => address !== playerAddress)
  const router = useRouter()
  const privateInfo = store.usePrivateInfo()
  const gameData = store.useGameData()
  const [ playedCards, addCard ] = usePlayedCards()
  const [ hasVisitedBoard, visitBoard ] = store.useHasVisitedBoard()
  const { useDragStart, handleDragEnd } = useDragEvents()
  useEffect(visitBoard, [visitBoard, hasVisitedBoard])

  const [ loading, setLoading ] = useState<string|null>(null)
  const [ hideResults, setHideResults ] = useState(false)
  const [ concedeCompleted, setConcedeCompleted ] = useState(false)
  const [ playerHand, setPlayerHand ] = useState<bigint[]>(privateInfo?.deck as bigint[] ?? []);
  const [ activeId, setActiveId ] = useState<UniqueIdentifier | null>(null);

  const handleDragStart = useDragStart(setActiveId);

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

      if (fetchedGameID > 0n)
        setGameID(fetchedGameID)
      else
        void navigate(router, "/")
    }

    // Back to home screen if player disconnects.
    if (playerAddress === null)
      void navigate(router, "/")
    else if (gameID === null)
      void fetchGameID()

  }, [gameID, setGameID, playerAddress, router])

  const playerHand = usePlayerHand()

  const currentPlayerCards = useMemo(() => {
    if (!playedCards) return []
    return playedCards
      .filter((card) => card.owner === playerAddress)
      .map((card) => card.cardId)
  }, [playerAddress, playedCards])

  const opponentPlayerCards = useMemo(() => {
    if (!playedCards) return []
    return playedCards
      .filter((card) => card.owner === opponentAddress)
      .map((card) => card.cardId)
  }, [opponentAddress, playedCards])

  const ended = gameStatus === GameStatus.ENDED || concedeCompleted

  useEffect(() => {
    // This avoids overlapping the concede loading modal with the game ended modal. This tends to
    // happen because we receive the game ended event before the confirmation that the concede
    // transaction succeeded.
    if (ended) setLoading(null)
  }, [ended])

  const missingData = gameID === null|| playerAddress === null || gameData === null
  const cantTakeActions = missingData || currentPlayer(gameData) !== playerAddress
  const cancellationHandler = useCancellationHandler(loading)

  const cantDrawCard = cantTakeActions || gameData.currentStep !== GameStep.DRAW
  const doDrawCard = useCallback(
    () => drawCard({
      gameID: gameID!,
      playerAddress: playerAddress!,
      setLoading,
      cancellationHandler
    }),
    [gameID, playerAddress, setLoading, cancellationHandler])

  const cantEndTurn = cantTakeActions || !isEndingTurn(gameData.currentStep)
  const doEndTurn = useCallback(
    () => endTurn({
      gameID: gameID!,
      playerAddress: playerAddress!,
      setLoading,
    }),
    [gameID, playerAddress, setLoading])

  const cantConcede = missingData
  const doConcede = useCallback(
    () => concede({
      gameID: gameID!,
      playerAddress: playerAddress!,
      setLoading,
      onSuccess: () => setConcedeCompleted(true),
    }),
    [gameID, playerAddress, setLoading])

  const doHideResults = useCallback(() => setHideResults(true), [setHideResults])
  const doShowResults = useCallback(() => setHideResults(false), [setHideResults])

  useEffect(() => {
    if (gameID !== null && playerAddress !== null && !privateInfo) {
      setError({
        title: "Hand information is missing",
        message: "Keep playing on the device where you started the game, and do not clear your "
          + "browser data while a game is in progress.",
        buttons: [DISMISS_BUTTON, { text: "Concede", onClick: () => {
          void doConcede!()
          setError(null)
          }
        }]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateInfo])

  const ctrl = useModalController({ displayed: true, closeable: false })

  const sensors = useSensors(
    // waits for a drag of 20 pixels before the UX assumes a card is being played
    useSensor(MouseSensor, { activationConstraint: { distance: 20 } }),
  )
  // -----------------------------------------------------------------------------------------------

  if (!isHydrated) return <></>

  return (
    <>
      {/* The !ended here hides the loading modal to avoid it superimposing with the game ending
          modal, which can happen when we learn the game has ended because of a data refresh that
          precedes the inclusion confirmation. */}
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      
      {loading && !ended && (
        <LoadingModal ctrl={ctrl} loading={loading} setLoading={setLoading} />)}

      {gameID === 0n && (
        <LoadingModal ctrl={ctrl} loading="Fetching game ..." setLoading={setLoading} />)}

      {ended && !hideResults && (
        <GameEndedModal closeCallback={doHideResults} />)}

      <main className="flex min-h-screen flex-col">
        <Navbar />

        <Hand
          cards={playerHand}
          setLoading={setLoading}
          cancellationHandler={cancellationHandler}
          className="absolute left-0 right-0 mx-auto z-[100] translate-y-1/2 transition-all duration-500 rounded-xl ease-in-out hover:translate-y-0"
        />
        <div className="grid-col-1 relative mx-6 mb-6 grid grow grid-rows-[6]">
          <PlayerBoard playerAddress={opponentAddress} playedCards={opponentPlayerCards} />

          {!ended && (
            <>
              <button className="btn-warning btn-lg btn absolute right-96 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={cantDrawCard}
                onClick={doDrawCard}>
                DRAW
              </button>

              <button
                className="btn-warning btn-lg btn absolute right-48 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={cantEndTurn}
                onClick={doEndTurn}>
                END TURN
              </button>

              <button
                className="btn-warning btn-lg btn absolute right-4 bottom-1/2 z-50 !translate-y-1/2 rounded-lg border-[.1rem] border-base-300 font-mono hover:scale-105"
                disabled={cantConcede}
                onClick={doConcede}
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
                onClick={doShowResults}
              >
                SEE RESULTS & EXIT
              </button>
            </>
          )}

          <PlayerBoard playerAddress={playerAddress} playedCards={currentPlayerCards} />
          {createPortal(
            <DragOverlay dropAnimation={{
              duration: 100,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}>
                <BaseCard id={activeId as number} placement={CardPlacement.DRAGGED} />
            </DragOverlay>,
          document.body)}
        </div>
        
      </main>
    </DndContext>
    </>
  )
}

export default Play
