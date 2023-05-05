import { useRouter } from "next/router"

import { CheckboxModal } from "src/components/lib/checkboxModal"
import { ModalTitle } from "src/components/lib/modalElements"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"

/**
 * This modal is displayed in the "/play" page, when the game ends. It can be dismissed if the
 * player wishes to view the final state of the game board, after which he can still go back
 * to the menu through a button on the game board.
 */
export const GameEndedModal = () => {
  const checkboxID = "game-end"
  const modalControl = useCheckboxModal(checkboxID)
  const router = useRouter()

  return <CheckboxModal id={checkboxID} control={modalControl}>
    <ModalTitle>Game Ended</ModalTitle>
    <p className="text-center">In the future, we ought to say who won :)</p>
    <div className="flex justify-center gap-4">
      <button className="btn" onClick={() => { void router.push("/")}}>
        Exit to Menu
      </button>
      <button className="btn" onClick={() => { modalControl.displayModal(false)}}>
        View Game
      </button>
    </div>
  </CheckboxModal>
}