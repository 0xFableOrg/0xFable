/**
 * Utilities for determining the game status: which phase of the game we're in, what
 * actions are legal.
 *
 * @module game/status
 */

import { FetchedGameData } from "src/store/types"

// =================================================================================================

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