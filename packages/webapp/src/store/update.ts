/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================

import { getDefaultStore, type Getter } from "jotai"
import { chain } from "src/constants"
import { setup } from "src/setup"
import { formatTimestamp } from "src/utils/js-utils"
import { getAccount, readContract, watchAccount, watchNetwork, getNetwork } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { gameData, gameID, hasVisitedBoard, isGameCreator, isGameJoiner } from "src/store"
import { gameData_, gameStatus_, playerAddress_, } from "src/store/private"
import { subscribeToGame } from "src/store/subscriptions"
import { GameStatus, StaticGameData } from "src/types"
import { AccountResult, NetworkResult, parseBigInt } from "src/utils/rpc-utils"

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
  return network.chain && network.chain.id === chain.id
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
function setDependencies(ID: BigInt) {
  // This can happen when loading from local storage. Parse & reset the ID.
  // TODO change how the game ID is stored/parsed from local storage?
  if (typeof ID === "string") {
    store.set(gameID, parseBigInt(ID))
    return
  }

  console.log(`transitioning to game ID ${ID}`)

  // avoid using inconsistent data
  store.set(gameData_, null as StaticGameData)
  store.set(gameStatus_, GameStatus.UNKNOWN)
  store.set(hasVisitedBoard, false)

  // TODO reset per-player state here, when we start using it

  subscribeToGame(ID) // will unusubscribe if ID is null
  if (ID !== null) void refreshGameData()
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the stored game data. If it is not yet available, this will return null and trigger an
 * async refresh.
 */
export function getGameData_(get: Getter): StaticGameData {
  const current = get(gameData_)
  if (current === null && get(gameID) !== null)
    void refreshGameData()
  return current
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the stored game status. If it is not yet available, this will return null and trigger an
 * async refresh.
 */
export function getGameStatus_(get: Getter): GameStatus {
  const current = get(gameStatus_)
  if (current === null && get(gameID) !== null)
    void refreshGameData()
  return current
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the stored game data. If it is not yet available, this will trigger a refresh and
 * wait until the result is available to return.
 */
function setGameData_(data: StaticGameData) {
  if (data === null) {
    console.error("setGameData_ called with null data")
    return
  }

  const ID = data.gameID
  const storeID = store.get(gameID)
  // The game ID changed underneath this update, ignore it.
  if (ID !== storeID) {
    console.log(`Rejected stale data with game ID ${ID} (current game ID is ${storeID})`)
    return
  }

  store.set(gameData_, data)

  // NOTE(norswap): We do not (yet?) handle replaying games.
  //   Replaying games need to be event-based in any case, so there needs to be an abstraction
  //   layer that allows for fetching either from the chain or from an indexer.
  //   Another problem with this is that we can't get the intermediate game data from events.
  //   (We could reconstruct it though, or make sure we can.)
  //   This could be a good use-case for MUDv2?
  //   This does not solve the problem that player hands are private, and only with their
  //   collaboration can we reconstruct a replay where their hands is visible.

  if (data.playersLeftToJoin == 0) {
    if (data.livePlayers.length <= 1)
      store.set(gameStatus_, GameStatus.ENDED)
    else
      store.set(gameStatus_, GameStatus.STARTED)
  } else if (data.players.includes(store.get(playerAddress_))) {
    store.set(gameStatus_, GameStatus.JOINED)
  } else {
    store.set(gameStatus_, GameStatus.CREATED)
  }

  if(!store.get(isGameCreator) && !store.get(isGameJoiner)) {
    console.warn(`Tracking a game (${store.get(gameID)}) we are not participating in, resetting to null.`)
    store.set(gameID, null)
  }

  // TODO parse data and ensure that the store is consistent with it
}

// =================================================================================================

// Used to throttle refreshes: at most one refresh can be requested in flight, unless two seconds
// elapse. After a refresh lands, another one become spossible immediately.
const refreshThrottle = 2000
let lastRequestTimestamp = 0

// Used to avoid "zombie" refreshes: old refreshes overwriting newer game data.
let sequenceNumber = 1
let lastCompletedNumber = 0

/**
 * Triggers a manual refresh of the game data, setting the {@link gameData} atom.
 * If the game ID changes the while the refresh is in flight, the refresh is ignored.
 *
 * TODO: implement a sequence number so that we can ignore stale refreshes.
 */
export async function refreshGameData() {
  const ID = store.get(gameID)
  if (ID === null) {
    console.error("refreshGameData called with null ID")
    return
  }

  const seqNum = sequenceNumber++
  const timestamp = Date.now()
  if (timestamp - lastRequestTimestamp < refreshThrottle)
    return // there is a recent-ish refresh in flight
  lastRequestTimestamp = timestamp

  const fetched = await readContract({
    address: deployment.Game,
    abi: gameABI,
    functionName: "staticGameData",
    args: [ID.valueOf()] // TODO can we store the primitive type directly?
  })

  // TODO is this step still needed?
  const gameData: StaticGameData = {
    gameID: fetched.gameID,
    gameCreator: fetched.gameCreator,
    players: fetched.players,
    lastBlockNum: fetched.lastBlockNum,
    playersLeftToJoin: fetched.playersLeftToJoin,
    livePlayers: fetched.livePlayers,
    currentPlayer: fetched.currentPlayer,
    currentStep: fetched.currentStep,
    attackingPlayer: fetched.attackingPlayer
  }

  if (seqNum < lastCompletedNumber) return // ignore zombie refresh
  lastCompletedNumber = seqNum

  console.groupCollapsed(`fetched data (at ${formatTimestamp(timestamp)})`)
  console.dir(gameData)
  console.groupEnd()

  // Allow another refresh immediately.
  lastRequestTimestamp = 0

  // This will check that the game data's game ID is consistent with the game ID in the store.
  setGameData_(gameData)
}

// =================================================================================================