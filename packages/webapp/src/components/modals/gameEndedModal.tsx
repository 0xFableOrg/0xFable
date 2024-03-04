import { useCallback, useState } from "react"
import { useRouter } from "next/router"

import { Button } from "src/components/ui/button"
import { Dialog, DialogContent,DialogDescription, DialogTitle } from "src/components/ui/dialog"
import { useGameData, useGameID } from "src/store/hooks"
import { navigate } from "src/utils/navigate"

/**
 * This modal is displayed in the "/play" page, when the game ends. It can be dismissed if the
 * player wishes to view the final state of the game board, after which he can still go back
 * to the menu through a button on the game board.
 */
export const GameEndedModal = ({ closeCallback }: { closeCallback: () => void }) => {
    const router = useRouter()
    const [, setGameID] = useGameID()
    const gameData = useGameData()
    const [open, isOpen] = useState<boolean>(true)

    const exitToMenu = useCallback(() => {
        setGameID(null)
        void navigate(router, "/")
    }, [router, setGameID])

    const viewGame = useCallback(() => {
        isOpen(false)
        closeCallback()
    }, [closeCallback])

    return (
        <Dialog open={open}>
            <DialogContent>
                <DialogTitle className="font-fable text-xl">Game Ended</DialogTitle>
                <DialogDescription>
                    <p className="py-4 font-mono">Winner: {gameData?.players[gameData.livePlayers[0]]}</p>
                    <div className="flex justify-center gap-4">
                        <Button className="font-fable" variant={"secondary"} onClick={exitToMenu}>
                            Exit to Menu
                        </Button>
                        <Button className="font-fable" variant={"secondary"} onClick={viewGame}>
                            View Game
                        </Button>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}
