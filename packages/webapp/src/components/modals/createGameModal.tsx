import { BigNumber, constants } from "ethers"
import { useAtom } from "jotai"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { deployment } from "src/deployment"
import { useGame } from "src/generated"
import { useGameWrite } from "src/hooks/fableTransact"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"
import { useDebugValues } from "src/hooks/useDebug"
import * as store from "src/store"
import { GameStatus } from "src/types"
import { parseBigInt } from "src/utils/rpc-utils"

// TODO(norswap): check the following is still true after rearchitecturing

// The following directive helps with React fast refresh, forcing it to remount the component when
// the file is edited. Without it, the behaviour is truly deranged: after creating then cancelling
// a game, fast refresh causes the `onSuccess` hook of the `createGame` write to be called again,
// resulting in the old gameID being resurrected. This causes an error in the `cancelGame` write,
// which is now active but whose simulation fails (because the game was already cancelled on the
// blockchain).

// @refresh reset

export const CreateGameModal = () => {
  const [ bigIntGameID, setGameID ] = useAtom(store.gameID)
  const [ gameStatus ] = useAtom(store.gameStatus)
  const gameContract = useGame({ address: deployment.Game })
  const router = useRouter()
  const { checkboxRef, checkboxCallback, isModalDisplayed, displayModal } = useCheckboxModal()

  const gameID = bigIntGameID == null ? null : BigNumber.from(bigIntGameID)
  const created = gameStatus >= GameStatus.CREATED
  const joined  = gameStatus >= GameStatus.JOINED
  const started = gameStatus >= GameStatus.STARTED

  useDebugValues({bigIntGameID, created, joined, started})

  // NOTE(norswap): This is how to compute the encoding of the joincheck callback, however, ethers
  //   will block us from using it, and will not provide built-in things for encoding it.
  //
  // const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  // const sigHash = gameContract.interface.getSighash(fragment);
  //
  // const hash = (
  //   deployment.game + sigHash.slice(2)
  // ).padEnd(66, "0")

  // TODO test end to end
  // TODO do something if data missing? (spinner)
  // TODO: store the game ID in local storage ... + test all the flows
  // TODO: suspene for game data?

  // TODO(later) weird cursor behaviour
  // TODO(later): meaningfully handle errors

  const { write: create } = useGameWrite({
    functionName: "createGame",
    args: [2], // we only handle two players
    enabled: isModalDisplayed && !created,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(parseBigInt(event.args.gameID))
    },
  })

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: gameID
      ? [
        BigNumber.from(gameID),
        0, // deckID
        constants.HashZero, // data for callback
        constants.HashZero, // hand root
        constants.HashZero, // deck root
        constants.HashZero, // proof
      ]
      : undefined,
    enabled: isModalDisplayed && created && !joined, // TODO used does not work
    onSuccess() {
      router.push("/play")
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
    enabled: isModalDisplayed && created && !started,
    onSuccess() {
      setGameID(null)
      displayModal(false)
    },
    onError(err) {
      console.log(`cancel_err: ${err}`)
    }
  })

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: started,
    onSuccess() {
      setGameID(null)
      displayModal(false)
    }
  })

  // This helps with fast refreshes: if the gameID is already set, the modal should be displayed.
  // It will also be useful when we store the gameID in local storage and support hard reloads.
  useEffect(() => {
    if (gameID != null && !isModalDisplayed) displayModal(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    {/* Button Code */}
    <label
      htmlFor="create"
      className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
    >
      Create Game →
    </label>

    {/* Modal Code */}
    <input type="checkbox" id="create" ref={checkboxRef} onChange={checkboxCallback} className="modal-toggle" />

    {isModalDisplayed && <>
      {!created && <>
        {/* The use of labels here means the modal can be closed by clicking outside. */}
        <label htmlFor="create" className="modal cursor-pointer">
          <label className="modal-box relative">
            <h3 className="text-xl font-bold normal-case">Create Game</h3>
            <label htmlFor="create" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <p className="py-4">
              Once a game is created, you can invite your friends to join with the game ID.
            </p>
            {/* TODO center */}
            <button className="btn" disabled={!create} onClick={() => create?.() }>
              Create Game
            </button>
          </label>
        </label>
      </>}
      {created && !started && <>
        <div className="modal cursor-pointer">
          <div className="modal-box relative">
            <h3 className="text-xl font-bold normal-case">{joined ? "Game Joined" : "Game Created"}</h3>
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
          </div>
        </div>
      </>}
      {started &&
        <div className="modal cursor-pointer" key="started">
          <div className="modal-box relative">
            <h3 className="text-xl font-bold normal-case mb-4">Game in progress!</h3>
            <div className="flex justify-center gap-4">
              <Link className="btn" href="/play">
                Return to Game
              </Link>
              <button className="btn" disabled={!concede} onClick={concede}>
                Concede Game
              </button>
            </div>
          </div>
        </div>}
      </>}
  </>
}