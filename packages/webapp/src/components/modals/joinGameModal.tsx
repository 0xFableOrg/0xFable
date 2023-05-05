import { BigNumber } from "ethers"
import { useAtom } from "jotai"
import debounce from "lodash/debounce"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import { CheckboxModal } from "src/components/lib/checkboxModal"
import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"

import { deployment } from "src/deployment"
import { useGame } from "src/generated"
import { useGameWrite } from "src/hooks/fableTransact"
import { CheckboxModalControl, useCheckboxModal } from "src/hooks/useCheckboxModal"
import { useDebugValues } from "src/hooks/useDebug"
import * as store from "src/store"
import { GameStatus } from "src/types"
import { isStringPositiveInteger } from "src/utils/js-utils"
import { parseBigInt } from "src/utils/rpc-utils"

// =================================================================================================

const JoinGameModalContent = ({ control }: { control: CheckboxModalControl }) => {
  const [ inputGameID, setInputGameID ] = useState(null)
  const [ gameID, setGameID ] = useAtom(store.gameID)
  const [ gameStatus ] = useAtom(store.gameStatus)
  const [ hasVisitedBoard ] = useAtom(store.hasVisitedBoard)
  const [ loading, setLoading ] = useState<string>(null)
  const gameContract = useGame({ address: deployment.Game })
  const router = useRouter()

  const joined  = gameStatus >= GameStatus.JOINED
  const started = gameStatus >= GameStatus.STARTED

  // Load game board game once upon game start.
  useEffect(() => {
    if (!hasVisitedBoard && started)
      router.push("/play")
  }, [hasVisitedBoard, router, started])


  // NOTE(norswap): Right now, the hook can cause error when you type a number that is not a valid
  //   game ID. This is fine. Alternatively, we could validate the input game ID and enable the hook
  //   only when the ID is valid.

  // Temporary, we do use 0x0 to signal the absence of a root, so we need to use a different value.
  const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

  useDebugValues({ inputGameID, gameID, gameStatus, joined, started, loading })

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: inputGameID
      ? [
        BigNumber.from(inputGameID),
        0, // deckID
        HashOne, // data for callback
        HashOne, // hand root
        HashOne, // deck root
        HashOne, // proof
      ]
      : undefined,
    enabled: inputGameID && !joined,
    setLoading,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(parseBigInt(event.args.gameID))
      setLoading("Waiting for other player...")
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

  const { write: concede } = useGameWrite({
    functionName: "concedeGame",
    args: [gameID],
    enabled: started,
    setLoading,
    onSuccess() {
      setGameID(null)
      control.displayModal(false)
    }
  })

  function handleInputChangeBouncy(e) {
    e.stopPropagation()
    if (isStringPositiveInteger(e.target.value))
      setInputGameID(e.target.value)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  // -----------------------------------------------------------------------------------------------

  if (loading) return <>
    <ModalTitle>{loading}</ModalTitle>
    <SpinnerWithMargin />
  </>

  if (started) return <InGameMenuModalContent concede={concede} />

  return <>
    <ModalTitle>Joining Game...</ModalTitle>
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
      onClick={join}>
      Join Game
    </button>
  </>
}

// =================================================================================================

export const JoinGameModal = () => {
  const checkboxID = "join"
  const modalControl = useCheckboxModal(checkboxID)
  const [ isGameJoiner ] = useAtom(store.isGameJoiner)

  // If we're on the home page and we have joined a game we didn't create, this modal should be displayed.
  useEffect(() => {
    if (isGameJoiner && !modalControl.isModalDisplayed)
      modalControl.displayModal(true)
  }, [isGameJoiner, modalControl.isModalDisplayed])

  return <>
    <ModalMenuButton htmlFor={checkboxID}>Join →</ModalMenuButton>
    <CheckboxModal id={checkboxID} control={modalControl}>
      <JoinGameModalContent control={modalControl} />
    </CheckboxModal>
  </>
}

// =================================================================================================