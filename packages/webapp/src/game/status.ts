/**
 * Utilities for determining the game status: which phase of the game we're in, what
 * actions are legal.
 *
 * @module game/status
 */

import { zeroAddress } from "viem"

import { Address } from "src/chain"
import { FetchedGameData, GameStatus, GameStep } from "src/types"

// =================================================================================================

/**
 * Returns the game status ({@link GameStatus)} based on the game data.
 */
export function getGameStatus(gdata: FetchedGameData|null, player: Address|null): GameStatus {

  if (gdata === null || player === null || gdata.gameCreator === zeroAddress)
    return GameStatus.UNKNOWN

  if (gdata.playersLeftToJoin === 0 && gdata.currentStep != GameStep.UNINITIALIZED)
    return gdata.livePlayers.length <= 1
      ? GameStatus.ENDED
      : GameStatus.STARTED

  return gdata.players.includes(player)
    ? gdata.livePlayers.includes(gdata.players.indexOf(player))
      ? GameStatus.HAND_DRAWN
      : GameStatus.JOINED
    : GameStatus.CREATED
}

// -------------------------------------------------------------------------------------------------

/**
 * Whether all player have joined and drawn their initial hands.
 */
export function isGameReadyToStart(gameData: FetchedGameData, blockNumber: bigint): boolean {
  return gameData.playersLeftToJoin === 0 &&
    (gameData.lastBlockNum >= blockNumber
      // depending on whether the data has already been updated with the results of the draw call
      ? gameData.livePlayers.length === gameData.players.length
      : gameData.livePlayers.length === gameData.players.length - 1)
}

// =================================================================================================