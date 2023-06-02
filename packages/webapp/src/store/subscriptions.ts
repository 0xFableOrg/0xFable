/**
 * Manages on-chain subscription that update the store.
 *
 * @module store/subscriptions
 */

// =================================================================================================

import { getDefaultStore } from "jotai"
import { watchContractEvent } from "wagmi/actions"
import { Log } from "viem"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { gameData, gameID, playerAddress } from "src/store"
import { refreshGameData } from "src/store/update"
import { format } from "src/utils/js-utils"

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
let currentlySubscribedID: bigint|null = null

/** List of function to call to unsubscribe from game updates. */
let unsubFunctions: (() => void)[] = []

// -------------------------------------------------------------------------------------------------

/**
 * Subscribe to all game events for the specified game ID. If the ID is null, unsubscribe from all
 * events we are currently subscribed to instead.
 */
export function subscribeToGame(ID: bigint|null) {

  // NOTE(norswap) we can't filter on ID with ethers, maybe with Viem?
  // If we could, this should be implemented as a logic that unsubscribe from the previous ID
  // and subscribe to the new one.

  if (ID === null) {
    // remove subscription
    unsubFunctions.forEach(unsub => unsub())
    unsubFunctions = []
    console.log(`unsubscribed from game events for game ID ${currentlySubscribedID}`)
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
      }, logs => gameEventListener(eventName, logs)))
    })
    console.log(`subscribed to game events for game ID ${ID}`)
  }
  else {
    // Changing game we are subscribed to — no need to change the subscription,
    // only the ID we filter on
    currentlySubscribedID = ID
  }
}

// =================================================================================================
// EVENT LISTENER

export type GameEventArgs = { gameID: bigint } & any
export type GameEventLog = { args: GameEventArgs } & Log

export function gameEventListener(name: string, logs: readonly GameEventLog[]) {
  if (logs.length > 1)
    // I'm not sure this can occur, hence the print statement.
    console.debug(`received ${logs.length} (> 1) ${name} events`)

  for (const log of logs)
    handleEvent(name, log.args)
}

// -------------------------------------------------------------------------------------------------

function handleEvent(name: string, args: GameEventArgs) {
  console.log(`event fired ${name}(${format(args)})`)

  const store = getDefaultStore()
  const ID = store.get(gameID)

  // Event is not for the game we're tracking, ignore.
  if (ID != args.gameID) return

  switch (name) {
    case 'CardDrawn': {
      const { _player } = args
      break
    } case 'CardPlayed': {
      const { _player, _card } = args
      break
    } case 'PlayerAttacked': {
      const { _attacking, _defending } = args
      break
    } case 'PlayerDefended': {
      const { _attacking, _defending } = args
      break
    } case 'PlayerPassed': {
      const { _player } = args
      break
    } case 'PlayerJoined': {
      const { _player } = args
      // Refetch game data to get up to date player list and update the status.

      // If the last player joined, we need to fetch the cards. This optimization allows us to fetch
      // the game data and the cards in parallel instead of waiting for the game data to indicate a
      // STARTED state to initiate fetching the cards.

      const forceFetchCards = store.get(gameData).playersLeftToJoin <= 1
      void refreshGameData({ forceFetchCards })
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