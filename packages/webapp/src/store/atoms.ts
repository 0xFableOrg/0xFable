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
import * as derive from "src/store/derive"
import type {
  ErrorConfig,
  FetchedGameData,
  PlayerData,
  PrivateInfo,
  PrivateInfoStore
} from "src/store/types"
import { GameStatus } from "src/store/types"

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

/**
 * Whether the user visited the game board for the current game.
 * This useful for managing state transitions in the game creation and joining flow.
 */
export const hasVisitedBoard = atom(false)

// -------------------------------------------------------------------------------------------------

/** If non-null, an error modal will be displayed with the given configuration. */
export const errorConfig = atom(null as ErrorConfig|null)

// =================================================================================================
// DERIVED ATOMS

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getGameStatus
 * @see module:store/hooks#useGameStatus
 */
export const gameStatus = atom<GameStatus>((get) => {
  return derive.getGameStatus(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useAllPlayersJoined
 */
export const allPlayersJoined = atom<boolean>((get) => {
  return derive.didAllPlayersJoin(get(gameData))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useIsGameCreator
 */
export const isGameCreator = atom<boolean>((get) => {
  return derive.isGameCreator(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useIsGameJoiner
 */
export const isGameJoiner = atom<boolean>((get) => {
  return derive.isGameJoiner(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getCards
 */
export const cards = atom<readonly bigint[]|null>((get) => {
  return derive.getCards(get(gameData))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getCurrentPlayerAddress
 * @see module:store/hooks#useCurrentPlayerAddress
 */
export const currentPlayerAddress = atom<Address|null>((get) => {
  return derive.getCurrentPlayerAddress(get(gameData))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getPlayerData
 * @see module:store/hooks#usePlayerData
 */
export const playerData = atom<PlayerData|null>((get) => {
  return derive.getPlayerData(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useOpponentAddress
 */
export const opponentAddress = atom<Address|null>((get) => {
  return derive.getOpponentAddress(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useOpponentData
 */
export const opponentData = atom<PlayerData|null>((get) => {
  return derive.getOpponentData(get(gameData), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#usePrivateInfo
 */
export const privateInfo = atom<PrivateInfo|null>((get) => {
  return derive.getPrivateInfo(get(gameID), get(playerAddress))
})

// -------------------------------------------------------------------------------------------------

let playerHandCache: readonly bigint[]|null = null

/**
 * @see module:store/hooks#usePlayerHand
 */
export const playerHand = atom<readonly bigint[]|null>((get) => {
  const hand = derive.getPlayerHand(get(gameData), get(privateInfo))

  // We cache the hand, so that not any change in the game data / private store causes a new
  // object to be allocated and the component to re-render.
  if (hand == null || playerHandCache === null
  || !hand.every((card, i) => card === playerHandCache![i]))
    return playerHandCache = hand
  else
    return playerHandCache
})

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel        = "playerAddress"
gameID.debugLabel               = "gameID"
gameData.debugLabel             = "gameData"
privateInfoStore.debugLabel     = "privateInfoStore"
hasVisitedBoard.debugLabel      = "hasVisitedBoard"
errorConfig.debugLabel          = "errorConfig"

gameStatus.debugLabel           = "gameStatus"
allPlayersJoined.debugLabel     = "allPlayersJoined"
isGameCreator.debugLabel        = "isGameCreator"
isGameJoiner.debugLabel         = "isGameJoiner"
cards.debugLabel                = "cards"
currentPlayerAddress.debugLabel = "currentPlayerAddress"
playerData.debugLabel           = "playerData"
opponentAddress.debugLabel      = "opponentAddress"
opponentData.debugLabel         = "opponentData"
privateInfo.debugLabel          = "privateInfo"
playerHand.debugLabel           = "playerHand"

// =================================================================================================