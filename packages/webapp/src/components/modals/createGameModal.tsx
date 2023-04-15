import { BigNumber, constants } from "ethers"
import { useAtom } from "jotai"
import Link from "next/link"
import { useRouter } from "next/router"
import {useCallback, useEffect} from "react"
import { useAccount } from "wagmi"

import { deployment } from "src/deployment"
import { useGame } from "src/generated"
import {useGameRead, useGameWrite} from "src/hooks/fableTransact"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"
import * as store from "src/store"
import { StaticGameData}  from "src/types"

// The following directive helps with React fast refresh, forcing it to remount the component when
// the file is edited. Without it, the behaviour is truly deranged: after creating then cancelling
// a game, fast refresh causes the `onSuccess` hook of the `createGame` write to be called again,
// resulting in the old gameID being resurrected. This causes an error in the `cancelGame` write,
// which is now active but whose simulation fails (because the game was already cancelled on the
// blockchain).

// @refresh reset

export const CreateGameModal = () => {
  const { address } = useAccount()
  const [ gameID, setGameID_ ] = useAtom(store.gameID)
  const gameContract = useGame({ address: deployment.Game })
  const router = useRouter()
  const { checkboxRef, checkboxCallback, isModalDisplayed, displayModal } = useCheckboxModal()

  // NOTE(norswap): This is how to compute the encoding of the joincheck callback, however, ethers
  //   will block us from using it, and will not provide built-in things for encoding it.
  //
  // const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  // const sigHash = gameContract.interface.getSighash(fragment);
  //
  // const hash = (
  //   deployment.game + sigHash.slice(2)
  // ).padEnd(66, "0")

  const { data, refetch } = useGameRead<StaticGameData>({
    functionName: "staticGameData",
    args: [gameID],
    enabled: gameID != null && isModalDisplayed
  })

  const setGameID = useCallback((gameID) => {
    setGameID_(gameID)
    if (gameID) refetch()
  }, [setGameID_, refetch])

  // All of these are only true if the modal is displayed.
  const created     = isModalDisplayed && gameID != null
  const notCreated  = isModalDisplayed && gameID == null
  const joined      = created && !!data && data.players.includes(address)
  const notJoined   = isModalDisplayed && !!data && !joined
  const started     = joined && data.playersLeftToJoin == 0
  const notStarted  = isModalDisplayed && !!data && data.playersLeftToJoin  > 0

  // TODO transitions:
  //  - data needs to be put into the store, so that it can be updated both from here and from play
  //  - needs to listen to PlayerJoined and update data accordingly
  //  - notStarted but joined → someone joins, it should transition
  //  - after other player joins, the data does not update, needs to be refetched

  // TODO do something if gameID + data missing? (spinner)

  // TODO: store the game ID in local storage

  // TODO(later) weird cursor behaviour
  // TODO(later): meaningfully handle errors

  console.log("isModalDisplayed:" + isModalDisplayed)
  console.log(data)
  console.log("included: " + data?.players?.includes(address))
  console.log("notCreated: " + notCreated)
  console.log("notStarted: " + notStarted)
  console.log("notJoined: " + notJoined)
  console.log("started: " + started)

  const { write: create } = useGameWrite({
    functionName: "createGame",
    args: [2], // we only handle two players
    enabled: notCreated,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(event.args.gameID)
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
    enabled: created && notJoined, // TODO does not work
    onSuccess() {
      router.push("/play")
    }
  })

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    enabled: created && notStarted,
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

    {notCreated && <>
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
    {created && notStarted && <>
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
            {notJoined &&
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
  </>
}