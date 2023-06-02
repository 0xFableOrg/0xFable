/**
 * Contains private atoms, which should not be accessed by frontend components, only by the store
 * update logic. Refer to the {@link module:store} module for information about the atoms.
 *
 * @module store/private
 */

// =================================================================================================

import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import type {
  GameCards,
  FetchedGameData,
  PlayerCardsStore
} from "src/types"
import { Address } from "src/chain"


// =================================================================================================
// PRIVATE ATOMS

/** cf. {@link playerAddress} */
export const playerAddress_ = atom(null as Address)

/** cf. {@link gameData} */
export const gameData_ = atom(null as FetchedGameData)

/** cf. {@link GameCards} */
export const gameCards_ = atom(null as GameCards)

/** cf. {@link PlayerCardsStore} */
export const playerCardsStore_ = atomWithStorage("0xFable::playerCards", {} as PlayerCardsStore)

/** cf. {@link randomness} (in store) */
export const randomness_ = atom(null as bigint)

// =================================================================================================
// DEBUG LABELS

playerAddress_.debugLabel     = 'playerAddress_'
gameData_.debugLabel          = 'gameData_'
gameCards_.debugLabel         = 'gameCards_'
playerCardsStore_.debugLabel  = 'playerCardsStore_'
randomness_.debugLabel        = 'randomness_'

// =================================================================================================