/**
 * Functions to fetch game data from the chain, taking care of various concerns like retries (via
 * wagmi), throttling and zombie filtering (via {@link fetch}).
 *
 * @module store/network
 */

import { readContract } from "wagmi/actions"

import { gameABI } from "src/generated"
import { deployment } from "src/deployment"
import { throttledFetch } from "src/utils/throttled-fetch"
import { FetchedGameData } from "src/types"

// TODO what is the retry fail behaviour?

// =================================================================================================

/**
 * Fetches the game data, handling throttling and zombie updates, as well as retries (via wagmi).
 * Returns null in case of throttling or zombie.
 */
export const fetchGameData: (ID: bigint) => Promise<FetchedGameData|null> =
  throttledFetch(async (ID: bigint) => {
    // TODO try throwing an exception from here
    return readContract({
      address: deployment.Game,
      abi: gameABI,
      functionName: "fetchGameData",
      args: [ID]
    })
  })

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the game cards, handling throttling and zombie updates, as well as retries (via wagmi).
 */
export const fetchCards: (ID: bigint) => Promise<readonly bigint[]|null> =
  throttledFetch(async (ID: bigint) => {
    return readContract({
      address: deployment.Game,
      abi: gameABI,
      functionName: "getCards",
      args: [ID]
    })
  })

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the randomness for the given block number, handling throttling and zombie updates, as
 * well as retries (via wagmi).
 */
export const fetchRandomness: (blockNum: bigint) => Promise<bigint|null> =
  throttledFetch(async (blockNum: bigint) => {
    return BigInt(await readContract({
      address: deployment.Game,
      abi: gameABI,
      functionName: "getRandomness",
      args: [blockNum]
    }))
  })

// =================================================================================================