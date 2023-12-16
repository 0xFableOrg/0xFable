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
import * as derive from "src/store/derive"
import type { FetchedGameData, PlayerData, PrivateInfo } from "src/store/types"
import { GameStatus } from "src/store/types"

// =================================================================================================
// DIRECT STORE ACCESS

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

// =================================================================================================
// PARAMETERIZED STORE ACCESS

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link GameStatus game status} based on the game data.
 * Returns {@link GameStatus.UNKNOWN} (= 0) if the some data is missing.
 */
export function getGameStatus(
    gdata: FetchedGameData|null = store.get(store.gameData),
    player: Address|null = store.get(store.playerAddress)
): GameStatus {
  return derive.getGameStatus(gdata, player)
}

// -------------------------------------------------------------------------------------------------

/**
 * The list of cards that can be used in the game, or null if data is missing.
 */
export function getCards(
    gdata: FetchedGameData|null = store.get(store.gameData)
): readonly bigint[]|null {
  return derive.getCards(gdata)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the address of the current player (whose turn it is in the game). Returns null if data is
 * missing. This value is only meaningful if the game status is >= {@link GameStatus.STARTED}.
 */
export function getCurrentPlayerAddress(
  gdata: FetchedGameData|null = store.get(store.gameData)
): Address|null {
  return derive.getCurrentPlayerAddress(gdata)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the given player if available (the player has joined the game
 * we're tracking / whose data we've passed in), or null (also if data is missing).
 */
export function getPlayerData(
    gdata: FetchedGameData|null = getGameData(),
    player: Address | null = getPlayerAddress()
): PlayerData | null {
  return derive.getPlayerData(gdata, player)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the private info for the given game and player, or null if some data is missing.
 */
export function getPrivateInfo(
    gameID: bigint|null = store.get(store.gameID),
    player: Address|null = store.get(store.playerAddress)
): PrivateInfo|null {
  return derive.getPrivateInfo(gameID, player)
}

// =================================================================================================
// FUNCTIONS WITHOUT CORRESPONDING ATOMS

// -------------------------------------------------------------------------------------------------


/**
 * Returns the player's deck if available (the player has joined the game we're tracking / whose
 * data we've passed in), or null.
 */
export function getDeck(
    pdata: PlayerData|null = getPlayerData(),
    cards: readonly bigint[]|null = getCards()
): bigint[]|null {
  return derive.getDeck(pdata, cards)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the number of cards left in the deck.
 * Returns -1 if data is missing.
 */
export function getDeckSize(privateInfo: PrivateInfo|null = getPrivateInfo()): number {
  if (privateInfo === null) return -1
  return derive.getDeckSize(privateInfo)
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