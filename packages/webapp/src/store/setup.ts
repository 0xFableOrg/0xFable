/**
 * Sets up the store as a side-effect of module initialization.
 *
 * Similar to `src/setup`, but can't be called from there because of a cyclical dependency (loading
 * storage-loaded atoms needs a JSON parsing hook to be setup).
 *
 * @module store/setup
 */

import { getAccount, watchAccount, watchNetwork } from "wagmi/actions"

import * as store from "src/store/atoms"
import { gameIDListener, updateNetwork, updatePlayerAddress } from "src/store/update"

// =================================================================================================

export function setupStore() {

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

setupStore()

// =================================================================================================