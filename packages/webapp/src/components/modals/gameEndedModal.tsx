import { useAtom } from "jotai"
import { useRouter } from "next/router"
import { useCallback, useEffect } from "react"

import { CheckboxModal } from "src/components/lib/checkboxModal"
import { ModalTitle } from "src/components/lib/modalElements"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"
import * as store from "src/store"

/**
 * This modal is displayed in the "/play" page, when the game ends. It can be dismissed if the
 * player wishes to view the final state of the game board, after which he can still go back
 * to the menu through a button on the game board.
 */
export const GameEndedModal = ({closeCallback}) => {
  const checkboxID = "game-end"
  const modalControl = useCheckboxModal(checkboxID)
  const router = useRouter()
  const [ gameID, setGameID ] = useAtom(store.gameID)

  const exitToMenu = useCallback(() => {
    setGameID(null)
    void router.push("/")
  }, [])

  useEffect(() => {
    modalControl.displayModal(true)
  }, [])

  return <CheckboxModal id={checkboxID} control={modalControl} initialCloseable={false}>
    <ModalTitle>Game Ended</ModalTitle>
    <p className="py-4 font-mono">In the future, we ought to say who won :)</p>
    <div className="flex justify-center gap-4">
      <button className="btn" onClick={exitToMenu}>
        Exit to Menu
      </button>
      <button className="btn" onClick={() => { modalControl.displayModal(false); closeCallback() }}>
        View Game
      </button>
    </div>
  </CheckboxModal>
}