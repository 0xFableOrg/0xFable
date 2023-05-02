import { constants } from "ethers"
import { useAtom } from "jotai"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { CheckboxModal } from "src/components/modals/checkboxModal"
import { ModalTitle, SpinnerWithMargin } from "src/components/modals/modalElements"
import { Spinner } from "src/components/spinner"
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
  const [ gameStatus ] = useAtom(store.gameStatus)
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

  useEffect(() => {
    // React forces us to use an effect, can't update a component state in another component.
    modalControl.setModalCloseable(!created)
  }, [modalControl.setModalCloseable, created])

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

  // TODO spinner for joining game & game creation
  // TODO: store the game ID in local storage ... + test all the flows
  // TODO(later): meaningfully handle errors

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

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: gameID
      ? [
        gameID,
        0, // deckID
        constants.HashZero, // data for callback
        constants.HashZero, // hand root
        constants.HashZero, // deck root
        constants.HashZero, // proof
      ]
      : undefined,
    enabled: created && !started && !joined,
    setLoading,
    onSuccess() {
      router.push("/play")
      setLoading("Joining game...")
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
    <ModalTitle>{joined ? "Game Joined" : "Game Created"}</ModalTitle>
    <p className="py-4 font-mono">
      Share the following code to invite players to battle:
    </p>
    <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
      {`${gameID}`}
    </p>
    <div className="flex justify-center gap-4">
      {!joined &&
        <button className="btn" disabled={!join} onClick={join}>
          Join Game
        </button>}
      {joined &&
        <Link className="btn" href="/play">
          Return to Game
        </Link>}
      <button className="btn" disabled={!cancel} onClick={() => cancel?.()}>
        Cancel Game
      </button>
    </div>
  </>

  if (started) return <>
    <h3 className="text-xl font-bold normal-case mb-4">Game in progress!</h3>
    <div className="flex justify-center gap-4">
      <Link className="btn" href="/play">
        Return to Game
      </Link>
      <button className="btn" disabled={!concede} onClick={concede}>
        Concede Game
      </button>
    </div>
  </>
}

// =================================================================================================

export const CreateGameModal = () => {
  const [ gameID, ] = useAtom(store.gameID)
  const modalControl = useCheckboxModal()

  // This helps with fast refreshes: if the gameID is already set, the modal should be displayed.
  // It will also be useful when we store the gameID in local storage and support hard reloads.
  useEffect(() => {
    if (gameID !== null && !modalControl.isModalDisplayed) modalControl.displayModal(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------------------------------

  return <>
    <label
      htmlFor="create"
      className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800">
      Create Game →
    </label>
    <CheckboxModal
        id="create"
        initialCloseable={true}
        initialSurroundCloseable={true}
        control={modalControl}>
      <CreateGameModalContent modalControl={modalControl} />
    </CheckboxModal>
  </>
}

// =================================================================================================