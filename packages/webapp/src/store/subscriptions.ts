/**
 * Manages on-chain subscription that update the store.
 *
 * @module store/subscriptions
 */

// =================================================================================================

import { getDefaultStore } from "jotai"
import { parseBigInt } from "src/utils/rpc-utils"
import { watchContractEvent } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { gameID, playerAddress } from "src/store"
import { gameStatus_ } from "src/store/private"
import { GameStatus } from "src/types"
import { refreshGameData } from "src/store/update"

// =================================================================================================
// SUBSCRIPTION MANAGEMENT

/** List of events we want to listen to. */
const eventNames = [
  'CardDrawn',
  'CardPlayed',
  'PlayerAttacked',
  'PlayerDefended',
  'PlayerPassed',
  'PlayerJoined',
  'GameStarted',
  'PlayerConceded',
  'Champion',
  'PlayerDefeated'
]

// -------------------------------------------------------------------------------------------------

/** ID of the game we are currently subscribed to, or null if we are not subscribed. */
let currentlySubscribedID: BigInt = null

/** List of function to call to unsubscribe from game updates. */
let unsubFunctions: (() => void)[] = []

// -------------------------------------------------------------------------------------------------

/**
 * Subscribe to all game events for the specified game ID. If the ID is null, unsubscribe from all
 * events we are currently subscribed to instead.
 */
export function subscribeToGame(ID: BigInt) {

  // NOTE(norswap) we can't filter on ID with ethers, maybe with Viem?
  // If we could, this should be implemented as a logic that unsubscribe from the previous ID
  // and subscribe to the new one.

  if (ID === null) {
    // remove subscription
    unsubFunctions.forEach(unsub => unsub())
    unsubFunctions = []
    currentlySubscribedID = null
  }
  else if (currentlySubscribedID === null) {
    currentlySubscribedID = ID
    // setup initial subscription
    eventNames.forEach(eventName => {
      unsubFunctions.push(watchContractEvent({
        address: deployment.Game,
        abi: gameABI,
        eventName: eventName as any
      }, (...args) => gameEventListener(eventName, args)))
    })
    console.log("subscribed to game events")
  }
  else {
    // Changing game we are subscribed to — no need to change the subscription,
    // only the ID we filter on
    currentlySubscribedID = ID
  }
}

// =================================================================================================
// EVENT LISTENER

export function gameEventListener(name: string, args: readonly any[]) {
  console.log(`event fired ${name}(${args})`)

  const store = getDefaultStore()
  const ID = store.get(gameID)
  const eventID = parseBigInt(args[0])

  // Event is not for the game we're tracking, ignore.
  if (ID != eventID) return

  switch (name) {
    case 'CardDrawn': {
      const [, player] = args
      break
    } case 'CardPlayed': {
      const [, player, card] = args
      break
    } case 'PlayerAttacked': {
      const [, attacking, defending] = args
      break
    } case 'PlayerDefended': {
      const [, attacking, defending] = args
      break
    } case 'PlayerPassed': {
      const [, player] = args
      break
    } case 'PlayerJoined': {
      const [, player] = args
      // Refetch game data to get up to date player list and update the status.
      void refreshGameData()
      break
    }
    case 'GameStarted': {
      // No need to refetch game data, game started is triggered by a player joining, which
      // refreshes the game data.
      // Also no need to set the game status, the game data refresh will do it.
      break
    }
    case 'PlayerConceded': {
      void refreshGameData()
      break
    }
    case 'PlayerDefeated': {
      void refreshGameData()
      break
    }
    case 'Champion': {
      // No need to refetch game data, a player winning is triggered by a player conceding or being
      // defeating, which refreshes the game data.
      // Also no need to set the game status, the game data refresh will do it.
      break
    }
  }
}

// =================================================================================================