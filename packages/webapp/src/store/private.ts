/**
 * Contains private atoms, which should not be accessed by frontend components, only by the store
 * update logic. Refer to the {@link module:store} module for information about the atoms.
 *
 * @module store/private
 */

// =================================================================================================

import { atom } from "jotai"

import { Address, GameCards, FetchedGameData } from "src/types"

// =================================================================================================
// PRIVATE ATOMS

/** cf. {@link playerAddress} */
export const playerAddress_ = atom(null as Address)

/** cf. {@link gameData} */
export const gameData_ = atom(null as FetchedGameData)

/** TODO */
export const gameCards_ = atom(null as GameCards)

// =================================================================================================
// DEBUG LABELS

playerAddress_.debugLabel = 'playerAddress_'
gameData_.debugLabel      = 'gameData_'
gameCards_.debugLabel     = 'gameCards_'

// =================================================================================================