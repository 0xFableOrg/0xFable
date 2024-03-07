import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"

import debounce from "lodash/debounce"

import { joinGame, reportInconsistentGameState } from "src/actions"
import { concede } from "src/actions/concede"
import { Spinner } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { LoadingModalContent } from "src/components/modals/loadingModal"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import * as store from "src/store/hooks"
import { GameStatus } from "src/store/types"
import { setError } from "src/store/write"
import { isStringPositiveInteger, parseBigIntOrNull } from "src/utils/js-utils"
import { navigate } from "src/utils/navigate"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog"

interface JoinGameModalContentProps {
    loading: string | null
    setLoading: React.Dispatch<React.SetStateAction<string | null>>
    gameStatus: GameStatus
}

// =================================================================================================

export const JoinGameModal = () => {
    const [open, setOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<string | null>(null)
    const isGameJoiner = store.useIsGameJoiner()
    const gameStatus = store.useGameStatus()

    const canCloseExternally = loading == null && gameStatus < GameStatus.JOINED

    useEffect(() => {
        // If we're on the home page and we have joined a game we didn't create, this modal
        // should be displayed.
        if (isGameJoiner && !open) setOpen(true)
    }, [isGameJoiner, open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="hover:border-3 h-16 rounded-lg border-2 border-green-900 p-6 font-fable text-2xl hover:scale-105 hover:border-green-800"
                >
                    Join Game →
                </Button>
            </DialogTrigger>
            <DialogContent canCloseExternally={canCloseExternally}>
                <JoinGameModalContent loading={loading} setLoading={setLoading} gameStatus={gameStatus} />
            </DialogContent>
        </Dialog>
    )
}

// =================================================================================================

const JoinGameModalContent: React.FC<JoinGameModalContentProps> = ({ loading, setLoading, gameStatus }) => {
    const [gameID, setGameID] = store.useGameID()
    const playerAddress = store.usePlayerAddress()
    const [hasVisitedBoard] = store.useHasVisitedBoard()
    const [inputGameID, setInputGameID] = useState<string | null>(null)

    const [drawCompleted, setDrawCompleted] = useState(false)
    const router = useRouter()

    // Decompose in boolean to help sharing code.
    const joined = gameStatus >= GameStatus.HAND_DRAWN || drawCompleted
    const started = gameStatus >= GameStatus.STARTED && gameStatus < GameStatus.ENDED

    // Load game board game once upon game start.
    useEffect(() => {
        if (!hasVisitedBoard && started) void navigate(router, "/play")
    }, [hasVisitedBoard, router, started])

    const cancellationHandler = useCancellationHandler(loading)

    const join = async () => {
        if (inputGameID === null || playerAddress === null)
            return reportInconsistentGameState("Not tracking a game or player disconnected.")

        const parsedGameID = parseBigIntOrNull(inputGameID) as bigint
        if (parsedGameID === null)
            return setError({
                title: "Game ID must be a plain number",
                message: "",
                buttons: [{ text: "OK", onClick: () => setError(null) }],
            })

        const success = await joinGame({
            gameID: parsedGameID,
            playerAddress,
            setLoading,
            cancellationHandler,
        })

        if (success) {
            setDrawCompleted(true)
            setLoading("Waiting for other player...")
        }
    }

    const doConcede = !started
        ? undefined
        : () =>
              concede({
                  gameID: gameID!,
                  playerAddress: playerAddress!,
                  setLoading,
                  onSuccess: () => {
                      setGameID(null)
                  },
              })

    function handleInputChangeBouncy(e: React.ChangeEvent<HTMLInputElement>) {
        e.stopPropagation()
        if (isStringPositiveInteger(e.target.value)) setInputGameID(e.target.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

    // -----------------------------------------------------------------------------------------------

    if (loading)
        return (
            <LoadingModalContent loading={loading} cancellationHandler={cancellationHandler} setLoading={setLoading} />
        )

    if (started) return <InGameMenuModalContent concede={doConcede} />

    return (
        <>
            {joined && (
                <>
                    <DialogTitle className="font-fable text-xl">Waiting for other player...</DialogTitle>
                    <Spinner />
                </>
            )}
            {!joined && (
                <>
                    <DialogTitle className="font-fable text-xl">Joining Game...</DialogTitle>
                    <DialogDescription>
                        <p className="py-4 font-mono">Enter the game ID you want to join.</p>
                        <div className="flex flex-row items-center justify-center space-x-2">
                            <Input
                                type="number"
                                placeholder="Game ID"
                                min={0}
                                onChange={handleInputChange}
                                className="mr-2 w-full max-w-xs font-mono text-white placeholder-gray-500"
                            />
                            <Button
                                className="font-fable"
                                variant={"secondary"}
                                disabled={!inputGameID || !join}
                                onClick={join}
                            >
                                Join Game
                            </Button>
                        </div>
                    </DialogDescription>
                </>
            )}
        </>
    )
}

// =================================================================================================
