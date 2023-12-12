/**
 * Utilities for determining the game status: which phase of the game we're in, what
 * actions are legal.
 *
 * @module game/status
 */

import { Address } from "src/chain"
import { FetchedGameData, GameStatus, GameStep } from "src/store/types"

// =================================================================================================

/**
 * Returns the game status ({@link GameStatus)} based on the game data.
 */
export function getGameStatus(gdata: FetchedGameData|null, player: Address|null): GameStatus {

  if (gdata === null || player === null)
    return GameStatus.UNKNOWN

  if  (gdata.lastBlockNum === 0n)
    throw new Error("Empty game data object — shouldn't be from Game contract which checks this.")

  if (gdata.currentStep === GameStep.UNINITIALIZED)
    if (!gdata.players.includes(player))
      return GameStatus.CREATED
    else if (gdata.livePlayers.includes(gdata.players.indexOf(player)))
      return GameStatus.HAND_DRAWN
    else
      return GameStatus.JOINED

  if (gdata.currentStep === GameStep.ENDED)
    return GameStatus.ENDED
  else
    return GameStatus.STARTED
}

// -------------------------------------------------------------------------------------------------

/**
 * Whether all player have joined and drawn their initial hands, given available block info and a
 * block number.
 *
 * Note that the block number might not be in sync with the game data. This is only so that we can
 * handle the case where the block number is the one at which we included our `drawInitialHand`
 * proof, and the game data hasn't updated accordingly yet.
 */
export function isGameReadyToStart(gameData: FetchedGameData, blockNumber: bigint): boolean {
  return gameData.playersLeftToJoin === 0 &&
    (gameData.lastBlockNum >= blockNumber
      // Depending on whether the game data has already been updated with the results of the
      // drawInitialHand call.
      ? gameData.livePlayers.length === gameData.players.length
      : gameData.livePlayers.length === gameData.players.length - 1)
}

// =================================================================================================