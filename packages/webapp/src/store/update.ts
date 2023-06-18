/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================

import { getDefaultStore } from "jotai"
import { getAccount, getNetwork, watchAccount, watchNetwork } from "wagmi/actions"

import { subscribeToGame } from "src/store/subscriptions"
import { GameStatus, type FetchedGameData } from "src/types"
import { AccountResult, chains, NetworkResult } from "src/chain"
import { formatTimestamp } from "src/utils/js-utils"
import * as atoms from "src/store/atoms"
import { Address } from "wagmi"
import * as net from "src/store/network"

// =================================================================================================
// INITIALIZATION

// The frontend can only handle one game at a time, for which we use the default store.
const store = getDefaultStore()

// Only run setup once.
let setupHasRun = false

/**
 * Called from {@link setup} to setup the store.
 */
export function setupStore() {
  if (setupHasRun) return
  setupHasRun = true

  // Whenever the connect wallet address changes, update the player address.
  watchAccount(updatePlayerAddress)

  // Make sure to clear game data if we switch to an unsupported network.
  watchNetwork(updateNetwork)

  // Make sure we don't miss the initial value, if already set.
  updatePlayerAddress(getAccount())

  // The game ID can change from actions in this tab, but also in other tabs, or can be retrieved
  // from the storage upon boot, so we need to listen to the storage.
  store.sub(atoms.gameID, () => {
    gameIDListener(store.get(atoms.gameID))
  })

  // Make sure we don't miss the initial value, if already set.
  const gameID = store.get(atoms.gameID)
  if (gameID !== null)
    gameIDListener(gameID)
}

// =================================================================================================
// CHANGE LISTENERS

/**
 * Called whenever the connected wallet address changes. Makes sure to clear the address if the
 * wallet is disconnected, as well as the game data.
 */
function updatePlayerAddress(result: AccountResult) {
  const oldAddress = store.get(atoms.playerAddress)
  // normalize to null (never undefined)
  const newAddress = result.status === 'disconnected' ? null : (result.address || null)

  if (oldAddress !== newAddress && isNetworkValid()) {
    console.log(`player address changed from ${oldAddress} to ${newAddress}`)
    store.set(atoms.playerAddress, newAddress)

    // TODO the below should go away if we stop saving the gameID in browser storage and just fetch
    //      the gameID a player is in instead

    // The check is important: on a page load when already connected, the address will transition
    // from null to the connected address, and we don't want to throw away the game ID.
    //
    // If the old address is null, there is also nothing to reset (excepted at load).
    if (oldAddress !== null)
      // New player means current game & game data is stale, reset it.
      store.set(atoms.gameID, null)
  }
}

// -------------------------------------------------------------------------------------------------

/** Returns true if the network we are connected to is the one we support ({@link chains}). */
function isNetworkValid(network: NetworkResult = getNetwork()) {
  return chains.some(chain => chain.id === network.chain?.id)
}

// -------------------------------------------------------------------------------------------------

/**
 * Called whenever the network we are connected to changes. Makes sure to clear the game data if the
 * network is unsupported.
 */
function updateNetwork(result: NetworkResult) {
  console.log(`network changed to chain with ID ${result.chain?.id}`)
  if (!isNetworkValid(result)) {
    store.set(atoms.gameID, null) // resets all game data
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Called whenever the game ID is updated. This clears the old game data (to avoid inconsistent
 * states), triggers a refresh of the game data, and makes sure we're subscribed to game updates.
 *
 * The game ID can be `null`, in which case there is no new subscription and no data refresh.
 *
 * This is called whenever the game ID changes (from actions in this tab or in other tabs), and
 * possibly when the game ID is loaded from storage at boot time.
 *
 * It never causes race conditions or weird data states: this resets all associated states, and if
 * a refresh lands with another ID, it will be ignored.
 */
function gameIDListener(ID: bigint|null) {
  console.log(`transitioning to game ID ${ID}`)

  // avoid using inconsistent data
  store.set(atoms.gameData, null as FetchedGameData)
  store.set(atoms.hasVisitedBoard, false)

  subscribeToGame(ID) // will unusubscribe if ID is null
  if (ID !== null)
    // We might be jumping into an in-progress game, so fetch cards.
    void refreshGameData({ forceFetchCards: true })
}

// =================================================================================================
// REFRESH GAME DATA

// -------------------------------------------------------------------------------------------------

/** If the game has started and we don't have the cards yet, we need to fetch them. */
function shouldUpdateCards(): boolean {
  return store.get(atoms.gameStatus) >= GameStatus.STARTED && store.get(atoms.gameCards) === null
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns whether an update for the given gameID and player address is stale, i.e. if the current
 * store gameID and player address are different, meaning they change underneath the fetch and the
 * fetched data should be discarded.
 */
function isStaleVerbose(ID: bigint, player: Address): boolean {
  const storeID = store.get(atoms.gameID)
  const storePlayer = store.get(atoms.playerAddress)
  if (player !== storePlayer) {
    console.log(`Rejected stale data with player ${player} (current: ${storePlayer})`)
    return true
  }
  if (ID !== storeID) {
    console.log(`Rejected stale data with game ID ${ID} (current: ${storeID})`)
    return true
  }
  return false
}

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the game data or the given game ID and player address, and updates the store with the
 * fetched data (if not throttled, zombie, or stale). Returns the fetched data.
 */
async function updateGameData(ID: bigint, player: Address): Promise<FetchedGameData> {
  const gameData = await net.fetchGameData(ID)
  if (gameData === null || isStale(ID, player)) return

  const timestamp = Date.now()
  console.groupCollapsed(`updated game data (at ${formatTimestamp(timestamp)})`)
  console.dir(gameData)
  console.groupEnd()

  const oldGameData = store.get(atoms.gameData)
  if (oldGameData !== null && oldGameData.lastBlockNum >= gameData.lastBlockNum)
    // We already have more or as recent data, no need to trigger a store update.
    return oldGameData

  store.set(atoms.gameData, gameData)
  return gameData
}

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the game cards for the given game ID and player address (if not throttled, zombie, or
 * stale). Returns the fetched cards.
 */
async function fetchCards(ID: bigint, player: Address): Promise<readonly bigint[]> {
  const cards = await net.fetchCards(ID)
  if (cards === null || isStale(ID, player)) return
  return cards
}

// -------------------------------------------------------------------------------------------------

/**
 * Triggers a refresh of the game data, setting the {@link atoms.gameData} atom. If the game ID or
 * the player changes the while the refresh is in flight, the refresh is ignored.
 *
 * If necessary ({@link shouldUpdateCards} returns true), also fetches the cards and updates the
 * {@link atoms.gameCards} atom accordingly.
 *
 * @param forceFetchCards forces fetching the cards even though {@link shouldUpdateCards} initially
 * returns false. This is useful when we know that the new game data will move us to a state where
 * we should update the cards.
 */
export async function refreshGameData({ forceFetchCards = false } = {}) {
  const ID = store.get(atoms.gameID)
  const player = store.get(atoms.playerAddress)

  if (ID === null) {
    console.error("refreshGameData called with null ID")
    return
  }

  const shouldFetchCards = shouldUpdateCards() || forceFetchCards

  if (!shouldFetchCards) {
    void updateGameData(ID, player)
  } else {
    // We need the game data in order to update the cards in the store.
    const gameDataPromise = updateGameData(ID, player)
    const cardsPromise = fetchCards(ID, player)
    const gameData = await gameDataPromise
    const cards = await cardsPromise
    if (shouldUpdateCards()) {
      // Don't (re)assign if cards were fetched in the meantime or if the game isn't started yet.
      const decks = gameData.playerData.map(pdata => cards.slice(pdata.deckStart, pdata.deckEnd))
      store.set(atoms.gameCards, {gameID: ID, cards, decks})
      const timestamp = Date.now()
      console.log(`updated cards (at ${formatTimestamp(timestamp)})`)
    }
  }
}

// =================================================================================================
// STALENESS CHECKS

// -------------------------------------------------------------------------------------------------

/** Check whether the game ID, player, or game state (if defined) shifted underneath us. */
export function isStale(gameID: bigint, player: Address, gameData?: FetchedGameData): boolean {
  return store.get(atoms.gameID) !== gameID
    || store.get(atoms.playerAddress) !== player
    || (gameData !== undefined && store.get(atoms.gameData).lastBlockNum !== gameData.lastBlockNum)
}

// -------------------------------------------------------------------------------------------------

/**
 * This symbol is returned by {@link asyncWithGameContext} and {@link asyncWithGameStateContext}
 * when the state shifts underneath the asynchronous call.
 */
export const STALE = Symbol("STALE")

// -------------------------------------------------------------------------------------------------

/**
 * This function calls `fn`, asynchronously returning its result, but only if the current game ID
 * and player address haven't shifted underneath the call (which would mean we disconnected or
 * switched to a completely different game). Otherwise, it returns {@link STALE}.
 *
 * Unlike {@link asyncWithGameStateContext}, this function does not check if the game state itself
 * changed.
 */
export async function asyncWithGameContext<T>(fn: () => Promise<T>): Promise<T | typeof STALE> {
  const gameID = store.get(atoms.gameID)
  const player = store.get(atoms.playerAddress)

  const result = await fn()

  if (isStale(gameID, player))
    return STALE

  return result
}

// -------------------------------------------------------------------------------------------------

/**
 * This function calls `fn`, asynchronously returning its result, but only if the current game ID,
 * player address and last block number for the game (hence, the game data in general) info haven't
 * shifted underneath the call. Otherwise, it returns {@link STALE}.
 *
 * If you only want to check that the game & player didn't change, use {@link asyncWithGameContext}
 * instead.
 */
export async function asyncWithGameStateContext<T>(fn: () => Promise<T>): Promise<T | typeof STALE> {
  const gameID = store.get(atoms.gameID)
  const player = store.get(atoms.playerAddress)
  const gameData = store.get(atoms.gameData)

  const result = await fn()

  if (isStale(gameID, player, gameData))
    return STALE

  return result
}

// =================================================================================================