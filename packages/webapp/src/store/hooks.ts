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
import { ErrorConfig, FetchedGameData, GameStatus, PrivateInfo, CardInPlay } from "src/store/types"

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

/** The current cards in play inside the game. */
type UsePlayedCardsReturn = [ CardInPlay[]|null, (card: CardInPlay|null) => void ]

export function usePlayedCards(): UsePlayedCardsReturn {
  const [ playedCards, setPlayedCards ] = useAtom(store.playedCards)

  const addOrRemoveCard = (card: CardInPlay|null) => {
    if (card === null) {
      setPlayedCards(null)
      return
    }
    if (playedCards) {
      setPlayedCards([...playedCards, card])
    } else {
      setPlayedCards([card])
    }
  }

  return [ playedCards, addOrRemoveCard ]
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

/**
 * The current {@link GameStatus game status} based on the game data.
 * Will be {@link GameStatus.UNKNOWN} (= 0) if the some data is missing.
 */
export function useGameStatus(): GameStatus {
  return useAtomValue(store.gameStatus)
}

// -------------------------------------------------------------------------------------------------

/**
 * True if all players have joined the game (they may not have drawn hands yet), at which point the
 * game creator can no longer cancel the game. False if data is missing.
 */
export function useAllPlayersJoined(): boolean {
  return useAtomValue(store.allPlayersJoined)
}

// -------------------------------------------------------------------------------------------------

/**
 * True if the local player is the game creator. False if data is missing.
 */
export function useIsGameCreator(): boolean {
  return useAtomValue(store.isGameCreator)
}

// -------------------------------------------------------------------------------------------------

/**
 * True if the local player has joined BUT is not the creator of the current game.
 * False if data is missing.
 */
export function useIsGameJoiner(): boolean {
  return useAtomValue(store.isGameJoiner)
}

// -------------------------------------------------------------------------------------------------

/**
 * The address of the current player (whose turn it is in the game). Will be null if data is
 * missing. This value is only meaningful if the game status is >= {@link GameStatus.STARTED}.
 */
export function useCurrentPlayerAddress(): Address|null {
  return useAtomValue(store.currentPlayerAddress)
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the local player, or null if the player is not set, game
 * data is missing, or the player is not in the game. Returns null if data is missing.
 */
export function usePlayerData(): PlayerData|null {
  return useAtomValue(store.playerData)
}

// -------------------------------------------------------------------------------------------------

/**
 * The address of the opponent of the local player (assumes a two-player game).
 * Returns null if data is missing.
 */
export function useOpponentAddress(): Address|null {
  return useAtomValue(store.opponentAddress)
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

/**
 * Returns the local player's hand, or null if data is missing.
 */
export function usePlayerHand(): readonly bigint[]|null {
  return useAtomValue(store.playerHand)
}

// -------------------------------------------------------------------------------------------------

/**
 * The private information pertaining to the local player.
 * Will be null if data is missing.
 */
export function usePrivateInfo(): PrivateInfo|null {
  return useAtomValue(store.privateInfo)
}

// -------------------------------------------------------------------------------------------------

/**
 * The cards controlled by the local player on the battlefield.
 */
export function usePlayerBattlefield(): readonly bigint[]|null {
  return useAtomValue(store.playerBattlefield)
}

// -------------------------------------------------------------------------------------------------

/**
 * The cards controlled by the opponent on the battlefield.
 * Will be null if data is missing.
 */
export function useOpponentBattlefield(): readonly bigint[]|null {
  return useAtomValue(store.opponentBattlefield)
}

// =================================================================================================