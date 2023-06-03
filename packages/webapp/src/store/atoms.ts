/**
 * This package contains all the Jotai atoms that comprises our store.
 *
 * Do *NOT* use these atoms directly from React, instead use the hooks in {@link
 * module:store/hooks}, and the actions in {@link module:store/actions}.
 *
 * @module store/atoms
 */

import { atom, getDefaultStore } from "jotai"
import { Address } from "src/chain"
import { atomWithStorage } from "jotai/utils"
import { FetchedGameData, GameCards, getGameStatus } from "src/types"

// =================================================================================================
// STORE

/** The Jotai store instance that has all our atoms. */
export const store = getDefaultStore()

// =================================================================================================
// READ/WRITE ATOMS

/** Player address — the connected wallet address. */
export const playerAddress = atom(null as Address|null)

// NOTE: This isn't atom<Address|null>(null) because that selects the WriteableAtom overload.
// The same applies to the other atoms below.

// -------------------------------------------------------------------------------------------------

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 * This is stored in local storage.
 */
export const gameID = atomWithStorage("0xFable::gameID", null as bigint|null)

// -------------------------------------------------------------------------------------------------

/** The current state of the game. */
export const gameData = atom(null as FetchedGameData|null)

// -------------------------------------------------------------------------------------------------

/** The listing of cards used in the current game. */
export const gameCards = atom(null as GameCards|null)

// -------------------------------------------------------------------------------------------------

/**
 * Whether the user visited the game board for the current game.
 * This useful for managing state transitions in the game creation and joining flow.
 */
export const hasVisitedBoard = atom(false)

// -------------------------------------------------------------------------------------------------

/** Current randomness value. Only meaninfully defined if it's our turn! */
export const randomness = atom(null as bigint|null)

// =================================================================================================
// DERIVED ATOMS

// -------------------------------------------------------------------------------------------------

/** The current game status (CREATED, JOINED, STARTED, etc). */
export const gameStatus = atom((get) => getGameStatus(get(gameData), get(playerAddress)))

// -------------------------------------------------------------------------------------------------

/** True if we have created the current game. */
export const isGameCreator = atom ((get) => {
  const address = get(playerAddress)
  return address != null && address === get(gameData)?.gameCreator
})

// -------------------------------------------------------------------------------------------------

/** True if we have have joined BUT are not the creator of the current game. */
export const isGameJoiner = atom((get) => {
  const address = get(playerAddress)
  return address != null && !get(isGameCreator) && get(gameData)?.players?.includes(address)
})

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel    = "playerAddress"
gameID.debugLabel           = "gameID"
gameData.debugLabel         = "gameData"
gameCards.debugLabel        = "gameCards"
hasVisitedBoard.debugLabel  = "hasVisitedBoard"
gameStatus.debugLabel       = "gameStatus"
randomness.debugLabel       = "randomness"
gameStatus.debugLabel       = "gameStatus"
isGameCreator.debugLabel    = "isGameCreator"
isGameJoiner.debugLabel     = "isGameJoiner"

// =================================================================================================