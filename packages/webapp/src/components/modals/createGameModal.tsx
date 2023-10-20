import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { decodeEventLog } from "viem"

import { LoadingModalContent } from "src/components/lib/loadingModal"
import { Modal, ModalController, useModalController } from "src/components/lib/modal"
import { ModalMenuButton, ModalTitle, Spinner } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { gameABI } from "src/generated"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { joinGame, reportInconsistentGameState } from "src/actions"
import { GameStatus } from "src/store/types"

// =================================================================================================

export const CreateGameModal = () => {
  const isGameCreator = store.useIsGameCreator()
  const ctrl = useModalController({ loaded: isGameCreator })

  // If we're on the home page and we're the game creator, this modal should be displayed.
  // An explicit intervention is necessary because the state might update while the modal is closed.
  useEffect(() => {
    if (isGameCreator && !ctrl.displayed)
      ctrl.display()
  }, [isGameCreator, ctrl, ctrl.displayed])

  return <>
    <ModalMenuButton display={ctrl.display} label="Create Game →" />
    <Modal ctrl={ctrl}>
      <CreateGameModalContent ctrl={ctrl} />
    </Modal>
  </>
}

// =================================================================================================

const CreateGameModalContent = ({ ctrl }: { ctrl: ModalController }) => {

  const playerAddress = store.usePlayerAddress()
  const [ gameID, setGameID ] = store.useGameID()
  const gameStatus = store.useGameStatus()
  const allPlayersJoined = store.useAllPlayersJoined()
  const [ hasVisitedBoard ] = store.useHasVisitedBoard()
  const [ loading, setLoading ] = useState<string|null>(null)
  const [ drawCompleted, setDrawCompleted ] = useState(false)
  const router = useRouter()

  // Decompose in boolean to help sharing code.
  const created = gameStatus >= GameStatus.CREATED
  const joined  = gameStatus >= GameStatus.HAND_DRAWN || drawCompleted
  const started = gameStatus >= GameStatus.STARTED

  // If the game is created, the modal can't be closed in the normal way, same if loading.
  useEffect(() => {
    // React forces us to use an effect, can't update a component state in another component.
    ctrl.closeableAndSurroundCloseable = !created && loading === null
  }, [created, loading, ctrl])

  // Load game board game once the game start, unless we've visited it for this game already.
  useEffect(() => {
    if (!hasVisitedBoard && started)
      void router.push("/play")
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

  const join = async () => {
    if (gameID === null || playerAddress === null)
      return reportInconsistentGameState("Not tracking a game or player disconnected.")

    const success = await joinGame({
      gameID,
      playerAddress,
      setLoading
    })

    if (success)
      // Optimistically transition to the next modal state as we know the tx succeeded, and the
      // game data refresh will follow.
      setDrawCompleted(true)
  }

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    enabled: created && !allPlayersJoined,
    setLoading,
    onSuccess() {
      setGameID(null)
      ctrl.close()
    }
  })

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: started,
    setLoading,
    onSuccess() {
      setGameID(null)
      ctrl.close()
    }
  })

  // -----------------------------------------------------------------------------------------------

  if (loading) return <LoadingModalContent loading={loading} setLoading={setLoading} />

  if (!created) return <>
    <ModalTitle>Create Game</ModalTitle>
    <p className="py-4">
      Once a game is created, you can invite your friends to join with the game ID.
    </p>
    <div className="flex justify-center">
      <button className="btn center" disabled={!create} onClick={create}>
        Create Game
      </button>
    </div>
  </>

  if (created && !started) return <>
    <ModalTitle>{joined ? "Waiting for other player..." : "Game Created"}</ModalTitle>
    <p className="py-4 font-mono">
      Share the following code to invite players to battle:
    </p>
    <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
      {`${gameID}`}
    </p>
    {!joined && <div className="flex justify-center gap-4">
      <button className="btn" onClick={join}>
        Join Game
      </button>
      <button className="btn" disabled={!cancel} onClick={cancel}>
        Cancel Game
      </button>
    </div>}
    {joined && <div className="flex flex-col justify-center gap-4 items-center">
      <Spinner />
      {!allPlayersJoined && <button className="btn" disabled={!cancel} onClick={cancel}>
          Cancel Game
        </button>}
    </div>}
  </>

  if (started) return <InGameMenuModalContent concede={concede} />
}

// =================================================================================================