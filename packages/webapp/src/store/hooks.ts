/**
 * React hooks that can be used to access the store.
 *
 * The purpose of wrapping our atoms in hooks is two-fold: facilitate switching to a different
 * store library if required, and to provide better type interface.
 *
 * @module store/hooks
 */
import { Address } from "src/chain"
import { FetchedGameData, GameStatus } from "src/types"
import { useAtom, useAtomValue } from "jotai"
import * as atoms from "src/store/atoms"

// =================================================================================================

/** Player address — the connected wallet address. */
export function usePlayerAddress(): Address {
  return useAtomValue(atoms.playerAddress)
}

// -------------------------------------------------------------------------------------------------

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 *
 * Returns the current value and a setter that can be used to transition to a different ID, or
 * to clear the game data (by passing null).
 */
export function useGameID(): [bigint|null, (ID: bigint|null) => void] {
  return useAtom(atoms.gameID)
}

// -------------------------------------------------------------------------------------------------

/** The current state of the game. */
export function useGameData(): FetchedGameData {
  return useAtomValue(atoms.gameData)
}

// -------------------------------------------------------------------------------------------------

/**
 * Whether the user visited the game board for the current game.
 * This useful for managing state transitions in the game creation and joining flow.
 *
 * Returns the current value and a function that can be used to indicate we visited the game board.
 */
export function useHasVisitedBoard(): [boolean, () => void] {
  const [ value, setValue ] = useAtom(atoms.hasVisitedBoard)
  return [ value, () => setValue(true) ]
}

// -------------------------------------------------------------------------------------------------

/** Current game status (CREATED, JOINED, STARTED, etc) */
export function useGameStatus(): GameStatus {
  return useAtomValue(atoms.gameStatus)
}

// -------------------------------------------------------------------------------------------------

/** True if we have created the current game. */
export function useIsGameCreator(): boolean {
  return useAtomValue(atoms.isGameCreator)
}

// -------------------------------------------------------------------------------------------------

/** True if we have have joined BUT are not the creator of the current game. */
export function useIsGameJoiner(): boolean {
  return useAtomValue(atoms.isGameJoiner)
}

// =================================================================================================