/**
 * Actions that can modify the store.
 *
 * @module store/actions
 */

import { Address } from "src/chain"
import * as store from "src/store/atoms"
import { ErrorConfig, FetchedGameData, PrivateInfo } from "src/store/types"
import { randomUint256 } from "src/utils/js-utils"

import "src/utils/extensions"
import { mimcHash } from "src/utils/hashing"

const get = store.get
const set = store.set

// =================================================================================================
// SET GAME ID

/** Sets the game ID in the store. */
export function setGameID(gameID: bigint) {
  set(store.gameID, gameID)
}

// =================================================================================================
// WAIT FOR UPDATE

/**
 * Wait for the game data to be updated to the given block number (or beyond), resolving to the game
 * data. If the game is set to null at any point (indicating some kind of reset in the game state),
 * or if the timeout is reached, the promise resolves to null instead.
 *
 * Note that some operations (e.g. `drawInitialHand`) do not update the `lastBlockNum` field of the
 * game data and as such `waitForUpdate` is not suitable for use with these operations.
 */
export async function waitForUpdate(blockNum: bigint, timeout: number = 15)
    : Promise<FetchedGameData|null> {

  return new Promise<FetchedGameData|null>((resolve, _reject) => {

    const unsubAndResolve = (result: FetchedGameData|null) => {
      unsub()
      resolve(result)
    }

    // Subscribe to the game data, resolve when receiving a state that satisfies blockNum req.
    const unsub = store.store.sub(store.gameData, () => {
      const gameData = store.get(store.gameData)
      if (gameData === null || gameData.lastBlockNum >= blockNum)
        unsubAndResolve(gameData)
    })

    // Maybe the game data is already up to date.
    const gameData = store.get(store.gameData)
    if (gameData !== null && gameData.lastBlockNum >= blockNum)
      return unsubAndResolve(gameData)

    // Initiate timeout.
    setTimeout(() => unsubAndResolve(null), timeout * 1000)
  })
}

// =================================================================================================
// TRIGGER/CLEAR ERROR

/** Triggers the display a global UI error, or clears the error if `null` is passed. */
export function setError(error: ErrorConfig|null) {
  console.log(`setting error modal: ${JSON.stringify(error)}`)
  set(store.errorConfig, error)
}

// =================================================================================================
// SET PRIVATE INFO

/**
 * Sets the private information specific to the given game and player in the preivate info store.
 */
export function setPrivateInfo(gameID: bigint, player: Address, privateInfo: PrivateInfo) {
  const privateInfoStore = get(store.privateInfoStore)
  const strID = gameID.toString()
  set(store.privateInfoStore, {
    ... privateInfoStore,
    [strID]: {
      ... privateInfoStore[strID],
      [player]: privateInfo
    }
  })
}

// =================================================================================================
// GET/INIT PRIVATE INFO

/**
 * Returns the private information specific to the given game and player, initializing it if
 * it doesn't exist yet. Meant to be called when joining a game.
 */
export function getOrInitPrivateInfo(gameID: bigint, playerAddress: Address): PrivateInfo {

  const privateInfoStore = store.get(store.privateInfoStore)
  let privateInfo = privateInfoStore[gameID.toString()]?.[playerAddress]

  if (privateInfo !== undefined)
    return privateInfo

  // The player's secret salt, necessary to hide information.
  const salt = randomUint256()

  privateInfo = {
    salt,
    saltHash: mimcHash([salt]),
    // dummy values
    hand: [],
    deck: [],
    handIndexes: new Uint8Array(0),
    deckIndexes: new Uint8Array(0),
    handRoot: `0x0`,
    deckRoot: `0x0`
  }

  setPrivateInfo(gameID, playerAddress, privateInfo)
  return privateInfo
}

// =================================================================================================