/**
 * Reading from the store from the UI, when not done via hooks.
 *
 * Also hosts the important {@link freshWrap} and {@link checkFresh} functions, which are used to
 * prevent reading from a no-longer relevant store after an async operation (e.g. if the player
 * connect a different wallet while the async operation was in progress).
 *
 * @module store/read
 */

import { type Address } from "src/chain"
import * as store from "src/store/atoms"
import type { FetchedGameData, PlayerData, PrivateInfo } from "src/store/types"
import { GameStatus } from "src/store/types"

// =================================================================================================
// BASIC STORE ACCESS

// -------------------------------------------------------------------------------------------------

/** Return the ID of the game we're created or joined. */
export function getGameID(): bigint|null {
  return store.get(store.gameID)
}

// -------------------------------------------------------------------------------------------------

/** Return the player's address. */
export function getPlayerAddress(): Address|null {
  return store.get(store.playerAddress)
}

// -------------------------------------------------------------------------------------------------

/** The current state of the game. */
export function getGameData(): FetchedGameData|null {
  return store.get(store.gameData)
}

// -------------------------------------------------------------------------------------------------

/** The current game status (CREATED, JOINED, STARTED, etc). */
export function getGameStatus(): GameStatus {
  return store.get(store.gameStatus)
}

// -------------------------------------------------------------------------------------------------

/**
 * Return the private info for the given game and player, if we have it, null otherwise.
 */
export function getPrivateInfo(gameID: bigint, player: Address): PrivateInfo|null {
  const privateInfoStore = store.get(store.privateInfoStore)
  return privateInfoStore[gameID.toString()]?.[player] ?? null
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the address of the current player (whose turn it is in the game!) according to the passed
 * game data. Returns null if there is no game being tracked or if the game hasn't started yet
 * (player still joining / drawing).
 */
export function currentPlayerAddress(): Address|null {
  const gdata = store.get(store.gameData)
  if (gdata === null || getGameStatus() < GameStatus.STARTED) return null
  return gdata.players[gdata.currentPlayer]
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the player data for the given player if available (the player is in the game and we're
 * tracking a game), or null.
 */
export function getPlayerData(gdata: FetchedGameData|null = getGameData(), player: Address)
    : PlayerData | null {

  if (gdata === null) return null
  const index = gdata.players.indexOf(player)
  if (index < 0) return null
  return gdata.playerData[index] ?? null
}

// =================================================================================================
// CHECKFRESH / FRESHWRAP

// -------------------------------------------------------------------------------------------------

/**
 * Check whether the game ID, player, or game state (if defined) shifted underneath us.
 *
 * The game state checking is currently unused in the codebase.
 */
function isStale(gameID: bigint | null, player: Address, gameData?: FetchedGameData): boolean {
  const gameID2 = store.get(store.gameID)
  const player2 = store.get(store.playerAddress)
  const gameData2 = store.get(store.gameData)
  return gameID2 !== gameID
    || player2 !== player
    || (gameData !== undefined
      && (gameData2 === null || gameData2.lastBlockNum !== gameData.lastBlockNum))
}

// -------------------------------------------------------------------------------------------------

/**
 * Thrown by the function returned by {@link freshWrap} when the game ID or player address changed
 * underneath the async operation contained in the promise.
 *
 * It's called "stale" because the callback that follows an async operation is stale: it's not up
 * to date with a store that has changed while the async operation was in progress.
 */
export class StaleError extends Error {
  constructor() {
    super("Stale")
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns a function that returns the result of the promise, but only after checking that the game
 * ID and game state did not change since the call to `freshWrap` was initiated. For clarity, you
 * should use {@checkWrap} to run the function (i.e. `checkFresh(await
 * freshWrap(myAsyncCall(...)))`).
 *
 * Every call that performs async actions and reads the store after the action complete must
 * wrap the action in `checkFresh/freshWrap` in order to avoid read from a completely different
 * store.
 *
 * The reason we must return a function is that if we ran the check after awaiting the promise,
 * we would have no guarantee that code that modifies the store isn't executed in between the time
 * `freshWrap` returns and the time the corresponding `await` resumes.
 */
export async function freshWrap<T>(promise: Promise<T>): Promise<() => T> {
  const gameID = store.get(store.gameID)
  const player = store.get(store.playerAddress)
  if (player === null) return () => {
    throw new StaleError()
  }

  const result = await promise

  return () => {
    if (isStale(gameID, player))
      throw new StaleError()
    return result
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Simply executes the given function, which is meant to be the result of a call to {@link
 * freshWrap}, i.e. `checkFresh(await freshWrap(myAsyncCall(...)))`.
 *
 * This function exists because calling the result of `freshWrap` directly would cause the syntax to
 * look like `(await freshWrap(...))()`, and starting lines with a parenthesis does not play nice
 * with semicolon insertion (it will try to treat the thing on the previous line as a function
 * value).
 */
export const checkFresh = <T>(fn: () => T) => fn()

// =================================================================================================