/**
 * Functions to fetch game data from the chain, taking care of various concerns like retries (via
 * wagmi), throttling and zombie filtering (via {@link fetch}).
 *
 * @module store/network
 */

import { readContract } from "wagmi/actions"

import { gameABI, inventoryABI } from "src/generated"
import { deployment } from "src/deployment"
import { type Fetched, throttledFetch } from "src/utils/throttled-fetch"
import { FetchedGameData } from "src/types"
import { Address } from "src/chain"

// =================================================================================================

/**
 * Fetches the game data, handling throttling and zombie updates, as well as retries (via wagmi).
 * Returns null in case of throttling or zombie.
 */
export const fetchGameData:
    (gameID: bigint, shouldFetchCards: boolean) => Promise<Fetched<FetchedGameData>> =
  throttledFetch(async (gameID: bigint, shouldFetchCards: boolean) => {
    return readContract({
      address: deployment.Game,
      abi: gameABI,
      functionName: "fetchGameData",
      args: [gameID, shouldFetchCards]
    })
  })

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the deck with the given ID for the given player. This is only called once at the start of
 * a game, and so doesn't need to handle throttling and zombies.
 */
export async function fetchDeck(player: Address, deckID: number): Promise<readonly bigint[]> {
  return readContract({
    address: deployment.Inventory,
    abi: inventoryABI,
    functionName: "getDeck",
    args: [player, deckID]
  })
}

// =================================================================================================