import {
  useGame,
  useGameJoinGame,
  usePrepareGameJoinGame,
} from "src/generated"
import { useWaitForTransaction } from "wagmi"
import { BigNumber } from "ethers"
import { constants } from "ethers/lib"
import * as store from "src/store"
import {useMemo, useRef, useState} from "react"
import { useRouter } from "next/router"
import { deployment } from "deployment"
import { useAtom } from "jotai"
import debounce from 'lodash/debounce'
import { useGameWrite } from "src/hooks/fableTransact"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"

export const JoinGameModal = () => {
  const [ inputGameID, setInputGameID ] = useState(null)
  const [ , setGameID ] = useAtom(store.gameID)
  const router = useRouter()
  const gameContract = useGame({ address: deployment.Game })
  const { checkboxRef, isModalDisplayed } = useCheckboxModal()

  // NOTE(norswap): Right now, the hook can cause error when you type a number that is not a valid
  //   game ID. This is fine. Alternatively, we could validate the input game ID and enable the hook
  //   only when the ID is valid.

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: inputGameID
      ? [
        BigNumber.from(inputGameID),
        0,
        constants.HashZero,
        constants.HashZero,
        constants.HashZero,
        constants.HashZero,
      ]
      : undefined,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(event.args.gameID)
      void router.push("/play")
    },
    onError(err) {
      console.log("join_err: " + err)
    },
    enabled: inputGameID !== null && isModalDisplayed
  })

  // Check if string is a postive integer.
  function isPositiveInteger(str: string) {
    const n = Math.floor(Number(str))
    return n !== Infinity && String(n) === str && n >= 0
  }

  function handleInputChangeBouncy(e) {
    e.stopPropagation()
    if (isPositiveInteger(e.target.value))
      setInputGameID(e.target.value)
  }
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  return (
    <>
      {/* Button Code */}
      <label
        htmlFor="join"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Join →
      </label>

      {/* Modal Code */}
      <input type="checkbox" id="join" ref={checkboxRef} className="modal-toggle" />
      <label htmlFor="join" className="modal cursor-pointer">
        <label className="modal-box relative">
          <h3 className="text-lg font-bold">Joining Game...</h3>
          <p className="py-4">Enter the game ID you want to join.</p>
          <input
            type="number"
            placeholder="Game ID"
            min={0}
            onChange={handleInputChange}
            className="input input-bordered input-primary mr-2 w-full max-w-xs text-white placeholder-gray-500"
          />
          <button
            className="btn"
            disabled={!inputGameID || !join}
            onClick={() => {
              join?.();
            }}
          >
            Join Game
          </button>
        </label>
      </label>
    </>
  )
}
