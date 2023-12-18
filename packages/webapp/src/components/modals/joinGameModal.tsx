import debounce from "lodash/debounce"
import { useRouter } from "next/router"
import React, { useEffect, useMemo, useState } from "react"
import { ModalMenuButton, ModalTitle, Spinner } from "src/components/lib/modalElements"
import { InGameMenuModalContent } from "src/components/modals/inGameMenuModalContent"

import * as store from "src/store/hooks"
import { isStringPositiveInteger, parseBigIntOrNull } from "src/utils/js-utils"
import { Modal, ModalController, useModalController } from "src/components/lib/modal"
import { LoadingModalContent } from "src/components/lib/loadingModal"
import { joinGame, reportInconsistentGameState } from "src/actions"
import { setError } from "src/store/write"
import { GameStatus } from "src/store/types"
import { navigate } from "src/utils/navigate"
import { useCancellationHandler } from "src/hooks/useCancellationHandler"
import { concede } from "src/actions/concede"

// =================================================================================================

export const JoinGameModal = () => {
  const isGameJoiner = store.useIsGameJoiner()
  const ctrl = useModalController({ loaded: isGameJoiner })

  useEffect(() => {
    // If we're on the home page and we have joined a game we didn't create, this modal
    // should be displayed.
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
  const playerAddress = store.usePlayerAddress()
  const gameStatus = store.useGameStatus()
  const [ hasVisitedBoard ] = store.useHasVisitedBoard()
  const [ inputGameID, setInputGameID ] = useState<string|null>(null)
  const [ loading, setLoading ] = useState<string|null>(null)
  const [ drawCompleted, setDrawCompleted ] = useState(false)
  const router = useRouter()

  // Decompose in boolean to help sharing code.
  const joined  = gameStatus >= GameStatus.HAND_DRAWN || drawCompleted
  const started = gameStatus >= GameStatus.STARTED && gameStatus < GameStatus.ENDED

  // Load game board game once upon game start.
  useEffect(() => {
    if (!hasVisitedBoard && started)
      void navigate(router, "/play")
  }, [hasVisitedBoard, router, started])

  // The modal can't be closed in the normal way when in a loading state.
  useEffect(() => {
    ctrl.closeableAndSurroundCloseable = loading === null
  }, [ctrl, loading])

  const cancellationHandler = useCancellationHandler(loading)

  const join = async () => {
    if (inputGameID === null || playerAddress === null)
      return reportInconsistentGameState("Not tracking a game or player disconnected.")

    const parsedGameID = parseBigIntOrNull(inputGameID) as bigint
    if (parsedGameID === null)
      return setError({
        title: "Game ID must be a plain number",
        message: "",
        buttons: [{ text: "OK", onClick: () => setError(null) }]
      })

    const success = await joinGame({
      gameID: parsedGameID,
      playerAddress,
      setLoading,
      cancellationHandler
    })

    if (success) {
      setDrawCompleted(true)
      setLoading("Waiting for other player...")
    }
  }

  const doConcede = !started
    ? undefined
    : () => concede({
      gameID: gameID!,
      playerAddress: playerAddress!,
      setLoading,
      onSuccess: () => {
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

  if (loading)
    return <LoadingModalContent
      loading={loading}
      cancellationHandler={cancellationHandler}
      setLoading={setLoading}
    />

  if (started) return <InGameMenuModalContent concede={doConcede} />

  return <>
    {joined && <>
      <ModalTitle>Waiting for other player...</ModalTitle>
      <Spinner />
    </>}
    {!joined && <>
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
    </>}
  </>
}

// =================================================================================================