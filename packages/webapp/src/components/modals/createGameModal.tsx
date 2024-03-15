import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/router"

import { decodeEventLog } from "viem"

import { joinGame, reportInconsistentGameState } from "src/actions"
import { concede } from "src/actions/concede"
import { Spinner } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { LoadingModalContent } from "src/components/modals/loadingModal"
import { Button } from "src/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "src/components/ui/dialog"
import { gameABI } from "src/generated"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { GameStatus } from "src/store/types"
import { navigate } from "src/utils/navigate"

interface CreateGameModalContentProps {
    loading: string | null
    setLoading: React.Dispatch<React.SetStateAction<string | null>>
    gameStatus: GameStatus
}

// =================================================================================================

export const CreateGameModal = () => {
    const [open, setOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<string | null>(null)
    const isGameCreator = store.useIsGameCreator()
    const gameStatus = store.useGameStatus()

    useEffect(() => {
        // If we're on the home page and we're the game creator, this modal should be displayed.
        if (isGameCreator && !open) setOpen(true)
    }, [isGameCreator, open])

    const canCloseExternally = loading == null && gameStatus < GameStatus.CREATED
    return (
        // If we're on the home page and we're the game creator, this modal should be displayed.
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="hover:border-3 h-16 rounded-lg border-2 border-green-900 p-6 font-fable text-2xl hover:scale-105 hover:border-green-800"
                >
                    Create Game →
                </Button>
            </DialogTrigger>
            <DialogContent canCloseExternally={canCloseExternally}>
                <CreateGameModalContent loading={loading} setLoading={setLoading} gameStatus={gameStatus} />
            </DialogContent>
        </Dialog>
    )
}

// =================================================================================================

const CreateGameModalContent: React.FC<CreateGameModalContentProps> = ({ loading, setLoading, gameStatus }) => {
    const playerAddress = store.usePlayerAddress()
    const [gameID, setGameID] = store.useGameID()
    const allPlayersJoined = store.useAllPlayersJoined()
    const [hasVisitedBoard] = store.useHasVisitedBoard()
    const [drawCompleted, setDrawCompleted] = useState(false)
    const router = useRouter()

    // Decompose in boolean to help sharing code.
    const created = gameStatus >= GameStatus.CREATED
    const joined = gameStatus >= GameStatus.HAND_DRAWN || drawCompleted
    const started = gameStatus >= GameStatus.STARTED && gameStatus < GameStatus.ENDED

    // Load game board game once the game start, unless we've visited it for this game already.
    useEffect(() => {
        if (!hasVisitedBoard && started) void navigate(router, "/play")
    }, [hasVisitedBoard, router, started])

    // -----------------------------------------------------------------------------------------------
    // NOTE(norswap): This is how to compute the encoding of the joincheck callback, however, ethers
    //   will block us from using it, and will not provide built-in things for encoding it.
    //
    // const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
    // const sigHash = gameContract.interface.getSighash(fragment);
    //
    // const hash = (
    //   deployment.game + sigHash.slice(2)
    // ).padEnd(66, "0")
    // -----------------------------------------------------------------------------------------------

    const { write: create } = useGameWrite({
        functionName: "createGame",
        args: [2], // we only handle two players
        enabled: !created,
        setLoading,
        onSuccess(data) {
            const event = decodeEventLog({
                abi: gameABI,
                data: data.logs[0].data,
                topics: data.logs[0]["topics"],
            })
            setGameID(event.args["gameID"])
        },
    })

    const cancellationHandler = useCancellationHandler(loading)

    const join = useCallback(async () => {
        if (gameID === null || playerAddress === null)
            return reportInconsistentGameState("Not tracking a game or player disconnected.")

        const success = await joinGame({
            gameID,
            playerAddress,
            setLoading,
            cancellationHandler,
        })

        if (success)
            // Optimistically transition to the next modal state as we know the tx succeeded, and the
            // game data refresh will follow.
            setDrawCompleted(true)
    }, [gameID, playerAddress, setLoading, cancellationHandler])

    const { write: cancel } = useGameWrite({
        functionName: "cancelGame",
        args: [gameID],
        enabled: created && !allPlayersJoined,
        setLoading,
        onSuccess() {
            setGameID(null)
        },
    })

    const doConcede = useCallback(
        () =>
            concede({
                gameID: gameID!,
                playerAddress: playerAddress!,
                setLoading,
                onSuccess: () => {
                    setGameID(null)
                },
            }),
        [gameID, playerAddress, setGameID, setLoading]
    )

    // -----------------------------------------------------------------------------------------------

    if (loading)
        return (
            <LoadingModalContent loading={loading} setLoading={setLoading} cancellationHandler={cancellationHandler} />
        )

    if (!created)
        return (
            <>
                <DialogTitle className="font-fable text-xl">Create Game</DialogTitle>
                <DialogDescription>
                    <p className="py-4 font-mono">
                        Once a game is created, you can invite your friends to join with the game ID.
                    </p>
                    <div className="flex justify-center">
                        <Button className="font-fable" variant={"secondary"} disabled={!create} onClick={create}>
                            Create Game
                        </Button>
                    </div>
                </DialogDescription>
            </>
        )

    if (created && !started)
        return (
            <>
                <DialogTitle className="font-fable text-xl">
                    {joined ? "Waiting for other player..." : "Game Created"}
                </DialogTitle>
                <DialogDescription>
                    <p className="py-4 font-mono">Share the following code to invite players to battle:</p>
                    <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
                        {`${gameID}`}
                    </p>
                    {!joined && (
                        <div className="flex justify-center gap-4">
                            <Button className="font-fable" variant={"secondary"} onClick={join}>
                                Join Game
                            </Button>
                            <Button className="font-fable" variant={"secondary"} disabled={!cancel} onClick={cancel}>
                                Cancel Game
                            </Button>
                        </div>
                    )}
                    {joined && (
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Spinner />
                            {!allPlayersJoined && (
                                <Button
                                    className="font-fable"
                                    variant={"secondary"}
                                    disabled={!cancel}
                                    onClick={cancel}
                                >
                                    Cancel Game
                                </Button>
                            )}
                        </div>
                    )}
                </DialogDescription>
            </>
        )

    if (started) return <InGameMenuModalContent concede={doConcede} />
}

// =================================================================================================
