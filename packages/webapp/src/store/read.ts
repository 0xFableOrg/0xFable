/**
 * Reading from the store, when not done via hooks (async actions, either user-initiated, or
 * subscriptions etc).
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

// -------------------------------------------------------------------------------------------------

/**
 * Whether all player have joined and drawn their initial hands, given available block info and a
 * block number.
 *
 * Note that the block number might not be in sync with the game data. This is only so that we can
 * handle the case where the block number is the one at which we included our `drawInitialHand`
 * proof, and the game data hasn't updated accordingly yet.
 */
export function isGameReadyToStart(gameData: FetchedGameData, blockNumber: bigint): boolean {
  return derive.isGameReadyToStart(gameData, blockNumber)
}

// =================================================================================================