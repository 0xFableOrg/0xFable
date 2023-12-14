/**
 * This package contains all the Jotai atoms that comprises our store.
 *
 * Do *NOT* use these atoms directly from React, instead use the hooks in {@link
 * module:store/hooks}, and the actions in {@link module:store/actions}.
 *
 * @module store/atoms
 */

import { atom, getDefaultStore } from "jotai"
import { Address } from "src/chain"
import { atomWithStorage } from "jotai/utils"
import type { ErrorConfig, FetchedGameData, PlayerData, PrivateInfoStore } from "src/store/types"
import { getGameStatus } from "src/game/status"
import { getOpponentAddress, getPlayerData } from "src/store/read"

// =================================================================================================
// STORE

/** The Jotai store instance that has all our atoms. */
export const store = getDefaultStore()

export const set = store.set
export const get = store.get

// =================================================================================================
// READ/WRITE ATOMS

/** Player address — the connected wallet address. */
export const playerAddress = atom(null as Address|null)

// NOTE: This isn't atom<Address|null>(null) because that selects the WriteableAtom overload.
// The same applies to the other atoms below.

// -------------------------------------------------------------------------------------------------

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 */
export const gameID = atom(null as bigint|null)

// -------------------------------------------------------------------------------------------------

/** The current state of the game. */
export const gameData = atom(null as FetchedGameData|null)

// -------------------------------------------------------------------------------------------------

/**
 * Whether the user visited the game board for the current game.
 * This useful for managing state transitions in the game creation and joining flow.
 */
export const hasVisitedBoard = atom(false)

// -------------------------------------------------------------------------------------------------

// TODO prune this when games are completed (and later, enable deep pruning of old games)

/**
 * Store {@link PrivateInfo} in local storage, keyed by gameID (stringified) and player.
 *
 * This information cannot be derived from on-chain data, it's therefore important to persist it
 * to browser storage in order to survive page reloads.
 */
export const privateInfoStore = atomWithStorage(
  "0xFable::privateInfoStore",
  {} as PrivateInfoStore,
  undefined,
  // Necessary, otherwise the storage only gets read when the atom is mounted in React.
  { unstable_getOnInit: true })

// Without this, Jotai does not seem to pickup in updates from other tabs.
store.sub(privateInfoStore, () => {})

// -------------------------------------------------------------------------------------------------

/** If non-null, an error modal will be displayed with the given configuration. */
export const errorConfig = atom(null as ErrorConfig|null)

// =================================================================================================
// DERIVED ATOMS

// -------------------------------------------------------------------------------------------------

/** The current game status (CREATED, JOINED, STARTED, etc). */
export const gameStatus = atom((get) => getGameStatus(get(gameData), get(playerAddress)))

// -------------------------------------------------------------------------------------------------

/**
 * True if all players have joined the game (they may not have drawn hands yet), at which point the
 * game creator can no longer cancel the game.
 */
export const allPlayersJoined = atom<boolean>((get) => get(gameData)?.playersLeftToJoin === 0)

// -------------------------------------------------------------------------------------------------

/** True if we have created the current game. */
export const isGameCreator = atom<boolean>((get) => {
  const address = get(playerAddress)
  return address != null && address === get(gameData)?.gameCreator
})

// -------------------------------------------------------------------------------------------------

/** True if we have have joined BUT are not the creator of the current game. */
export const isGameJoiner = atom<boolean>((get) => {
  const address = get(playerAddress)
  return !!(address != null && !get(isGameCreator) && get(gameData)?.players?.includes(address))
})

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the local player, or null if the player is not set, game
 * data is missing, or the player is not in the game.
 */
export const playerData = atom<PlayerData|null>((get) => {
  const address = get(playerAddress)
  if (address == null) return null
  const gdata = get(gameData)
  return getPlayerData(gdata, address)
})

// -------------------------------------------------------------------------------------------------

/** Returns the address of the opponent (assumes a two-player game). */
export const opponentAddress = atom<Address|null>((get) => {
  const gdata = get(gameData)
  const localPlayer = get(playerAddress)
  return getOpponentAddress(gdata, localPlayer)
})

// -------------------------------------------------------------------------------------------------

/**
 * Returns the {@link PlayerData} for the opponent (assumes a two-player game). Returns null if the
 * local player is not set, game data is missing, or the local player is not in the game.
 */
export const opponentData = atom<PlayerData|null>((get) => {
  const gdata = get(gameData)
  const localPlayer = get(playerAddress)
  return getPlayerData(gdata, localPlayer)
})

// -------------------------------------------------------------------------------------------------

/** The cards currently in the game. */
export const cards = atom<readonly bigint[]|null>((get) => {
  return get(gameData)?.cards ?? null
})

// -------------------------------------------------------------------------------------------------

let playerHandCache: readonly bigint[]|null = null

/** Returns the local player's hand, or null if data is missing. */
export const playerHand = atom<readonly bigint[]|null>((get) => {
  const gdata = get(gameData)
  const privStore = get(privateInfoStore)
  const id = get(gameID)
  const address = get(playerAddress)
  if (gdata === null || id === null || address === null) return null
  const handIndexes = privStore[id.toString()]?.[address]?.handIndexes
  if (handIndexes === undefined) return null
  const handSize = handIndexes.indexOf(255)

  const hand = handIndexes
    .slice(0, handSize < 0 ? handIndexes.length : handSize)
    .map((index) => gdata.cards[index])

  // We cache the hand, so that not any old change in the game data / private store causes a new
  // object to be allowed and the component to re-render.
  if (playerHandCache === null || !hand.every((card, i) => card === playerHandCache![i]))
    return playerHandCache = hand
  else
    return playerHandCache
})

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel    = "playerAddress"
gameID.debugLabel           = "gameID"
gameData.debugLabel         = "gameData"
hasVisitedBoard.debugLabel  = "hasVisitedBoard"
gameStatus.debugLabel       = "gameStatus"
privateInfoStore.debugLabel = "privateInfoStore"
errorConfig.debugLabel      = "errorConfig"
gameStatus.debugLabel       = "gameStatus"
allPlayersJoined.debugLabel = "allPlayersJoined"
isGameCreator.debugLabel    = "isGameCreator"
isGameJoiner.debugLabel     = "isGameJoiner"
playerData.debugLabel       = "playerData"
opponentAddress.debugLabel  = "opponentAddress"
opponentData.debugLabel     = "opponentData"
cards.debugLabel            = "cards"
playerHand.debugLabel       = "playerHand"

// =================================================================================================