/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================

import { getDefaultStore } from "jotai"
import { getAccount, getNetwork, readContract, watchAccount, watchNetwork } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import {
  gameID,
  gameStatus,
  hasVisitedBoard,
  isGameCreator,
  isGameJoiner
} from "src/store"
import { gameCards_, gameData_, playerAddress_, randomness_ } from "src/store/private"
import { subscribeToGame } from "src/store/subscriptions"
import { GameStatus, type FetchedGameData, currentPlayerAddress, getGameStatus } from "src/types"
import { AccountResult, chains, NetworkResult } from "src/chain"
import { formatTimestamp } from "src/utils/js-utils"

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
  store.sub(gameID, () => {
    setDependencies(store.get(gameID))
  })

  // Make sure we don't miss the initial value, if already set.
  if (store.get(gameID) !== null)
    setDependencies(store.get(gameID))
}

// =================================================================================================
// CONSISTENT UPDATES

/**
 * Called whenever the connected wallet address changes. Makes sure to clear the address if the
 * wallet is disconnected, as well as the game data.
 */
function updatePlayerAddress(result: AccountResult) {
  // normalize undefined to null
  const oldAddress = store.get(playerAddress_) || null
  const newAddress = result.status === 'disconnected' ? null : (result.address || null)

  if (oldAddress !== newAddress && isNetworkValid()) {
    console.log(`player address changed from ${oldAddress} to ${newAddress}`)
    store.set(playerAddress_, newAddress)

    // TODO temporary hack: don't reset the game data on hard page refresh, because the player address will transition from null to the connected address
    if (oldAddress !== null)
      store.set(gameID, null) // resets all game data
  }
}

// -------------------------------------------------------------------------------------------------

/** Returns true if the network we are connected to is the one we support ({@link chain}). */
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
    store.set(gameID, null) // resets all game data
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
function setDependencies(ID: bigint|null) {
  console.log(`transitioning to game ID ${ID}`)

  // avoid using inconsistent data
  store.set(gameData_, null as FetchedGameData)
  store.set(hasVisitedBoard, false)

  // TODO reset per-player state here, when we start using it

  subscribeToGame(ID) // will unusubscribe if ID is null
  if (ID !== null)
    // We might be jumping into an in-progress game, so fetch cards.
    void refreshGameData({ forceFetchCards: true })
}

// =================================================================================================

// Used to throttle refreshes: at most one refresh can be requested in flight, unless two seconds
// elapse. After a refresh lands, another one become spossible immediately.
const refreshThrottle = 2000
let lastRequestTimestamp = 0

// Used to avoid "zombie" refreshes: old refreshes overwriting newer game data.
let sequenceNumber = 1
let lastCompletedNumber = 0

/** If the game has started and we don't have the cards yet, we need to fetch them. */
function shouldUpdateCards(): boolean {
  return store.get(gameStatus) >= GameStatus.STARTED && store.get(gameCards_) === null
}

/**
 * Triggers a manual refresh of the game data, setting the {@link gameData} atom.
 * If the game ID changes the while the refresh is in flight, the refresh is ignored.
 *
 * @param forceFetchCards forces fetching the cards even though {@link shouldUpdateCards} initially
 * returns false. This is useful when we know that the new game data will move us to a state where
 * we should update the cards. We still check if the update is necessary anyhow.
 */
export async function refreshGameData({ forceFetchCards = false } = {}) {
  const ID = store.get(gameID)
  const player = store.get(playerAddress_)

  if (ID === null) {
    console.error("refreshGameData called with null ID")
    return
  }

  // === Throttle ===

  const seqNum = sequenceNumber++
  const timestamp = Date.now()
  if (timestamp - lastRequestTimestamp < refreshThrottle)
    return // there is a recent-ish refresh in flight
  lastRequestTimestamp = timestamp

  // === Fetch ===

  const gameDataPromise = readContract({
    address: deployment.Game,
    abi: gameABI,
    functionName: "fetchGameData",
    args: [ID]
  })

  let gameCardsPromise: Promise<readonly bigint[]> = null

  // If the game has started and we haven't got the cards yet, fetch them.
  if (forceFetchCards || shouldUpdateCards()) {
    gameCardsPromise = readContract({
      address: deployment.Game,
      abi: gameABI,
      functionName: "getCards",
      args: [ID]
    })
  }

  // Await after firing all calls
  const gameData = await gameDataPromise
  const gameCards = await gameCardsPromise

  // === Stale Update Filtering ===

  if (seqNum < lastCompletedNumber) return // ignore zombie refresh
  lastCompletedNumber = seqNum

  const storeID = store.get(gameID)
  const storePlayer = store.get(playerAddress_)
  const stale = ID !== storeID || player !== storePlayer
  if (stale) {
    // The game ID changed underneath this update, ignore it.
    console.log(`Rejected stale data with game ID ${ID} (current game ID is ${storeID})`)
    return
  }

  // === Log Updates (1/2) ===

  console.groupCollapsed(`fetched data (at ${formatTimestamp(timestamp)})`)
  console.dir(gameData)
  console.groupEnd()

  // Allow another refresh immediately.
  lastRequestTimestamp = 0

  // === Update Store ===

  // TODO only update if things changed?

  store.set(gameData_, gameData)
  const updateCards = shouldUpdateCards()

  if (gameCards && updateCards) {
    const decks = gameData.playerData.map(pdata =>
      gameCards.slice(pdata.deckStart, pdata.deckEnd))
    store.set(gameCards_, {
      gameID: ID,
      cards: gameCards,
      decks: decks
    })
  }

  // === Log Updates (2/2) ===

  if (gameCards && updateCards) console.log("fetched game cards")
  console.groupEnd()

  // === Sanity Check ===
  // NOTE: We don't yet support spectating games.

  if(!store.get(isGameCreator) && !store.get(isGameJoiner)) {
    console.warn(`Tracking a game (${store.get(gameID)}) we are not participating in.`)
    // NOTE(norswap): hunting an heisenbug that I've seen happen after creating a game
    console.log("address", store.get(playerAddress_))
    console.log("creator", store.get(gameData_)?.gameCreator)
  }

  // === Fetch Randomness ===

  // TODO

  // The current player is not us, no need to fetch randomness.
  if (player !== currentPlayerAddress(gameData))
    return

  // The randomness is meaningless before the game starts.
  // This should be covered by the player check, but let's be safe.
  if (getGameStatus(gameData, player) < GameStatus.STARTED)
    return


  // TODO maybe we already have the randomness?
  //      e.g. gamedata did not change (should be tackled upstream)
  //      or data changed, but player and lastBlockNum did not (I think impossible rn but should handle to be future-proof)

  // Randomness is needed, but we do not have it yet. The previous value is incorrect, erase it.
  store.set(randomness_, null)

  const randomness = readContract({
    address: deployment.Game,
    abi: gameABI,
    functionName: "getRandomness",
    args: [gameData.lastBlockNum]
  })

  const randomNum = BigInt(await randomness)

  // TODO stale filtering: ID, player, lastBlockNum

  console.log("fetched randomness: ", randomNum)
  store.set(randomness_, randomNum)
}

// =================================================================================================