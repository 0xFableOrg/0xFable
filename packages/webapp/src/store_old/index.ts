/**
 * The 0xFable store manages the game state and ensures that is update consistently.
 * It also manages subscriptions to the chain for keeping the state up to date.
 *
 * This is the top-level store module, the implementation also comprises:
 * - {@link module:store/private} for private primitive atoms
 * - {@link module:store/update} for managing updates and making sure the state is consistent
 * - {@link module:store/subscriptions} to manage on-chain subscriptions and updates
 *
 * @module store
 */

// =================================================================================================

import { atom, getDefaultStore } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { type FetchedGameData, getGameStatus } from "src/types"
import { readOnlyAtom } from "src/utils/react-utils"
import { playerAddress_, gameData_, randomness_ } from "src/store_old/private"
import { Address } from "src/chain"
import { doDrawHand } from "src/store_old/cards"

export { setupStore, refreshGameData } from "src/store_old/update"

// =================================================================================================

export const GAME_ID_STORAGE_KEY = "0xFable::gameID"

// -------------------------------------------------------------------------------------------------

/**
 * Direct access to the Jotai store.
 */
export const store = getDefaultStore()

// =================================================================================================
// GAME INFORMATION

/** Player address — the connected wallet address (enforced in logic.ts) */
export const playerAddress = readOnlyAtom<Address>(playerAddress_)

// -------------------------------------------------------------------------------------------------

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 * This is stored in local storage.
 */
export const gameID = atomWithStorage(GAME_ID_STORAGE_KEY, null as bigint|null)
// atomWithStorage causes the creation of another anonymous atom

// -------------------------------------------------------------------------------------------------

/** Static game data (excluding per-player information).  */
export const gameData = readOnlyAtom<FetchedGameData>(gameData_)

// -------------------------------------------------------------------------------------------------

/** Lets us load the game board once the game starts, but come back to the main menu later. */
export const hasVisitedBoard = atom(false)

// -------------------------------------------------------------------------------------------------

/** Current game status (CREATED, JOINED, STARTED, etc) */
export const gameStatus = atom((get) => {
  const gameData = get(gameData_)
  const player = get(playerAddress_)
  return getGameStatus(gameData, player)
})

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

// -------------------------------------------------------------------------------------------------

/** Current randomness value. Only meaninfully defined if it's our turn! */
export const randomness = readOnlyAtom<bigint>(randomness_)

// =================================================================================================
// ACTIONS

export const drawHand = atom(null, doDrawHand)

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel   = "playerAddress"
gameID.debugLabel          = "gameID"
gameData.debugLabel        = "gameData"
gameStatus.debugLabel      = "gameStatus"
hasVisitedBoard.debugLabel = "hasVisitedBoard"
isGameCreator.debugLabel   = "isGameCreator"
isGameJoiner.debugLabel    = "isGameJoiner"
randomness.debugLabel      = "randomness"

// =================================================================================================