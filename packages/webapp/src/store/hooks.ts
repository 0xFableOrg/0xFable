/**
 * React hooks that can be used to access the store.
 *
 * The purpose of wrapping our atoms in hooks is two-fold: facilitate switching to a different
 * store library if required, and to provide better type interface.
 *
 * @module store/hooks
 */

import { useAtom, useAtomValue } from "jotai"

import { Address } from "src/chain"
import * as store from "src/store/atoms"
import { ErrorConfig, FetchedGameData, GameStatus, PlayerData, PrivateInfo } from "src/store/types"

// =================================================================================================

/** Player address — the connected wallet address. */
export function usePlayerAddress(): Address|null {
  return useAtomValue(store.playerAddress)
}

// -------------------------------------------------------------------------------------------------

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 *
 * Returns the current value and a setter that can be used to transition to a different ID, or
 * to clear the game data (by passing null).
 */
export function useGameID(): [bigint|null, (ID: bigint|null) => void] {
  return useAtom(store.gameID)
}

// -------------------------------------------------------------------------------------------------

/** The current state of the game. */
export function useGameData(): FetchedGameData|null {
  return useAtomValue(store.gameData)
}

// -------------------------------------------------------------------------------------------------

/**
 * Whether the user visited the game board for the current game.
 * This useful for managing state transitions in the game creation and joining flow.
 *
 * Returns the current value and a function that can be used to indicate we visited the game board.
 */
export function useHasVisitedBoard(): [boolean, () => void] {
  const [ value, setValue ] = useAtom(store.hasVisitedBoard)
  return [ value, () => setValue(true) ]
}

// -------------------------------------------------------------------------------------------------

/** If non-null, the configuration of an error modal to be displayed. */
export function useErrorConfig(): ErrorConfig|null {
  return useAtomValue(store.errorConfig)
}

// -------------------------------------------------------------------------------------------------

/** Current game status (CREATED, JOINED, STARTED, etc) */
export function useGameStatus(): GameStatus {
  return useAtomValue(store.gameStatus)
}

// -------------------------------------------------------------------------------------------------

/** True if we have created the current game. */
export function useIsGameCreator(): boolean {
  return useAtomValue(store.isGameCreator)
}

// -------------------------------------------------------------------------------------------------

/** True if we have have joined BUT are not the creator of the current game. */
export function useIsGameJoiner(): boolean {
  return useAtomValue(store.isGameJoiner)
}

// -------------------------------------------------------------------------------------------------

/**
 * True if all players have joined the game (they may not have drawn hands yet), at which point the
 * game creator can no longer cancel the game.
 */
export function useAllPlayersJoined(): boolean {
  return useAtomValue(store.allPlayersJoined)
}

// -------------------------------------------------------------------------------------------------

/** Returns the private information pertaining to the current game. */
export function usePrivateInfo(gameID: bigint|null, playerAddress: Address|null): PrivateInfo|null {
  const privateInfoStore = useAtomValue(store.privateInfoStore)
  return gameID === null || playerAddress === null
    ? null
    : privateInfoStore?.[gameID.toString()]?.[playerAddress]
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the local player, or null if the player is not set, game
 * data is missing, or the player is not in the game.
 */
export function usePlayerData(): PlayerData|null {
  return useAtomValue(store.playerData)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the opponent (assumes a two-player game). Returns null if the
 * local player is not set, game data is missing, or the local player is not in the game.
 */
export function useOpponentData(): PlayerData|null {
  return useAtomValue(store.opponentData)
}

// -------------------------------------------------------------------------------------------------

export function usePlayerHand(): readonly bigint[]|null {
  return useAtomValue(store.playerHand)
}

// =================================================================================================