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

import _ from "lodash"
import { Log } from "viem"
import { getPublicClient } from "wagmi/actions"

import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import * as store from "src/store/atoms"
import { refreshGameData } from "src/store/update"
import { format } from "src/utils/js-utils"
import { setError } from "src/store/write"
import { DISMISS_BUTTON } from "src/actions/errors"

// =================================================================================================
// SUBSCRIPTION MANAGEMENT

// NOTE: If you put a non-existent event in the list below, it will generate spurious events,
// because good API design is a mysterious art I guess.

/** List of events we want to listen to. */
const eventNames = [
  "CardDrawn",
  "CardPlayed",
  "Champion",
  "GameCancelled",
  "GameStarted",
  "MissingPlayers",
  "PlayerAttacked",
  "PlayerConceded",
  "PlayerDefeated",
  "PlayerDrewHand",
  "PlayerDefended",
  "PlayerJoined",
  "PlayerTimedOut",
  "TurnEnded"
]

// -------------------------------------------------------------------------------------------------

/** ID of the game we are currently subscribed to, or null if we are not subscribed. */
let currentlySubscribedID: bigint|null = null

/** Function to call to unsubscribe from game updates. */
let unsubscribeEventListener: (() => void) | null = null

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
    if(unsubscribeEventListener){
      unsubscribeEventListener()
      unsubscribeEventListener = null;
    }
    console.log(`unsubscribed from game events for game ID ${currentlySubscribedID}`)
    currentlySubscribedID = null
  }
  if (needsSub) {
    currentlySubscribedID = ID

    const eventsABI = gameABI.filter((abi) => abi.type === "event" && eventNames.includes(abi.name));

    /**
     * Listen to all events in eventNames for the current game ID. 
     * All of these events must have an indexed gameID argument.
     * We must use watchEvent to be able to listen to multiple events at the same time.
     * Wagmi does not officially support listening to multiple events with an argument filter, 
     * and this might break in future updates.
     */
    unsubscribeEventListener = publicClient.watchEvent({
      address: deployment.Game,
      events: eventsABI,
      args: { gameID: ID },
      onLogs: logs => {
        Object.entries(_.groupBy(logs, (log:any) => log.eventName))
        .forEach(
          ([eventName, logs]:[string,any]) => {
            gameEventListener(eventName, logs)
          }
        )
      }
    })
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
  console.log(`event fired ${name}(${format(args, true)})`)

  const ID = store.get(store.gameID)

  // Event is not for the game we're tracking, ignore.
  if (ID != args.gameID) return

  switch (name) {
    case "CardDrawn": {
      const { _player } = args
      void refreshGameData()
      break
    } case "CardPlayed": {
      const { _player, _card } = args
      void refreshGameData()
      break
    } case "PlayerAttacked": {
      const { _attacking, _defending } = args
      break
    } case "PlayerDefended": {
      const { _attacking, _defending } = args
      break
    } case "PlayerPassed": {
      const { _player } = args
      break
    } case "PlayerJoined": {
      const { _player } = args
      // Refetch game data to get up to date player list and update the status.
      void refreshGameData()
      break
    }
    case "PlayerDrewHand": {
      void refreshGameData()
      break
    }
    case "GameStarted": {
      // No need to refetch game data, game started is triggered by a player drawing his hand, which
      // refreshes the game data.
      break
    }
    case "PlayerConceded": {
      void refreshGameData()
      break
    }
    case "PlayerDefeated": {
      void refreshGameData()
      break
    }
    case "PlayerTimedOut": {
      void refreshGameData()
      break
    }
    case "Champion": {
      // No need to refetch game data, a player winning is triggered by a player conceding, timing
      // out, or being defeated, which refreshes the game data.
      break
    }
    case "MissingPlayers": {
      // TODO: temporary message, need to do better flow handling for these scenarios
      // TODO: might also be good to close the createGame modal after this
      setError({
        title: "Missing players",
        message: "Some players didn't join within the time limit, " +
          "the game got cancelled as a result.",
        buttons: [DISMISS_BUTTON]
      })
      store.set(store.gameID, null) // clears game data
      break
    }
    case "GameCancelled": {
      void refreshGameData()
      break
    }
    case "TurnEnded": {
      void refreshGameData()
      break
    }
  }
}

// =================================================================================================