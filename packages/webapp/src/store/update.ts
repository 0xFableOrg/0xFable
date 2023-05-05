/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================

import { BigNumber } from "ethers"
import { getDefaultStore, type Getter, type Setter } from "jotai"
import { setup } from "src/setup"
import { getAccount, readContract, watchAccount } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { gameData, gameID, hasVisitedBoard } from "src/store"
import { gameData_, gameStatus_, playerAddress_, } from "src/store/private"
import { subscribeToGame } from "src/store/subscriptions"
import { GameStatus, StaticGameData } from "src/types"
import { AccountResult, parseBigInt } from "src/utils/rpc-utils"

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
 * wallet is disconnected, and to trigger the necessary updates if it changed.
 */
function updatePlayerAddress(result: AccountResult) {
  const oldAddress = store.get(playerAddress_)
  if (result.status === 'disconnected') {
    if (oldAddress != null) store.set(playerAddress_, null)
  }
  else if (store.get(playerAddress_) !== result.address) {
    store.set(playerAddress_, result.address)
  }
}

// -------------------------------------------------------------------------------------------------


/**
 * Called whenever the game ID is updated. This clears the old game data (to avoid inconsistent
 * states),  triggers a refresh of the game data, and makes sure we're subscribed to game updates.
 */
function setDependencies(ID: BigInt) {
  console.log("setting dependencies for ", ID)
  // No race conditions — after setting the gameID, any refresh will use that ID.

  // This will only be called when the ID changes in Jotai, so the new ID will always be different
  // from the old ID.

  // TODO: need to add ID into static game data, and check consistency when in-flight refreshes land

  // avoid using inconsistent data
  store.set(gameData_, null as StaticGameData)
  store.set(gameStatus_, GameStatus.UNKNOWN)
  store.set(hasVisitedBoard, false)

  // NOTE(norswap) reset per-player state here, when we start using it

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
export function setGameData_(get: Getter, set: Setter, data: StaticGameData) {
  set(gameData_, data)

  // NOTE(norswap): We do not (yet?) handle replaying games.
  //   Replaying games need to be event-based in any case, so there needs to be an abstraction
  //   layer that allows for fetching either from the chain or from an indexer.
  //   Another problem with this is that we can't get the intermediate game data from events.
  //   (We could reconstruct it though, or make sure we can.)
  //   This could be a good use-case for MUDv2?
  //   This does not solve the problem that player hands are private, and only with their
  //   collaboration can we reconstruct a replay where their hands is visible.

  // TODO manage relationship between game data and game ID

  if (data == null) {
    set(gameStatus_, GameStatus.UNKNOWN)
    // NOTE(norswap) clear game state here, when we start using it
    return
  }

  if (data.playersLeftToJoin == 0) {
    // TODO remove this guard when contracts are updated
    if (data.livePlayers && data.livePlayers.length <= 1)
      set(gameStatus_, GameStatus.ENDED)
    else
      set(gameStatus_, GameStatus.STARTED)
  } else if (data.players.includes(get(playerAddress_))) {
    set(gameStatus_, GameStatus.JOINED)
  } else {
    set(gameStatus_, GameStatus.CREATED)
  }

  // TODO parse data and ensure that the store is consistent with it
}

// =================================================================================================

let lastRefreshTimestamp = 0

/**
 * Triggers a manual refresh of the game data, setting the {@link gameData} atom.
 */
export async function refreshGameData() {
  const ID = store.get(gameID)
  if (ID === null) {
    console.error("refreshGameData called with null ID")
    return
  }
  const timestamp = Date.now()
  if (timestamp - lastRefreshTimestamp < 2000) return // there is a recent-ish refresh in flight
  lastRefreshTimestamp = timestamp

  if (ID == null) return
  const fetchedGameData = await readContract({
    address: deployment.Game,
    abi: gameABI,
    functionName: "staticGameData",
    args: [BigNumber.from(ID)]
  })
  console.log("fetched data: " + JSON.stringify(fetchedGameData))
  store.set(gameData, fetchedGameData as StaticGameData)
  lastRefreshTimestamp = 0 // allow another refresh immediately
}

// =================================================================================================