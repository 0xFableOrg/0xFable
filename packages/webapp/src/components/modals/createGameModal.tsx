import { deployment } from "src/deployment";
import * as store from "src/store"
import Link from "next/link"
import { useAtom } from "jotai"
import { useGame } from "src/generated"
import { useGameWrite } from "src/hooks/game"
import {useEffect, useRef} from "react"

// The following directive helps with React fast refresh, forcing it to remount the component when
// the file is edited. Without it, the behaviour is truly deranged: after creating then cancelling
// a game, fast refresh causes the `onSuccess` hook of the `createGame` write to be called again,
// resulting in the old gameID being resurrected. This causes an error in the `cancelGame` write,
// which is now active but whose simulation fails (because the game was already cancelled on the
// blockchain).

// @refresh reset

export const CreateGameModal = () => {
  const [ gameID, setGameID ] = useAtom(store.gameID)
  const gameContract = useGame({ address: deployment.Game })

  const checkboxRef = useRef<HTMLInputElement>(null)
  function displayModal(display: boolean) {
    checkboxRef.current.checked = display
  }
  function isModalDisplayed() {
    return checkboxRef.current?.checked
  }

  // NOTE(norswap): This is how to compute the encoding of the joincheck callback, however, ethers
  //   will block us from using it, and will not provide built-in things for encoding it.
  //
  // const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  // const sigHash = gameContract.interface.getSighash(fragment);
  //
  // const hash = (
  //   process.env.NEXT_PUBLIC_GAME_CONTRACT + sigHash.slice(2)
  // ).padEnd(66, "0")

  // TODO: meaningfully handle errors

  // TODO: store the game ID in local storage

  const { write: start } = useGameWrite({
    functionName: "createGame",
    args: [2], // we only handle two players
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(event.args.gameID)
    },
    onError(err) {
      console.log("start_err: " + err)
    },
    enabled: gameID == null && isModalDisplayed()
  })

  const { write: cancel } = useGameWrite({
    functionName: "cancelGame",
    args: [gameID],
    onSuccess() {
      setGameID(null)
      displayModal(false)
    },
    onError(err) {
      console.log("cancel_err: " + err)
    },
    enabled: gameID != null
  })

  // This helps with fast refreshes: if the gameID is already set, the modal should be displayed.
  // It will also be useful when we store the gameID in local storage and support hard reloads.
  useEffect(() => {
    if (gameID != null) displayModal(true)
  }, [])

  return <>
    {/* Button Code */}
    <label
      htmlFor="create"
      className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
    >
      Create Game →
    </label>

    {/* Create Game Modal Code */}
    <input type="checkbox" id="create" ref={checkboxRef} className="modal-toggle" />

    {!gameID && <>
      {/* The use of labels here means the modal can be closed by clicking outside. */}
      <label htmlFor="create" className="modal cursor-pointer">
        <label className="modal-box relative">
          <h3 className="text-xl font-bold normal-case">Create Game</h3>
          <label htmlFor="create" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          <p className="py-4">
            Once a game is created, you can invite your friends to join with the game ID.
          </p>
          <button className="btn" disabled={!start} onClick={() => start?.() }>
            Create Game
          </button>
        </label>
      </label>
    </>}
    {gameID && <>
      <div className="modal cursor-pointer">
        <div className="modal-box relative">
          <h3 className="text-xl font-bold normal-case">Create Game</h3>
          <p className="py-4 font-mono">
            Share the following code to invite players to battle:
          </p>
          <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
            {gameID.toString()}
          </p>
          <div className="flex justify-center gap-4">
            <Link className="btn" href={"/play"}>
              Let's Play!
            </Link>
            <button className="btn" disabled={!cancel} onClick={() => cancel?.()}>
              Cancel Game
            </button>
          </div>
        </div>
      </div>
    </>}
  </>
}