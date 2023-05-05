import Link from "next/link"

/**
 * This modal content is shared by both the {@link CreateGameModal} (for the game creator) and the
 * {@link JoinGameModal} (for the joiner), and is displayed when the game is in progress but the
 * player navigates back to the menu.
 *
 * @param {{concede}} concede - The function to call to concede the game.
 */
export const InGameMenuModalContent = ({ concede }) => {
  return <>
    <h3 className="text-xl font-bold normal-case mb-4">Game in progress!</h3>
    <div className="flex justify-center gap-4">
      <Link className="btn" href="/play">
        Return to Game
      </Link>
      <button className="btn" disabled={!concede} onClick={concede}>
        Concede Game
      </button>
    </div>
  </>
}