import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { decodeEventLog } from "viem"

import { Modal, ModalController, useModalController } from "src/components/lib/modal"
import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { gameABI } from "src/generated"
import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { GameStatus } from "src/types"
import { LoadingModalContent } from "src/components/lib/loadingModal"
import { ABORTED, drawCards } from "src/store/actions"

// =================================================================================================

export const CreateGameModal = () => {
  const isGameCreator = store.useIsGameCreator()
  const ctrl = useModalController({ loaded: isGameCreator })

  // Otherwise if we're on the home page and we're the game creator, this modal should be displayed.
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
  const gameData = store.useGameData()
  const gameStatus = store.useGameStatus()
  const [ hasVisitedBoard ] = store.useHasVisitedBoard()
  const [ loading, setLoading ] = useState<string>(null)
  const [ joinCompleted, setJoinCompleted ] = useState(false)
  const router = useRouter()

  const created = gameStatus >= GameStatus.CREATED
  const joined  = gameStatus >= GameStatus.JOINED || joinCompleted
  const started = gameStatus >= GameStatus.STARTED

  // Relevant combinations:
  // - !created (UNKNOWN)
  // - created && !started && !joined (CREATED)
  // - created && !started && joined (JOINED)
  // - started (STARTED)

  // The reason to decompose the status into boolean is it helps with sharing code in the layout
  // logic. Cancelling a game can also be done in CREATED or JOINED state.

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

  // Temporary, we do use 0x0 to signal the absence of a root, so we need to use a different value.
  const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: gameID !== null
      ? [
        gameID,
        0, // deckID
        HashOne, // data for callback
        HashOne, // hand root
        HashOne, // deck root
        HashOne, // proof
      ]
      : undefined,
    enabled: created && !started && !joined,
    setLoading,
    onSuccess() {
      // This will capture the game data at the point where `join` was called, so we should check
      // for 1 instead of 0.
      // Assuming two players, if we're the last to join, we just need to wait for (1) the data
      // refresh and (2) loading of the play page. Not displaying a loading modal would just show
      // the old screen, which is janky (feels like our join didnt work).
      // The alternative is an optimistic update of the game status & data.
      if (gameData.playersLeftToJoin <= 1)
        setLoading("Loading game...")
      else
        // Optimistically transition to the next modal state as we know the tx succeeded, and the
        // game data refresh will follow.
        setJoinCompleted(true)
    },
    onError(err) {
      const errData = (err as any)?.error?.data?.data
      if (errData && (errData as string).startsWith("0xb32dfa71")) {
        // TODO generify this + report to user
        console.log("deck does not exist")
      } else {
        console.log(`error in joinGame: ${err}`)
      }
    }
  })

  const drawAndJoin = async () => {
    setLoading("Drawing cards...")
    // TODO WIP
    const hand = await drawCards(gameID, playerAddress, gameData, 0)
    if (hand === ABORTED) {
      setLoading(null)
    } else {
      join()
    }
  }

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    enabled: created && !started,
    setLoading,
    onSuccess() {
      setGameID(null)
      // setJoinCompleted(false)
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
      <button className="btn" disabled={!join} onClick={drawAndJoin}>
        Join Game
      </button>
      <button className="btn" disabled={!cancel} onClick={cancel}>
        Cancel Game
      </button>
    </div>}
    {joined && <div className="flex flex-col justify-center gap-4 items-center">
      <SpinnerWithMargin />
      <button className="btn" disabled={!cancel} onClick={cancel}>
        Cancel Game
      </button>
    </div>}
  </>

  if (started) return <InGameMenuModalContent concede={concede} />
}

// =================================================================================================