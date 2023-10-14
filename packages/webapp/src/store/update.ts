/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================


import { getAccount, getNetwork, watchAccount, watchNetwork } from "wagmi/actions"

import { AccountResult, Address, chains, NetworkResult } from "src/chain"
import { subscribeToGame } from "src/store/subscriptions"
import * as store from "src/store/atoms"
import * as net from "src/store/network"
import { THROTTLED, ZOMBIE } from "src/utils/throttled-fetch"
import { formatTimestamp } from "src/utils/js-utils"
import { GameStatus } from "src/store/types"

// =================================================================================================
// INITIALIZATION

// Only run setup once.
let setupHasRun = false

/**
 * Called from {@link setup} to setup the store.
 */
export function setupStore() {
  if (setupHasRun) return
  setupHasRun = true

  // Whenever the connected wallet address changes, update the player address.
  watchAccount(updatePlayerAddress)

  // Make sure to clear game data if we switch to an unsupported network.
  watchNetwork(updateNetwork)

  // Make sure we don't miss the initial value, if already set.
  updatePlayerAddress(getAccount())

  // The game ID can change from actions in this tab, but also in other tabs, or can be retrieved
  // from the storage upon boot, so we need to listen to the storage.
  store.store.sub(store.gameID, () => {
    gameIDListener(store.get(store.gameID))
  })

  // Make sure we don't miss the initial value, if already set.
  const gameID = store.get(store.gameID)
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
  const oldAddress = store.get(store.playerAddress)
  const newAddress = result.status === 'disconnected' || !isNetworkValid()
    ? null
    : (result.address || null) // undefined --> null

  if (oldAddress !== newAddress) {
    console.log(`player address changed from ${oldAddress} to ${newAddress}`)
    store.set(store.playerAddress, newAddress)

    // TODO the below should go away if we stop saving the gameID in browser storage and just fetch
    //      the gameID a player is in instead

    // The check is important: on a page load when already connected, the address will transition
    // from null to the connected address, and we don't want to throw away the game ID.
    //
    // If the old address is null, there is also nothing to reset (excepted at load).
    if (oldAddress !== null)
      // New player means current game & game data is stale, reset it.
      store.set(store.gameID, null)
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
  if (result.chain === undefined)
    console.log("disconnected from network")
  else
    console.log(`network changed to chain with ID ${result.chain?.id}`)

  if (!isNetworkValid(result))
    store.set(store.gameID, null) // resets all game data

  // Update player address, setting it or clearing it depending on whether the network is supported.
  // Note the account listener won't fire by itself because the address (wagmi-level) didn't change,
  // but our invariant is that is that playerAddress === null if not connected to a supported chain.
  updatePlayerAddress(getAccount())
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
  store.set(store.gameData, null)
  store.set(store.cards, null)
  store.set(store.hasVisitedBoard, false)

  subscribeToGame(ID) // will unusubscribe if ID is null
  if (ID === null) return // no need to refresh data

  // We might be jumping into an in-progress game, so fetch cards.
  void refreshGameData()
}

// =================================================================================================
// REFRESH GAME DATA

// -------------------------------------------------------------------------------------------------

/**
 * Returns whether an update for the given gameID and player address is stale, i.e. if the current
 * store gameID and player address are different, meaning they change underneath the fetch and the
 * fetched data should be discarded.
 */
function isStaleVerbose(ID: bigint, player: Address): boolean {
  const storeID = store.get(store.gameID)
  const storePlayer = store.get(store.playerAddress)
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
 * Triggers a refresh of the game data, setting the {@link store.gameData} and {@link store.cards}
 * atoms. If the game ID or the player changes the while the refresh is in flight, the refresh is
 * ignored.
 *
 * If necessary, also fetches the cards.
 */
export async function refreshGameData() {
  const gameID = store.get(store.gameID)
  const player = store.get(store.playerAddress)
  const status = store.get(store.gameStatus)

  if (gameID === null) {
    console.error("refreshGameData called with null ID")
    return
  } else if (player === null) {
    console.error("refreshGameData called with null player")
    return
  }

  // Always fetch cards before game is started (easier). Don't fetch after, as they won't change,
  // but fetch is missing (e.g. browser refresh).
  const cards = store.get(store.cards)
  const shouldFetchCards = status < GameStatus.STARTED || cards === null

  const gameData = await net.fetchGameData(gameID, player, shouldFetchCards)

  if (gameData === ZOMBIE || gameData == THROTTLED || isStaleVerbose(gameID, player))
    // Either game changed (stale), or there should be a request in flight that will give us the
    // data (throttled), or we should have more recent data (zombie).
    return

  const oldGameData = store.get(store.gameData)
  if (oldGameData !== null && oldGameData.lastBlockNum >= gameData.lastBlockNum)
    // We already have more or as recent data, no need to trigger a store update.
    return oldGameData

  store.set(store.gameData, gameData)
  if (gameData.cards.length > 0)
    store.set(store.cards, gameData.cards)

  const timestamp = Date.now()
  console.groupCollapsed(
    "updated game data " +
    (shouldFetchCards ? "(including cards) " : "") +
    `(at ${formatTimestamp(timestamp)})`)
  console.dir(gameData)
  console.groupEnd()

  return gameData
}

// =================================================================================================