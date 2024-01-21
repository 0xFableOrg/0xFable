import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { decodeEventLog } from "viem"

import { LoadingModalContent } from "src/components/modals/loadingModal"
import { Spinner } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { gameABI } from "src/generated"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { joinGame, reportInconsistentGameState } from "src/actions"
import { GameStatus } from "src/store/types"
import { navigate } from "src/utils/navigate"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import { concede } from "src/actions/concede"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "src/components/ui/dialog"
import { Button } from "src/components/ui/button"

interface CreateGameModalContentProps {
  loading: string|null;
  setLoading: React.Dispatch<React.SetStateAction< string|null >>;
  gameStatus: GameStatus
}

// =================================================================================================

export const CreateGameModal = () => {
  const [ loading, setLoading ] = useState< string|null >(null);
  const isGameCreator = store.useIsGameCreator()
  const gameStatus = store.useGameStatus()

  const preventSurroundClick = gameStatus >= GameStatus.CREATED && loading; // created and loading

  return (
    // If we're on the home page and we're the game creator, this modal should be displayed.
    <Dialog defaultOpen={isGameCreator}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-lg p-6 font-fable text-2xl border-green-900 border-2 h-16 hover:scale-105 hover:border-green-800 hover:border-3">
          Create Game →
        </Button>
      </DialogTrigger>
      <DialogContent
        // prevent modal from closing if area outside modal is clicked and loading is populated
        onInteractOutside={(event) => { if (preventSurroundClick) event.preventDefault(); }}
        onCloseAutoFocus={(event) => { if (preventSurroundClick) event.preventDefault(); }}
        // prevent modal from closing if esc key is pressed and loading is populated
        onKeyDown={(event) => { if(preventSurroundClick && event.key == 'Escape') event.preventDefault(); }} 
      >
        <CreateGameModalContent loading={loading} setLoading={setLoading} gameStatus={gameStatus}/>
      </DialogContent >
    </Dialog>
  )
}

// =================================================================================================

const CreateGameModalContent: React.FC<CreateGameModalContentProps> = ({ loading, setLoading, gameStatus }) => {
  const playerAddress = store.usePlayerAddress()
  const [ gameID, setGameID ] = store.useGameID()
  const allPlayersJoined = store.useAllPlayersJoined()
  const [ hasVisitedBoard ] = store.useHasVisitedBoard()
  const [ drawCompleted, setDrawCompleted ] = useState(false)
  const router = useRouter()

  // Decompose in boolean to help sharing code.
  const created = gameStatus >= GameStatus.CREATED
  const joined  = gameStatus >= GameStatus.HAND_DRAWN || drawCompleted
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
        topics: data.logs[0]["topics"]
      })
      setGameID(event.args["gameID"])
    }
  })

  const cancellationHandler = useCancellationHandler(loading)

  const join = useCallback(async () => {
      if (gameID === null || playerAddress === null)
        return reportInconsistentGameState("Not tracking a game or player disconnected.")

      const success = await joinGame({
        gameID,
        playerAddress,
        setLoading,
        cancellationHandler
      })

      if (success)
        // Optimistically transition to the next modal state as we know the tx succeeded, and the
        // game data refresh will follow.
        setDrawCompleted(true)
    },
    [gameID, playerAddress, setLoading, cancellationHandler])

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    enabled: created && !allPlayersJoined,
    setLoading,
    onSuccess() {
      setGameID(null)
    }
  })

  const doConcede = useCallback(
    () => concede({
      gameID: gameID!,
      playerAddress: playerAddress!,
      setLoading,
      onSuccess: () => {
        setGameID(null)
      }
    }),
    [gameID, playerAddress, setGameID, setLoading])

  // -----------------------------------------------------------------------------------------------

  if (loading)
    return <LoadingModalContent
      loading={loading}
      setLoading={setLoading}
      cancellationHandler={cancellationHandler}
    />

  if (!created)
    return (
      <>
        <DialogTitle className="font-fable text-xl">Create Game</DialogTitle>
        <DialogDescription>
          <p className="py-4 font-mono">
            Once a game is created, you can invite your friends to join with the
            game ID.
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
          <p className="py-4 font-mono">
            Share the following code to invite players to battle:
          </p>
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
            <div className="flex flex-col justify-center gap-4 items-center">
              <Spinner />
              {!allPlayersJoined && (
                <Button className="font-fable" variant={"secondary"} disabled={!cancel} onClick={cancel}>
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
