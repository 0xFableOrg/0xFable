/**
 * Misc game logic helpers.
 */
import { FetchedGameData, GameStep } from "src/store/types"
import { Address } from "src/chain"

// =================================================================================================

/**
 * Returns true iff it is legal to end a turn in the given game step.
 */
export function isEndingTurn(gameStep: GameStep): boolean {
  return gameStep === GameStep.PLAY || gameStep === GameStep.ATTACK || gameStep === GameStep.PASS
}

// -------------------------------------------------------------------------------------------------

/**
 * Return the current player's address.
 */
export function currentPlayer(gameData: FetchedGameData): Address {
  return gameData.players[gameData.currentPlayer]
}

// =================================================================================================