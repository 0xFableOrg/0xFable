import debounce from "lodash/debounce"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import { ModalMenuButton, ModalTitle } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"

import { useGameWrite } from "src/hooks/useFableWrite"
import * as store from "src/store/hooks"
import { GameStatus } from "src/types"
import { isStringPositiveInteger } from "src/utils/js-utils"
import { parseBigIntOrNull } from "src/utils/js-utils"
import { Modal, ModalController, useModalController } from "src/components/lib/modal"
import { LoadingModalContent } from "src/components/lib/loadingModal"
import { decodeEventLog } from "viem"
import { gameABI } from "src/generated"

// =================================================================================================

export const JoinGameModal = () => {
  const isGameJoiner = store.useIsGameJoiner()
  const ctrl = useModalController({ loaded: isGameJoiner })

  // If we're on the home page and we have joined a game we didn't create, this modal should be displayed.
  useEffect(() => {
    if (isGameJoiner && !ctrl.displayed)
      ctrl.display()
  }, [isGameJoiner, ctrl, ctrl.displayed])

  return <>
    <ModalMenuButton display={ctrl.display} label="Join →"/>
    <Modal ctrl={ctrl}>
      <JoinGameModalContent ctrl={ctrl} />
    </Modal>
  </>
}

// =================================================================================================

const JoinGameModalContent = ({ ctrl }: { ctrl: ModalController }) => {
  const [ gameID, setGameID ] = store.useGameID()
  const gameStatus = store.useGameStatus()
  const [ hasVisitedBoard ] = store.useHasVisitedBoard()
  const [ inputGameID, setInputGameID ] = useState<string|null>(null)
  const [ loading, setLoading ] = useState<string|null>(null)
  const router = useRouter()

  const joined  = gameStatus >= GameStatus.JOINED
  const started = gameStatus >= GameStatus.STARTED

  // Load game board game once upon game start.
  useEffect(() => {
    if (!hasVisitedBoard && started)
      void router.push("/play")
  }, [hasVisitedBoard, router, started])

  // The modal can't be closed in the normal way when in a loading state.
  useEffect(() => {
    ctrl.closeableAndSurroundCloseable = loading === null
  }, [ctrl, loading])

  // NOTE(norswap): Right now, the hook can cause error when you type a number that is not a valid
  //   game ID. This is fine. Alternatively, we could validate the input game ID and enable the hook
  //   only when the ID is valid.

  // Temporary, we do use 0x0 to signal the absence of a root, so we need to use a different value.
  const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: inputGameID
      ? [
        parseBigIntOrNull(inputGameID),
        0, // deckID
        HashOne, // data for callback
        HashOne, // hand root
        HashOne, // deck root
        HashOne, // proof
      ]
      : undefined,
    enabled: !!inputGameID && !joined,
    setLoading,
    onSuccess(data) {
      const event = decodeEventLog({
        abi: gameABI,
        data: data.logs[0].data,
        topics: data.logs[0]["topics"]
      })
      setGameID(event.args["gameID"])
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
      ctrl.close()
    }
  })

  function handleInputChangeBouncy(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation()
    if (isStringPositiveInteger(e.target.value))
      setInputGameID(e.target.value)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  // -----------------------------------------------------------------------------------------------

  if (loading) return <LoadingModalContent loading={loading} setLoading={setLoading} />

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