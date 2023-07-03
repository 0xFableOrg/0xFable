/**
 * Function to compute hashes and Merkle roots.
 *
 * @module utils/hash
 */

// I hate typescript package management bullshit.
// @ts-ignore
import { buildMimcSponge } from "circomlibjs"

// =================================================================================================
// HASH FUNCTIONS

const mimcSponge = await buildMimcSponge()

/**
 * The MiMCSponge hash function.
 */
export function mimcHash(inputs: readonly bigint[]): bigint {
  return mimcSponge.F.toObject(mimcSponge.multiHash(inputs))
}

// =================================================================================================
// CONSTANTS

/**
 * Value to fill an array that is smaller than the requested (power of two) size for Merkleizing
 * an array. The array may not contain this value otherwise Merkle roots are not unique!
 */
export const fillerValue = 255n

// =================================================================================================
// MERKLEIZATION

/**
 * Returns the MiMC-based Merkle root of `items`, after extending it to size `size` by filling it up
 * with `filler`. `size` must be a power of two.
 */
export function merkleize
    (size: number, items: readonly bigint[], filler: bigint = fillerValue)
    : bigint {

  if (size & (size - 1) || size == 0)
    throw new Error("size must be a power of 2")

  const extended = [...items]
  for (let i = items.length; i < size; i++)
    extended.push(filler)

  return _merkleize(extended)
}

// -------------------------------------------------------------------------------------------------

/**
 * Merkleize `items`, assuming its size is a power of 2.
 */
function _merkleize(items: readonly bigint[]): bigint {
  if (items.length === 1)
    return items[0]
  const half = items.length / 2
  return mimcHash([
    _merkleize(items.slice(0, half)),
    _merkleize(items.slice(half))
  ])
}

// =================================================================================================
