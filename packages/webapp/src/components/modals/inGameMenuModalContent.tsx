import Link from "next/link"

import { Button } from "src/components/ui/button"
import { DialogDescription, DialogTitle } from "src/components/ui/dialog"

/**
 * This modal content is shared by both the {@link CreateGameModal} (for the game creator) and the
 * {@link JoinGameModal} (for the joiner), and is displayed when the game is in progress but the
 * player navigates back to the menu.
 *
 * @param {{concede}} concede - The function to call to concede the game.
 */
export const InGameMenuModalContent = ({ concede }: { concede?: () => void }) => {
    return (
        <>
            <DialogTitle className="font-fable">Game in progress!</DialogTitle>
            <DialogDescription>
                <div className="mt-4 flex justify-center gap-4">
                    <Link href="/play">
                        <Button className="font-fable" variant={"secondary"}>
                            Return to Game
                        </Button>
                    </Link>
                    <Button className="font-fable" variant={"secondary"} disabled={!concede} onClick={concede}>
                        Concede Game
                    </Button>
                </div>
            </DialogDescription>
        </>
    )
}
