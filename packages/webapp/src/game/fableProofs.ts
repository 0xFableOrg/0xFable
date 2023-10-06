/**
 * Logic useful for zero-knowledge proof, specific to 0xFable.
 *
 * See {@link module:utils/proofs} for more generic ZK logic.
 *
 * @module game/fableProofs
 */

import { packBytes } from "src/utils/zkproofs/proofs"
import { FELT_SIZE, NUM_FELTS_FOR_CARDS } from "src/game/constants"

// =================================================================================================

/**
 * Calls {@link packBytes}, where each byte represent a index in the game data's `cards` array.
 * Fills in the parameters specific to our ZK scheme and to this encoding.
 */
export function packCards(cards: Uint8Array): bigint[] {
  return packBytes(cards, NUM_FELTS_FOR_CARDS, FELT_SIZE)
}

// =================================================================================================