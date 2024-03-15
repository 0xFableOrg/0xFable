/**
 * Misc game logic helpers.
 */
import { Address } from "src/chain"
import { FetchedGameData, GameStep } from "src/store/types"

// =================================================================================================

/**
 * Returns true iff it is legal to end a turn in the given game step.
 */
export function isEndingTurn(gameStep: GameStep): boolean {
    return gameStep === GameStep.PLAY || gameStep === GameStep.ATTACK || gameStep === GameStep.END_TURN
}

// -------------------------------------------------------------------------------------------------

/**
 * Return the current player's address.
 */
export function currentPlayer(gameData: FetchedGameData): Address {
    return gameData.players[gameData.currentPlayer]
}

// =================================================================================================
