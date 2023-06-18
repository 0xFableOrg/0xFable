/**
 * Manages on-chain subscription that update the store.
 *
 * Currently, the subscription only trigger a refetch of the game state, from which the store is
 * updated. In the future, we might want to optimistically apply updates from events (optimistically
 * because even though events should be legitimate, we might have applied them on a stale game
 * state), to be reconciled after the data is refetched.
 *
 * @module store/subscriptions
 */

// =================================================================================================

import { Log } from "viem"
import { getPublicClient } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import * as store from "src/store/atoms"
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

  const publicClient = getPublicClient()
  const needsUnsub = currentlySubscribedID !== null && ID !== currentlySubscribedID
  const needsSub   = ID !== null && ID !== currentlySubscribedID

  if (needsUnsub) {
    // remove subscription
    unsubFunctions.forEach(unsub => unsub())
    unsubFunctions = []
    console.log(`unsubscribed from game events for game ID ${currentlySubscribedID}`)
    currentlySubscribedID = null
  }
  if (needsSub) {
    currentlySubscribedID = ID
    eventNames.forEach(eventName => {
      unsubFunctions.push(publicClient.watchContractEvent({
        address: deployment.Game,
        abi: gameABI,
        eventName: eventName as any,
        args: { gameID: ID },
        onLogs: logs => gameEventListener(eventName, logs)
      }))
    })
    console.log(`subscribed to game events for game ID ${ID}`)
  }
}

// =================================================================================================
// EVENT LISTENER

type GameEventArgs = { gameID: bigint } & any
type GameEventLog = { args: GameEventArgs } & Log

function gameEventListener(name: string, logs: readonly GameEventLog[]) {
  for (const log of logs)
    handleEvent(name, log.args)
}

// -------------------------------------------------------------------------------------------------

function handleEvent(name: string, args: GameEventArgs) {
  console.log(`event fired ${name}(${format(args)})`)

  const ID = store.get(store.gameID)

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

      const forceFetchCards = store.get(store.gameData).playersLeftToJoin <= 1
      void refreshGameData({ forceFetchCards })
      break
    }
    case 'GameStarted': {
      // No need to refetch game data, game started is triggered by a player joining, which
      // refreshes the game data.
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
      break
    }
  }
}

// =================================================================================================