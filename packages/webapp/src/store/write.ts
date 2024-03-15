/**
 * Function to modify the store, either directly or after transforming the input data.
 *
 * @module store/write
 */

import { Address } from "src/chain"
import { PROOF_CURVE_ORDER } from "src/game/constants"
import * as store from "src/store/atoms"
import { ErrorConfig, PrivateInfo } from "src/store/types"
import { mimcHash } from "src/utils/hashing"
import { randomUint256 } from "src/utils/js-utils"

import "src/utils/extensions"

const get = store.get
const set = store.set

// =================================================================================================
// SIMPLE SETTERS

/**
 * Sets the game ID in the store.
 */
export function setGameID(gameID: bigint) {
    set(store.gameID, gameID)
}

// -------------------------------------------------------------------------------------------------

/**
 * Triggers the display a global UI error, or clears the error if `null` is passed.
 */
export function setError(error: ErrorConfig | null) {
    console.log(`setting error modal: ${JSON.stringify(error)}`)
    set(store.errorConfig, error)
}

// =================================================================================================
// DERIVED SETTERS

// -------------------------------------------------------------------------------------------------

/**
 * Sets the private information specific to the given game and player in the preivate info store.
 */
export function setPrivateInfo(gameID: bigint, player: Address, privateInfo: PrivateInfo) {
    const privateInfoStore = get(store.privateInfoStore)
    const strID = gameID.toString()
    set(store.privateInfoStore, {
        ...privateInfoStore,
        [strID]: {
            ...privateInfoStore[strID],
            [player]: privateInfo,
        },
    })
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the private information specific to the given game and player, initializing it if
 * it doesn't exist yet. Meant to be called when joining a game.
 */
export function getOrInitPrivateInfo(gameID: bigint, playerAddress: Address): PrivateInfo {
    const privateInfoStore = store.get(store.privateInfoStore)
    let privateInfo = privateInfoStore[gameID.toString()]?.[playerAddress]

    if (privateInfo !== undefined) return privateInfo

    // The player's secret salt, necessary to hide information.
    const salt = randomUint256() % PROOF_CURVE_ORDER

    privateInfo = {
        salt,
        saltHash: mimcHash([salt]),
        // dummy values
        handIndexes: [],
        deckIndexes: [],
        handRoot: `0x0`,
        deckRoot: `0x0`,
    }

    setPrivateInfo(gameID, playerAddress, privateInfo)
    return privateInfo
}

// =================================================================================================
