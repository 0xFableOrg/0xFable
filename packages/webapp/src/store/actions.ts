/**
 * Actions that can modify the store.
 *
 * @module store/actions
 */

import { Address } from "src/chain"
import { fetchDeck } from "src/store/network"
import { merkleize, mimcHash } from "src/utils/hashing"
import "utils/extensions"
import * as store from "src/store/atoms"
// import { testProving } from "src/utils/proofs"
import { isStale } from "src/store/update"
import { FetchedGameData } from "src/types"

const get = store.get
const set = store.set

// =================================================================================================
// CONSTANTS

/** Size of the initial hand. */
const initialHandSize = 5

/** Maximum size of a deck. */
const maxHandSize = 64

/** Maximum size of a hand (same as the deck = no limit). */
const maxDeckSize = 64

// NOTE: Reducing the max hand size to 16 would probably reduce the DrawHand circuit proving time.
//       It would require enforcing the max hand size in the Game contract, though.

// ========================e=========================================================================
// DRAW CARDS

/** Returned by {@link drawCards} when the operation was aborted because of an error. */
export const ABORTED = Symbol("ABORTED")

// -------------------------------------------------------------------------------------------------

/**
 * Generates the initial hand for a player, drawn from the deck with the given ID.
 *
 * This will return {@link ABORTED} if the game state shifts from underneath this function,
 * or if failing to fetch the deck from the blockchain (setting a global error in the latter case).
 */
export async function drawCards
    (gameID: bigint, player: Address, gameData: FetchedGameData, deckID: number)
    : Promise<readonly bigint[] | typeof ABORTED> {

  if (isStale(gameID, player, gameData))
    return ABORTED // could theoretically happen

  // TODO: This will need to be generated in advance and sent on-chain.
  const salt = 42n
  const randomness = mimcHash([salt, gameData.publicRandomness])

  let deckResult
  try {
    deckResult = await fetchDeck(player, deckID)
    if (isStale(gameID, player))
      return ABORTED
  }
  catch (e) {
    console.log(e)

    // The action can be retried, by re-clicking "Join Game", so there's no need for some very
    // involved recovery here.

    set(store.errorConfig, {
      title: "Could not fetch deck",
      message: e.message,
      buttons: [{ text: "Dismiss", onClick: () => set(store.errorConfig, null) }]
    })
    return ABORTED
  }

  // draw cards and update deck
  const deck = [... deckResult]
  const hand = []
  for (let i = 0; i < initialHandSize; i++) {
    const cardIndex = Number(randomness % BigInt(deck.length))
    hand.push(deck[cardIndex])
    deck[cardIndex] = deck.last()
    deck.pop()
  }

  const extendedHand = [...hand]
  for (let i = hand.length; i < maxHandSize; i++)
    extendedHand.push(255n)

  // NOTE: These will be replaced by single hash calls, which should only take a fraction of a
  // second, so it will not be necessary to delegate this to a worker thread.
  const handRoot = merkleize(maxHandSize, extendedHand)
  const deckRoot = merkleize(maxDeckSize, deck)

  // TODO validate proofs — the setup has been tested, no we just need the actual production proofs
  // TODO this will need to run in a worker thread, not to hogg the main thread
  // await testProving("MerkleHand", { root: handRoot, leaves: extendedHand })
  // NOTE: MerkleHand is a circuit defined as:
  //       component main { public [root, leaves] } = CheckMerkleRoot(6);

  if (isStale(gameID, player))
    return ABORTED

  set(store.privateInfoStore, {
    ... get(store.privateInfoStore),
    [gameID.toString()]: {
      [player]: { salt, hand, deck, handRoot, deckRoot }
    }
  })

  console.log("drew initial hand: ", hand)

  return hand
}

// =================================================================================================