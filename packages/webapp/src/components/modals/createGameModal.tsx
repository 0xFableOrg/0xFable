import { useAtom } from "jotai"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { CheckboxModal } from "src/components/lib/checkboxModal"
import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"
import { deployment } from "src/deployment"
import { useGame } from "src/generated"
import { useGameWrite } from "src/hooks/fableTransact"
import { type CheckboxModalContentProps, useCheckboxModal } from "src/hooks/useCheckboxModal"
import * as store from "src/store"
import { GameStatus } from "src/types"
import { parseBigInt } from "src/utils/rpc-utils"

// =================================================================================================

const CreateGameModalContent = ({ modalControl }: CheckboxModalContentProps) => {

  const [ gameID, setGameID ] = useAtom(store.gameID)
  const [ gameData ] = useAtom(store.gameData)
  const [ gameStatus ] = useAtom(store.gameStatus)
  const [ hasVisitedBoard ] = useAtom(store.hasVisitedBoard)
  const [ loading, setLoading ] = useState<string>(null)
  const gameContract = useGame({ address: deployment.Game })
  const router = useRouter()

  const created = gameStatus >= GameStatus.CREATED
  const joined  = gameStatus >= GameStatus.JOINED
  const started = gameStatus >= GameStatus.STARTED

  // Relevant combinations:
  // - !created (UNKNOWN)
  // - created && !started && !joined (CREATED)
  // - created && !started && joined (JOINED)
  // - started (STARTED)

  // The reason to decompose the status into boolean is it helps with sharing code in the layout
  // logic. Cancelling a game can also be done in CREATED or JOINED state.

  // If the game is created, the modal can't be closed.
  useEffect(() => {
    // React forces us to use an effect, can't update a component state in another component.
    modalControl.setModalCloseable(!created)
  }, [modalControl.setModalCloseable, created])

  // Load game board game once upon game start.
  useEffect(() => {
    if (!hasVisitedBoard && started)
      router.push("/play")
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
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(parseBigInt(event.args.gameID))
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
      // This should be called before we get the data refresh, so check for 1 instead of 0.
      // Assuming two players, if we're the last to join, we just need to wait for (1) the data
      // refresh and (2) loading of the play page. Not displaying a loading modal would just show
      // the old screen, which is janky (feels like our join didnt work).
      // The alternative is an optimistic update of the game status & data.
      if (gameData.playersLeftToJoin <= 1)
        setLoading("Loading game...")
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

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    enabled: created && !started,
    setLoading,
    onSuccess() {
      setGameID(null)
      modalControl.displayModal(false)
    }
  })

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: started,
    setLoading,
    onSuccess() {
      setGameID(null)
      modalControl.displayModal(false)
    }
  })

  // -----------------------------------------------------------------------------------------------

  if (loading) return <>
    <ModalTitle>{loading}</ModalTitle>
    <SpinnerWithMargin />
  </>

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
      <button className="btn" disabled={!join} onClick={join}>
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

export const CreateGameModal = () => {
  const checkboxID = "create"
  const modalControl = useCheckboxModal(checkboxID)
  const [ isGameCreator ] = useAtom(store.isGameCreator)

  // If we're on the home page and we're the game creator, this modal should be displayed.
  useEffect(() => {
    if (isGameCreator && !modalControl.isModalDisplayed)
      modalControl.displayModal(true)
  }, [isGameCreator, modalControl.isModalDisplayed])

  // -----------------------------------------------------------------------------------------------

  return <>
    <ModalMenuButton htmlFor={checkboxID}>Create Game →</ModalMenuButton>
    <CheckboxModal id={checkboxID} control={modalControl}>
      <CreateGameModalContent modalControl={modalControl} />
    </CheckboxModal>
  </>
}

// =================================================================================================