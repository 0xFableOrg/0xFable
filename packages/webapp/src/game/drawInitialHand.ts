/**
 * Logic for drawing the initial player hand, cf. {@link drawInitialHand}.
 *
 * @module game/drawInitialHand
 */

import { Hash } from "src/chain"
import { mimcHash } from "src/utils/hashing"
import { PrivateInfo } from "src/store/types"
import { INITIAL_HAND_SIZE, MAX_DECK_SIZE, MAX_HAND_SIZE } from "src/game/constants"
import { bigintToHexString, parseBigInt } from "src/utils/js-utils"

// =================================================================================================

/**
 * Given a deck listing, its starting index within the array of all cards in the game, the player's
 * salt, and the public randomness, computes the initial hand for the player and updates the deck.
 *
 * Returns a structure containing the new hand, the updated deck, and the new deck and hand roots,
 * suitable for updating the player's private info.
 */
export function drawInitialHand
    (deck: bigint[], deckStartIndex: number, salt: bigint, publicRandomness: bigint)
    : Omit<PrivateInfo, "salt" | "saltHash"> {

  const randomness = mimcHash([salt, publicRandomness])

  // draw cards and update deck
  const hand = []
  const deckIndexes = new Uint8Array(MAX_DECK_SIZE)
  const handIndexes = new Uint8Array(MAX_HAND_SIZE)

  for (let i = 0; i < deck.length; i++)
    deckIndexes[i] = deckStartIndex + i
  for (let i = deck.length; i < deckIndexes.length; i++)
    deckIndexes[i] = 255
  handIndexes.fill(255)

  for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
    const cardIndex = Number(randomness % BigInt(deck.length))
    hand.push(deck[cardIndex])
    handIndexes[i] = deckIndexes[cardIndex]
    deck[cardIndex] = deck[deck.length - 1]
    deck.pop()
    deckIndexes[cardIndex] = deckIndexes[deck.length]
    deckIndexes[deck.length] = 255
  }

  const deckRootInputs = []
  const handRootInputs = []

  // Pack the deck and hand indexes into 31-byte chunks.
  for (let i = 0; i * 31 < MAX_DECK_SIZE; i++)
    deckRootInputs.push(parseBigInt(deckIndexes.slice(i * 31, (i + 1) * 31)))
  for (let i = 0; i * 31 < MAX_HAND_SIZE; i++)
    handRootInputs.push(parseBigInt(handIndexes.slice(i * 31, (i + 1) * 31)))

  deckRootInputs.push(salt)
  handRootInputs.push(salt)

  const deckRoot: Hash = `0x${bigintToHexString(mimcHash(deckRootInputs), 32)}`
  const handRoot: Hash = `0x${bigintToHexString(mimcHash(handRootInputs), 32)}`

  return { hand, deck, deckRoot, handRoot }
}

// =================================================================================================