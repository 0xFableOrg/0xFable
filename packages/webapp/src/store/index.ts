/**
 * The 0xFable store manages the game state and ensures that is update consistently.
 * It also manages subscriptions to the chain for keeping the state up to date.
 *
 * This is the top-level store module, the implementation also comprises:
 * - {@link module:store/private} for private primitive atoms
 * - {@link module:store/update} for managing updates and making sure the state is consistent
 * - {@link module:store/subscriptions} to manage on-chain subscriptions and updates
 *
 * @module store
 */

// =================================================================================================

import { atom } from "jotai"
import { GameStatus, type Address, type StaticGameData } from "src/types"
import { asyncWriteableAtom, readOnlyAtom, writeableAtom } from "src/utils/react-utils"
import { gameID_, playerAddress_, gameStatus_ } from "src/store/private"
import { getGameData_, setGameData_, setGameID_ } from "src/store/update"

// =================================================================================================
// GAME INFORMATION

/** Player address — the connected wallet address (enforced in logic.ts) */
export const playerAddress = readOnlyAtom<Address>(playerAddress_)

/** ID of the game the player is currently participating in (creating, joined, or playing) */
export const gameID = writeableAtom<BigInt>((get) => get(gameID_), setGameID_)

/** Static game data (excluding per-player information).  */
export const gameData = asyncWriteableAtom<StaticGameData>(getGameData_, setGameData_)

/** Current game status (CREATED, JOINED, STARTED, etc) */
export const gameStatus = readOnlyAtom<GameStatus>(gameStatus_)

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel  = 'playerAddress'
gameID.debugLabel         = 'gameID'
gameData.debugLabel       = 'gameData'
gameStatus.debugLabel     = 'gameStatus'

// =================================================================================================
// TODO UNUSED
// =================================================================================================
// Play Areas

export const playerHand      = atom<BigInt[]>([])
export const playerBoard     = atom<BigInt[]>([])
export const playerGraveyard = atom<BigInt[]>([])
export const enemyBoard      = atom<BigInt[]>([])
export const enemyGraveyard  = atom<BigInt[]>([])

playerHand      .debugLabel = 'playerHand'
playerBoard     .debugLabel = 'playerBoard'
playerGraveyard .debugLabel = 'playerGraveyard'
enemyBoard      .debugLabel = 'enemyBoard'
enemyGraveyard  .debugLabel = 'enemyGraveyard'

export const addToHand = atom(null, (get, set, card: BigInt) => {
  set(playerHand, [...get(playerHand), card])
})

export const addToBoard = atom(null, (get, set, card: BigInt) => {
  set(playerHand, get(playerHand).filter((c) => c !== card))
  set(playerBoard, [...get(playerBoard), card])
})

export const addToEnemyBoard = atom(null, (get, set, card: BigInt) => {
  set(enemyBoard, [...get(enemyBoard), card])
})

export const destroyOwnCard = atom(null, (get, set, card: BigInt) => {
  set(playerBoard, get(playerBoard).filter((c) => c !== card))
  set(playerGraveyard, [...get(playerGraveyard), card])
})

export const destroyEnemyCard = atom(null, (get, set, card: BigInt) => {
  set(enemyBoard, get(enemyBoard).filter((c) => c !== card))
  set(enemyGraveyard, [...get(enemyGraveyard), card])
})

// =================================================================================================