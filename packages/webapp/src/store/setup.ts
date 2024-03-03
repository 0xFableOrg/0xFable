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
import { gameIDListener, refreshGameData, updateNetwork, updatePlayerAddress } from "src/store/update"
import { GAME_DATA_REFRESH_INTERVAL } from "src/constants"

// =================================================================================================

function setupStore() {
    if (typeof window === "undefined")
        // Do not set up subscriptions and timers on the server.
        return

    // Whenever the connected wallet address changes, update the player address.
    watchAccount(updatePlayerAddress)

    // Make sure to clear game data if we switch to an unsupported network.
    watchNetwork(updateNetwork)

    // Make sure we don't miss the initial value, if already set.
    updatePlayerAddress(getAccount())

    // Update / clear game data whenever the game ID changes.
    store.store.sub(store.gameID, () => {
        gameIDListener(store.get(store.gameID))
    })

    // Make sure we don't miss the initial value, if already set.
    const gameID = store.get(store.gameID)
    if (gameID !== null) gameIDListener(gameID)

    // Periodically refresh game data.
    setInterval(() => {
        const gameID = store.get(store.gameID)
        const player = store.get(store.playerAddress)
        if (gameID !== null && player !== null) void refreshGameData()
    }, GAME_DATA_REFRESH_INTERVAL)
}

// =================================================================================================

setupStore()

// =================================================================================================
