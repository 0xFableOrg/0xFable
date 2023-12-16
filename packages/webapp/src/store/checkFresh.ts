/**
 * Functions for checking the freshness/staleness of available state data.
 *
 * Say we read the game data from the store, then `await` some async operation. It is possible that
 * the game data in the store has changed. Given the turn-based nature of the game, this is usually
 * ok. However, if the game ID or player address changed, then we're using completely irrelevant
 * game data.
 *
 * To avoid this, awaited calls can be wrapped with {@link freshWrap}, and the awaited result with
 * {@link checkFresh}, which will throw a {@link StaleError} if the game ID or player address
 * changed.
 *
 * The check can also be performed manually with {@link checkStale}.
 *
 * @module store/checkFresh
 */

import { Address } from "src/chain"
import * as store from "src/store/atoms"
import { FetchedGameData } from "src/store/types"

// =================================================================================================

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
 * If {@link isStale} returns true, throws a {@link StaleError}.
 */
export function checkStale(gameID: bigint | null, player: Address, gameData?: FetchedGameData) {
  if (isStale(gameID, player, gameData))
    throw new StaleError()
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