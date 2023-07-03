import { useRouter } from "next/router"
import { useCallback } from "react"

import { ModalTitle } from "src/components/lib/modalElements"
import { useGameID } from "src/store/hooks"
import { Modal, useModalController } from "src/components/lib/modal"

/**
 * This modal is displayed in the "/play" page, when the game ends. It can be dismissed if the
 * player wishes to view the final state of the game board, after which he can still go back
 * to the menu through a button on the game board.
 */
export const GameEndedModal = ({ closeCallback }: { closeCallback: () => void }) => {
  const ctrl = useModalController({ displayed: true, closeable: false })
  const router = useRouter()
  const [ , setGameID ] = useGameID()

  const exitToMenu = useCallback(() => {
    setGameID(null)
    void router.push("/")
  }, [router, setGameID])

  const viewGame = useCallback(() => {
    ctrl.close()
    closeCallback()
  }, [closeCallback, ctrl])

  return <Modal ctrl={ctrl}>
    <ModalTitle>Game Ended</ModalTitle>
    <p className="py-4 font-mono">In the future, we ought to say who won :)</p>
    <div className="flex justify-center gap-4">
      <button className="btn" onClick={exitToMenu}>
        Exit to Menu
      </button>
      <button className="btn" onClick={viewGame}>
        View Game
      </button>
    </div>
  </Modal>
}