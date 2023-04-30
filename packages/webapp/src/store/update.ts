/**
 * Manages updates to the state so that the whole state is always consistent.
 *
 * @module store/update
 */

// =================================================================================================

import { BigNumber } from "ethers"
import { getDefaultStore, type Getter, type Setter } from "jotai"
import { getAccount, readContract, watchAccount } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { gameData } from "src/store"
import { gameData_, gameID_, gameStatus_, playerAddress_ } from "src/store/private"
import { subscribeToGame } from "src/store/subscriptions"
import { GameStatus, StaticGameData } from "src/types"
import { AccountResult } from "src/utils/rpc-utils"

// =================================================================================================
// INITIALIZATION

// The frontend can only handle one game at a time, for which we use the default store.
const store = getDefaultStore()

// Whenever the connect wallet address changes, update the player address.
watchAccount(updatePlayerAddress)
// Make sure we don't miss the initial value, if already set.
updatePlayerAddress(getAccount())

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
 * Called whenever the game ID is updated. Besides setting the ID, this always makes sure we're
 * subscribed to the game updates. Because it is possible to miss events in that way, also triggers
 * a manual refresh of the game data. Also clears the game data i
 */
export function setGameID_(get: Getter, set: Setter, ID: BigInt) {
  const lastID = get(gameID_)
  if (ID === lastID) return

  // NOTE(norswap): no race conditions — after setting the gameID, any refresh will use that ID
  set(gameID_, ID)
  set(gameData_, null as StaticGameData) // avoid using inconsistent data
  set(gameStatus_, GameStatus.UNKNOWN) // avoid using inconsistent data
  // NOTE(norswap) reset per-player state here, when we start using it
  subscribeToGame(ID) // will unusubscribe if ID is null
  if (ID !== null) void refreshGameData()
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the stored game data. If it is not yet available, this will trigger a refresh and
 * wait until the result is available to return.
 */
export async function getGameData_(get: Getter): Promise<StaticGameData> {
  // TODO this needs suspense support - or better, simply don't await & handle updates in react!
  const current = get(gameData_)
  if (current != null) return current
  await refreshGameData()
  return get(gameData_)
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

  // TODO manage game ending gracefully
  // TODO manage relationship between game data and game ID

  if (data == null) {
    set(gameStatus_, GameStatus.UNKNOWN)
    // NOTE(norswap) clear game state here, when we start using it
    return
  }

  if (data.playersLeftToJoin == 0) {
    set(gameStatus_, GameStatus.STARTED)
  } else if (data.players.includes(get(playerAddress_))) {
    set(gameStatus_, GameStatus.JOINED)
  } else {
    set(gameStatus_, GameStatus.CREATED)
  }

  // TODO parse data and ensure that the store is consistent with it
}

// =================================================================================================

/**
 * Triggers a manual refresh of the game data, setting the {@link gameData} atom.
 */
export async function refreshGameData() {
  const ID = store.get(gameID_)
  if (ID == null) return
  const fetchedGameData = await readContract({
    address: deployment.Game,
    abi: gameABI,
    functionName: "staticGameData",
    args: [BigNumber.from(ID)]
  })
  console.log("fetched data: " + JSON.stringify(fetchedGameData))
  store.set(gameData, fetchedGameData as StaticGameData)
}

// =================================================================================================