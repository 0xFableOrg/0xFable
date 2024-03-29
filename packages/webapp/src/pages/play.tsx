import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/router"

import {
    closestCenter,
    defaultDropAnimationSideEffects,
    DndContext,
    DragOverlay,
    DropAnimation,
    MeasuringStrategy,
    MouseSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { Address } from "viem"
import { readContract } from "wagmi/actions"

import { concede } from "src/actions/concede"
import { drawCard } from "src/actions/drawCard"
import { endTurn } from "src/actions/endTurn"
import { DISMISS_BUTTON } from "src/actions/errors"
import CardContainer from "src/components/cards/cardContainer"
import Hand from "src/components/hand"
import { GameEndedModal } from "src/components/modals/gameEndedModal"
import { LoadingModal } from "src/components/modals/loadingModal"
import { Navbar } from "src/components/navbar"
import PlayerBoard from "src/components/playerBoard"
import { Button } from "src/components/ui/button"
import { deployment } from "src/deployment"
import { currentPlayer, isEndingTurn } from "src/game/misc"
import { gameABI } from "src/generated"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import useDragEvents from "src/hooks/useDragEvents"
import { FablePage } from "src/pages/_app"
import * as store from "src/store/hooks"
import { usePlayerHand } from "src/store/hooks"
import { CardPlacement, GameStatus, GameStep } from "src/store/types"
import { setError } from "src/store/write"
import { navigate } from "src/utils/navigate"

const Play: FablePage = ({ isHydrated }) => {
    const [gameID, setGameID] = store.useGameID()
    const gameStatus = store.useGameStatus()

    const playerAddress = store.usePlayerAddress()
    const opponentAddress = store.useOpponentAddress()
    const playerBattlefield = store.usePlayerBattlefield()
    const opponentBattlefield = store.useOpponentBattlefield()
    const router = useRouter()
    const privateInfo = store.usePrivateInfo()
    const [hasVisitedBoard, visitBoard] = store.useHasVisitedBoard()
    useEffect(visitBoard, [visitBoard, hasVisitedBoard])

    // state variables
    const [loading, setLoading] = useState<string | null>(null)
    const [hideResults, setHideResults] = useState<boolean>(false)
    const [concedeCompleted, setConcedeCompleted] = useState<boolean>(false)
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
    const [showDrawButton, setShowDrawButton] = useState<boolean>(false)

    const gameData = store.useGameData()
    const playerHand = usePlayerHand()

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: "0.5",
                },
            },
        }),
    }

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

            if (fetchedGameID > 0n) setGameID(fetchedGameID)
            else void navigate(router, "/")
        }

        // Back to home screen if player disconnects.
        if (playerAddress === null) void navigate(router, "/")
        else if (gameID === null) void fetchGameID()
    }, [gameID, setGameID, playerAddress, router])

    const ended = gameStatus === GameStatus.ENDED || concedeCompleted

    useEffect(() => {
        // This avoids overlapping the concede loading modal with the game ended modal. This tends to
        // happen because we receive the game ended event before the confirmation that the concede
        // transaction succeeded.
        if (ended) setLoading(null)
    }, [ended])

    const missingData = gameID === null || playerAddress === null || gameData === null
    const cantTakeActions = missingData || currentPlayer(gameData) !== playerAddress
    const cancellationHandler = useCancellationHandler(loading)

    const cantDrawCard = cantTakeActions || gameData.currentStep !== GameStep.DRAW
    const doDrawCard = useCallback(
        () =>
            drawCard({
                gameID: gameID!,
                playerAddress: playerAddress!,
                setLoading,
                cancellationHandler,
            }),
        [gameID, playerAddress, setLoading, cancellationHandler]
    )

    useEffect(() => {
        // Automatically submit the card draw transaction when it's our turn
        if (gameData && currentPlayer(gameData) === playerAddress && !cantDrawCard) {
            toast.promise(doDrawCard, {
                id: "DRAW_CARD_TOAST",
                loading: "Your Turn - Drawing Card...",
                success: () => {
                    if (showDrawButton) setShowDrawButton(false)
                    return "Card Drawn Successfully!"
                },
                error: () => {
                    if (!showDrawButton) setShowDrawButton(true)
                    return null as any // don't trigger the toast
                },
                dismissible: true,
            })
        }
    }, [cancellationHandler, cantDrawCard, gameID, playerAddress, doDrawCard, gameData, showDrawButton])

    const cantEndTurn = cantTakeActions || !isEndingTurn(gameData.currentStep)
    const doEndTurn = useCallback(
        () =>
            endTurn({
                gameID: gameID!,
                playerAddress: playerAddress!,
                setLoading,
            }),
        [gameID, playerAddress, setLoading]
    )

    const cantConcede = missingData
    const doConcede = useCallback(
        () =>
            concede({
                gameID: gameID!,
                playerAddress: playerAddress!,
                setLoading,
                onSuccess: () => setConcedeCompleted(true),
            }),
        [gameID, playerAddress]
    )

    const doHideResults = useCallback(() => setHideResults(true), [setHideResults])
    const doShowResults = useCallback(() => setHideResults(false), [setHideResults])
    useEffect(() => {
        if (gameID !== null && playerAddress !== null && !privateInfo) {
            setError({
                title: "Hand information is missing",
                message:
                    "Keep playing on the device where you started the game, and do not clear your " +
                    "browser data while a game is in progress.",
                buttons: [
                    DISMISS_BUTTON,
                    {
                        text: "Concede",
                        onClick: () => {
                            void doConcede!()
                            setError(null)
                        },
                    },
                ],
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [privateInfo])

    // dnd setup
    const { handleDragStart, handleDragEnd, handleDragCancel } = useDragEvents(
        setActiveId,
        setLoading,
        cancellationHandler
    )
    const sensors = useSensors(
        // waits for a drag of 20 pixels before the UX assumes a card is being played
        useSensor(MouseSensor, { activationConstraint: { distance: 20 } })
    )
    // -----------------------------------------------------------------------------------------------

    if (!isHydrated) return <></>

    return (
        <>
            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                {/* The !ended here hides the loading modal to avoid it superimposing with the game ending
          modal, which can happen when we learn the game has ended because of a data refresh that
          precedes the inclusion confirmation. */}
                {loading && !ended && <LoadingModal loading={loading} setLoading={setLoading} />}

                {gameID === 0n && <LoadingModal loading="Fetching game ..." setLoading={setLoading} />}

                {ended && !hideResults && <GameEndedModal closeCallback={doHideResults} />}

                <main className="flex min-h-screen flex-col">
                    <Navbar />

                    <Hand
                        cards={playerHand as readonly bigint[]}
                        setLoading={setLoading}
                        cancellationHandler={cancellationHandler}
                        className={`absolute left-0 right-0 z-[100] mx-auto translate-y-1/2 rounded-xl transition-all duration-500 ease-in-out hover:translate-y-0`}
                    />
                    <div className="grid-col-1 relative mx-6 mb-6 grid grow grid-rows-[6]">
                        <PlayerBoard playerAddress={opponentAddress} playedCards={opponentBattlefield} />

                        {!ended && (
                            <>
                                {showDrawButton && (
                                    <Button
                                        variant={"secondary"}
                                        className="border-base-300 absolute bottom-1/2 right-96 z-50 !translate-y-1/2 rounded-lg border-[.1rem] font-mono hover:scale-105"
                                        onClick={() => {
                                            toast.promise(doDrawCard, {
                                                id: "DRAW_CARD_TOAST",
                                                loading: "Drawing Card...",
                                                success: () => {
                                                    if (showDrawButton) setShowDrawButton(false)
                                                    return "Card Drawn Successfully!"
                                                },
                                                dismissible: true,
                                            })
                                        }}
                                    >
                                        DRAW
                                    </Button>
                                )}

                                <Button
                                    variant={"secondary"}
                                    className="border-base-300 absolute bottom-1/2 right-48 z-50 !translate-y-1/2 rounded-lg border-[.1rem] font-mono hover:scale-105"
                                    disabled={cantEndTurn}
                                    onClick={doEndTurn}
                                >
                                    END TURN
                                </Button>

                                <Button
                                    variant={"secondary"}
                                    className="border-base-300 absolute bottom-1/2 right-4 z-50 !translate-y-1/2 rounded-lg border-[.1rem] font-mono hover:scale-105"
                                    disabled={cantConcede}
                                    onClick={doConcede}
                                >
                                    CONCEDE
                                </Button>
                            </>
                        )}

                        {/* TODO avoid the bump by grouping buttons in a container that is translated, then no need for the translation here and the important */}
                        {ended && (
                            <>
                                <Button
                                    variant={"secondary"}
                                    className="border-base-300 absolute bottom-1/2 right-4 z-50 !translate-y-1/2 rounded-lg border-[.1rem] font-mono hover:scale-105"
                                    onClick={doShowResults}
                                >
                                    SEE RESULTS & EXIT
                                </Button>
                            </>
                        )}

                        <PlayerBoard playerAddress={playerAddress} playedCards={playerBattlefield} />

                        {createPortal(
                            <DragOverlay dropAnimation={dropAnimation}>
                                <CardContainer id={activeId as string} placement={CardPlacement.DRAGGED} />
                            </DragOverlay>,
                            document.body
                        )}
                    </div>
                </main>
            </DndContext>
        </>
    )
}

export default Play
